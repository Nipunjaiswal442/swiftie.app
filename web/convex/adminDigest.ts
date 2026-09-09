// Maya's daily briefing for the admin console: a summary, written in her
// voice, of every complaint, feature request, bug report and content report
// from the last 24 hours (Help & Feedback forms, ⚑ reports, and things users
// said to Maya in chat). Runs from crons.ts every morning and on demand from
// the admin console ("Ask Maya for a round-up now").
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { MAYA_PERSONA } from "./maya";
import { askNvidia, configuredModelCandidates, readEnv } from "./nvidia";
import { isUserOnline, userLabel } from "./helpers";

export const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS_IN_BRIEF = 60;

const DIGEST_SYSTEM_PROMPT = `${MAYA_PERSONA}

Right now you are NOT chatting with a user. You are sending your daily update to Nipun — the developer who built Swiftie and runs its admin console. You've been quietly collecting what people complained about, asked for, and reported over the last 24 hours (from the Help & Feedback forms, the ⚑ report buttons, and things people told you directly in chat), and you're passing it all on to him like a friend who's also his sharpest product teammate.

Stay completely in character: warm, a little dramatic, the occasional Assamese word, a few emojis. But be genuinely useful:
- Put anything urgent first (harassment, abuse, safety, scams, or bugs that block login/posting/messaging).
- Group similar complaints and requests together and say how many people raised each.
- Mention the user handle for each item so Nipun can follow up (e.g. "@riya said…").
- Add a one-line "my take" at the end: what you'd fix or build first and why.
- Quote the activity numbers briefly (new sign-ups, who's online, posts, comments).
- Keep it under about 350 words. Plain text only — no markdown headers, no tables, no bold. Use short lines and simple • bullets.
- Never invent items or users that aren't in the data. If a section is empty, say so in one cheerful line.
- Sign off as Maya.`;

type DigestItem = {
  id: string;
  type: string;
  source: string;
  status: string;
  user: string;
  subject: string;
  message: string;
  targetLabel?: string;
  createdAt: number;
};

export type DigestData = {
  since: number;
  until: number;
  items: DigestItem[];
  openBacklog: number;
  counts: {
    complaints: number;
    requests: number;
    bugs: number;
    reports: number;
    other: number;
    fromMaya: number;
    fromForms: number;
    newUsers: number;
    activeUsers: number;
    onlineNow: number;
    suspended: number;
    totalUsers: number;
    newPosts: number;
    newComments: number;
  };
};

// ─── Gather everything worth summarising ─────────────────────────────────────
export const collectDigestData = internalQuery({
  args: { since: v.number(), until: v.number() },
  handler: async (ctx, { since, until }): Promise<DigestData> => {
    const inWindow = (t: number) => t >= since && t <= until;

    const recentFeedback = (await ctx.db.query("feedback").order("desc").take(500)).filter((f) =>
      inWindow(f._creationTime)
    );
    const openRows = await ctx.db
      .query("feedback")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    const userCache = new Map<string, string>();
    const labelFor = async (userId: (typeof recentFeedback)[number]["userId"]) => {
      const cached = userCache.get(userId);
      if (cached) return cached;
      const doc = await ctx.db.get(userId);
      const label = doc ? userLabel(doc) : "a deleted user";
      userCache.set(userId, label);
      return label;
    };

    const items: DigestItem[] = [];
    for (const f of recentFeedback.slice(0, MAX_ITEMS_IN_BRIEF)) {
      items.push({
        id: f._id,
        type: f.type,
        source: f.source,
        status: f.status,
        user: await labelFor(f.userId),
        subject: f.subject,
        message: f.message.length > 400 ? `${f.message.slice(0, 399)}…` : f.message,
        targetLabel: f.targetLabel,
        createdAt: f._creationTime,
      });
    }

    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    const posts = (await ctx.db.query("posts").order("desc").take(300)).filter((p) => inWindow(p._creationTime));
    const communityPosts = (await ctx.db.query("communityPosts").order("desc").take(300)).filter((p) =>
      inWindow(p._creationTime)
    );
    const comments = (await ctx.db.query("comments").order("desc").take(500)).filter((c) =>
      inWindow(c._creationTime)
    );

    const count = (type: string) => recentFeedback.filter((f) => f.type === type).length;

    return {
      since,
      until,
      items,
      openBacklog: openRows.length,
      counts: {
        complaints: count("complaint"),
        requests: count("request"),
        bugs: count("bug"),
        reports: count("report"),
        other: count("other"),
        fromMaya: recentFeedback.filter((f) => f.source === "maya").length,
        fromForms: recentFeedback.filter((f) => f.source !== "maya").length,
        newUsers: users.filter((u) => inWindow(u._creationTime)).length,
        activeUsers: users.filter((u) => (u.lastSeen ?? 0) >= since).length,
        onlineNow: users.filter((u) => isUserOnline(u, now)).length,
        suspended: users.filter((u) => u.status === "suspended").length,
        totalUsers: users.length,
        newPosts: posts.length + communityPosts.length,
        newComments: comments.length,
      },
    };
  },
});

