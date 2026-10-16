"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, KeyRound, Loader2, Send, Settings2, Square, Trash2, User } from "lucide-react";
import { GROQ_MODELS, getStoredKey, getStoredModel, setStoredKey, setStoredModel, streamChat, type ChatMessage } from "@/lib/ai";
import { Markdown } from "@/lib/markdown";

const SUGGESTIONS = [
  { t: "Single vs multi-agent", p: "When should I move from a single agent to a multi-agent architecture? Use our CNC predictive-maintenance use case." },
  { t: "LangGraph supervisor", p: "Write a minimal LangGraph supervisor with two worker agents (sensor diagnostics and parts) and a retry policy." },
  { t: "MCP explained", p: "Explain MCP host, client and server with a diagram in text, and why it's critical for AI orchestration." },
  { t: "Corrective RAG", p: "How does Corrective RAG work, and how would I implement the grade → rewrite loop?" },
  { t: "CrewAI vs LangGraph", p: "Compare CrewAI hierarchical process with a LangGraph supervisor for the plant maintenance use case. When would you pick each?" },
  { t: "Fallback strategies", p: "List the fallback and recovery strategies an orchestrator should implement, mapped to failure types." },
  { t: "Quiz my audience", p: "Create 5 multiple-choice quiz questions (with answers) on AI orchestration, MCP and RAG for my training session." },
  { t: "Why MCP + RAG?", p: "Explain to a non-technical manager why AI orchestration is nothing without MCP and RAG." },
];

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [key, setKey] = useState("");
  const [model, setModel] = useState(GROQ_MODELS[0].id);
  const [server, setServer] = useState<{ configured: boolean; model: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setKey(getStoredKey());
    setModel(getStoredModel());
    fetch("/api/chat")
      .then((r) => r.json())
      .then(setServer)
      .catch(() => setServer({ configured: false, model: "" }));
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ready = server?.configured || !!key;

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError("");
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      await streamChat(next, (full) => setMessages([...next, { role: "assistant", content: full }]), { signal: ac.signal });
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : String(e));
        setMessages(next);
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_300px]">
      <section className="glass flex h-[calc(100vh-130px)] min-h-[520px] flex-col rounded-2xl">
        <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-orange-500/30">
            <Bot className="h-5 w-5 text-white" />
          </span>
          <div>
            <div className="font-bold text-white">Orchestra — AI teaching assistant</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-2 w-2 rounded-full ${ready ? "bg-emerald-400" : "bg-rose-400"}`} />
              {ready ? `Groq connected · ${model}` : "No Groq API key yet"}
            </div>
          </div>
          <div className="ml-auto flex gap-1">
            <button onClick={() => setMessages([])} title="Clear chat" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={() => setShowSettings((s) => !s)} title="Settings" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
        </header>

        {(showSettings || (server && !ready)) && (
          <div className="fade-in space-y-3 border-b border-white/10 bg-amber-500/5 px-4 py-3">
            {server && !server.configured && (
              <div className="flex gap-2 text-sm text-amber-100">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <div>
                  Recommended: put <code className="rounded bg-white/10 px-1">GROQ_API_KEY=gsk_…</code> in <code className="rounded bg-white/10 px-1">.env.local</code> and restart the dev
                  server. Or paste a key below — it&apos;s kept only in this browser&apos;s local storage and sent to this app&apos;s own API route.
                </div>
              </div>
            )}
            {server?.configured && <div className="text-sm text-emerald-200">✓ Server key configured via .env.local. A key entered here is only used if the server has none.</div>}
            <div className="flex flex-wrap gap-2">
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="gsk_… (optional browser key)"
                className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-amber-400/60"
              />
              <select
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setStoredModel(e.target.value);
                }}
                className="rounded-lg border border-white/10 bg-[#11142a] px-2 py-2 text-sm"
              >
                {GROQ_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setStoredKey(key);
                  setShowSettings(false);
                }}
                className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="text-5xl">🎼</div>
                <h2 className="mt-2 text-xl font-bold text-white">Ask anything about AI orchestration</h2>
                <p className="mt-1 text-sm text-slate-400">Agents, multi-agent patterns, MCP, RAG, LangChain, LangGraph, CrewAI, fallback & recovery…</p>
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${m.role === "user" ? "bg-violet-600" : "bg-gradient-to-br from-amber-500 to-orange-500"}`}>
                {m.role === "user" ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
              </span>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-violet-600/25 text-violet-50" : "bg-white/5 text-slate-200"}`}>
                {m.role === "assistant" ? (
                  m.content ? <Markdown text={m.content} /> : <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                ) : (
                  <div className="whitespace-pre-wrap text-sm">{m.content}</div>
                )}
              </div>
            </div>
          ))}
          {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>}
          <div ref={bottom} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2 border-t border-white/10 p-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Ask about orchestration, MCP, RAG, frameworks…  (Enter to send, Shift+Enter for newline)"
            className="max-h-40 flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-amber-400/60"
          />
          {busy ? (
            <button type="button" onClick={() => abortRef.current?.abort()} className="rounded-xl bg-rose-500/80 px-4 text-white">
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 text-white disabled:opacity-50" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </button>
          )}
        </form>
      </section>

      <aside className="space-y-3">
        <div className="glass rounded-2xl p-4">
          <div className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Try asking</div>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s.t} onClick={() => send(s.p)} disabled={busy} className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-sm transition hover:border-amber-400/40 hover:bg-amber-500/10 disabled:opacity-50">
                <div className="font-semibold text-white">{s.t}</div>
                <div className="line-clamp-2 text-xs text-slate-400">{s.p}</div>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
