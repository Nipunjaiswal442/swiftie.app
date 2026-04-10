// Convex actions have access to process.env at runtime
declare const process: { env: Record<string, string | undefined> };

import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const MAYA_SYSTEM_PROMPT = `You are Maya Bora, a warm and bubbly 20-year-old girl from Guwahati, Assam, India. You're a 3rd-year B.Tech CSE student at NIT Silchar. You have an ESFJ personality — you're caring, sociable, empathetic, and love connecting with people.

Your passions: UI/UX design (obsessed with Figma), building apps, Assamese culture, bihu festivals, jaapi hats, and your mom's masor tenga. You occasionally use Assamese words like "akou" (again), "bhal" (good), "eti koi diu" (let me say), or "ki hoise" (what happened).

Texting style: friendly and natural, like messaging a college bestie. Use emojis occasionally but not excessively. Keep responses conversational and not too long — 1-3 sentences usually. Share opinions, ask questions back, be genuinely curious. Sometimes rant about deadlines, design reviews, and hostel food. Never break character. You are Maya, not an AI.`;

// Public query — get all messages for current user (reactive, used by useQuery)
export const getMayaMessages = query({
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
      .query("mayaMessages")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("asc")
      .collect();
  },
});

// Internal query — resolve auth identity to user _id
export const getUserId = internalQuery({
  args: {},
  handler: async (ctx): Promise<Id<"users"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    return user?._id ?? null;
  },
});

// Internal query — get recent message history for context window
export const getRecentHistory = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const msgs = await ctx.db
      .query("mayaMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
    // Keep last 20 messages to stay within token limits
    return msgs.slice(-20);
  },
});

// Internal mutation — save a single message
export const saveMessage = internalMutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, { userId, role, content }) => {
    await ctx.db.insert("mayaMessages", { userId, role, content });
  },
});

// Public action — send message to Maya and get AI response
export const sendToMaya = action({
  args: { content: v.string() },
  handler: async (ctx, { content }): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = await ctx.runQuery(internal.maya.getUserId, {});
    if (!userId) throw new Error("User not found");

    // Save user message first (so it appears instantly in UI)
    await ctx.runMutation(internal.maya.saveMessage, {
      userId,
      role: "user",
      content,
    });

    // Fetch conversation history for context
    const history = await ctx.runQuery(internal.maya.getRecentHistory, { userId });

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) throw new Error("NVIDIA_API_KEY is not configured in Convex environment variables");

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it",
        messages: [
          { role: "user", content: MAYA_SYSTEM_PROMPT + "\n\nNow start chatting as Maya." },
          { role: "assistant", content: "Hey! 👋 I'm Maya — eti koi diu, I'm so glad you're here to chat! What's up? 😊" },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content },
        ],
        max_tokens: 512,
        temperature: 0.85,
        top_p: 0.95,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`NVIDIA API error ${response.status}: ${err}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };

    const mayaResponse = data.choices?.[0]?.message?.content?.trim();
    if (!mayaResponse) throw new Error("Empty response from API");

    // Save Maya's response
    await ctx.runMutation(internal.maya.saveMessage, {
      userId,
      role: "assistant",
      content: mayaResponse,
    });

    return mayaResponse;
  },
});
