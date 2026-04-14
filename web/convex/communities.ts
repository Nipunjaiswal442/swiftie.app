import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Seed data ────────────────────────────────────────────────────────────────

const PERSONALITY_COMMUNITIES = [
  { slug: "intj-architects", name: "The Architects", matchKey: "INTJ", icon: "🏛️", description: "Strategic minds who plan everything. INTJs discuss systems thinking, long-term strategy, and turning complex visions into reality." },
  { slug: "intp-logicians", name: "The Logicians", matchKey: "INTP", icon: "🔬", description: "Curious theorists who love a good thought experiment. Deep dives into logic, philosophy, and abstract ideas." },
  { slug: "entj-commanders", name: "The Commanders", matchKey: "ENTJ", icon: "⚡", description: "Natural-born leaders who love a challenge. Talk strategy, leadership, and building things that last." },
  { slug: "entp-debaters", name: "The Debaters", matchKey: "ENTP", icon: "🗣️", description: "Devil's advocates who love intellectual sparring. Expect contrarian takes and rapid-fire idea generation." },
  { slug: "infj-advocates", name: "The Advocates", matchKey: "INFJ", icon: "🌿", description: "Idealistic visionaries with a cause. Share values, creative projects, and conversations that actually mean something." },
  { slug: "infp-mediators", name: "The Mediators", matchKey: "INFP", icon: "🌸", description: "Poetic souls guided by their values. A space for art, identity, authenticity, and emotional depth." },
  { slug: "enfj-protagonists", name: "The Protagonists", matchKey: "ENFJ", icon: "🌟", description: "Charismatic leaders who love to uplift others. Discuss growth, community building, and social impact." },
  { slug: "enfp-campaigners", name: "The Campaigners", matchKey: "ENFP", icon: "🎉", description: "Free spirits who see possibilities everywhere. Creative energy, new ideas, and genuine human connection." },
  { slug: "istj-inspectors", name: "The Inspectors", matchKey: "ISTJ", icon: "📋", description: "Reliable, fact-minded traditionalists. Talk about systems, processes, and getting things done right." },
  { slug: "isfj-defenders", name: "The Defenders", matchKey: "ISFJ", icon: "🛡️", description: "Warm protectors who are always ready to help. Share experiences of care, loyalty, and community." },
  { slug: "estj-executives", name: "The Executives", matchKey: "ESTJ", icon: "📊", description: "Order-loving organisers who make things happen. Business, discipline, and structured problem-solving." },
  { slug: "esfj-consuls", name: "The Consuls", matchKey: "ESFJ", icon: "🤝", description: "Social butterflies who keep everyone together. Celebrate relationships, traditions, and group harmony." },
  { slug: "istp-virtuosos", name: "The Virtuosos", matchKey: "ISTP", icon: "🔧", description: "Bold experimenters who love tinkering. Hardware, hands-on projects, and mastering practical skills." },
  { slug: "isfp-adventurers", name: "The Adventurers", matchKey: "ISFP", icon: "🎨", description: "Spontaneous artists who live in the moment. Share creative work, aesthetics, and personal expression." },
  { slug: "estp-entrepreneurs", name: "The Entrepreneurs", matchKey: "ESTP", icon: "🚀", description: "Energetic risk-takers who live on the edge. Startups, sports, and making things happen in real time." },
  { slug: "esfp-entertainers", name: "The Entertainers", matchKey: "ESFP", icon: "🎭", description: "Spontaneous, energetic, and always the life of the party. Music, performance, and pure fun." },
];

const IDEOLOGY_COMMUNITIES = [
  { slug: "progressive-voices", name: "Progressive Voices", matchKey: "progressive", icon: "🌱", description: "A space for centre-left and progressive discourse — social justice, climate, and reform politics." },
  { slug: "classical-liberal", name: "Classical Liberals", matchKey: "liberal", icon: "🗽", description: "Individual liberty, free markets, and limited government. Thoughtful liberal debate." },
  { slug: "conservative-circle", name: "Conservative Circle", matchKey: "conservative", icon: "🏛️", description: "Traditional values, cultural continuity, and ordered liberty. Respectful right-of-centre dialogue." },
  { slug: "libertarian-hub", name: "Libertarian Hub", matchKey: "libertarian", icon: "⚖️", description: "Minimal state, maximum freedom. Discuss voluntary exchange, civil liberties, and decentralisation." },
];

