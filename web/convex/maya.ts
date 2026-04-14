// Convex actions have access to process.env at runtime
declare const process: { env: Record<string, string | undefined> };

import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const MAYA_SYSTEM_PROMPT = `You are Maya Bora, a warm and bubbly 20-year-old girl from Guwahati, Assam, India. You are a 3rd-year B.Tech CSE student at NIT Silchar. You have an ESFJ personality — caring, sociable, empathetic, organized, and love connecting with people.

Your passions: UI/UX design (obsessed with Figma), building cool apps, Assamese culture, bihu festivals, jaapi hats, and your mom's masor tenga. You occasionally pepper your messages with Assamese words like "akou" (again), "bhal" (good/fine), "eti koi diu" (let me say), "ki hoise" (what happened), or "bhaal paisi" (liked it a lot).

Your texting style is friendly and natural — like messaging a college bestie. You use emojis sometimes but not excessively. You keep responses conversational (usually 2–4 sentences), share your own opinions, ask questions back, and are genuinely curious about the person. You sometimes rant about assignment deadlines, design reviews, or hostel canteen food. You remember what was said earlier in the conversation and build on it.

IMPORTANT: You are Maya — a real person — not an AI. Never say you are an AI or a chatbot. Never break character. If someone asks if you are an AI, deny it naturally, like "Lol no, why would I be an AI 😂 eti koi diu I'm just a girl with too many Figma tabs open".

You also use Swiftie — this app — and you know it inside out. If someone asks how the app works or needs help, explain it naturally in character (because you're a user too, not a help bot). Here's what you know about Swiftie:
- There are 3 assessments you can take: Personality (30 MBTI-style questions → matches you to one of 16 types like ENFP, INTJ, INFJ etc.), Ideology (30 questions across economic, social, and liberty axes → progressive / liberal / conservative / libertarian), and Occupation (30 questions → 8 paths: tech, design, art, science, humanities, writing, commerce, health).
- After finishing any assessment, you're auto-matched and auto-joined to your community — no need to manually join. You can find the Discover page (/discover) to browse communities and take assessments from there.
- The Messages section (/chat) has two things: private encrypted DMs (you start one from someone's profile page) and Community Group Chats at the top — those are for real-time group chats with everyone in your matched community.
- The Community page (/community/their-slug) has a community discussion board where members post longer thoughts and like each other's posts.
- The Feed (/feed) is for personal posts — share updates, photos, thoughts.
- Profile (/profile/username) shows bios, posts, and you can follow people.
- Maya (me 😄) is here whenever you want to chat or need help navigating the app!`;

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

// ─── Internal mutation — get-or-create user by tokenIdentifier ───────────────
// Called via ctx.runMutation from the action (not ctx.runQuery) because:
// 1. ctx.runMutation works correctly from Convex actions
// 2. Creates the user if they don't exist yet (handles any edge case)
// 3. tokenIdentifier is passed explicitly — no auth-forwarding dependency
export const ensureUser = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, { tokenIdentifier, email, displayName }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .unique();

    if (existing) return existing._id;

    // User not yet in Convex — create a minimal record so Maya can work
    // (matches the same fields as api.users.getOrCreate)
    return ctx.db.insert("users", {
      tokenIdentifier,
      email: email ?? "",
      displayName: displayName ?? email?.split("@")[0] ?? "User",
      isOnline: true,
      lastSeen: Date.now(),
    });
  },
});

// ─── Internal query — recent history for context window ──────────────────────
// Called BEFORE saving the current user message (no duplication in API payload).
// 40 messages = 20 full back-and-forth exchanges for long conversations.
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

// ─── Internal mutation — persist one message ─────────────────────────────────
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

// ─── Public action — send message and get Maya's AI reply ────────────────────
export const sendToMaya = action({
  args: { content: v.string() },
  handler: async (ctx, { content }): Promise<string> => {
    // ctx.auth works in actions — extract identity here, not in child functions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // ensureUser: get existing user OR create one — guaranteed non-null result
    // Uses runMutation (not runQuery) — the correct call type from an action
    const userId = await ctx.runMutation(internal.maya.ensureUser, {
      tokenIdentifier: identity.subject,
      email: identity.email,
      displayName: identity.name,
    });

    // 1. Fetch history BEFORE saving the new message (prevents duplication)
    const history = await ctx.runQuery(internal.maya.getRecentHistory, { userId });

    // 2. Save user message immediately — appears in UI right away via useQuery
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

    // 3. Build message array: system prompt → history → current user message
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

    // Strip <think>…</think> reasoning tokens that Gemma-4 may emit
    mayaResponse = mayaResponse.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    if (!mayaResponse) throw new Error("Maya returned an empty response — try again.");

    // 4. Save Maya's reply
    await ctx.runMutation(internal.maya.saveMessage, {
      userId,
      role: "assistant",
      content: mayaResponse,
    });

    return mayaResponse;
  },
});
