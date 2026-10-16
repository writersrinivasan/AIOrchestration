"use client";

import Link from "next/link";

type MiniNode = { id: string; x: number; y: number; l: string; c: string; r?: number };
type MiniEdge = [string, string, boolean?]; // from, to, bidirectional

function MiniGraph({ nodes, edges, id }: { nodes: MiniNode[]; edges: MiniEdge[]; id: string }) {
  const by = Object.fromEntries(nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 200 110" className="h-28 w-full">
      <defs>
        <marker id={`m-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
        </marker>
      </defs>
      {edges.map(([a, b, bi], i) => {
        const na = by[a];
        const nb = by[b];
        const dx = nb.x - na.x;
        const dy = nb.y - na.y;
        const len = Math.hypot(dx, dy) || 1;
        const ra = (na.r ?? 13) + 2;
        const rb = (nb.r ?? 13) + 3;
        return (
          <line
            key={i}
            x1={na.x + (dx / len) * ra}
            y1={na.y + (dy / len) * ra}
            x2={nb.x - (dx / len) * rb}
            y2={nb.y - (dy / len) * rb}
            stroke="#94a3b8"
            strokeWidth={1.2}
            markerEnd={`url(#m-${id})`}
            markerStart={bi ? `url(#m-${id})` : undefined}
          />
        );
      })}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.r ?? 13} fill={n.c} fillOpacity={0.25} stroke={n.c} strokeWidth={1.5} />
          <text x={n.x} y={n.y + 3.5} textAnchor="middle" fontSize={n.l.length > 2 ? 7.5 : 10} fontWeight={700} fill="#f8fafc">
            {n.l}
          </text>
        </g>
      ))}
    </svg>
  );
}

const V = "#8b5cf6", S = "#0ea5e9", E = "#10b981", A = "#f59e0b", R = "#f43f5e", P = "#d946ef";

const PATTERNS: { name: string; when: string; nodes: MiniNode[]; edges: MiniEdge[] }[] = [
  {
    name: "Sequential / Pipeline",
    when: "Fixed, known steps. Cheap & predictable.",
    nodes: [
      { id: "a", x: 30, y: 55, l: "A", c: S },
      { id: "b", x: 100, y: 55, l: "B", c: S },
      { id: "c", x: 170, y: 55, l: "C", c: S },
    ],
    edges: [["a", "b"], ["b", "c"]],
  },
  {
    name: "Router",
    when: "Classify the request, dispatch to one specialist.",
    nodes: [
      { id: "i", x: 25, y: 55, l: "In", c: P },
      { id: "r", x: 80, y: 55, l: "R", c: V },
      { id: "a", x: 165, y: 18, l: "A", c: S },
      { id: "b", x: 165, y: 55, l: "B", c: S },
      { id: "c", x: 165, y: 92, l: "C", c: S },
    ],
    edges: [["i", "r"], ["r", "a"], ["r", "b"], ["r", "c"]],
  },
  {
    name: "Parallel fan-out / fan-in",
    when: "Independent sub-tasks; merge results.",
    nodes: [
      { id: "i", x: 25, y: 55, l: "In", c: P },
      { id: "a", x: 100, y: 18, l: "A", c: S },
      { id: "b", x: 100, y: 55, l: "B", c: S },
      { id: "c", x: 100, y: 92, l: "C", c: S },
      { id: "m", x: 175, y: 55, l: "Agg", c: V },
    ],
    edges: [["i", "a"], ["i", "b"], ["i", "c"], ["a", "m"], ["b", "m"], ["c", "m"]],
  },
  {
    name: "Supervisor",
    when: "Dynamic delegation; workers report back.",
    nodes: [
      { id: "s", x: 100, y: 22, l: "Sup", c: V, r: 15 },
      { id: "a", x: 35, y: 88, l: "A", c: S },
      { id: "b", x: 100, y: 88, l: "B", c: S },
      { id: "c", x: 165, y: 88, l: "C", c: S },
    ],
    edges: [["s", "a", true], ["s", "b", true], ["s", "c", true]],
  },
  {
    name: "Hierarchical",
    when: "Teams of teams across departments.",
    nodes: [
      { id: "t", x: 100, y: 15, l: "Top", c: V },
      { id: "s1", x: 55, y: 55, l: "S1", c: V },
      { id: "s2", x: 145, y: 55, l: "S2", c: V },
      { id: "a", x: 25, y: 95, l: "a", c: S, r: 10 },
      { id: "b", x: 80, y: 95, l: "b", c: S, r: 10 },
      { id: "c", x: 120, y: 95, l: "c", c: S, r: 10 },
      { id: "d", x: 175, y: 95, l: "d", c: S, r: 10 },
    ],
    edges: [["t", "s1"], ["t", "s2"], ["s1", "a"], ["s1", "b"], ["s2", "c"], ["s2", "d"]],
  },
  {
    name: "Plan-and-Execute",
    when: "Long tasks: plan up front, execute, re-plan.",
    nodes: [
      { id: "p", x: 30, y: 55, l: "Plan", c: V, r: 15 },
      { id: "e", x: 105, y: 55, l: "Exec", c: S, r: 15 },
      { id: "r", x: 170, y: 55, l: "Re", c: A, r: 14 },
    ],
    edges: [["p", "e"], ["e", "r", true]],
  },
  {
    name: "Evaluator–Optimizer",
    when: "Quality loop: generate, critique, revise (bounded).",
    nodes: [
      { id: "g", x: 55, y: 55, l: "Gen", c: S, r: 16 },
      { id: "e", x: 145, y: 55, l: "Eval", c: R, r: 16 },
    ],
    edges: [["g", "e", true]],
  },
  {
    name: "Network / Handoffs",
    when: "Peers hand control to each other (swarm).",
    nodes: [
      { id: "a", x: 50, y: 25, l: "A", c: S },
      { id: "b", x: 150, y: 25, l: "B", c: S },
      { id: "c", x: 50, y: 88, l: "C", c: S },
      { id: "d", x: 150, y: 88, l: "D", c: S },
    ],
    edges: [["a", "b", true], ["a", "c", true], ["b", "d", true], ["c", "d", true], ["a", "d", true]],
  },
  {
    name: "Blackboard / Shared state",
    when: "Agents read & write a common workspace.",
    nodes: [
      { id: "bb", x: 100, y: 55, l: "State", c: E, r: 18 },
      { id: "a", x: 35, y: 22, l: "A", c: S },
      { id: "b", x: 165, y: 22, l: "B", c: S },
      { id: "c", x: 35, y: 90, l: "C", c: S },
      { id: "d", x: 165, y: 90, l: "D", c: S },
    ],
    edges: [["a", "bb", true], ["b", "bb", true], ["c", "bb", true], ["d", "bb", true]],
  },
];

