"use client";

import { useState } from "react";
import { Check, Copy, TriangleAlert } from "lucide-react";
import { FRAMEWORKS } from "@/lib/demo/frameworks";
import type { Framework } from "@/lib/demo/types";
import { highlight } from "@/lib/highlight";

const TABS = ["How it orchestrates", "Code for this use case", "Compare all three", "Why all 3 layers"] as const;
type Tab = (typeof TABS)[number];

const COMPARE_ROWS: { k: string; lc: string; lg: string; cr: string }[] = [
  { k: "Mental model", lc: "Agent + tools loop", lg: "State machine / graph", cr: "Team of role-players" },
  { k: "Control flow", lc: "Implicit (LLM chooses)", lg: "Explicit edges + LLM routers", cr: "Task order or manager LLM" },
  { k: "Multi-agent pattern", lc: "Sub-agents as tools", lg: "Supervisor, hierarchical, swarm, network", cr: "Sequential / hierarchical crews, Flows" },
  { k: "State", lc: "Messages (+ custom state)", lg: "Typed shared state + reducers", cr: "Task context + crew memory / Flow state" },
  { k: "Persistence", lc: "Checkpointer (via LangGraph runtime)", lg: "Checkpointers, time-travel, durable execution", cr: "Memory stores; Flow state persistence" },
  { k: "Fallback / retry", lc: "Middleware (model fallback, tool retry)", lg: "RetryPolicy, error edges, loops", cr: "Guardrail retries, max_retry_limit, delegation" },
  { k: "Human-in-the-loop", lc: "HumanInTheLoopMiddleware", lg: "interrupt() / Command(resume)", cr: "human_input=True, Flow feedback" },
  { k: "MCP integration", lc: "langchain-mcp-adapters", lg: "langchain-mcp-adapters", cr: "MCPServerAdapter (crewai-tools)" },
  { k: "RAG integration", lc: "Retriever tools, 100+ vector stores", lg: "Agentic / Corrective / Self-RAG graphs", cr: "knowledge_sources, RAG tools" },
  { k: "Observability", lc: "LangSmith", lg: "LangSmith + Studio", cr: "Built-in tracing, AMP, OTel integrations" },
  { k: "Best for", lc: "Fast prototypes, single capable agents", lg: "Regulated, long-running, auditable workflows", cr: "Business-process crews, quick multi-agent POCs" },
];

export default function FrameworkDeepDive({ framework, onSelect }: { framework: Framework; onSelect: (f: Framework) => void }) {
  const [tab, setTab] = useState<Tab>("How it orchestrates");
  const [copied, setCopied] = useState(false);
  const info = FRAMEWORKS[framework];

  return (
    <section className="glass rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-extrabold text-white">
          Framework deep dive: <span className="bg-gradient-to-r bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(90deg, ${info.accent}, #fff)` }}>{info.name}</span>
        </h2>
        <span className="text-sm text-slate-400">— {info.tagline}</span>
        <div className="ml-auto flex gap-1.5">
          {(Object.keys(FRAMEWORKS) as Framework[]).map((k) => (
            <button
              key={k}
              onClick={() => onSelect(k)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold ${framework === k ? `bg-gradient-to-r ${FRAMEWORKS[k].gradient} text-white` : "bg-white/5 text-slate-300 hover:bg-white/10"}`}
            >
              {FRAMEWORKS[k].name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${tab === t ? "border-violet-400 text-white" : "border-transparent text-slate-400 hover:text-slate-200"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === "How it orchestrates" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              {info.traits.map((t) => (
                <div key={t.k} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="w-44 shrink-0 text-xs font-bold uppercase tracking-wide" style={{ color: info.accent }}>
                    {t.k}
                  </div>
                  <div className="text-sm text-slate-200">{t.v}</div>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <div className="mb-2 text-sm font-bold text-emerald-300">Strengths</div>
                <ul className="space-y-1.5 text-sm text-slate-200">
                  {info.strengths.map((s) => (
                    <li key={s} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
                <div className="mb-2 text-sm font-bold text-amber-300">Watch-outs</div>
                <ul className="space-y-1.5 text-sm text-slate-200">
                  {info.watchOuts.map((s) => (
                    <li key={s} className="flex gap-2">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === "Code for this use case" && (
          <div className="relative">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(info.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="absolute right-3 top-3 flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/20"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <pre className="scrollbar-thin max-h-[560px] overflow-auto rounded-xl border border-white/10 bg-[#05060f] p-4 font-mono text-[12.5px] leading-relaxed">
              <code>{highlight(info.code)}</code>
            </pre>
            <p className="mt-2 text-xs text-slate-500">
              Illustrative code for teaching: MCP server URLs, prompts, retrievers and helper functions (supervisor, grade_docs, validate_loto…) are placeholders for your plant&apos;s implementations.
            </p>
          </div>
        )}

        {tab === "Compare all three" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs uppercase tracking-wider text-slate-400">Dimension</th>
                  {(["langchain", "langgraph", "crewai"] as Framework[]).map((k) => (
                    <th key={k} className="p-2 text-left">
                      <span className={`rounded-md bg-gradient-to-r ${FRAMEWORKS[k].gradient} px-2 py-0.5 text-xs font-bold text-white`}>{FRAMEWORKS[k].name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r, i) => (
                  <tr key={r.k} className={i % 2 ? "bg-white/[0.02]" : ""}>
                    <td className="p-2 font-semibold text-slate-300">{r.k}</td>
                    {(["lc", "lg", "cr"] as const).map((c, j) => (
                      <td key={c} className={`p-2 ${["langchain", "langgraph", "crewai"][j] === framework ? "text-white" : "text-slate-400"}`}>
                        {r[c]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "Why all 3 layers" && <ThreeLayers />}
      </div>
    </section>
  );
}

function ThreeLayers() {
  const cards = [
    {
      title: "Orchestration",
      color: "from-violet-500 to-indigo-500",
      role: "The conductor",
      does: "Decides who does what, in which order, with what state; handles failures, retries, approvals.",
      without: "Agents act in isolation: no plan, no shared state, no recovery — a pile of chatbots.",
    },
    {
      title: "MCP",
      color: "from-emerald-500 to-teal-500",
      role: "The hands & eyes",
      does: "Standard protocol for tools, resources & prompts: SCADA, SAP, CMMS, Teams — discoverable and governed.",
      without: "The orchestrator can think but can’t sense or act. Every integration is custom glue code (N×M).",
    },
    {
      title: "RAG",
      color: "from-amber-500 to-orange-500",
      role: "The plant memory",
      does: "Grounds every decision in OEM manuals, SOPs, regulations and incident history — with citations.",
      without: "Fluent hallucinations: invented part numbers, torque specs and safety steps. Nothing verifiable.",
    },
  ];
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <div key={c.title} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className={`bg-gradient-to-r ${c.color} px-4 py-3`}>
              <div className="text-lg font-extrabold text-white">{c.title}</div>
              <div className="text-xs font-semibold text-white/80">{c.role}</div>
            </div>
            <div className="space-y-3 p-4 text-sm">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">What it does</div>
                <div className="text-slate-200">{c.does}</div>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-rose-300">Without it</div>
                <div className="text-slate-300">{c.without}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-500/10 via-emerald-500/10 to-amber-500/10 p-4 text-center text-sm text-slate-200">
        <b className="text-white">Agentic AI = Orchestration × MCP × RAG.</b> It is a product, not a sum — if any factor is zero, the result is zero.
        Try it above: switch MCP or RAG off and replay the run.
      </div>
    </div>
  );
}
