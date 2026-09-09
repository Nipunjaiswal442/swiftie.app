import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireActiveUser } from "./helpers";

const SECTION_ARG = v.union(
  v.literal("personality"),
  v.literal("ideology"),
  v.literal("occupation")
);

// ─── Complete assessment + auto-join matched community ────────────────────────
// This is the primary mutation called from all three assessment pages.
// It saves the result and auto-joins the community that matches the user's result.
export const completeAssessment = mutation({
  args: {
    section: SECTION_ARG,
    scores: v.record(v.string(), v.number()),
    matchKey: v.string(),
  },
  handler: async (ctx, { section, scores, matchKey }) => {
    const user = await requireActiveUser(ctx);
    // Profiles are created before assessments so the result has somewhere to land.
    if (!user.username) {
      throw new Error("Set up your profile before taking an assessment");
    }

    // 1. Upsert assessment result (one per section per user)
    const existing = await ctx.db
      .query("assessmentResults")
      .withIndex("by_user_section", (q) =>
        q.eq("userId", user._id).eq("section", section)
      )
      .unique();
    if (existing) await ctx.db.delete(existing._id);

    const resultId = await ctx.db.insert("assessmentResults", {
      userId: user._id,
      section,
      scores,
      matchKey,
      completedAt: Date.now(),
    });

    // 1b. Cache matchKey on user doc for fast profile/chat rendering
    const resultField =
      section === 'personality' ? 'personalityResult' :
      section === 'ideology'    ? 'ideologyResult'    :
                                  'occupationResult';
    await ctx.db.patch(user._id, { [resultField]: matchKey });

    // 2. Find the matching community for this section + matchKey
    // Note: matchKeys are globally unique across sections (MBTI codes never
    // collide with ideology or occupation keys), so we can safely filter by section
    // after the index lookup on matchKey.
    const candidates = await ctx.db
      .query("communities")
      .withIndex("by_match_key", (q) => q.eq("matchKey", matchKey))
      .collect();
    const community = candidates.find((c) => c.section === section) ?? null;

    if (!community) {
      return { resultId, communityId: null, matchKey };
    }

    // 3. Auto-join if not already a member
    const existingMembership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", community._id).eq("userId", user._id)
      )
      .unique();

    if (!existingMembership) {
      await ctx.db.patch(community._id, {
        memberCount: community.memberCount + 1,
      });
      await ctx.db.insert("communityMembers", {
        communityId: community._id,
        userId: user._id,
        joinedAt: Date.now(),
      });
    }

    return { resultId, communityId: community._id, matchKey };
  },
});

// ─── Save assessment result (kept for backward compatibility) ─────────────────
export const saveResult = mutation({
  args: {
    section: SECTION_ARG,
    scores: v.record(v.string(), v.number()),
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
  args: { section: SECTION_ARG },
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

// ─── Public: results shown on a profile page ─────────────────────────────────
// Every completed assessment is automatically part of the profile: the
// matched type, the score breakdown, when it was completed and the community
// the user was matched into.
export const getResultsForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const results = await ctx.db
      .query("assessmentResults")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return Promise.all(
      results.map(async (r) => {
        const candidates = await ctx.db
          .query("communities")
          .withIndex("by_match_key", (q) => q.eq("matchKey", r.matchKey))
          .collect();
        const community = candidates.find((c) => c.section === r.section) ?? null;
        return {
          _id: r._id,
          section: r.section,
          matchKey: r.matchKey,
          scores: r.scores,
          completedAt: r.completedAt,
          community: community
            ? { slug: community.slug, name: community.name, icon: community.icon }
            : null,
        };
      })
    );
  },
});
