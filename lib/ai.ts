"use client";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export const GROQ_MODELS = [
  { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B (best)" },
  { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B (fast)" },
  { id: "qwen/qwen3.8-27b", label: "Qwen 3.8 27B" },
];

const KEY_STORAGE = "orchestra.groqKey";
const MODEL_STORAGE = "orchestra.groqModel";

function safeGet(k: string) {
  try {
    return localStorage.getItem(k) ?? "";
  } catch {
    return "";
  }
}
function safeSet(k: string, v: string) {
  try {
    if (v) localStorage.setItem(k, v);
    else localStorage.removeItem(k);
  } catch {
    /* storage unavailable */
  }
}

export const getStoredKey = () => safeGet(KEY_STORAGE);
export const setStoredKey = (v: string) => safeSet(KEY_STORAGE, v.trim());
export const getStoredModel = () => {
  const m = safeGet(MODEL_STORAGE);
  return GROQ_MODELS.some((x) => x.id === m) ? m : GROQ_MODELS[0].id;
};
export const setStoredModel = (v: string) => safeSet(MODEL_STORAGE, v);

/** Streams an assistant reply from /api/chat, calling onDelta with the accumulated text. */
export async function streamChat(
  messages: ChatMessage[],
  onDelta: (fullText: string) => void,
  opts: { context?: string; signal?: AbortSignal } = {}
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = getStoredKey();
  if (key) headers["x-groq-key"] = key;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ messages, model: getStoredModel(), context: opts.context }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) {
    throw new Error(await res.text());
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
    onDelta(text);
  }
  return text;
}
