import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

// Update current user profile
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();
    if (!me) throw new Error("User not found");

    // Validate age
    if (args.age !== undefined && args.age < 13) {
      throw new Error("You must be at least 13 years old to use this platform");
    }

    // Check username uniqueness if changing
    if (args.username && args.username !== me.username) {
      const taken = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique();
      if (taken) throw new Error("Username already taken");
    }

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
    });
    return ctx.db.get(me._id);
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

    const identity = await ctx.auth.getUserIdentity();
    let isFollowing = false;
    let followersCount = 0;
    let followingCount = 0;

    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();
    followersCount = followers.length;

    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();
    followingCount = following.length;

    if (identity) {
      const me = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
        .unique();
      if (me) {
        const follow = await ctx.db
          .query("follows")
          .withIndex("by_both", (q) =>
            q.eq("followerId", me._id).eq("followingId", user._id)
          )
          .unique();
        isFollowing = !!follow;
      }
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    return { ...user, followersCount, followingCount, postsCount: posts.length, isFollowing };
  },
});

// Follow a user
export const follow = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!me) throw new Error("User not found");
    if (me._id === userId) throw new Error("Cannot follow yourself");

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!me) throw new Error("User not found");

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
          u.username?.includes(lower) ||
          u.displayName.toLowerCase().includes(lower)
      )
      .slice(0, 20);
  },
});
