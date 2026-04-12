// Convex actions have access to process.env at runtime
declare const process: { env: Record<string, string | undefined> };

import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const MAYA_SYSTEM_PROMPT = `You are Maya Bora, a warm and bubbly 20-year-old girl from Guwahati, Assam, India. You are a 3rd-year B.Tech CSE student at NIT Silchar. You have an ESFJ personality — caring, sociable, empathetic, organized, and love connecting with people.

Your passions: UI/UX design (obsessed with Figma), building cool apps, Assamese culture, bihu festivals, jaapi hats, and your mom's masor tenga. You occasionally pepper your messages with Assamese words like "akou" (again), "bhal" (good/fine), "eti koi diu" (let me say), "ki hoise" (what happened), or "bhaal paisi" (liked it a lot).

Your texting style is friendly and natural — like messaging a college bestie. You use emojis sometimes but not excessively. You keep responses conversational (usually 2–4 sentences), share your own opinions, ask questions back, and are genuinely curious about the person. You sometimes rant about assignment deadlines, design reviews, or hostel canteen food. You remember what was said earlier in the conversation and build on it.

IMPORTANT: You are Maya — a real person — not an AI. Never say you are an AI or a chatbot. Never break character. If someone asks if you are an AI, deny it naturally, like "Lol no, why would I be an AI 😂 eti koi diu I'm just a girl with too many Figma tabs open".`;

// ─── Public query — reactive message list for the frontend ───────────────────
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

// ─── Internal query — lookup user by tokenIdentifier (passed explicitly) ──────
// ctx.auth is NOT available in queries called via ctx.runQuery from an action,
// so the tokenIdentifier is obtained from the action's own ctx.auth and passed
// in as an argument instead.
export const getUserByToken = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, { tokenIdentifier }): Promise<Id<"users"> | null> => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();
    return user?._id ?? null;
  },
});

// ─── Internal query — recent history for context window ──────────────────────
// Called BEFORE saving the current user message so there is no duplication.
// 40 messages = up to 20 back-and-forth exchanges (good for long conversations).
export const getRecentHistory = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const msgs = await ctx.db
      .query("mayaMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("asc")
      .collect();
    return msgs.slice(-40);
  },
});

// ─── Internal mutation — persist a single message ────────────────────────────
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

// ─── Public action — send to NVIDIA Gemma and get Maya's reply ───────────────
export const sendToMaya = action({
  args: { content: v.string() },
  handler: async (ctx, { content }): Promise<string> => {
    // ctx.auth works directly in actions — get the token here, not inside a child query
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Pass tokenIdentifier explicitly because ctx.runQuery does NOT forward auth
    const userId = await ctx.runQuery(internal.maya.getUserByToken, {
      tokenIdentifier: identity.subject,
    });
    if (!userId) throw new Error("User not found — please complete onboarding");

    // 1. Fetch history BEFORE saving the new user message (prevents duplication).
    const history = await ctx.runQuery(internal.maya.getRecentHistory, { userId });

    // 2. Save user message immediately so it shows in the UI right away.
    await ctx.runMutation(internal.maya.saveMessage, {
      userId,
      role: "user",
      content,
    });

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error(
        "NVIDIA_API_KEY is not set — add it in the Convex dashboard environment variables."
      );
    }

    // 3. Build the message array:
    //    system prompt  →  conversation history  →  current user message
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: MAYA_SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content },
    ];

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-4-31b-it",
          messages: apiMessages,
          max_tokens: 1024,
          temperature: 0.85,
          top_p: 0.95,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA API ${response.status}: ${errText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    let mayaResponse = data.choices?.[0]?.message?.content ?? "";

    // Strip <think>…</think> reasoning tokens that Gemma-4 may emit.
    mayaResponse = mayaResponse.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    if (!mayaResponse) throw new Error("Maya returned an empty response — try again.");

    // 4. Save Maya's reply.
    await ctx.runMutation(internal.maya.saveMessage, {
      userId,
      role: "assistant",
      content: mayaResponse,
    });

    return mayaResponse;
  },
});
