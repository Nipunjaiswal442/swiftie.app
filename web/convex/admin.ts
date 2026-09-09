// Admin console backend. The admin signs in with an ID + password (Convex env
// vars ADMIN_ID / ADMIN_PASSWORD — never stored in the repo) and receives a
// random session token. Every function below takes that token and validates it
// with requireAdmin(); the token is independent of Firebase/Google sign-in.
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ADMIN_SESSION_TTL_MS,
  adjustPostCommentsCount,
  deleteCommentTree,
  deleteCommunityPostWithDependents,
  deletePostWithDependents,
  findAdminSession,
  isUserOnline,
  purgeUserData,
  requireAdmin,
  resolvePost,
  userLabel,
} from "./helpers";
import { readEnv } from "./nvidia";

const DEFAULT_ADMIN_ID = "admin";
const THROTTLE_KEY = "admin";
const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

/** Compare two strings without short-circuiting on the first mismatch. */
function constantTimeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function audit(
  ctx: { db: { insert: (table: "adminAuditLog", doc: Omit<Doc<"adminAuditLog">, "_id" | "_creationTime">) => Promise<unknown> } },
  adminId: string,
  action: string,
  targetUserId?: Id<"users">,
  details?: string
) {
  await ctx.db.insert("adminAuditLog", { adminId, action, targetUserId, details });
}

// ─── Login throttle (internal) ───────────────────────────────────────────────
export const getThrottle = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("adminLoginThrottle")
      .withIndex("by_key", (q) => q.eq("key", THROTTLE_KEY))
      .unique();
  },
});

export const recordLoginFailure = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const row = await ctx.db
      .query("adminLoginThrottle")
      .withIndex("by_key", (q) => q.eq("key", THROTTLE_KEY))
      .unique();
    if (!row || now - row.windowStart > FAILURE_WINDOW_MS) {
      if (row) await ctx.db.delete(row._id);
      await ctx.db.insert("adminLoginThrottle", { key: THROTTLE_KEY, failures: 1, windowStart: now });
      return;
    }
    const failures = row.failures + 1;
    await ctx.db.patch(row._id, {
      failures,
      lockedUntil: failures >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MS : row.lockedUntil,
    });
  },
});

export const createSession = internalMutation({
  args: { token: v.string(), adminId: v.string(), expiresAt: v.number() },
  handler: async (ctx, { token, adminId, expiresAt }) => {
    // Successful login clears the throttle and expired sessions.
    const throttle = await ctx.db
      .query("adminLoginThrottle")
      .withIndex("by_key", (q) => q.eq("key", THROTTLE_KEY))
      .unique();
    if (throttle) await ctx.db.delete(throttle._id);

    const now = Date.now();
    const sessions = await ctx.db.query("adminSessions").collect();
    for (const s of sessions) if (s.expiresAt < now) await ctx.db.delete(s._id);

    await ctx.db.insert("adminSessions", { token, adminId, expiresAt, lastUsedAt: now });
    await ctx.db.insert("adminAuditLog", { adminId, action: "login" });
  },
});

export const checkSession = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await findAdminSession(ctx, token);
    return session ? { adminId: session.adminId, expiresAt: session.expiresAt } : null;
  },
});

