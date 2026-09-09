// Shared helpers used across Convex modules. This file exports plain
// functions only (no queries/mutations), so it never appears in the public API.
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/** A user counts as online if they sent a presence heartbeat within this window. */
export const ONLINE_WINDOW_MS = 3 * 60 * 1000;

/** Admin sessions expire after 12 hours of being issued. */
export const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

// ─── Current user ─────────────────────────────────────────────────────────────

export async function userByToken(ctx: Ctx, tokenIdentifier: string) {
  return ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .unique();
}

/** The signed-in user's document, or null when not signed in / not created yet. */
export async function currentUser(ctx: Ctx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return userByToken(ctx, identity.subject);
}

/** Throws unless the caller is signed in and has a users row. */
export async function requireUser(ctx: Ctx): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  const user = await userByToken(ctx, identity.subject);
  if (!user) throw new Error("User not found");
  return user;
}

export function assertActive(user: Doc<"users">) {
  if (user.status === "suspended") {
    const reason = user.suspendedReason ? `: ${user.suspendedReason}` : "";
    throw new Error(`Your account is suspended${reason}. Contact support from Settings → Help & Feedback.`);
  }
}

/** Like requireUser, but also rejects suspended accounts. Use for every write. */
export async function requireActiveUser(ctx: Ctx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  assertActive(user);
  return user;
}

// ─── Presentation ─────────────────────────────────────────────────────────────

export function isUserOnline(
  u: { isOnline?: boolean; lastSeen?: number },
  now: number = Date.now()
): boolean {
  return !!u.isOnline && typeof u.lastSeen === "number" && now - u.lastSeen < ONLINE_WINDOW_MS;
}

/** Strip private fields (email, Firebase uid, prefs) before sending a user to other clients. */
export function publicUser(u: Doc<"users">) {
  return {
    _id: u._id,
    _creationTime: u._creationTime,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    profilePhotoUrl: u.profilePhotoUrl,
    coverPhotoUrl: u.coverPhotoUrl,
    isOnline: isUserOnline(u),
    lastSeen: u.lastSeen,
    age: u.age,
    location: u.location,
    pronouns: u.pronouns,
    currentRole: u.currentRole,
    interests: u.interests,
    personalityResult: u.personalityResult,
    ideologyResult: u.ideologyResult,
    occupationResult: u.occupationResult,
    status: u.status ?? ("active" as const),
  };
}
export type PublicUser = ReturnType<typeof publicUser>;

export function userLabel(u: { username?: string; displayName: string }): string {
  return u.username ? `@${u.username}` : u.displayName;
}

// ─── Posts (feed + community) ─────────────────────────────────────────────────

export type AnyPostId = Id<"posts"> | Id<"communityPosts">;

export type ResolvedPost =
  | { kind: "post"; doc: Doc<"posts"> }
  | { kind: "communityPost"; doc: Doc<"communityPosts"> };

/** Look up a post that may live in either the `posts` or `communityPosts` table. */
export async function resolvePost(ctx: Ctx, postId: string): Promise<ResolvedPost | null> {
  const feedId = ctx.db.normalizeId("posts", postId);
  if (feedId) {
    const doc = await ctx.db.get(feedId);
    return doc ? { kind: "post", doc } : null;
  }
  const communityId = ctx.db.normalizeId("communityPosts", postId);
  if (communityId) {
    const doc = await ctx.db.get(communityId);
    return doc ? { kind: "communityPost", doc } : null;
  }
  return null;
}

export async function adjustPostCommentsCount(ctx: MutationCtx, postId: AnyPostId, delta: number) {
  const resolved = await resolvePost(ctx, postId);
  if (!resolved) return;
  const next = Math.max(0, resolved.doc.commentsCount + delta);
  await ctx.db.patch(resolved.doc._id, { commentsCount: next });
}

async function deleteCommentLikes(ctx: MutationCtx, commentId: Id<"comments">) {
  const likes = await ctx.db
    .query("commentLikes")
    .withIndex("by_comment", (q) => q.eq("commentId", commentId))
    .collect();
  for (const like of likes) await ctx.db.delete(like._id);
}

/**
 * Delete a comment together with its likes and (for top-level comments) all of
 * its replies. Returns how many comment rows were removed so the caller can
 * adjust the post's commentsCount.
 */
export async function deleteCommentTree(ctx: MutationCtx, comment: Doc<"comments">): Promise<number> {
  let removed = 0;
  if (!comment.parentId) {
    const replies = await ctx.db
      .query("comments")
      .withIndex("by_parent", (q) => q.eq("parentId", comment._id))
      .collect();
    for (const reply of replies) {
      await deleteCommentLikes(ctx, reply._id);
      await ctx.db.delete(reply._id);
      removed++;
    }
  }
  await deleteCommentLikes(ctx, comment._id);
  await ctx.db.delete(comment._id);
  return removed + 1;
}

async function deleteCommentsForPost(ctx: MutationCtx, postId: AnyPostId) {
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();
  for (const c of comments) {
    await deleteCommentLikes(ctx, c._id);
    await ctx.db.delete(c._id);
  }
}

export async function deletePostWithDependents(ctx: MutationCtx, post: Doc<"posts">) {
  const likes = await ctx.db
    .query("likes")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect();
  for (const like of likes) await ctx.db.delete(like._id);
  await deleteCommentsForPost(ctx, post._id);
  await ctx.db.delete(post._id);
}

