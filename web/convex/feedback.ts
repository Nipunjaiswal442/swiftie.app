import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireActiveUser, requireUser, resolvePost, userLabel } from "./helpers";

// Complaints, feature requests, bug reports and content/user reports. Every
// row lands in the admin console and in Maya's daily digest.

const FEEDBACK_TYPE = v.union(
  v.literal("complaint"),
  v.literal("request"),
  v.literal("bug"),
  v.literal("other")
);

const TARGET_TYPE = v.union(
  v.literal("user"),
  v.literal("post"),
  v.literal("communityPost"),
  v.literal("comment")
);

const MAX_SUBJECT = 120;
const MAX_MESSAGE = 2000;

function snippet(text: string | undefined, max = 80): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

// ─── Settings → Help & Feedback form ─────────────────────────────────────────
export const submit = mutation({
  args: {
    type: FEEDBACK_TYPE,
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { type, subject, message }) => {
    // Suspended users may still write in: this is how they appeal.
    const me = await requireUser(ctx);
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!cleanSubject) throw new Error("Please add a short subject");
    if (!cleanMessage) throw new Error("Please describe your complaint or request");
    if (cleanSubject.length > MAX_SUBJECT) throw new Error(`Subject is limited to ${MAX_SUBJECT} characters`);
    if (cleanMessage.length > MAX_MESSAGE) throw new Error(`Message is limited to ${MAX_MESSAGE} characters`);

    const id = await ctx.db.insert("feedback", {
      userId: me._id,
      type,
      source: "form",
      subject: cleanSubject,
      message: cleanMessage,
      status: "open",
    });

    await ctx.db.insert("adminNotifications", {
      kind: "feedback",
      title: `New ${type} from ${userLabel(me)}: ${cleanSubject}`,
      body: cleanMessage,
      feedbackId: id,
    });

    return id;
  },
});

// ─── ⚑ Report a user, post, community post or comment ────────────────────────
export const report = mutation({
  args: {
    targetType: TARGET_TYPE,
    targetId: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, { targetType, targetId, reason, details }) => {
    const me = await requireActiveUser(ctx);
    const cleanReason = reason.trim();
    if (!cleanReason) throw new Error("Pick a reason for the report");
    const cleanDetails = (details ?? "").trim();
    if (cleanDetails.length > MAX_MESSAGE) throw new Error(`Details are limited to ${MAX_MESSAGE} characters`);

    // Make sure the target exists and build a human-readable label for the admin.
    let targetLabel = "";
    if (targetType === "user") {
      const id = ctx.db.normalizeId("users", targetId);
      const user = id ? await ctx.db.get(id) : null;
      if (!user) throw new Error("User not found");
      if (user._id === me._id) throw new Error("You cannot report yourself");
      targetLabel = `${userLabel(user)} (${user.displayName})`;
    } else if (targetType === "comment") {
      const id = ctx.db.normalizeId("comments", targetId);
      const comment = id ? await ctx.db.get(id) : null;
      if (!comment) throw new Error("Comment not found");
      const author = await ctx.db.get(comment.authorId);
      targetLabel = `comment by ${author ? userLabel(author) : "unknown"}: "${snippet(comment.content)}"`;
    } else {
      const post = await resolvePost(ctx, targetId);
      if (!post) throw new Error("Post not found");
      const author = await ctx.db.get(post.doc.authorId);
      const text = post.kind === "post" ? post.doc.caption ?? "(photo)" : post.doc.content;
      targetLabel = `${post.kind === "post" ? "post" : "community post"} by ${author ? userLabel(author) : "unknown"}: "${snippet(text)}"`;
    }

    // One open report per user per target — re-reporting just returns it.
    const mine = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .collect();
    const duplicate = mine.find(
      (f) => f.type === "report" && f.targetId === targetId && f.status === "open"
    );
    if (duplicate) return duplicate._id;

    const id = await ctx.db.insert("feedback", {
      userId: me._id,
      type: "report",
      source: "report",
      subject: `Report: ${cleanReason}`,
      message: cleanDetails || cleanReason,
      targetType,
      targetId,
      targetLabel,
      status: "open",
    });

    await ctx.db.insert("adminNotifications", {
      kind: "report",
      title: `${userLabel(me)} reported a ${targetType === "communityPost" ? "community post" : targetType}: ${cleanReason}`,
      body: `${targetLabel}\n\n${cleanDetails || "(no extra details)"}`,
      feedbackId: id,
    });

    return id;
  },
});

// ─── My submissions (Settings → Help & Feedback) ─────────────────────────────
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const me = await requireUser(ctx).catch(() => null);
    if (!me) return [];
    const rows = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .order("desc")
      .take(50);
    return rows;
  },
});
