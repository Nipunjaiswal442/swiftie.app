// Shared NVIDIA NIM client used by Maya's chat action and by the admin digest.
// Plain functions only — nothing here is exposed as a Convex function.
//
// Model + key are read from the Convex deployment's environment variables
// (Convex dashboard → Settings → Environment Variables), never from the repo.
//
//   NVIDIA_API_KEY   required  — "nvapi-…" key from build.nvidia.com
//   NVIDIA_MODEL     optional  — defaults to DEFAULT_MODEL below
//
// NVIDIA model ids are "vendor/model" (e.g. "nvidia/nemotron-3-ultra-550b-a55b").
// A bare id such as "nemotron-3-ultra-550b-a55b" is normalised in resolveModelCandidates.

// Convex actions have access to process.env at runtime
declare const process: { env: Record<string, string | undefined> };

export const NVIDIA_CHAT_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
export const DEFAULT_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const REQUEST_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_TOKENS = 1024;

const VENDOR_PREFIXES: Array<[RegExp, string]> = [
  [/^deepseek/i, "deepseek-ai"],
  [/^gemma/i, "google"],
  [/nemotron/i, "nvidia"], // before llama: "llama-3.x-nemotron-*" is an NVIDIA model
  [/^llama/i, "meta"],
  [/^mistral|^mixtral/i, "mistralai"],
  [/^qwen/i, "qwen"],
];

export type ChatMessage = { role: string; content: string };

/** Read an env var, tolerating stray whitespace / surrounding quotes from copy-paste. */
export function readEnv(name: string): string | undefined {
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

/** The model candidates configured for this deployment (NVIDIA_MODEL, legacy MAYA_MODEL). */
export function configuredModelCandidates(): string[] {
  return resolveModelCandidates(readEnv("NVIDIA_MODEL") ?? readEnv("MAYA_MODEL"));
}

/** Models whose NIM chat template exposes a thinking/reasoning toggle. */
function hasThinkingToggle(model: string): boolean {
  return /deepseek|nemotron/i.test(model);
}

function buildRequestBody(model: string, messages: ChatMessage[], maxTokens: number, temperature: number) {
  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
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

/** Extract the reply text from a chat completion, stripping any inline reasoning. */
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
export async function askNvidia(
  apiKey: string,
  candidates: string[],
  messages: ChatMessage[],
  options: { maxTokens?: number; temperature?: number } = {}
): Promise<{ model: string; reply: string }> {
  const unavailable: string[] = [];
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const temperature = options.temperature ?? 0.85;

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
        body: JSON.stringify(buildRequestBody(model, messages, maxTokens, temperature)),
      },
      REQUEST_TIMEOUT_MS
    );

    if (response.status === 404 || response.status === 410) {
      const detail = await response.text();
      console.warn(
        `[nvidia] model "${model}" not available (${response.status}): ${detail.slice(0, 200)}`
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
        `Empty response from "${model}" (finish_reason: ${finish}) — try again.`
      );
    }
    return { model, reply };
  }

  throw new Error(
    `None of the configured NVIDIA models are available for this API key: ${unavailable.join(", ")}. ` +
      `Set NVIDIA_MODEL in the Convex dashboard to a current model listed at build.nvidia.com.`
  );
}