export async function deleteCommunityPostWithDependents(ctx: MutationCtx, post: Doc<"communityPosts">) {
  const likes = await ctx.db
    .query("communityPostLikes")
    .withIndex("by_post", (q) => q.eq("postId", post._id))
    .collect();
  for (const like of likes) await ctx.db.delete(like._id);
  await deleteCommentsForPost(ctx, post._id);
  await ctx.db.delete(post._id);
}

// ─── Account deletion ─────────────────────────────────────────────────────────

/**
 * Remove every trace of a user: content, likes, comments, follows, DMs, Maya
 * history, assessment results, memberships, applications, feedback, and
 * finally the users row itself. Used by "Delete my account" and by the admin
 * console. Counters on other documents are kept consistent.
 */
export async function purgeUserData(ctx: MutationCtx, userId: Id<"users">) {
  // 1. Personal feed posts (+ their likes and comments)
  const posts = await ctx.db
    .query("posts")
    .withIndex("by_author", (q) => q.eq("authorId", userId))
    .collect();
  for (const post of posts) await deletePostWithDependents(ctx, post);

  // 2. Likes given to other people's feed posts
  const likes = await ctx.db
    .query("likes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const like of likes) {
    await ctx.db.delete(like._id);
    const post = await ctx.db.get(like.postId);
    if (post) await ctx.db.patch(post._id, { likesCount: Math.max(0, post.likesCount - 1) });
  }

  // 3. Comments authored (each with its replies + likes)
  const comments = await ctx.db
    .query("comments")
    .withIndex("by_author", (q) => q.eq("authorId", userId))
    .collect();
  for (const c of comments) {
    const live = await ctx.db.get(c._id); // may already be gone via a deleted tree/post
    if (!live) continue;
    const removed = await deleteCommentTree(ctx, live);
    await adjustPostCommentsCount(ctx, live.postId, -removed);
    if (live.parentId) {
      const parent = await ctx.db.get(live.parentId);
      if (parent) await ctx.db.patch(parent._id, { repliesCount: Math.max(0, parent.repliesCount - 1) });
    }
  }

  // 4. Likes given to comments
  const commentLikes = await ctx.db
    .query("commentLikes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const like of commentLikes) {
    await ctx.db.delete(like._id);
    const comment = await ctx.db.get(like.commentId);
    if (comment) await ctx.db.patch(comment._id, { likesCount: Math.max(0, comment.likesCount - 1) });
  }

  // 5. Follow graph
  const following = await ctx.db
    .query("follows")
    .withIndex("by_follower", (q) => q.eq("followerId", userId))
    .collect();
  const followers = await ctx.db
    .query("follows")
    .withIndex("by_following", (q) => q.eq("followingId", userId))
    .collect();
  for (const f of [...following, ...followers]) await ctx.db.delete(f._id);

  // 6. Private conversations
  const conversations = (await ctx.db.query("conversations").collect()).filter((c) =>
    c.participantIds.includes(userId)
  );
  for (const conv of conversations) {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
      .collect();
    for (const m of messages) await ctx.db.delete(m._id);
    await ctx.db.delete(conv._id);
  }

  // 7. Maya history
  const mayaMessages = await ctx.db
    .query("mayaMessages")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const m of mayaMessages) await ctx.db.delete(m._id);

  // 8. Assessment results
  const results = await ctx.db
    .query("assessmentResults")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const r of results) await ctx.db.delete(r._id);

  // 9. Community memberships (+ memberCount)
  const memberships = await ctx.db
    .query("communityMembers")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const m of memberships) {
    const community = await ctx.db.get(m.communityId);
    if (community) {
      await ctx.db.patch(community._id, { memberCount: Math.max(0, community.memberCount - 1) });
    }
    await ctx.db.delete(m._id);
  }

  // 10. Community discussion posts authored
  const communityPosts = await ctx.db
    .query("communityPosts")
    .withIndex("by_author", (q) => q.eq("authorId", userId))
    .collect();
  for (const post of communityPosts) await deleteCommunityPostWithDependents(ctx, post);

  // 11. Likes given to community posts
  const communityLikes = await ctx.db
    .query("communityPostLikes")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const like of communityLikes) {
    await ctx.db.delete(like._id);
    const post = await ctx.db.get(like.postId);
    if (post) await ctx.db.patch(post._id, { likesCount: Math.max(0, post.likesCount - 1) });
  }

  // 12. Community group-chat messages
  const chatMessages = await ctx.db
    .query("communityMessages")
    .withIndex("by_sender", (q) => q.eq("senderId", userId))
    .collect();
  for (const m of chatMessages) await ctx.db.delete(m._id);

  // 13. Applications to communities
  const applications = await ctx.db
    .query("communityApplications")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const a of applications) await ctx.db.delete(a._id);

  // 14. Communities created by the user stay, but lose the creator reference
  const created = (await ctx.db.query("communities").collect()).filter((c) => c.createdBy === userId);
  for (const c of created) await ctx.db.patch(c._id, { createdBy: undefined });

  // 15. Feedback / reports submitted by the user
  const feedback = await ctx.db
    .query("feedback")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  for (const f of feedback) await ctx.db.delete(f._id);

  // 16. The account itself
  await ctx.db.delete(userId);
}

// ─── Admin sessions ───────────────────────────────────────────────────────────

export async function findAdminSession(ctx: Ctx, token: string) {
  if (!token) return null;
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!session) return null;
  if (session.expiresAt < Date.now()) return null;
  return session;
}

/** Throws "ADMIN_UNAUTHORIZED" unless the token maps to a live admin session. */
export async function requireAdmin(ctx: Ctx, token: string) {
  const session = await findAdminSession(ctx, token);
  if (!session) throw new Error("ADMIN_UNAUTHORIZED");
  return session;
}
