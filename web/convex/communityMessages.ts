import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Send a message to a community ───────────────────────────────────────────
export const send = mutation({
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

    // Must be a member
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", communityId).eq("userId", user._id)
      )
      .unique();
    if (!membership) throw new Error("You must join this community to send messages");

    return (ctx.db as any).insert("communityMessages", {
      communityId,
      senderId: user._id,
      content: content.trim(),
    });
  },
});

// ─── Get messages for a community (real-time) ─────────────────────────────────
export const getMessages = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, { communityId }) => {
    const msgs = await (ctx.db as any)
      .query("communityMessages")
      .withIndex("by_community", (q: any) => q.eq("communityId", communityId))
      .order("asc")
      .take(100);

    return Promise.all(
      msgs.map(async (msg: any) => {
        const sender = (await ctx.db.get(msg.senderId)) as any;
        return {
          ...msg,
          sender: sender
            ? {
                _id: sender._id,
                displayName: sender.displayName as string,
                username: sender.username as string | undefined,
                profilePhotoUrl: sender.profilePhotoUrl as string | undefined,
              }
            : { _id: msg.senderId, displayName: "Unknown", username: undefined, profilePhotoUrl: undefined },
        };
      })
    );
  },
});

// ─── Get current user's community chats (for Chat.tsx sidebar) ───────────────
export const getMyCommunityChats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!user) return [];

    // Get all communities the user has joined
    const memberships = await ctx.db
      .query("communityMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const results = await Promise.all(
      memberships.map(async (m) => {
        const community = await ctx.db.get(m.communityId);
        if (!community) return null;

        // Get the latest message in this community
        const msgs = await (ctx.db as any)
          .query("communityMessages")
          .withIndex("by_community", (q: any) => q.eq("communityId", community._id))
          .order("desc")
          .take(1);

        const lastMessage = msgs[0] ?? null;
        return {
          community,
          lastMessage: lastMessage
            ? { content: lastMessage.content, _creationTime: lastMessage._creationTime }
            : null,
        };
      })
    );

    const filtered = results.filter(Boolean) as Array<{
      community: NonNullable<Awaited<ReturnType<typeof ctx.db.get>>>;
      lastMessage: { content: string; _creationTime: number } | null;
    }>;

    // Sort: communities with recent messages first, then alphabetically
    return filtered.sort((a, b) => {
      const ta = a.lastMessage?._creationTime ?? 0;
      const tb = b.lastMessage?._creationTime ?? 0;
      if (tb !== ta) return tb - ta;
      return (a.community as any).name.localeCompare((b.community as any).name);
    });
  },
});
