import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get feed: posts from followed users + own posts
export const getFeed = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    // Get all posts sorted by creation time (newest first)
    const posts = await ctx.db.query("posts").order("desc").take(50);

    const enriched = await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);

        let likedByMe = false;
        if (identity) {
          const me = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
              q.eq("tokenIdentifier", identity.subject)
            )
            .unique();
          if (me) {
            const like = await ctx.db
              .query("likes")
              .withIndex("by_post_and_user", (q) =>
                q.eq("postId", post._id).eq("userId", me._id)
              )
              .unique();
            likedByMe = !!like;
          }
        }

        return { ...post, author, likedByMe };
      })
    );

    return enriched.filter((p) => p.author !== null);
  },
});

// Get posts by a specific user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, author };
      })
    );
  },
});

// Create a post
export const create = mutation({
  args: {
    caption: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
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

    const postId = await ctx.db.insert("posts", {
      authorId: me._id,
      caption: args.caption,
      imageUrl: args.imageUrl,
      likesCount: 0,
      commentsCount: 0,
    });

    const post = await ctx.db.get(postId);
    return { ...post!, author: me };
  },
});

// Like a post
export const like = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();
    if (!me) throw new Error("User not found");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", postId).eq("userId", me._id)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("likes", { postId, userId: me._id });
      const post = await ctx.db.get(postId);
      if (post) await ctx.db.patch(postId, { likesCount: post.likesCount + 1 });
    }
  },
});

// Unlike a post
export const unlike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();
    if (!me) throw new Error("User not found");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", postId).eq("userId", me._id)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      const post = await ctx.db.get(postId);
      if (post)
        await ctx.db.patch(postId, {
          likesCount: Math.max(0, post.likesCount - 1),
        });
    }
  },
});
