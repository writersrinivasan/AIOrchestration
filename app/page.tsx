import Link from "next/link";
import { ArrowRight, BookOpen, Bot, Factory, Presentation } from "lucide-react";

const LAYERS = [
  { t: "Orchestration", s: "The conductor", d: "Plans, routes, shares state, recovers from failure, asks humans.", c: "from-violet-500 to-indigo-500", e: "🎼" },
  { t: "MCP", s: "The hands & eyes", d: "One protocol to reach SCADA, SAP, Maximo, Teams — discoverable & governed.", c: "from-emerald-500 to-teal-500", e: "🔌" },
  { t: "RAG", s: "The plant memory", d: "Grounds decisions in manuals, SOPs, standards and incident history.", c: "from-amber-500 to-orange-500", e: "📚" },
];

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="glass relative overflow-hidden rounded-3xl p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> 2-hour training · live demonstration mode
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
              AI Orchestration
              <br />
              <span className="gradient-text">from one agent to many</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              See how an orchestration layer plans, delegates, <span className="text-orange-300">falls back</span>, and <span className="text-lime-300">regains the right decision</span> —
              on a real manufacturing incident, implemented three ways: <b className="text-emerald-300">LangChain</b>, <b className="text-violet-300">LangGraph</b> and{" "}
              <b className="text-orange-300">CrewAI</b>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/demo" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-sky-500 to-emerald-500 px-5 py-3 font-bold text-white shadow-lg shadow-violet-500/30 hover:brightness-110">
                <Factory className="h-5 w-5" /> Launch the industrial demo
              </Link>
              <Link href="/learn" className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10">
                <BookOpen className="h-5 w-5" /> Learning hub
              </Link>
            </div>
          </div>

          {/* Single vs multi visual */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-sky-300">Single agent</div>
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-2xl shadow-lg shadow-sky-500/30">🤖</div>
                <div className="flex flex-wrap justify-center gap-1">
                  {["sensors", "SAP", "CMMS", "manuals", "SOPs", "Teams", "supplier", "…"].map((t) => (
                    <span key={t} className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400">One prompt, every tool, every doc. Overloaded, hard to govern.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-violet-400/30 bg-violet-500/5 p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-violet-300">Orchestrated multi-agent</div>
              <div className="mt-3 flex flex-col items-center gap-2">
                <div className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-violet-500/30">🎼 Orchestrator</div>
                <div className="flex flex-wrap justify-center gap-1">
                  {["📈", "🔍", "📦", "📅", "🦺", "📝"].map((e) => (
                    <span key={e} className="grid h-8 w-8 place-items-center rounded-lg border border-sky-400/40 bg-sky-500/15 text-sm">
                      {e}
                    </span>
                  ))}
                </div>
                <div className="flex w-full gap-1">
                  <span className="flex-1 rounded-md bg-emerald-500/20 py-1 text-center text-[10px] font-bold text-emerald-300">MCP</span>
                  <span className="flex-1 rounded-md bg-amber-500/20 py-1 text-center text-[10px] font-bold text-amber-300">RAG</span>
                </div>
                <p className="text-center text-xs text-slate-400">Specialists, shared state, guardrails, fallbacks, human approval.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three layers */}
      <section>
        <h2 className="mb-1 text-2xl font-extrabold text-white">Three layers. One system.</h2>
        <p className="mb-4 text-slate-400">Every agentic framework brings these together. Remove one and the system collapses — try it in the demo.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {LAYERS.map((l) => (
            <div key={l.t} className="glass overflow-hidden rounded-2xl">
              <div className={`bg-gradient-to-r ${l.c} p-4`}>
                <div className="text-3xl">{l.e}</div>
                <div className="mt-1 text-xl font-extrabold text-white">{l.t}</div>
                <div className="text-sm font-semibold text-white/85">{l.s}</div>
              </div>
              <p className="p-4 text-sm text-slate-300">{l.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-500/10 via-emerald-500/10 to-amber-500/10 p-4 text-center text-lg font-bold text-white">
          Agentic AI = Orchestration × MCP × RAG <span className="text-sm font-normal text-slate-400">— if any factor is zero, the outcome is zero.</span>
        </div>
      </section>

      {/* Dual processing */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link href="/learn" className="glass group rounded-2xl p-6 transition hover:-translate-y-0.5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div className="mt-3 text-xs font-bold uppercase tracking-widest text-sky-300">Track 1 · Learn</div>
          <h3 className="mt-1 text-xl font-bold text-white">Learning resources</h3>
          <p className="mt-2 text-sm text-slate-400">9 modules: agent anatomy, autonomy ladder, orchestration patterns, fallback & recovery, MCP, RAG, frameworks, observability, production checklist — with quizzes.</p>
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-sky-300">
            Open hub <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </Link>
        <Link href="/present" className="glass group rounded-2xl p-6 transition hover:-translate-y-0.5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500">
            <Presentation className="h-5 w-5 text-white" />
          </div>
          <div className="mt-3 text-xs font-bold uppercase tracking-widest text-fuchsia-300">Track 1b · Present</div>
          <h3 className="mt-1 text-xl font-bold text-white">Framework decks</h3>
          <p className="mt-2 text-sm text-slate-400">Slide decks with speaker notes: LangChain, LangGraph, CrewAI and the wider landscape — 30+ frameworks, platforms, protocols and methodologies.</p>
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-fuchsia-300">
            Start presenting <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </Link>
        <Link href="/demo" className="glass group rounded-2xl p-6 transition hover:-translate-y-0.5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-400">
            <Factory className="h-5 w-5 text-white" />
          </div>
          <div className="mt-3 text-xs font-bold uppercase tracking-widest text-emerald-300">Track 2 · Demonstrate</div>
          <h3 className="mt-1 text-xl font-bold text-white">Industrial use case</h3>
          <p className="mt-2 text-sm text-slate-400">CNC spindle anomaly → diagnosis → root cause → parts → schedule → safety → approval. 5 failure scenarios, 3 frameworks, MCP/RAG on-off switches.</p>
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-emerald-300">
            Run demo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </Link>
        <Link href="/assistant" className="glass group rounded-2xl p-6 transition hover:-translate-y-0.5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="mt-3 text-xs font-bold uppercase tracking-widest text-amber-300">Live Q&A</div>
          <h3 className="mt-1 text-xl font-bold text-white">AI assistant (Groq)</h3>
          <p className="mt-2 text-sm text-slate-400">Answer audience questions live, generate code, quizzes and explanations. “Ask AI” buttons on every demo step and module.</p>
          <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-amber-300">
            Chat now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </div>
        </Link>
      </section>
    </div>
  );
}
