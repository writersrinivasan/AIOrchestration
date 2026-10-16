"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Pause,
  Play,
  Plug,
  RotateCcw,
  ShieldAlert,
  Timer,
  Wrench,
  Zap,
} from "lucide-react";
import ArchitectureDiagram from "./ArchitectureDiagram";
import OrchestrationGraph from "./OrchestrationGraph";
import FrameworkDeepDive from "./FrameworkDeepDive";
import AskAI from "@/components/AskAI";
import { buildSteps, SCENARIOS, USE_CASE } from "@/lib/demo/scenario";
import { FRAMEWORKS } from "@/lib/demo/frameworks";
import { LAYER_META, STATUS_META, type Framework, type Scenario, type Step } from "@/lib/demo/types";

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function mergeState(steps: Step[], upto: number) {
  const s: Record<string, unknown> = {};
  for (let i = 0; i <= upto; i++) {
    const patch = steps[i]?.state;
    if (!patch) continue;
    for (const [k, v] of Object.entries(patch)) {
      s[k] = isObj(v) && isObj(s[k]) ? { ...(s[k] as object), ...v } : v;
    }
  }
  return s;
}

export default function DemoStudio() {
  const [fw, setFw] = useState<Framework>("langgraph");
  const [sc, setSc] = useState<Scenario>("happy");
  const [mcpOn, setMcpOn] = useState(true);
  const [ragOn, setRagOn] = useState(true);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const logRef = useRef<HTMLDivElement>(null);

  const steps = useMemo(() => buildSteps(fw, sc, mcpOn, ragOn), [fw, sc, mcpOn, ragOn]);
  const step = idx >= 0 ? steps[idx] : null;
  const finished = idx === steps.length - 1;

  // Deep links for presenters, e.g. /demo?fw=crewai&sc=mcp-timeout&step=6&mcp=off
  const pending = useRef<{ key: string; step: number } | null>(null);
  const configKey = `${fw}|${sc}|${mcpOn}|${ragOn}`;
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const f = q.get("fw");
    const s = q.get("sc");
    const nf = f && f in FRAMEWORKS ? (f as Framework) : "langgraph";
    const ns = s && SCENARIOS.some((x) => x.id === s) ? (s as Scenario) : "happy";
    const nm = q.get("mcp") !== "off";
    const nr = q.get("rag") !== "off";
    const st = Number(q.get("step"));
    if (st > 0) pending.current = { key: `${nf}|${ns}|${nm}|${nr}`, step: st - 1 };
    setFw(nf);
    setSc(ns);
    setMcpOn(nm);
    setRagOn(nr);
  }, []);

  // Reset the run whenever the configuration changes (or jump to a deep-linked step)
  useEffect(() => {
    if (pending.current && pending.current.key === configKey) {
      setIdx(Math.min(pending.current.step, steps.length - 1));
      pending.current = null;
    } else {
      setIdx(-1);
    }
    setPlaying(false);
  }, [configKey, steps.length]);

  const next = useCallback(() => setIdx((i) => Math.min(i + 1, steps.length - 1)), [steps.length]);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, -1)), []);
  const reset = useCallback(() => {
    setIdx(-1);
    setPlaying(false);
  }, []);
  const togglePlay = useCallback(() => {
    if (finished) {
      setIdx(-1);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  }, [finished]);

  // Autoplay — fallback & failure steps linger a little longer so the audience can read them
  useEffect(() => {
    if (!playing) return;
    if (idx >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const cur = steps[idx];
    const base = cur && (cur.status === "fail" || cur.status === "fallback") ? 4200 : 3000;
    const t = setTimeout(next, idx < 0 ? 300 : base / speed);
    return () => clearTimeout(t);
  }, [playing, idx, steps, speed, next]);

  // Presenter keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key.toLowerCase() === "r") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, next, prev, reset]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [idx]);

  const { visitedArch, visitedOrch } = useMemo(() => {
    const va = new Set<string>();
    const vo = new Set<string>();
    for (let i = 0; i < idx; i++) {
      steps[i].arch.forEach((n) => va.add(n));
      vo.add(steps[i].orch);
    }
    return { visitedArch: va, visitedOrch: vo };
  }, [steps, idx]);

  const sharedState = useMemo(() => mergeState(steps, idx), [steps, idx]);

  const totals = useMemo(() => {
    const t = { llm: 0, tool: 0, rag: 0, ms: 0, tokens: 0, fallbacks: 0, recoveries: 0, failures: 0 };
    for (let i = 0; i <= idx; i++) {
      const m = steps[i].metrics ?? {};
      t.llm += m.llm ?? 0;
      t.tool += m.tool ?? 0;
      t.rag += m.rag ?? 0;
      t.ms += m.ms ?? 0;
      t.tokens += m.tokens ?? 0;
      if (steps[i].status === "fallback") t.fallbacks++;
      if (steps[i].status === "recover") t.recoveries++;
      if (steps[i].status === "fail") t.failures++;
    }
    return t;
  }, [steps, idx]);

  const info = FRAMEWORKS[fw];
  const success = finished && steps[steps.length - 1].status === "done";

  const aiContext = step
    ? `Framework: ${info.name}. Scenario: ${SCENARIOS.find((s) => s.id === sc)?.label}. MCP layer: ${mcpOn ? "ON" : "OFF"}. RAG layer: ${ragOn ? "ON" : "OFF"}.
Current step ${idx + 1}/${steps.length}: "${step.title}" [${STATUS_META[step.status].label}, layer: ${LAYER_META[step.layer].label}]
Detail: ${step.detail}
Trace: ${step.trace}`
    : `Framework: ${info.name}. Scenario: ${sc}. Demo not started.`;

  return (
    <div className="space-y-5">
      {/* Use case header */}
      <section className="glass rounded-2xl p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-[260px] flex-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Industrial use case · live demonstration</div>
            <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
              🏭 {USE_CASE.title}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {USE_CASE.plant} — <span className="text-slate-300">{USE_CASE.asset}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {USE_CASE.stakes.map((s) => (
              <div key={s.k} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">{s.k}</div>
                <div className="text-sm font-bold text-white">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Control deck */}
      <section className="glass sticky top-[61px] z-30 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">1 · Framework</div>
            <div className="flex gap-1.5">
              {(Object.keys(FRAMEWORKS) as Framework[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setFw(k)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                    fw === k ? `bg-gradient-to-r ${FRAMEWORKS[k].gradient} text-white shadow-lg` : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {FRAMEWORKS[k].name}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-[240px]">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">2 · Scenario</div>
            <select
              value={sc}
              onChange={(e) => setSc(e.target.value as Scenario)}
              className="w-full rounded-lg border border-white/10 bg-[#11142a] px-3 py-1.5 text-sm text-white outline-none focus:border-violet-400"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">3 · Layers</div>
            <div className="flex gap-1.5">
              <LayerToggle on={mcpOn} set={setMcpOn} label="MCP" color="emerald" icon={<Plug className="h-3.5 w-3.5" />} />
              <LayerToggle on={ragOn} set={setRagOn} label="RAG" color="amber" icon={<Database className="h-3.5 w-3.5" />} />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={reset} title="Reset (R)" className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={prev} title="Previous (←)" className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={togglePlay}
              title="Play / pause (Space)"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-500 via-sky-500 to-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:brightness-110"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Pause" : finished ? "Replay" : idx < 0 ? "Run demo" : "Resume"}
            </button>
            <button onClick={next} title="Next (→)" className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10">
              <ChevronRight className="h-4 w-4" />
            </button>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-[#11142a] px-2 py-1.5 text-xs text-white"
              title="Speed"
            >
              <option value={0.5}>0.5×</option>
              <option value={1}>1×</option>
              <option value={1.5}>1.5×</option>
              <option value={2.5}>2.5×</option>
            </select>
          </div>
        </div>
        {/* Progress */}
        <div className="mt-3 flex gap-1">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setPlaying(false);
                setIdx(i);
              }}
              title={`${i + 1}. ${s.title}`}
              className="h-2 flex-1 rounded-full transition"
              style={{
                background: i <= idx ? STATUS_META[s.status].color : "rgba(148,163,184,0.15)",
                outline: i === idx ? "2px solid white" : undefined,
                outlineOffset: 1,
              }}
            />
          ))}
        </div>
      </section>

      {/* Diagrams */}
      <section className="grid gap-5 xl:grid-cols-12">
        <div className="glass rounded-2xl p-4 xl:col-span-8">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Enterprise architecture · all layers</h2>
            <div className="ml-auto flex flex-wrap gap-2">
              {(["orchestration", "agent", "mcp", "rag", "data", "guard"] as const).map((l) => (
                <span key={l} className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: LAYER_META[l].color }} />
                  {LAYER_META[l].label}
                </span>
              ))}
            </div>
          </div>
          <ArchitectureDiagram
            active={new Set(step?.arch ?? [])}
            visited={visitedArch}
            activeEdges={step?.edges ?? []}
            status={step?.status ?? null}
            mcpOn={mcpOn}
            ragOn={ragOn}
            running={playing}
          />
        </div>
        <div className="glass rounded-2xl p-4 xl:col-span-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-md bg-gradient-to-r ${info.gradient} px-2 py-0.5 text-xs font-bold text-white`}>{info.name}</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">Orchestration internals</h2>
          </div>
          <OrchestrationGraph framework={fw} activeNode={step?.orch ?? null} activeEdge={step?.orchEdge} visited={visitedOrch} status={step?.status ?? null} />
        </div>
      </section>

      {/* Step narration + log + state */}
      <section className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-5">
          {step ? (
            <div key={`${idx}-${fw}`} className="fade-in glass h-full rounded-2xl p-5" style={{ borderColor: STATUS_META[step.status].color + "66" }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-wider" style={{ color: STATUS_META[step.status].color, background: STATUS_META[step.status].bg }}>
                  {STATUS_META[step.status].label}
                </span>
                <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ color: LAYER_META[step.layer].color, background: LAYER_META[step.layer].soft }}>
                  {LAYER_META[step.layer].label}
                </span>
                <span className="ml-auto text-xs text-slate-500">
                  Step {idx + 1} / {steps.length}
                </span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.detail}</p>
              {step.why && (
                <div className="mt-3 rounded-xl border border-violet-400/30 bg-violet-500/10 p-3 text-sm text-violet-100">
                  <span className="font-bold text-violet-300">Why it matters → </span>
                  {step.why}
                </div>
              )}
              <div className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-xs text-emerald-300">
                <span className="text-slate-500">{info.name.toLowerCase()} ▸ </span>
                {step.trace}
              </div>
              <div className="mt-4">
                <AskAI
                  prompt={`Explain this step of the live demo to my training audience: "${step.title}". What exactly is the orchestration layer doing here in ${info.name}, and what would a production implementation look like?`}
                  context={aiContext}
                />
              </div>
            </div>
          ) : (
            <div className="glass flex h-full flex-col justify-center rounded-2xl p-6">
              <div className="text-xs font-semibold uppercase tracking-widest text-sky-400">Ready</div>
              <h3 className="mt-1 text-xl font-bold text-white">Pick a framework and a scenario, then press Run</h3>
              <p className="mt-2 text-sm text-slate-400">{SCENARIOS.find((s) => s.id === sc)?.blurb}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
                <li>⌨️ <b>Space</b> play/pause · <b>← →</b> step · <b>R</b> reset</li>
                <li>🔌 Switch <b>MCP</b> off to see an orchestrator that can’t sense or act</li>
                <li>📚 Switch <b>RAG</b> off to see an orchestrator that hallucinates plant facts</li>
                <li>🔁 Same scenario, different framework → compare orchestration styles</li>
              </ul>
            </div>
          )}
        </div>

        <div className="glass flex flex-col rounded-2xl p-4 xl:col-span-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-white">Orchestration event log</h2>
          <div ref={logRef} className="scrollbar-thin max-h-[380px] flex-1 space-y-1.5 overflow-y-auto pr-1">
            {idx < 0 && <div className="text-sm text-slate-500">Waiting for the first event…</div>}
            {steps.slice(0, idx + 1).map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setPlaying(false);
                  setIdx(i);
                }}
                className={`fade-in flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/5 ${i === idx ? "bg-white/5" : ""}`}
              >
                <span className="mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold" style={{ color: STATUS_META[s.status].color, background: STATUS_META[s.status].bg }}>
                  {STATUS_META[s.status].label}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-200">
                    {i + 1}. {s.title}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-slate-500">{s.trace}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:col-span-3">
          <div className="glass rounded-2xl p-4">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-white">Run metrics</h2>
            <div className="grid grid-cols-2 gap-2">
              <Metric icon={<Cpu className="h-3.5 w-3.5" />} label="LLM calls" value={totals.llm} color="#a78bfa" />
              <Metric icon={<Wrench className="h-3.5 w-3.5" />} label="MCP tool calls" value={totals.tool} color="#34d399" />
              <Metric icon={<Database className="h-3.5 w-3.5" />} label="Retrievals" value={totals.rag} color="#fbbf24" />
              <Metric icon={<Timer className="h-3.5 w-3.5" />} label="Elapsed (sim)" value={`${(totals.ms / 1000).toFixed(1)}s`} color="#38bdf8" />
              <Metric icon={<Zap className="h-3.5 w-3.5" />} label="Fallbacks" value={totals.fallbacks} color="#fb923c" />
              <Metric icon={<ShieldAlert className="h-3.5 w-3.5" />} label="Recoveries" value={totals.recoveries} color="#a3e635" />
            </div>
          </div>
          <div className="glass flex-1 rounded-2xl p-4">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-white">Shared state</h2>
            <pre className="scrollbar-thin max-h-[250px] overflow-auto rounded-lg bg-black/40 p-2 font-mono text-[10.5px] leading-snug text-sky-200">
              {JSON.stringify(sharedState, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      {/* Outcome */}
      {finished && (
        <section
          className={`fade-in rounded-2xl border p-5 ${success ? "border-emerald-400/40 bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-violet-500/15" : "border-rose-400/40 bg-gradient-to-r from-rose-500/15 via-orange-500/10 to-amber-500/10"}`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-4xl">{success ? "🏆" : "⚠️"}</div>
            <div className="min-w-[260px] flex-1">
              <h3 className="text-xl font-extrabold text-white">
                {success ? "Mission accomplished — downtime prevented" : "Mission failed — the orchestrator had no ground truth"}
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                {success
                  ? `A 4-hour planned stop instead of ~22 hours of unplanned downtime. ${totals.fallbacks ? `${totals.fallbacks} fallback step(s) and ${totals.recoveries} recovery step(s) kept the mission on track.` : "No fallbacks were needed this time."}`
                  : `${!mcpOn ? "Without MCP the agents could not read sensors, check stock or book a window. " : ""}${!ragOn ? "Without RAG the agents invented part numbers and could not cite safety procedures. " : ""}Orchestration alone is just a coordinator with nothing reliable to coordinate.`}
              </p>
            </div>
            <div className="flex gap-2">
              <AskAI
                label="Ask AI for the debrief"
                prompt={`Give my audience a crisp debrief of this demo run (${info.name}, scenario "${sc}", MCP ${mcpOn ? "on" : "off"}, RAG ${ragOn ? "on" : "off"}). What did the orchestration layer do well, where did fallback/recovery kick in, and what are the 3 key lessons?`}
                context={`Run summary: ${steps.map((s, i) => `${i + 1}. [${STATUS_META[s.status].label}] ${s.title}`).join("; ")}. Totals: ${JSON.stringify(totals)}`}
              />
            </div>
          </div>
        </section>
      )}

      <FrameworkDeepDive framework={fw} onSelect={setFw} />
    </div>
  );
}

function LayerToggle({
  on,
  set,
  label,
  color,
  icon,
}: {
  on: boolean;
  set: (v: boolean) => void;
  label: string;
  color: "emerald" | "amber";
  icon: React.ReactNode;
}) {
  const onCls = color === "emerald" ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/50" : "bg-amber-500/20 text-amber-300 border-amber-400/50";
  return (
    <button
      onClick={() => set(!on)}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${on ? onCls : "border-rose-400/50 bg-rose-500/15 text-rose-300 line-through"}`}
    >
      {icon}
      {label} {on ? "ON" : "OFF"}
    </button>
  );
}

function Metric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-400">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className="text-lg font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
