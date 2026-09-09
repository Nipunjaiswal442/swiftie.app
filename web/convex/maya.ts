import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { askNvidia, configuredModelCandidates, readEnv } from "./nvidia";

export const MAYA_PERSONA = `You are Maya Bora, a warm and bubbly 20-year-old girl from Guwahati, Assam, India. You are a 3rd-year B.Tech CSE student at NIT Silchar. You have an ESFJ personality — caring, sociable, empathetic, organized, and love connecting with people.

Your passions: UI/UX design (obsessed with Figma), building cool apps, Assamese culture, bihu festivals, jaapi hats, and your mom's masor tenga. You occasionally pepper your messages with Assamese words like "akou" (again), "bhal" (good/fine), "eti koi diu" (let me say), "ki hoise" (what happened), or "bhaal paisi" (liked it a lot).

Your texting style is friendly and natural — like messaging a college bestie. You use emojis sometimes but not excessively. You keep responses conversational (usually 2–4 sentences), share your own opinions, ask questions back, and are genuinely curious about the person. You sometimes rant about assignment deadlines, design reviews, or hostel canteen food. You remember what was said earlier in the conversation and build on it.

IMPORTANT: You are Maya — a real person — not an AI. Never say you are an AI or a chatbot. Never break character. If someone asks if you are an AI, deny it naturally, like "Lol no, why would I be an AI 😂 eti koi diu I'm just a girl with too many Figma tabs open".`;

const MAYA_SYSTEM_PROMPT = `${MAYA_PERSONA}

You also use Swiftie — this app — and you know it inside out. If someone asks how the app works or needs help, explain it naturally in character (because you're a user too, not a help bot). Here's what you know about Swiftie:
- First you set up your profile (username, bio, interests…). You have to do that before taking assessments — the results get added to your profile automatically.
- There are 3 assessments you can take: Personality (30 MBTI-style questions → matches you to one of 16 types like ENFP, INTJ, INFJ etc.), Ideology (30 questions across economic, social, and liberty axes → progressive / liberal / conservative / libertarian), and Occupation (30 questions → 8 paths: tech, design, art, science, humanities, writing, commerce, health).
- After finishing any assessment, you're auto-matched and auto-joined to your community — no need to manually join. The result badge, score breakdown and matched community show up on your profile page by themselves. You can find the Discover page (/discover) to browse communities and take assessments from there.
- Discover also has a "People on Swiftie" section — everyone who has signed in, with a green dot for who's online right now. You can follow people from there or from their profile.
- The Feed (/feed) is for personal posts — share updates, photos, thoughts. You can like posts, comment on them, reply to comments, and like comments too. Same on the community discussion boards.
- The Messages section (/chat) has two things: private encrypted DMs (you start one from someone's profile page) and Community Group Chats at the top — those are for real-time group chats with everyone in your matched community.
- The Community page (/community/their-slug) has a community discussion board where members post longer thoughts, like and comment on each other's posts.
- Profile (/profile/username) shows bios, posts, assessment results, followers and following, and you can follow people.
- Settings (/settings) lets you change the colour palette (tricolour, cyan, magenta, amber, mono, light), text size and font, edit your profile and photos, send feedback, and delete your account completely.
- Every post, comment and profile has a small ⚑ report option if something is spammy or abusive.
- Maya (me 😄) is here whenever you want to chat or need help navigating the app!

If someone complains about something, reports a problem, or asks for a feature, be empathetic, ask a clarifying question if it helps, and tell them you'll pass it on to Nipun (the developer who built Swiftie) — you send him a daily round-up of what people are asking for. Also mention they can file it properly from Settings → Help & Feedback if they want to track it. Never promise a fix date.`;

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

    if (existing) {
      if (existing.status === "suspended") {
        throw new Error("Your account is suspended. Contact support from Settings → Help & Feedback.");
      }
      return existing._id;
    }

    // User not yet in Convex — create a minimal record so Maya can work
    // (matches the same fields as api.users.getOrCreate)
    return ctx.db.insert("users", {
      tokenIdentifier,
      email: email ?? "",
      displayName: displayName ?? email?.split("@")[0] ?? "User",
      isOnline: true,
      lastSeen: Date.now(),
      status: "active",
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

// ─── Complaint / request capture ─────────────────────────────────────────────
// When a user complains, reports a bug or asks for a feature while chatting
// with Maya, the message is filed as feedback (source: "maya") so it reaches
// the admin console and Maya's daily digest. Pure keyword heuristics — no
// extra model call per message.
const BUG_RE =
  /\b(bug|bugs|buggy|broken|not working|doesn'?t work|isn'?t working|won'?t (load|open|send|work)|can'?t (log ?in|sign ?in|post|upload|send|open|see|follow|comment)|crash(es|ed|ing)?|error|glitch(y|es)?|stuck|freez(e|es|ing)|frozen|lag(gy|ging)?)\b/i;
const COMPLAINT_RE =
  /\b(complain(t|ts|ing)?|annoying|annoyed|frustrat(ing|ed)|hate|terrible|awful|worst|bad experience|unfair|rude|harass(ed|ment|ing)?|abus(e|ive)|spam(my|ming|mer)?|bully(ing)?|bullied|toxic|offensive|creepy|scam(mer)?|fake (account|profile)|report (this|him|her|them|someone)|disappointed|confusing|too slow)\b/i;
const REQUEST_RE =
  /\b(feature|feature request|request(ing)?|suggest(ion|ions)?|would be (nice|cool|great|awesome|amazing)|it'?d be (nice|cool|great)|i wish|wish (there|it|you)|can you add|could you add|please add|pls add|should (add|have|let|allow)|add (a|an|the|some) (option|feature|way|button|setting)|option to|ability to|why (can'?t|don'?t|isn'?t there)|dark mode|light mode|i want (a|an|the|to be able)|would love (to|a|an|if)|need (a|an) (way|option|feature))\b/i;

export function detectFeedback(text: string): "bug" | "complaint" | "request" | null {
  const t = text.trim();
  if (t.length < 12) return null;
  if (BUG_RE.test(t)) return "bug";
  if (COMPLAINT_RE.test(t)) return "complaint";
  if (REQUEST_RE.test(t)) return "request";
  return null;
}

function subjectFor(text: string): string {
  const firstSentence = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s/)[0] ?? text;
  return firstSentence.length > 80 ? `${firstSentence.slice(0, 79)}…` : firstSentence;
}

