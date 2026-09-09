import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  currentUser,
  deleteCommunityPostWithDependents,
  publicUser,
  requireActiveUser,
  type PublicUser,
} from "./helpers";

// ─── Get feed for a community ─────────────────────────────────────────────────
export const getFeed = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, { communityId }) => {
    const me = await currentUser(ctx);

    const posts = await ctx.db
      .query("communityPosts")
      .withIndex("by_community", (q) => q.eq("communityId", communityId))
      .order("desc")
      .take(50);

    const authorCache = new Map<string, PublicUser | null>();

    return Promise.all(
      posts.map(async (post) => {
        let author = authorCache.get(post.authorId);
        if (author === undefined) {
          const doc = await ctx.db.get(post.authorId);
          author = doc ? publicUser(doc) : null;
          authorCache.set(post.authorId, author);
        }
        let isLikedByMe = false;
        if (me) {
          const like = await ctx.db
            .query("communityPostLikes")
            .withIndex("by_post_and_user", (q) =>
              q.eq("postId", post._id).eq("userId", me._id)
            )
            .unique();
          isLikedByMe = like !== null;
        }
        return {
          ...post,
          isLikedByMe,
          isMine: me?._id === post.authorId,
          author: author ?? {
            _id: post.authorId,
            displayName: "Unknown",
            username: undefined,
            profilePhotoUrl: undefined,
          },
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
    const user = await requireActiveUser(ctx);
    if (!user.username) throw new Error("Set up your profile before posting");

    const text = content.trim();
    if (!text) throw new Error("Post is empty");
    if (text.length > 2000) throw new Error("Posts are limited to 2000 characters");

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
      content: text,
      likesCount: 0,
      commentsCount: 0,
    });
  },
});

// ─── Like a post (idempotent, deduped) ────────────────────────────────────────
export const like = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, { postId }) => {
    const user = await requireActiveUser(ctx);

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    const existing = await ctx.db
      .query("communityPostLikes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", postId).eq("userId", user._id)
      )
      .unique();
    if (existing) return; // already liked — idempotent

    await ctx.db.insert("communityPostLikes", { postId, userId: user._id });
    await ctx.db.patch(postId, { likesCount: post.likesCount + 1 });
  },
});

// ─── Unlike a post ────────────────────────────────────────────────────────────
export const unlike = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, { postId }) => {
    const user = await requireActiveUser(ctx);

    const post = await ctx.db.get(postId);
    if (!post) throw new Error("Post not found");

    const existing = await ctx.db
      .query("communityPostLikes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", postId).eq("userId", user._id)
      )
      .unique();
    if (!existing) return; // not liked — idempotent

    await ctx.db.delete(existing._id);
    await ctx.db.patch(postId, { likesCount: Math.max(0, post.likesCount - 1) });
  },
});

// ─── Delete your own community post ──────────────────────────────────────────
export const remove = mutation({
  args: { postId: v.id("communityPosts") },
  handler: async (ctx, { postId }) => {
    const user = await requireActiveUser(ctx);
    const post = await ctx.db.get(postId);
    if (!post) return;
    if (post.authorId !== user._id) throw new Error("You can only delete your own posts");
    await deleteCommunityPostWithDependents(ctx, post);
  },
});
