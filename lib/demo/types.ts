export type Framework = "langchain" | "langgraph" | "crewai";

export type Scenario = "happy" | "llm-outage" | "rag-lowconf" | "mcp-timeout" | "guardrail";

export type Status = "info" | "ok" | "warn" | "fail" | "fallback" | "recover" | "done";

export type Layer = "experience" | "orchestration" | "agent" | "mcp" | "rag" | "data" | "guard";

export interface Step {
  title: string;
  detail: string;
  why?: string;
  layer: Layer;
  status: Status;
  /** Active nodes on the enterprise architecture diagram */
  arch: string[];
  /** Active edges on the architecture diagram */
  edges?: [string, string][];
  /** Active node on the framework's internal orchestration graph */
  orch: string;
  orchEdge?: string[]; // [from, to]
  /** Framework-flavoured trace line shown in the console */
  trace: string;
  /** Patch merged into the shared orchestration state */
  state?: Record<string, unknown>;
  metrics?: { llm?: number; tool?: number; rag?: number; ms?: number; tokens?: number };
}

export const LAYER_META: Record<Layer, { label: string; color: string; soft: string }> = {
  experience: { label: "Experience / Trigger", color: "#d946ef", soft: "rgba(217,70,239,0.10)" },
  orchestration: { label: "Orchestration", color: "#8b5cf6", soft: "rgba(139,92,246,0.12)" },
  agent: { label: "Agents", color: "#0ea5e9", soft: "rgba(14,165,233,0.10)" },
  mcp: { label: "MCP (Tools & Actions)", color: "#10b981", soft: "rgba(16,185,129,0.10)" },
  rag: { label: "RAG (Knowledge)", color: "#f59e0b", soft: "rgba(245,158,11,0.10)" },
  data: { label: "Enterprise Systems & Data", color: "#6366f1", soft: "rgba(99,102,241,0.10)" },
  guard: { label: "Guardrails & Observability", color: "#f43f5e", soft: "rgba(244,63,94,0.10)" },
};

export const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  info: { label: "EVENT", color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  ok: { label: "OK", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  warn: { label: "DEGRADED", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  fail: { label: "FAILURE", color: "#fb7185", bg: "rgba(251,113,133,0.14)" },
  fallback: { label: "FALLBACK", color: "#fb923c", bg: "rgba(251,146,60,0.14)" },
  recover: { label: "RECOVERED", color: "#a3e635", bg: "rgba(163,230,53,0.12)" },
  done: { label: "COMPLETE", color: "#c084fc", bg: "rgba(192,132,252,0.14)" },
};
