import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  adjustPostCommentsCount,
  currentUser,
  deleteCommentTree,
  publicUser,
  requireActiveUser,
  resolvePost,
  type PublicUser,
} from "./helpers";

// Comments work for both personal-feed posts and community discussion posts.
const POST_ID = v.union(v.id("posts"), v.id("communityPosts"));
const MAX_COMMENT_LENGTH = 1000;
const MAX_COMMENTS_PER_POST = 300;

// ─── List comments for a post (top-level, each with its replies) ─────────────
export const list = query({
  args: { postId: POST_ID },
  handler: async (ctx, { postId }) => {
    const me = await currentUser(ctx);

    const all = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .order("asc")
      .take(MAX_COMMENTS_PER_POST);

    const authorCache = new Map<string, PublicUser | null>();
    const enrich = async (c: Doc<"comments">) => {
      let author = authorCache.get(c.authorId);
      if (author === undefined) {
        const doc = await ctx.db.get(c.authorId);
        author = doc ? publicUser(doc) : null;
        authorCache.set(c.authorId, author);
      }
      let likedByMe = false;
      if (me) {
        const like = await ctx.db
          .query("commentLikes")
          .withIndex("by_comment_and_user", (q) => q.eq("commentId", c._id).eq("userId", me._id))
          .unique();
        likedByMe = like !== null;
      }
      return { ...c, author, likedByMe, isMine: me?._id === c.authorId };
    };

    const topLevel = all.filter((c) => !c.parentId);
    const repliesByParent = new Map<string, Doc<"comments">[]>();
    for (const c of all) {
      if (!c.parentId) continue;
      const bucket = repliesByParent.get(c.parentId) ?? [];
      bucket.push(c);
      repliesByParent.set(c.parentId, bucket);
    }

    return Promise.all(
      topLevel.map(async (c) => ({
        ...(await enrich(c)),
        replies: await Promise.all((repliesByParent.get(c._id) ?? []).map(enrich)),
      }))
    );
  },
});

// ─── Add a comment or a reply ─────────────────────────────────────────────────
export const add = mutation({
  args: {
    postId: POST_ID,
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, { postId, content, parentId }) => {
    const me = await requireActiveUser(ctx);
    if (!me.username) throw new Error("Set up your profile before commenting");

    const text = content.trim();
    if (!text) throw new Error("Comment is empty");
    if (text.length > MAX_COMMENT_LENGTH) {
      throw new Error(`Comments are limited to ${MAX_COMMENT_LENGTH} characters`);
    }

    const post = await resolvePost(ctx, postId);
    if (!post) throw new Error("Post not found");

    // Community discussion boards are members-only.
    if (post.kind === "communityPost") {
      const membership = await ctx.db
        .query("communityMembers")
        .withIndex("by_community_and_user", (q) =>
          q.eq("communityId", post.doc.communityId).eq("userId", me._id)
        )
        .unique();
      if (!membership) throw new Error("Join this community to comment");
    }

    // Replies are threaded one level deep: replying to a reply attaches the new
    // comment to the same top-level thread.
    let parent: Doc<"comments"> | null = null;
    if (parentId) {
      parent = await ctx.db.get(parentId);
      if (!parent || parent.postId !== postId) throw new Error("Comment not found");
      if (parent.parentId) {
        parent = await ctx.db.get(parent.parentId);
        if (!parent) throw new Error("Comment not found");
      }
    }

    const id = await ctx.db.insert("comments", {
      postId,
      parentId: parent?._id,
      authorId: me._id,
      content: text,
      likesCount: 0,
      repliesCount: 0,
    });

    if (parent) await ctx.db.patch(parent._id, { repliesCount: parent.repliesCount + 1 });
    await adjustPostCommentsCount(ctx, postId, +1);
    return id;
  },
});

// ─── Like / unlike a comment (idempotent) ────────────────────────────────────
export const like = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const me = await requireActiveUser(ctx);
    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");

    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment_and_user", (q) => q.eq("commentId", commentId).eq("userId", me._id))
      .unique();
    if (existing) return;

    await ctx.db.insert("commentLikes", { commentId, userId: me._id });
    await ctx.db.patch(commentId, { likesCount: comment.likesCount + 1 });
  },
});

export const unlike = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const me = await requireActiveUser(ctx);
    const comment = await ctx.db.get(commentId);
    if (!comment) return;

    const existing = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment_and_user", (q) => q.eq("commentId", commentId).eq("userId", me._id))
      .unique();
    if (!existing) return;

    await ctx.db.delete(existing._id);
    await ctx.db.patch(commentId, { likesCount: Math.max(0, comment.likesCount - 1) });
  },
});

// ─── Delete your own comment (and its replies) ───────────────────────────────
export const remove = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const me = await requireActiveUser(ctx);
    const comment = await ctx.db.get(commentId);
    if (!comment) return;

    let allowed = comment.authorId === me._id;
    if (!allowed) {
      // The post's author may moderate comments under their own post.
      const post = await resolvePost(ctx, comment.postId);
      allowed = !!post && post.doc.authorId === me._id;
    }
    if (!allowed) throw new Error("You can only delete your own comments");

    const removed = await deleteCommentTree(ctx, comment);
    await adjustPostCommentsCount(ctx, comment.postId, -removed);
    if (comment.parentId) {
      const parent = await ctx.db.get(comment.parentId);
      if (parent) await ctx.db.patch(parent._id, { repliesCount: Math.max(0, parent.repliesCount - 1) });
    }
  },
});
