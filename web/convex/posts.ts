import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  currentUser,
  deletePostWithDependents,
  publicUser,
  requireActiveUser,
  type PublicUser,
} from "./helpers";

// Get feed: latest posts from everyone (newest first)
export const getFeed = query({
  handler: async (ctx) => {
    const me = await currentUser(ctx);

    // Get all posts sorted by creation time (newest first)
    const posts = await ctx.db.query("posts").order("desc").take(50);

    const authorCache = new Map<string, PublicUser | null>();
    const enriched = await Promise.all(
      posts.map(async (post) => {
        let author = authorCache.get(post.authorId);
        if (author === undefined) {
          const doc = await ctx.db.get(post.authorId);
          author = doc && doc.status !== "suspended" ? publicUser(doc) : null;
          authorCache.set(post.authorId, author);
        }

        let likedByMe = false;
        if (me) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_post_and_user", (q) =>
              q.eq("postId", post._id).eq("userId", me._id)
            )
            .unique();
          likedByMe = !!like;
        }

        return { ...post, author, likedByMe, isMine: me?._id === post.authorId };
      })
    );

    return enriched.filter((p) => p.author !== null);
  },
});

// Get posts by a specific user (profile page)
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await currentUser(ctx);
    const authorDoc = await ctx.db.get(userId);
    const author = authorDoc ? publicUser(authorDoc) : null;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      posts.map(async (post) => {
        let likedByMe = false;
        if (me) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_post_and_user", (q) =>
              q.eq("postId", post._id).eq("userId", me._id)
            )
            .unique();
          likedByMe = !!like;
        }
        return { ...post, author, likedByMe, isMine: me?._id === post.authorId };
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
    const me = await requireActiveUser(ctx);
    if (!me.username) throw new Error("Set up your profile before posting");

    const caption = args.caption?.trim() || undefined;
    if (!caption && !args.imageUrl) throw new Error("Write something or attach an image");
    if (caption && caption.length > 500) throw new Error("Captions are limited to 500 characters");

    const postId = await ctx.db.insert("posts", {
      authorId: me._id,
      caption,
      imageUrl: args.imageUrl,
      likesCount: 0,
      commentsCount: 0,
    });

    const post = await ctx.db.get(postId);
    return { ...post!, author: publicUser(me) };
  },
});

// Like a post
export const like = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const me = await requireActiveUser(ctx);

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", postId).eq("userId", me._id)
      )
      .unique();

    if (!existing) {
      const post = await ctx.db.get(postId);
      if (!post) throw new Error("Post not found");
      await ctx.db.insert("likes", { postId, userId: me._id });
      await ctx.db.patch(postId, { likesCount: post.likesCount + 1 });
    }
  },
});

// Unlike a post
export const unlike = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const me = await requireActiveUser(ctx);

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

// Delete your own post (with its likes and comments)
export const remove = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, { postId }) => {
    const me = await requireActiveUser(ctx);
    const post = await ctx.db.get(postId);
    if (!post) return;
    if (post.authorId !== me._id) throw new Error("You can only delete your own posts");
    await deletePostWithDependents(ctx, post);
  },
});