// ─── Persist the digest as an admin notification ─────────────────────────────
export const storeDigest = internalMutation({
  args: {
    title: v.string(),
    body: v.string(),
    since: v.number(),
    until: v.number(),
    stats: v.any(),
  },
  handler: async (ctx, { title, body, since, until, stats }) => {
    return ctx.db.insert("adminNotifications", {
      kind: "daily_digest",
      title,
      body,
      periodStart: since,
      periodEnd: until,
      stats,
    });
  },
});

// ─── Formatting helpers ──────────────────────────────────────────────────────
function formatIST(ts: number): string {
  return new Date(ts).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateIST(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

/** The raw facts Maya summarises. Plain text, one item per line. */
export function buildDigestBrief(data: DigestData): string {
  const lines: string[] = [];
  lines.push(`Window: ${formatIST(data.since)} → ${formatIST(data.until)} (IST)`);
  lines.push("");
  lines.push("ACTIVITY NUMBERS");
  lines.push(
    `total users ${data.counts.totalUsers} · new sign-ups ${data.counts.newUsers} · active in window ${data.counts.activeUsers} · online right now ${data.counts.onlineNow} · suspended ${data.counts.suspended}`
  );
  lines.push(`new posts ${data.counts.newPosts} · new comments ${data.counts.newComments}`);
  lines.push(
    `feedback in window: ${data.counts.complaints} complaints, ${data.counts.requests} requests, ${data.counts.bugs} bugs, ${data.counts.reports} reports, ${data.counts.other} other (${data.counts.fromMaya} heard in Maya chat, ${data.counts.fromForms} via forms/reports) · open backlog ${data.openBacklog}`
  );
  lines.push("");
  if (data.items.length === 0) {
    lines.push("ITEMS: none in this window.");
  } else {
    lines.push("ITEMS (newest first)");
    data.items.forEach((item, i) => {
      const via = item.source === "maya" ? "told Maya in chat" : item.source === "report" ? "⚑ report" : "feedback form";
      const target = item.targetLabel ? ` · target: ${item.targetLabel}` : "";
      lines.push(
        `${i + 1}. [${item.type.toUpperCase()}] ${item.user} · ${via} · ${item.status}${target}\n   "${item.subject}" — ${item.message}`
      );
    });
  }
  return lines.join("\n");
}

/** Used when NVIDIA is not configured or fails: still deliver the round-up, in Maya's voice. */
export function fallbackDigest(data: DigestData, note?: string): string {
  const c = data.counts;
  const lines: string[] = [];
  lines.push(`Hey Nipun! Maya here with your daily Swiftie round-up 🌸`);
  lines.push("");
  const total = c.complaints + c.requests + c.bugs + c.reports + c.other;
  if (total === 0) {
    lines.push("Bhal news — nobody complained, reported, or requested anything in the last 24 hours. Quiet day! 🎉");
  } else {
    lines.push(
      `Eti koi diu — ${total} thing${total === 1 ? "" : "s"} came in: ${c.complaints} complaint${c.complaints === 1 ? "" : "s"}, ${c.requests} request${c.requests === 1 ? "" : "s"}, ${c.bugs} bug${c.bugs === 1 ? "" : "s"}, ${c.reports} report${c.reports === 1 ? "" : "s"}${c.other ? `, ${c.other} other` : ""}. ${c.fromMaya ? `${c.fromMaya} of those people told me directly in chat.` : ""}`.trim()
    );
    const urgent = data.items.filter((i) => i.type === "report" || i.type === "bug");
    if (urgent.length) {
      lines.push("");
      lines.push("Look at these first:");
      for (const i of urgent.slice(0, 8)) {
        lines.push(`• ${i.user} — ${i.subject}${i.targetLabel ? ` (${i.targetLabel})` : ""}`);
      }
    }
    const rest = data.items.filter((i) => i.type !== "report" && i.type !== "bug");
    if (rest.length) {
      lines.push("");
      lines.push("Complaints & requests:");
      for (const i of rest.slice(0, 12)) {
        lines.push(`• [${i.type}] ${i.user} — ${i.subject}`);
      }
      if (rest.length > 12) lines.push(`• …and ${rest.length - 12} more in the Reports & Feedback tab`);
    }
  }
  lines.push("");
  lines.push(
    `Numbers: ${c.newUsers} new sign-up${c.newUsers === 1 ? "" : "s"}, ${c.activeUsers} people active, ${c.onlineNow} online right now, ${c.newPosts} new post${c.newPosts === 1 ? "" : "s"} and ${c.newComments} comment${c.newComments === 1 ? "" : "s"}. Open backlog: ${data.openBacklog}.`
  );
  if (note) {
    lines.push("");
    lines.push(`(Psst — I couldn't reach my usual brain today: ${note.slice(0, 160)}. This is the plain version.)`);
  }
  lines.push("");
  lines.push("Ok back to my Figma tabs — ping me if you want details on any of these! — Maya 💛");
  return lines.join("\n");
}

// ─── The action (cron + "generate now") ──────────────────────────────────────
export const generateDailyDigest = internalAction({
  args: { trigger: v.optional(v.string()) },
  handler: async (ctx, { trigger }): Promise<Id<"adminNotifications">> => {
    const until = Date.now();
    const since = until - DIGEST_WINDOW_MS;
    const data: DigestData = await ctx.runQuery(internal.adminDigest.collectDigestData, { since, until });

    const title = `Maya's daily round-up · ${formatDateIST(until)}`;
    let body: string;
    let model: string | undefined;
    let generatedBy: "nvidia" | "fallback" = "fallback";

    const apiKey = readEnv("NVIDIA_API_KEY");
    if (apiKey) {
      try {
        const result = await askNvidia(
          apiKey,
          configuredModelCandidates(),
          [
            { role: "system", content: DIGEST_SYSTEM_PROMPT },
            {
              role: "user",
              content: `Here is everything from the last 24 hours. Write today's update for Nipun.\n\n${buildDigestBrief(data)}`,
            },
          ],
          { maxTokens: 1200, temperature: 0.7 }
        );
        body = result.reply;
        model = result.model;
        generatedBy = "nvidia";
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[adminDigest] NVIDIA call failed, using fallback: ${message}`);
        body = fallbackDigest(data, message);
      }
    } else {
      body = fallbackDigest(data, "NVIDIA_API_KEY is not set in the Convex dashboard");
    }

    const id: Id<"adminNotifications"> = await ctx.runMutation(internal.adminDigest.storeDigest, {
      title,
      body,
      since,
      until,
      stats: { ...data.counts, openBacklog: data.openBacklog, items: data.items.length, model, generatedBy, trigger: trigger ?? "cron" },
    });
    console.log(`[adminDigest] stored digest ${id} (${generatedBy}${model ? ` via ${model}` : ""}, ${data.items.length} items)`);
    return id;
  },
});
