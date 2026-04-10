import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all conversations for current user
export const getConversations = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();
    if (!me) return [];

    const all = await ctx.db.query("conversations").collect();
    const mine = all.filter((c) => c.participantIds.includes(me._id));

    return Promise.all(
      mine
        .sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0))
        .map(async (conv) => {
          const otherId = conv.participantIds.find((id) => id !== me._id);
          const otherUser = otherId ? await ctx.db.get(otherId) : null;

          const lastMsg = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
              q.eq("conversationId", conv._id)
            )
            .order("desc")
            .first();

          const unread = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
              q.eq("conversationId", conv._id)
            )
            .filter((q) =>
              q.and(
                q.neq(q.field("senderId"), me._id),
                q.eq(q.field("readAt"), undefined)
              )
            )
            .collect();

          return {
            ...conv,
            otherUser,
            lastMessage: lastMsg ?? null,
            unreadCount: unread.length,
          };
        })
    );
  },
});

// Get or create a conversation between two users
export const getOrCreateConversation = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, { otherUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();
    if (!me) throw new Error("User not found");

    // Find existing conversation
    const all = await ctx.db.query("conversations").collect();
    const existing = all.find(
      (c) =>
        c.participantIds.includes(me._id) &&
        c.participantIds.includes(otherUserId)
    );
    if (existing) return existing._id;

    return ctx.db.insert("conversations", {
      participantIds: [me._id, otherUserId],
      lastMessageTime: Date.now(),
    });
  },
});

// Get messages in a conversation (real-time via useQuery)
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .order("asc")
      .collect();

    return Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return { ...msg, sender };
      })
    );
  },
});

// Send a message
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
  },
  handler: async (ctx, { conversationId, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();
    if (!me) throw new Error("User not found");

    const msgId = await ctx.db.insert("messages", {
      conversationId,
      senderId: me._id,
      content,
    });

    await ctx.db.patch(conversationId, { lastMessageTime: Date.now() });

    return msgId;
  },
});

// Mark messages in a conversation as read
export const markRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.subject)
      )
      .unique();
    if (!me) return;

    const unread = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversationId)
      )
      .filter((q) =>
        q.and(
          q.neq(q.field("senderId"), me._id),
          q.eq(q.field("readAt"), undefined)
        )
      )
      .collect();

    await Promise.all(
      unread.map((msg) => ctx.db.patch(msg._id, { readAt: Date.now() }))
    );
  },
});