export function PatternGallery() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {PATTERNS.map((p, i) => (
        <div key={p.name} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-violet-400/40 hover:bg-white/[0.05]">
          <MiniGraph nodes={p.nodes} edges={p.edges} id={`p${i}`} />
          <div className="mt-1 text-sm font-bold text-white">{p.name}</div>
          <div className="text-xs text-slate-400">{p.when}</div>
        </div>
      ))}
    </div>
  );
}

export function Ladder() {
  const rungs = [
    { l: "L0", t: "Single LLM call", d: "Prompt in, text out. No tools, no memory.", c: "#64748b" },
    { l: "L1", t: "Chain / pipeline", d: "Fixed sequence of LLM calls & functions (e.g. RAG chain).", c: "#6366f1" },
    { l: "L2", t: "Router", d: "LLM classifies and picks a path — still predetermined paths.", c: "#8b5cf6" },
    { l: "L3", t: "Tool-using agent", d: "ReAct loop: LLM decides which tools to call, when to stop.", c: "#0ea5e9" },
    { l: "L4", t: "Multi-agent + supervisor", d: "Specialists coordinated by an orchestrator with shared state.", c: "#10b981" },
    { l: "L5", t: "Hierarchical / networked agents", d: "Teams of agents, cross-org protocols (MCP, A2A), long-running autonomy.", c: "#f59e0b" },
  ];
  return (
    <div className="space-y-2">
      {rungs.map((r, i) => (
        <div key={r.l} className="flex items-center gap-3" style={{ marginLeft: `${i * 4}%` }}>
          <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg text-sm font-extrabold text-white" style={{ background: r.c }}>
            {r.l}
          </span>
          <div className="flex-1 rounded-lg border px-3 py-2" style={{ borderColor: r.c + "66", background: r.c + "1a" }}>
            <div className="text-sm font-bold text-white">{r.t}</div>
            <div className="text-xs text-slate-300">{r.d}</div>
          </div>
        </div>
      ))}
      <div className="flex justify-between pt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        <span>↑ predictability</span>
        <span>autonomy & risk ↓</span>
      </div>
    </div>
  );
}

export function Anatomy() {
  const parts = [
    { t: "Instructions", d: "role · goal · rules", c: "#d946ef", pos: "col-start-2 row-start-1" },
    { t: "Tools (MCP)", d: "sense & act", c: "#10b981", pos: "col-start-3 row-start-2" },
    { t: "Knowledge (RAG)", d: "grounding", c: "#f59e0b", pos: "col-start-2 row-start-3" },
    { t: "Memory", d: "short & long term", c: "#0ea5e9", pos: "col-start-1 row-start-2" },
  ];
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      {parts.map((p) => (
        <div key={p.t} className={`${p.pos} rounded-xl border p-3 text-center`} style={{ borderColor: p.c + "88", background: p.c + "1f" }}>
          <div className="text-sm font-bold text-white">{p.t}</div>
          <div className="text-xs text-slate-300">{p.d}</div>
        </div>
      ))}
      <div className="col-start-2 row-start-2 grid place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 p-3 text-center shadow-lg shadow-violet-500/30">
        <div>
          <div className="text-base font-extrabold text-white">LLM</div>
          <div className="text-[11px] text-violet-100">think → act → observe ↻</div>
        </div>
      </div>
    </div>
  );
}