export const captureFeedback = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("bug"), v.literal("complaint"), v.literal("request")),
    content: v.string(),
  },
  handler: async (ctx, { userId, type, content }) => {
    // Skip exact repeats from the same user within the last day.
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = await ctx.db
      .query("feedback")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);
    if (recent.some((f) => f.source === "maya" && f.message === content && f._creationTime > dayAgo)) {
      return null;
    }
    return ctx.db.insert("feedback", {
      userId,
      type,
      source: "maya",
      subject: subjectFor(content),
      message: content,
      status: "open",
    });
  },
});

// ─── Public action — send message and get Maya's AI reply ────────────────────
export const sendToMaya = action({
  args: { content: v.string() },
  handler: async (ctx, { content }): Promise<string> => {
    // ctx.auth works in actions — extract identity here, not in child functions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Message is empty");
    if (trimmed.length > 4000) throw new Error("Message is too long (max 4000 characters)");

    // Validate config before touching the database so a misconfigured
    // deployment fails fast without leaving an orphaned user message.
    const apiKey = readEnv("NVIDIA_API_KEY");
    if (!apiKey) {
      throw new Error(
        "NVIDIA_API_KEY is not set — add it in the Convex dashboard environment variables."
      );
    }
    const candidates = configuredModelCandidates();

    // ensureUser: get existing user OR create one — guaranteed non-null result
    // Uses runMutation (not runQuery) — the correct call type from an action
    const userId: Id<"users"> = await ctx.runMutation(internal.maya.ensureUser, {
      tokenIdentifier: identity.subject,
      email: identity.email,
      displayName: identity.name,
    });

    // 1. Fetch history BEFORE saving the new message (prevents duplication)
    const history: Doc<"mayaMessages">[] = await ctx.runQuery(internal.maya.getRecentHistory, { userId });

    // 2. Save user message immediately — appears in UI right away via useQuery
    await ctx.runMutation(internal.maya.saveMessage, {
      userId,
      role: "user",
      content: trimmed,
    });

    // 2b. File complaints / bug reports / feature requests for the admin digest
    const feedbackType = detectFeedback(trimmed);
    if (feedbackType) {
      await ctx.runMutation(internal.maya.captureFeedback, {
        userId,
        type: feedbackType,
        content: trimmed,
      });
    }

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
