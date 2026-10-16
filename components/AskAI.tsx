"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { streamChat, type ChatMessage } from "@/lib/ai";
import { Markdown } from "@/lib/markdown";

/** Button that opens a slide-over panel where the Groq-powered assistant explains the current item. */
export default function AskAI({
  prompt,
  context,
  label = "Ask AI to explain",
  className = "",
}: {
  prompt: string;
  context?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow hover:brightness-110 ${className}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </button>
      {open && <AskPanel initialPrompt={prompt} context={context} onClose={() => setOpen(false)} />}
    </>
  );
}

function AskPanel({
  initialPrompt,
  context,
  onClose,
}: {
  initialPrompt: string;
  context?: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const bottom = useRef<HTMLDivElement>(null);

  async function send(text: string, history: ChatMessage[]) {
    const next: ChatMessage[] = [...history, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);
    setError("");
    try {
      await streamChat(next, (full) => setMessages([...next, { role: "assistant", content: full }]), { context });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setMessages(next);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    send(initialPrompt, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fade-in flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0b0e1d]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
            <Bot className="h-4 w-4 text-white" />
          </span>
          <div className="text-sm font-semibold">Orchestra · AI Assistant (Groq)</div>
          <button onClick={onClose} className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-xl px-3 py-2 ${
                m.role === "user" ? "ml-8 bg-violet-600/25 text-violet-50" : "mr-2 bg-white/5 text-slate-200"
              }`}
            >
              {m.role === "assistant" && !m.content && busy ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
              ) : m.role === "assistant" ? (
                <Markdown text={m.content} />
              ) : (
                <div className="whitespace-pre-wrap text-sm">{m.content}</div>
              )}
            </div>
          ))}
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
              {error}
              <div className="mt-1 text-xs text-rose-300/80">Tip: set GROQ_API_KEY in .env.local or paste a key on the AI Assistant page.</div>
            </div>
          )}
          <div ref={bottom} />
        </div>
        <form
          className="flex gap-2 border-t border-white/10 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || busy) return;
            const t = input;
            setInput("");
            send(t, messages.filter((m) => m.content));
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a follow-up…"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-amber-400/60"
          />
          <button
            disabled={busy}
            className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-white disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
