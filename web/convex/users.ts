import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  currentUser,
  isUserOnline,
  publicUser,
  purgeUserData,
  requireActiveUser,
  requireUser,
} from "./helpers";

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "maya", "maya_bora", "swiftie", "support", "system", "moderator", "mod", "root", "help",
]);

const PALETTES = ["tricolour", "cyan", "magenta", "amber", "mono", "light"];
const FONT_SCALES = ["small", "medium", "large", "xlarge"];
const FONT_FAMILIES = ["cyber", "readable", "mono"];

// Only write presence every so often to keep reactive queries from churning.
const HEARTBEAT_MIN_INTERVAL_MS = 45 * 1000;

// Get or create the current user profile from Firebase token
export const getOrCreate = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();

    if (existing) {
      // Update online status
      await ctx.db.patch(existing._id, { isOnline: true, lastSeen: Date.now() });
      return existing;
    }

    const id = await ctx.db.insert("users", {
      tokenIdentifier: identity.subject,
      email: identity.email ?? "",
      displayName: identity.name ?? identity.email?.split("@")[0] ?? "User",
      isOnline: true,
      lastSeen: Date.now(),
      status: "active",
    });
    return await ctx.db.get(id);
  },
});

// Get current user's full profile
export const getMe = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();
  },
});

// Update current user profile (onboarding + Settings → Profile)
export const updateMe = mutation({
  args: {
    username:        v.optional(v.string()),
    displayName:     v.optional(v.string()),
    bio:             v.optional(v.string()),
    profilePhotoUrl: v.optional(v.string()),
    coverPhotoUrl:   v.optional(v.string()),
    // Richer profile fields
    age:         v.optional(v.number()),
    location:    v.optional(v.string()),
    pronouns:    v.optional(v.string()),
    currentRole: v.optional(v.string()),
    interests:   v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const me = await requireActiveUser(ctx);

    if (args.age !== undefined && (args.age < 13 || args.age > 120)) {
      throw new Error("You must be at least 13 years old to use this platform");
    }
    if (args.displayName !== undefined) {
      const name = args.displayName.trim();
      if (!name) throw new Error("Display name cannot be empty");
      if (name.length > 50) throw new Error("Display name is limited to 50 characters");
      args = { ...args, displayName: name };
    }
    if (args.bio !== undefined && args.bio.length > 300) {
      throw new Error("Bio is limited to 300 characters");
    }
    if (args.interests !== undefined) {
      const tags = Array.from(
        new Set(args.interests.map((t) => t.trim().toLowerCase()).filter(Boolean))
      ).slice(0, 8);
      if (tags.some((t) => t.length > 30)) throw new Error("Interest tags are limited to 30 characters");
      args = { ...args, interests: tags };
    }

    // Check username format + uniqueness if changing
    if (args.username !== undefined) {
      const username = args.username.trim().toLowerCase();
      if (!USERNAME_RE.test(username)) {
        throw new Error("Username: 3-30 chars, lowercase letters, numbers, underscores only.");
      }
      if (RESERVED_USERNAMES.has(username)) throw new Error("That username is reserved");
      if (username !== me.username) {
        const taken = await ctx.db
          .query("users")
          .withIndex("by_username", (q) => q.eq("username", username))
          .unique();
        if (taken) throw new Error("Username already taken");
      }
      args = { ...args, username };
    }

    const firstCompletion = !me.username && !!args.username && !me.profileCompletedAt;

    await ctx.db.patch(me._id, {
      ...(args.username !== undefined && { username: args.username }),
      ...(args.displayName !== undefined && { displayName: args.displayName }),
      ...(args.bio !== undefined && { bio: args.bio }),
      ...(args.profilePhotoUrl !== undefined && { profilePhotoUrl: args.profilePhotoUrl }),
      ...(args.coverPhotoUrl !== undefined && { coverPhotoUrl: args.coverPhotoUrl }),
      ...(args.age !== undefined && { age: args.age }),
      ...(args.location !== undefined && { location: args.location }),
      ...(args.pronouns !== undefined && { pronouns: args.pronouns }),
      ...(args.currentRole !== undefined && { currentRole: args.currentRole }),
      ...(args.interests !== undefined && { interests: args.interests }),
      ...(firstCompletion && { profileCompletedAt: Date.now() }),
    });
    return ctx.db.get(me._id);
  },
});

