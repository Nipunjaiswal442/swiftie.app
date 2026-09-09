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

// ─── NVIDIA NIM configuration ────────────────────────────────────────────────
// Model + key are read from the Convex deployment's environment variables
// (Convex dashboard → Settings → Environment Variables), never from the repo.
//
//   NVIDIA_API_KEY   required  — "nvapi-…" key from build.nvidia.com
//   NVIDIA_MODEL     optional  — defaults to DEFAULT_MODEL below
//
// NVIDIA model ids are "vendor/model" (e.g. "nvidia/nemotron-3-ultra-550b-a55b").
// A bare id such as "nemotron-3-ultra-550b-a55b" is normalised in resolveModelCandidates.
const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_TOKENS = 1024;

const VENDOR_PREFIXES: Array<[RegExp, string]> = [
  [/^deepseek/i, "deepseek-ai"],
  [/^gemma/i, "google"],
  [/nemotron/i, "nvidia"], // before llama: "llama-3.x-nemotron-*" is an NVIDIA model
  [/^llama/i, "meta"],
  [/^mistral|^mixtral/i, "mistralai"],
  [/^qwen/i, "qwen"],
];

/** Read an env var, tolerating stray whitespace / surrounding quotes from copy-paste. */
function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const cleaned = raw.trim().replace(/^["']|["']$/g, "").trim();
  return cleaned || undefined;
}

/** Turn whatever is configured into a NVIDIA "vendor/model" id. */
export function normalizeModelId(raw: string | undefined): string {
  const id = (raw ?? "").trim();
  if (!id) return DEFAULT_MODEL;
  if (id.includes("/")) return id;
  const lower = id.toLowerCase();
  for (const [pattern, vendor] of VENDOR_PREFIXES) {
    if (pattern.test(lower)) return `${vendor}/${lower}`;
  }
  return id;
}

/**
 * Ordered list of models to try. The configured model goes first; if it carries a
 * dated suffix (e.g. "deepseek-v4-flash-0731") the un-suffixed id is tried next,
 * because NVIDIA gates dated snapshots per account and returns 404 for most keys.
 * DEFAULT_MODEL is always the last resort.
 */
export function resolveModelCandidates(raw: string | undefined): string[] {
  const primary = normalizeModelId(raw);
  const candidates = [primary];
  const undated = primary.replace(/-\d{4}$/, "");
  if (undated !== primary) candidates.push(undated);
  candidates.push(DEFAULT_MODEL);
  return Array.from(new Set(candidates));
}

/** Models whose NIM chat template exposes a thinking/reasoning toggle. */
function hasThinkingToggle(model: string): boolean {
  return /deepseek|nemotron/i.test(model);
}

function buildRequestBody(model: string, messages: Array<{ role: string; content: string }>) {
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: MAX_TOKENS,
    temperature: 0.85,
    top_p: 0.95,
    stream: false,
  };
  if (hasThinkingToggle(model)) {
    // Nemotron 3 and DeepSeek V3.1 / V4 on NVIDIA NIM select "thinking" mode
    // through chat_template_kwargs. Maya is a persona chat, so thinking is
    // switched off: it keeps replies fast, avoids the endpoint stalling when
    // the flag is absent, and stops reasoning tokens from eating the whole
    // max_tokens budget (which surfaces as an empty `content`). Nemotron uses
    // `enable_thinking`, NVIDIA's DeepSeek examples use `thinking`; unknown
    // template kwargs are ignored, so both are sent.
    body.chat_template_kwargs = { enable_thinking: false, thinking: false };
  }
  return body;
}

type ChatCompletion = {
  choices?: Array<{
    message?: {
      content?: string | null;
      reasoning_content?: string | null;
      reasoning?: string | null;
    };
    finish_reason?: string | null;
  }>;
};

/** fetch with a hard timeout so a stalled upstream never leaves the UI spinning. */
async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller?.abort();
      reject(new Error(`NVIDIA API timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([
      fetch(input, controller ? { ...init, signal: controller.signal } : init),
      timeout,
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Extract Maya's reply text from a chat completion, stripping any inline reasoning. */
export function extractReply(data: ChatCompletion): string {
  const message = data.choices?.[0]?.message;
  let text = message?.content ?? "";
  // Some reasoning models emit <think>…</think> inline; never show that to the user.
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  return text;
}

/**
 * Call NVIDIA NIM, walking the candidate list on 404 (model not enabled for this
 * account) or 410 (model reached end of life). Any other failure is surfaced
 * immediately with the upstream detail.
 */
async function askNvidia(
  apiKey: string,
  candidates: string[],
  messages: Array<{ role: string; content: string }>
): Promise<{ model: string; reply: string }> {
  const unavailable: string[] = [];

  for (const model of candidates) {
    const response = await fetchWithTimeout(
      NVIDIA_CHAT_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(buildRequestBody(model, messages)),
      },
      REQUEST_TIMEOUT_MS
    );

    if (response.status === 404 || response.status === 410) {
      const detail = await response.text();
      console.warn(
        `[maya] model "${model}" not available (${response.status}): ${detail.slice(0, 200)}`
      );
      unavailable.push(`${model} (${response.status})`);
      continue;
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `NVIDIA API rejected the key (${response.status}). Check NVIDIA_API_KEY in the Convex dashboard.`
      );
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`NVIDIA API ${response.status} for model "${model}": ${errText.slice(0, 500)}`);
    }

    const data = (await response.json()) as ChatCompletion;
    const reply = extractReply(data);
    if (!reply) {
      const finish = data.choices?.[0]?.finish_reason ?? "unknown";
      throw new Error(
        `Maya returned an empty response from "${model}" (finish_reason: ${finish}) — try again.`
      );
    }
    return { model, reply };
  }

  throw new Error(
    `None of the configured NVIDIA models are available for this API key: ${unavailable.join(", ")}. ` +
      `Set NVIDIA_MODEL in the Convex dashboard to a current model listed at build.nvidia.com.`
  );
}

// ─── Public action — send message and get Maya's AI reply ────────────────────
export const sendToMaya = action({
  args: { content: v.string() },
  handler: async (ctx, { content }): Promise<string> => {
    // ctx.auth works in actions — extract identity here, not in child functions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Message is empty");

    // Validate config before touching the database so a misconfigured
    // deployment fails fast without leaving an orphaned user message.
    const apiKey = readEnv("NVIDIA_API_KEY");
    if (!apiKey) {
      throw new Error(
        "NVIDIA_API_KEY is not set — add it in the Convex dashboard environment variables."
      );
    }
    const candidates = resolveModelCandidates(readEnv("NVIDIA_MODEL") ?? readEnv("MAYA_MODEL"));

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
      content: trimmed,
    });

    // 3. Build message array: system prompt → history → current user message
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: MAYA_SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: trimmed },
    ];

    const { model, reply } = await askNvidia(apiKey, candidates, apiMessages);
    console.log(`[maya] replied via ${model} (${reply.length} chars)`);

    // 4. Save Maya's reply
    await ctx.runMutation(internal.maya.saveMessage, {
      userId,
      role: "assistant",
      content: reply,
    });

    return reply;
  },
});