export function McpVisual() {
  const servers = [
    { n: "SCADA MCP", t: "read_sensor_history", s: "PLC / Historian" },
    { n: "SAP ERP MCP", t: "check_stock · reserve", s: "SAP S/4HANA" },
    { n: "CMMS MCP", t: "find_window · create_wo", s: "IBM Maximo" },
    { n: "Teams MCP", t: "post_message", s: "Microsoft Teams" },
  ];
  return (
    <div className="grid items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[1fr_auto_1.3fr_auto_1fr]">
      <div className="rounded-xl border border-violet-400/50 bg-violet-500/10 p-3">
        <div className="text-xs font-bold uppercase tracking-wider text-violet-300">Host</div>
        <div className="text-sm font-bold text-white">Orchestrator app</div>
        <div className="mt-2 space-y-1">
          {["MCP client #1", "MCP client #2", "MCP client #3", "MCP client #4"].map((c) => (
            <div key={c} className="rounded-md bg-violet-500/20 px-2 py-1 text-xs text-violet-100">
              {c}
            </div>
          ))}
        </div>
      </div>
      <div className="text-center text-xs text-emerald-300">
        JSON-RPC 2.0
        <br />⇄<br />
        stdio / HTTP
      </div>
      <div className="space-y-2">
        {servers.map((s) => (
          <div key={s.n} className="rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-3 py-2">
            <div className="text-sm font-bold text-white">{s.n}</div>
            <div className="font-mono text-[11px] text-emerald-300">tools: {s.t}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-lg text-slate-500">→</div>
      <div className="space-y-2">
        {servers.map((s) => (
          <div key={s.s} className="rounded-lg border border-indigo-400/40 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-100">
            {s.s}
          </div>
        ))}
      </div>
    </div>
  );
}

function Chain({ items, color, label }: { items: string[]; color: string; label: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color }}>
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <span key={it} className="flex items-center gap-1.5">
            <span className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold text-white" style={{ borderColor: color + "88", background: color + "22" }}>
              {it}
            </span>
            {i < items.length - 1 && <span className="text-slate-500">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RagVisual() {
  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <Chain label="Offline · indexing" color="#6366f1" items={["📄 Manuals · SOPs · WOs", "Parse", "Chunk + metadata", "Embed", "🗄️ Vector + keyword index"]} />
      <Chain label="Online · agentic retrieval" color="#f59e0b" items={["❓ Question", "✍️ Rewrite", "🧲 Hybrid retrieve", "🏅 Re-rank", "⚖️ Grade", "💬 Generate + cite"]} />
      <div className="text-xs text-slate-400">
        <span className="font-semibold text-orange-300">Corrective loop:</span> if ⚖️ Grade fails → back to ✍️ Rewrite (bounded attempts) → else escalate.
      </div>
    </div>
  );
}

export function DefenseVisual() {
  const layers = [
    { t: "Timeouts & budgets", d: "per node, per run: steps, tokens, ₹", c: "#64748b" },
    { t: "Retries with backoff + jitter", d: "transient faults", c: "#6366f1" },
    { t: "Circuit breakers", d: "stop hammering sick dependencies", c: "#8b5cf6" },
    { t: "Fallbacks", d: "backup model · cached data · alternate tool/server", c: "#fb923c" },
    { t: "Self-correction", d: "grading, schema validation, reflection loops", c: "#f59e0b" },
    { t: "Guardrails", d: "policy, safety, PII, action approval", c: "#f43f5e" },
    { t: "Human-in-the-loop", d: "the final, accountable fallback", c: "#d946ef" },
  ];
  return (
    <div className="space-y-1.5">
      {layers.map((l, i) => (
        <div key={l.t} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: `linear-gradient(90deg, ${l.c}33, transparent)`, borderLeft: `4px solid ${l.c}`, width: `${100 - i * 5}%` }}>
          <span className="text-sm font-bold text-white">{l.t}</span>
          <span className="text-xs text-slate-300">— {l.d}</span>
        </div>
      ))}
    </div>
  );
}

export function FrameworksVisual() {
  const fws = [
    { n: "LangChain", g: "from-emerald-500 to-teal-500", s: "Agent loop + middleware", d: "LLM decides each next step; middleware wraps model & tool calls for retries, fallbacks, HITL." },
    { n: "LangGraph", g: "from-violet-500 to-indigo-500", s: "Explicit state graph", d: "You define nodes, edges and state; LLMs act inside nodes. Checkpoints, interrupts, loops." },
    { n: "CrewAI", g: "from-orange-500 to-rose-500", s: "Role-based crews + Flows", d: "Agents with roles/goals execute tasks; a manager delegates (hierarchical) or tasks run in order." },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {fws.map((f) => (
        <div key={f.n} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          <div className={`bg-gradient-to-r ${f.g} px-3 py-2`}>
            <div className="font-extrabold text-white">{f.n}</div>
            <div className="text-xs text-white/85">{f.s}</div>
          </div>
          <div className="p-3 text-sm text-slate-300">{f.d}</div>
          <div className="px-3 pb-3">
            <Link href="/demo" className="text-xs font-semibold text-sky-300 hover:underline">
              See it orchestrate the plant use case →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