// Appearance preferences (Settings → Appearance). Stored on the user so they
// follow the account across devices; the client also caches them locally.
export const updatePrefs = mutation({
  args: {
    prefs: v.object({
      palette:      v.optional(v.string()),
      fontScale:    v.optional(v.string()),
      fontFamily:   v.optional(v.string()),
      reduceMotion: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { prefs }) => {
    const me = await requireUser(ctx);
    if (prefs.palette !== undefined && !PALETTES.includes(prefs.palette)) throw new Error("Unknown palette");
    if (prefs.fontScale !== undefined && !FONT_SCALES.includes(prefs.fontScale)) throw new Error("Unknown text size");
    if (prefs.fontFamily !== undefined && !FONT_FAMILIES.includes(prefs.fontFamily)) throw new Error("Unknown font");
    const merged = { ...(me.prefs ?? {}), ...prefs };
    await ctx.db.patch(me._id, { prefs: merged });
    return merged;
  },
});

// Presence heartbeat — called periodically by the app shell while a tab is open.
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await currentUser(ctx);
    if (!me) return null;
    const now = Date.now();
    if (!me.isOnline || !me.lastSeen || now - me.lastSeen > HEARTBEAT_MIN_INTERVAL_MS) {
      await ctx.db.patch(me._id, { isOnline: true, lastSeen: now });
    }
    return { status: me.status ?? "active" };
  },
});

export const setOffline = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await currentUser(ctx);
    if (!me) return;
    await ctx.db.patch(me._id, { isOnline: false, lastSeen: Date.now() });
  },
});

// Get user by username (public profile)
export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    if (!user) return null;

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();

    let isFollowing = false;
    let followsMe = false;
    const me = await currentUser(ctx);
    if (me) {
      isFollowing = followers.some((f) => f.followerId === me._id);
      followsMe = following.some((f) => f.followingId === me._id);
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    return {
      ...publicUser(user),
      followersCount: followers.length,
      followingCount: following.length,
      postsCount: posts.length,
      isFollowing,
      followsMe,
      isMe: me?._id === user._id,
    };
  },
});

// Followers / following lists for a profile
export const getFollowLists = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await currentUser(ctx);
    const myFollowing = new Set<string>();
    if (me) {
      const rows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", me._id))
        .collect();
      for (const r of rows) myFollowing.add(r.followingId);
    }

    const toPublic = async (ids: Array<typeof userId>) => {
      const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
      return docs
        .filter((u): u is NonNullable<typeof u> => u !== null && u.status !== "suspended")
        .map((u) => ({ ...publicUser(u), isFollowing: myFollowing.has(u._id), isMe: me?._id === u._id }));
    };

    const followerRows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", userId))
      .collect();
    const followingRows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    return {
      followers: await toPublic(followerRows.map((r) => r.followerId)),
      following: await toPublic(followingRows.map((r) => r.followingId)),
    };
  },
});

// Follow a user
export const follow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireActiveUser(ctx);
    if (me._id === userId) throw new Error("Cannot follow yourself");

    const target = await ctx.db.get(userId);
    if (!target) throw new Error("User not found");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", me._id).eq("followingId", userId)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("follows", { followerId: me._id, followingId: userId });
    }
  },
});

// Unfollow a user
export const unfollow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await requireUser(ctx);

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", me._id).eq("followingId", userId)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);
  },
});

// Search users by username/displayName
export const search = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    if (!q.trim()) return [];
    const all = await ctx.db.query("users").collect();
    const lower = q.toLowerCase();
    return all
      .filter(
        (u) =>
          u.status !== "suspended" &&
          (u.username?.includes(lower) || u.displayName.toLowerCase().includes(lower))
      )
      .slice(0, 20)
      .map(publicUser);
  },
});

// Discover → People: everyone who has signed in, online members first.
export const listPeople = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const me = await currentUser(ctx);
    const now = Date.now();

    const myFollowing = new Set<string>();
    if (me) {
      const rows = await ctx.db
        .query("follows")
        .withIndex("by_follower", (q) => q.eq("followerId", me._id))
        .collect();
      for (const r of rows) myFollowing.add(r.followingId);
    }

    const all = await ctx.db.query("users").order("desc").take(400);
    const people = all
      .filter((u) => u.status !== "suspended" && (!me || u._id !== me._id))
      .map((u) => ({
        ...publicUser(u),
        isOnline: isUserOnline(u, now),
        isFollowing: myFollowing.has(u._id),
        hasProfile: !!u.username,
      }))
      .sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return (b.lastSeen ?? 0) - (a.lastSeen ?? 0);
      });

    const onlineCount = people.filter((p) => p.isOnline).length;
    return {
      total: people.length,
      onlineCount,
      people: people.slice(0, Math.min(Math.max(limit ?? 60, 1), 200)),
    };
  },
});

// Settings → Danger zone. Removes every trace of the account (see purgeUserData).
export const deleteMyAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    await purgeUserData(ctx, me._id);
    return true;
  },
});