const OCCUPATION_COMMUNITIES = [
  { slug: "builders-den", name: "Builders' Den", matchKey: "tech", icon: "💻", description: "Engineers, developers, and hackers. Ship code, debug life, and talk about what you're building." },
  { slug: "creative-studio", name: "Creative Studio", matchKey: "art", icon: "🎨", description: "Designers, illustrators, musicians, and filmmakers. Share work, get feedback, and find collaborators." },
  { slug: "humanities-forum", name: "Humanities Forum", matchKey: "humanities", icon: "📚", description: "Writers, philosophers, historians, and social scientists. Ideas, texts, and big questions." },
  { slug: "commerce-corner", name: "Commerce Corner", matchKey: "commerce", icon: "📈", description: "Founders, marketers, finance folks, and operators. Build, grow, and scale." },
];

// ─── Seed communities (run once if empty) ────────────────────────────────────
export const seedCommunities = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("communities").first();
    if (existing) return; // already seeded

    const all = [
      ...PERSONALITY_COMMUNITIES.map((c) => ({ ...c, section: "personality" as const, memberCount: 0 })),
      ...IDEOLOGY_COMMUNITIES.map((c) => ({ ...c, section: "ideology" as const, memberCount: 0 })),
      ...OCCUPATION_COMMUNITIES.map((c) => ({ ...c, section: "occupation" as const, memberCount: 0 })),
    ];

    for (const community of all) {
      await ctx.db.insert("communities", community);
    }
  },
});

// ─── Public query — get all communities (optionally filtered by section) ─────
export const getAll = query({
  args: {
    section: v.optional(
      v.union(
        v.literal("personality"),
        v.literal("ideology"),
        v.literal("occupation")
      )
    ),
  },
  handler: async (ctx, { section }) => {
    if (section) {
      return ctx.db
        .query("communities")
        .withIndex("by_section", (q) => q.eq("section", section))
        .collect();
    }
    return ctx.db.query("communities").collect();
  },
});

// ─── Public query — get one community by slug ─────────────────────────────────
export const getOne = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("communities")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// ─── Public query — get recommended communities for current user ───────────────
// Matches communities where matchKey equals the user's assessmentResult matchKey
// for the given section. Falls back to all communities in that section.
export const getRecommended = query({
  args: {
    section: v.union(
      v.literal("personality"),
      v.literal("ideology"),
      v.literal("occupation")
    ),
  },
  handler: async (ctx, { section }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return [];

    // Get assessment result for this section
    const result = await ctx.db
      .query("assessmentResults")
      .withIndex("by_user_section", (q) =>
        q.eq("userId", user._id).eq("section", section)
      )
      .unique();

    if (result) {
      // Return exact match first, then others in section
      const matched = await ctx.db
        .query("communities")
        .withIndex("by_match_key", (q) => q.eq("matchKey", result.matchKey))
        .collect();
      const others = await ctx.db
        .query("communities")
        .withIndex("by_section", (q) => q.eq("section", section))
        .collect();
      // Merge: matched first, then rest (dedup by _id)
      const matchedIds = new Set(matched.map((c) => c._id));
      return [...matched, ...others.filter((c) => !matchedIds.has(c._id))];
    }

    // No assessment yet — return all communities in section
    return ctx.db
      .query("communities")
      .withIndex("by_section", (q) => q.eq("section", section))
      .collect();
  },
});

// ─── Mutation — join a community ──────────────────────────────────────────────
export const join = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, { communityId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Idempotent: check if already a member
    const existing = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", communityId).eq("userId", user._id)
      )
      .unique();
    if (existing) return existing._id;

    const community = await ctx.db.get(communityId);
    if (!community) throw new Error("Community not found");

    await ctx.db.patch(communityId, { memberCount: community.memberCount + 1 });
    return ctx.db.insert("communityMembers", {
      communityId,
      userId: user._id,
      joinedAt: Date.now(),
    });
  },
});

// ─── Mutation — leave a community ─────────────────────────────────────────────
export const leave = mutation({
  args: { communityId: v.id("communities") },
  handler: async (ctx, { communityId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", communityId).eq("userId", user._id)
      )
      .unique();
    if (!membership) return;

    const community = await ctx.db.get(communityId);
    if (community) {
      await ctx.db.patch(communityId, {
        memberCount: Math.max(0, community.memberCount - 1),
      });
    }
    await ctx.db.delete(membership._id);
  },
});

// ─── Query — check if current user is a member ────────────────────────────────
export const isMember = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, { communityId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return false;

    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", communityId).eq("userId", user._id)
      )
      .unique();
    return !!membership;
  },
});

// ─── Query — get communities the current user has joined ──────────────────────
export const getMyCommunitiesBySection = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { personality: [], ideology: [], occupation: [] };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return { personality: [], ideology: [], occupation: [] };

    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const communities = await Promise.all(
      memberships.map((m) => ctx.db.get(m.communityId))
    );

    const result: { personality: typeof communities; ideology: typeof communities; occupation: typeof communities } = {
      personality: [],
      ideology: [],
      occupation: [],
    };

    for (const c of communities) {
      if (c) result[c.section].push(c);
    }

    return result;
  },
});