// ─── Login / logout ──────────────────────────────────────────────────────────
export const login = action({
  args: { adminId: v.string(), password: v.string() },
  handler: async (ctx, { adminId, password }): Promise<{ token: string; adminId: string; expiresAt: number }> => {
    const configuredId = readEnv("ADMIN_ID") ?? DEFAULT_ADMIN_ID;
    const configuredPassword = readEnv("ADMIN_PASSWORD");
    if (!configuredPassword) {
      throw new Error(
        "ADMIN_NOT_CONFIGURED: set ADMIN_PASSWORD (and optionally ADMIN_ID) in the Convex dashboard → Settings → Environment Variables."
      );
    }

    const throttle: Doc<"adminLoginThrottle"> | null = await ctx.runQuery(internal.admin.getThrottle, {});
    const now = Date.now();
    if (throttle?.lockedUntil && throttle.lockedUntil > now) {
      const minutes = Math.max(1, Math.ceil((throttle.lockedUntil - now) / 60_000));
      throw new Error(`Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
    }

    const idOk = constantTimeEqual(adminId.trim(), configuredId);
    const passwordOk = constantTimeEqual(password, configuredPassword);
    if (!idOk || !passwordOk) {
      await ctx.runMutation(internal.admin.recordLoginFailure, {});
      throw new Error("Invalid admin ID or password");
    }

    const token = randomToken();
    const expiresAt = now + ADMIN_SESSION_TTL_MS;
    await ctx.runMutation(internal.admin.createSession, { token, adminId: configuredId, expiresAt });
    return { token, adminId: configuredId, expiresAt };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (session) {
      await ctx.db.delete(session._id);
      await audit(ctx, session.adminId, "logout");
    }
  },
});

/** Reactive session check for the console shell. Null → back to /admin. */
export const session = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const s = await findAdminSession(ctx, token);
    return s ? { adminId: s.adminId, expiresAt: s.expiresAt } : null;
  },
});

// ─── Overview ────────────────────────────────────────────────────────────────
export const stats = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const users = await ctx.db.query("users").collect();
    const posts = await ctx.db.query("posts").collect();
    const communityPosts = await ctx.db.query("communityPosts").collect();
    const comments = await ctx.db.query("comments").collect();
    const communities = await ctx.db.query("communities").collect();
    const openFeedback = await ctx.db
      .query("feedback")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const notifications = await ctx.db.query("adminNotifications").collect();

    return {
      users: {
        total: users.length,
        online: users.filter((u) => isUserOnline(u, now)).length,
        suspended: users.filter((u) => u.status === "suspended").length,
        withProfile: users.filter((u) => !!u.username).length,
        newToday: users.filter((u) => u._creationTime >= dayAgo).length,
        newThisWeek: users.filter((u) => u._creationTime >= weekAgo).length,
      },
      content: {
        posts: posts.length,
        communityPosts: communityPosts.length,
        comments: comments.length,
        communities: communities.length,
        postsToday: posts.filter((p) => p._creationTime >= dayAgo).length + communityPosts.filter((p) => p._creationTime >= dayAgo).length,
      },
      feedback: {
        open: openFeedback.length,
        openReports: openFeedback.filter((f) => f.type === "report").length,
        openComplaints: openFeedback.filter((f) => f.type === "complaint").length,
        openRequests: openFeedback.filter((f) => f.type === "request").length,
        openBugs: openFeedback.filter((f) => f.type === "bug").length,
      },
      notifications: {
        unread: notifications.filter((n) => !n.readAt).length,
        total: notifications.length,
      },
    };
  },
});

// ─── Accounts ────────────────────────────────────────────────────────────────
export const listUsers = query({
  args: {
    token: v.string(),
    search: v.optional(v.string()),
    status: v.optional(v.union(v.literal("all"), v.literal("active"), v.literal("suspended"), v.literal("online"))),
  },
  handler: async (ctx, { token, search, status }) => {
    await requireAdmin(ctx, token);
    const now = Date.now();
    const users = await ctx.db.query("users").order("desc").collect();

    // Reports filed against each user (targetType "user") — one scan, counted per id.
    const reports = await ctx.db.query("feedback").collect();
    const reportsAgainst = new Map<string, number>();
    for (const r of reports) {
      if (r.type === "report" && r.targetType === "user" && r.targetId && r.status === "open") {
        reportsAgainst.set(r.targetId, (reportsAgainst.get(r.targetId) ?? 0) + 1);
      }
    }

    const needle = (search ?? "").trim().toLowerCase();
    const filtered = users.filter((u) => {
      const online = isUserOnline(u, now);
      if (status === "active" && u.status === "suspended") return false;
      if (status === "suspended" && u.status !== "suspended") return false;
      if (status === "online" && !online) return false;
      if (!needle) return true;
      return (
        (u.username ?? "").includes(needle) ||
        u.displayName.toLowerCase().includes(needle) ||
        u.email.toLowerCase().includes(needle)
      );
    });

    return Promise.all(
      filtered.slice(0, 500).map(async (u) => {
        const posts = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", u._id))
          .collect();
        const followers = await ctx.db
          .query("follows")
          .withIndex("by_following", (q) => q.eq("followingId", u._id))
          .collect();
        return {
          _id: u._id,
          createdAt: u._creationTime,
          username: u.username,
          displayName: u.displayName,
          email: u.email,
          profilePhotoUrl: u.profilePhotoUrl,
          status: u.status ?? "active",
          suspendedReason: u.suspendedReason,
          suspendedAt: u.suspendedAt,
          isOnline: isUserOnline(u, now),
          lastSeen: u.lastSeen,
          postsCount: posts.length,
          followersCount: followers.length,
          openReports: reportsAgainst.get(u._id) ?? 0,
          assessments: [u.personalityResult, u.ideologyResult, u.occupationResult].filter(Boolean) as string[],
          hasProfile: !!u.username,
        };
      })
    );
  },
});

export const getUser = query({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, { token, userId }) => {
    await requireAdmin(ctx, token);
    const u = await ctx.db.get(userId);
    if (!u) return null;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .take(10);
    const communityPosts = await ctx.db
      .query("communityPosts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .take(10);
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .take(10);
    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const communities = (await Promise.all(memberships.map((m) => ctx.db.get(m.communityId)))).filter(
      (c): c is NonNullable<typeof c> => c !== null
    );
    const submitted = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    const allFeedback = await ctx.db.query("feedback").collect();
    const reportsAgainst = allFeedback.filter(
      (f) => f.type === "report" && f.targetType === "user" && f.targetId === userId
    );
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();
    const mayaMessages = await ctx.db
      .query("mayaMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      _id: u._id,
      createdAt: u._creationTime,
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      bio: u.bio,
      profilePhotoUrl: u.profilePhotoUrl,
      age: u.age,
      location: u.location,
      pronouns: u.pronouns,
      currentRole: u.currentRole,
      interests: u.interests ?? [],
      status: u.status ?? "active",
      suspendedReason: u.suspendedReason,
      suspendedAt: u.suspendedAt,
      isOnline: isUserOnline(u),
      lastSeen: u.lastSeen,
      profileCompletedAt: u.profileCompletedAt,
      assessments: {
        personality: u.personalityResult,
        ideology: u.ideologyResult,
        occupation: u.occupationResult,
      },
      counts: {
        followers: followers.length,
        following: following.length,
        mayaMessages: mayaMessages.length,
        communities: communities.length,
      },
      communities: communities.map((c) => ({ _id: c._id, name: c.name, slug: c.slug, icon: c.icon })),
      recentPosts: posts.map((p) => ({ _id: p._id, kind: "post" as const, text: p.caption ?? "(photo)", createdAt: p._creationTime, likes: p.likesCount, comments: p.commentsCount })),
      recentCommunityPosts: communityPosts.map((p) => ({ _id: p._id, kind: "communityPost" as const, text: p.content, createdAt: p._creationTime, likes: p.likesCount, comments: p.commentsCount })),
      recentComments: comments.map((c) => ({ _id: c._id, text: c.content, createdAt: c._creationTime, likes: c.likesCount })),
      submittedFeedback: submitted,
      reportsAgainst,
    };
  },
});

export const suspendUser = mutation({
  args: { token: v.string(), userId: v.id("users"), reason: v.string() },
  handler: async (ctx, { token, userId, reason }) => {
    const session = await requireAdmin(ctx, token);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, {
      status: "suspended",
      suspendedReason: reason.trim() || "Violation of community guidelines",
      suspendedAt: Date.now(),
      isOnline: false,
    });
    await audit(ctx, session.adminId, "suspend", userId, `${userLabel(user)} — ${reason.trim()}`);
  },
});

export const unsuspendUser = mutation({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, { token, userId }) => {
    const session = await requireAdmin(ctx, token);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    await ctx.db.patch(userId, { status: "active", suspendedReason: undefined, suspendedAt: undefined });
    await audit(ctx, session.adminId, "unsuspend", userId, userLabel(user));
  },
});

export const deleteUser = mutation({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, { token, userId }) => {
    const session = await requireAdmin(ctx, token);
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const label = `${userLabel(user)} <${user.email}>`;
    await purgeUserData(ctx, userId);
    await audit(ctx, session.adminId, "delete_user", undefined, label);
  },
});

// ─── Reports & feedback ──────────────────────────────────────────────────────
export const listFeedback = query({
  args: {
    token: v.string(),
    status: v.optional(v.union(v.literal("all"), v.literal("open"), v.literal("resolved"), v.literal("dismissed"))),
    source: v.optional(v.union(v.literal("all"), v.literal("form"), v.literal("report"), v.literal("maya"))),
  },
  handler: async (ctx, { token, status, source }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("feedback").order("desc").take(400);
    const filtered = rows.filter((f) => {
      if (status && status !== "all" && f.status !== status) return false;
      if (source && source !== "all" && f.source !== source) return false;
      return true;
    });
    const userCache = new Map<string, { label: string; displayName: string; username?: string } | null>();
    return Promise.all(
      filtered.map(async (f) => {
        let user = userCache.get(f.userId);
        if (user === undefined) {
          const doc = await ctx.db.get(f.userId);
          user = doc ? { label: userLabel(doc), displayName: doc.displayName, username: doc.username } : null;
          userCache.set(f.userId, user);
        }
        // Does the reported content still exist?
        let targetExists: boolean | undefined;
        if (f.targetType && f.targetId) {
          if (f.targetType === "user") {
            const id = ctx.db.normalizeId("users", f.targetId);
            targetExists = !!(id && (await ctx.db.get(id)));
          } else if (f.targetType === "comment") {
            const id = ctx.db.normalizeId("comments", f.targetId);
            targetExists = !!(id && (await ctx.db.get(id)));
          } else {
            targetExists = !!(await resolvePost(ctx, f.targetId));
          }
        }
        return { ...f, user, targetExists };
      })
    );
  },
});

export const resolveFeedback = mutation({
  args: {
    token: v.string(),
    feedbackId: v.id("feedback"),
    status: v.union(v.literal("open"), v.literal("resolved"), v.literal("dismissed")),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, { token, feedbackId, status, adminNote }) => {
    const session = await requireAdmin(ctx, token);
    const row = await ctx.db.get(feedbackId);
    if (!row) throw new Error("Feedback not found");
    await ctx.db.patch(feedbackId, {
      status,
      adminNote: adminNote?.trim() || row.adminNote,
      resolvedAt: status === "open" ? undefined : Date.now(),
    });
    await audit(ctx, session.adminId, `feedback_${status}`, row.userId, row.subject);
  },
});

/** Remove reported content (post, community post or comment). */
export const removeContent = mutation({
  args: {
    token: v.string(),
    targetType: v.union(v.literal("post"), v.literal("communityPost"), v.literal("comment")),
    targetId: v.string(),
  },
  handler: async (ctx, { token, targetType, targetId }) => {
    const session = await requireAdmin(ctx, token);
    if (targetType === "comment") {
      const id = ctx.db.normalizeId("comments", targetId);
      const comment = id ? await ctx.db.get(id) : null;
      if (!comment) throw new Error("Comment not found (already removed?)");
      const removed = await deleteCommentTree(ctx, comment);
      await adjustPostCommentsCount(ctx, comment.postId, -removed);
      if (comment.parentId) {
        const parent = await ctx.db.get(comment.parentId);
        if (parent) await ctx.db.patch(parent._id, { repliesCount: Math.max(0, parent.repliesCount - 1) });
      }
      await audit(ctx, session.adminId, "remove_comment", comment.authorId, comment.content.slice(0, 120));
      return;
    }
    const post = await resolvePost(ctx, targetId);
    if (!post) throw new Error("Post not found (already removed?)");
    if (post.kind === "post") {
      await deletePostWithDependents(ctx, post.doc);
      await audit(ctx, session.adminId, "remove_post", post.doc.authorId, (post.doc.caption ?? "(photo)").slice(0, 120));
    } else {
      await deleteCommunityPostWithDependents(ctx, post.doc);
      await audit(ctx, session.adminId, "remove_community_post", post.doc.authorId, post.doc.content.slice(0, 120));
    }
  },
});

// ─── Maya notifications ──────────────────────────────────────────────────────
export const listNotifications = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { token, limit }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("adminNotifications").order("desc").take(Math.min(limit ?? 100, 300));
    const all = await ctx.db.query("adminNotifications").collect();
    return { items: rows, unread: all.filter((n) => !n.readAt).length };
  },
});

export const markNotificationRead = mutation({
  args: { token: v.string(), notificationId: v.id("adminNotifications") },
  handler: async (ctx, { token, notificationId }) => {
    await requireAdmin(ctx, token);
    const n = await ctx.db.get(notificationId);
    if (n && !n.readAt) await ctx.db.patch(notificationId, { readAt: Date.now() });
  },
});

export const markAllNotificationsRead = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("adminNotifications").collect();
    const now = Date.now();
    for (const n of rows) if (!n.readAt) await ctx.db.patch(n._id, { readAt: now });
  },
});

/** "Ask Maya for a round-up now" — runs the same digest the cron produces. */
export const generateDigestNow = action({
  args: { token: v.string() },
  handler: async (ctx, { token }): Promise<Id<"adminNotifications">> => {
    const session: { adminId: string; expiresAt: number } | null = await ctx.runQuery(
      internal.admin.checkSession,
      { token }
    );
    if (!session) throw new Error("ADMIN_UNAUTHORIZED");
    const id: Id<"adminNotifications"> = await ctx.runAction(internal.adminDigest.generateDailyDigest, {
      trigger: "manual",
    });
    return id;
  },
});

// ─── Audit log ───────────────────────────────────────────────────────────────
export const auditLog = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    return ctx.db.query("adminAuditLog").order("desc").take(100);
  },
});
