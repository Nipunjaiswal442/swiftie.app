import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Get feed for a community ─────────────────────────────────────────────────
export const getFeed = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, { communityId }) => {
    const posts = await ctx.db
      .query("communityPosts")
      .withIndex("by_community", (q) => q.eq("communityId", communityId))
      .order("desc")
      .take(50);

    // Enrich with author info
    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return {
          ...post,
          author: author
            ? { displayName: author.displayName, username: author.username, profilePhotoUrl: author.profilePhotoUrl }
            : { displayName: "Unknown", username: undefined, profilePhotoUrl: undefined },
        };
      })
    );
  },
});

// ─── Create a post ────────────────────────────────────────────────────────────
export const create = mutation({
  args: {
    communityId: v.id("communities"),
    content: v.string(),
  },
  handler: async (ctx, { communityId, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Require membership
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", communityId).eq("userId", user._id)
      )
      .unique();
    if (!membership) throw new Error("You must join this community to post");

    return ctx.db.insert("communityPosts", {
      communityId,
      authorId: user._id,
      content: content.trim(),
      likesCount: 0,
      commentsCount: 0,
    });
  },
});

// ─── Like a post ──────────────────────────────────────────────────────────────
export const like = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, { postId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(postId, { likesCount: post.likesCount + 1 });
  },
});

// ─── Unlike a post ────────────────────────────────────────────────────────────
export const unlike = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, { postId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    await ctx.db.patch(postId, { likesCount: Math.max(0, post.likesCount - 1) });
  },
});
