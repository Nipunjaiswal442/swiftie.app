import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Save assessment result ───────────────────────────────────────────────────
export const saveResult = mutation({
  args: {
    section: v.union(
      v.literal("personality"),
      v.literal("ideology"),
      v.literal("occupation")
    ),
    scores: v.object({
      E: v.optional(v.number()),
      I: v.optional(v.number()),
      S: v.optional(v.number()),
      N: v.optional(v.number()),
      T: v.optional(v.number()),
      F: v.optional(v.number()),
      J: v.optional(v.number()),
      P: v.optional(v.number()),
    }),
    matchKey: v.string(),
  },
  handler: async (ctx, { section, scores, matchKey }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Delete existing result for this section (one result per section)
    const existing = await ctx.db
      .query("assessmentResults")
      .withIndex("by_user_section", (q) =>
        q.eq("userId", user._id).eq("section", section)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);

    return ctx.db.insert("assessmentResults", {
      userId: user._id,
      section,
      scores,
      matchKey,
      completedAt: Date.now(),
    });
  },
});

// ─── Get my result for a specific section ────────────────────────────────────
export const getMyResult = query({
  args: {
    section: v.union(
      v.literal("personality"),
      v.literal("ideology"),
      v.literal("occupation")
    ),
  },
  handler: async (ctx, { section }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return null;

    return ctx.db
      .query("assessmentResults")
      .withIndex("by_user_section", (q) =>
        q.eq("userId", user._id).eq("section", section)
      )
      .unique();
  },
});

// ─── Get all my results across all sections ───────────────────────────────────
export const getMyAllResults = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return [];

    return ctx.db
      .query("assessmentResults")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});
