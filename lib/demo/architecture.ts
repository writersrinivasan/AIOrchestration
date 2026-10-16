import type { Layer } from "./types";

export interface ArchNode {
  id: string;
  label: string;
  sub: string;
  icon: string;
  layer: Layer;
  x: number; // centre
  y: number; // centre
  w?: number;
  h?: number;
}

/** Enterprise reference architecture for the predictive-maintenance use case (SVG viewBox 1200 x 640). */
export const ARCH_NODES: ArchNode[] = [
  // Experience / trigger
  { id: "ui", label: "Plant Ops Console", sub: "Operator dashboard", icon: "🖥️", layer: "experience", x: 140, y: 56 },
  { id: "iot", label: "IoT Alert Stream", sub: "Kafka · OPC-UA events", icon: "📡", layer: "experience", x: 400, y: 56 },
  { id: "hitl", label: "Maint. Manager", sub: "Human-in-the-loop", icon: "🧑‍🔧", layer: "experience", x: 660, y: 56 },
  { id: "notify", label: "Teams / Email", sub: "Notifications", icon: "💬", layer: "experience", x: 920, y: 56 },

  // Orchestration
  { id: "planner", label: "Planner", sub: "Task decomposition", icon: "🗺️", layer: "orchestration", x: 110, y: 168 },
  { id: "orchestrator", label: "Orchestrator", sub: "Supervisor · Router", icon: "🎼", layer: "orchestration", x: 330, y: 168, w: 180, h: 54 },
  { id: "state", label: "Shared State", sub: "Memory · Checkpoints", icon: "🧠", layer: "orchestration", x: 550, y: 168 },
  { id: "policy", label: "Fallback & Policy", sub: "Retry · Circuit breaker", icon: "🛟", layer: "orchestration", x: 760, y: 168 },
  { id: "llm", label: "LLM Gateway", sub: "GPT-OSS → backup", icon: "⚡", layer: "orchestration", x: 955, y: 168 },

  // Agents
  { id: "a_sensor", label: "Sensor Diagnostics", sub: "Anomaly analysis", icon: "📈", layer: "agent", x: 105, y: 288 },
  { id: "a_rca", label: "Root-Cause Analyst", sub: "Knowledge agent", icon: "🔍", layer: "agent", x: 275, y: 288 },
  { id: "a_parts", label: "Parts & Procurement", sub: "Inventory agent", icon: "📦", layer: "agent", x: 445, y: 288 },
  { id: "a_sched", label: "Maint. Scheduler", sub: "Planning agent", icon: "📅", layer: "agent", x: 615, y: 288 },
  { id: "a_safety", label: "Safety & Compliance", sub: "Review agent", icon: "🦺", layer: "agent", x: 785, y: 288 },
  { id: "a_report", label: "Work-Order Writer", sub: "Reporting agent", icon: "📝", layer: "agent", x: 955, y: 288 },

  // MCP
  { id: "mcp_client", label: "MCP Client", sub: "tools/list · tools/call", icon: "🔌", layer: "mcp", x: 265, y: 395, w: 200 },
  { id: "mcp_scada", label: "SCADA MCP", sub: "read_sensor_history", icon: "🏭", layer: "mcp", x: 85, y: 462, w: 114 },
  { id: "mcp_sap", label: "SAP ERP MCP", sub: "check_stock", icon: "🧾", layer: "mcp", x: 205, y: 462, w: 114 },
  { id: "mcp_cmms", label: "CMMS MCP", sub: "find_window", icon: "🛠️", layer: "mcp", x: 325, y: 462, w: 114 },
  { id: "mcp_supplier", label: "Supplier MCP", sub: "find_alternate", icon: "🚚", layer: "mcp", x: 445, y: 462, w: 114 },

  // RAG
  { id: "rag_rewrite", label: "Query Rewriter", sub: "HyDE · expansion", icon: "✍️", layer: "rag", x: 625, y: 395 },
  { id: "rag_retr", label: "Hybrid Retriever", sub: "BM25 + vectors", icon: "🧲", layer: "rag", x: 795, y: 395 },
  { id: "rag_grade", label: "Relevance Grader", sub: "Corrective RAG", icon: "⚖️", layer: "rag", x: 965, y: 395 },
  { id: "rag_embed", label: "Embeddings", sub: "Chunk + embed", icon: "🧬", layer: "rag", x: 625, y: 462 },
  { id: "rag_vdb", label: "Vector DB", sub: "18k chunks · metadata", icon: "🗄️", layer: "rag", x: 795, y: 462 },
  { id: "rag_rerank", label: "Re-ranker", sub: "Cross-encoder", icon: "🏅", layer: "rag", x: 965, y: 462 },

  // Data / systems
  { id: "d_plc", label: "PLC / Sensors", sub: "Vibration · Temp", icon: "📟", layer: "data", x: 105, y: 568 },
  { id: "d_sap", label: "SAP S/4HANA", sub: "MM inventory", icon: "🏢", layer: "data", x: 275, y: 568 },
  { id: "d_cmms", label: "IBM Maximo", sub: "Work orders", icon: "🗂️", layer: "data", x: 445, y: 568 },
  { id: "d_supplier", label: "Supplier Portal", sub: "Alt. vendors", icon: "🌐", layer: "data", x: 615, y: 568 },
  { id: "d_docs", label: "OEM Manuals · SOPs", sub: "PDF corpus · OSHA", icon: "📚", layer: "data", x: 785, y: 568 },
  { id: "d_history", label: "Past Incidents", sub: "12k work orders", icon: "🕰️", layer: "data", x: 955, y: 568 },

  // Guardrails & observability (side rail)
  { id: "g_guard", label: "Guardrails", sub: "Policy · Safety", icon: "🛡️", layer: "guard", x: 1120, y: 190, w: 120 },
  { id: "g_trace", label: "Tracing", sub: "LangSmith / OTel", icon: "🔭", layer: "guard", x: 1120, y: 340, w: 120 },
  { id: "g_eval", label: "Evaluator", sub: "LLM-as-judge", icon: "🎯", layer: "guard", x: 1120, y: 490, w: 120 },
];

export const ARCH_NODE_MAP = Object.fromEntries(ARCH_NODES.map((n) => [n.id, n]));

/** Always-visible (faint) wiring of the architecture. */
export const ARCH_EDGES: [string, string][] = [
  ["iot", "orchestrator"],
  ["ui", "orchestrator"],
  ["orchestrator", "hitl"],
  ["orchestrator", "notify"],
  ["orchestrator", "planner"],
  ["orchestrator", "state"],
  ["state", "policy"],
  ["policy", "llm"],
  ["orchestrator", "a_sensor"],
  ["orchestrator", "a_rca"],
  ["orchestrator", "a_parts"],
  ["orchestrator", "a_sched"],
  ["orchestrator", "a_safety"],
  ["orchestrator", "a_report"],
  ["a_sensor", "mcp_client"],
  ["a_parts", "mcp_client"],
  ["a_sched", "mcp_client"],
  ["mcp_client", "mcp_scada"],
  ["mcp_client", "mcp_sap"],
  ["mcp_client", "mcp_cmms"],
  ["mcp_client", "mcp_supplier"],
  ["mcp_scada", "d_plc"],
  ["mcp_sap", "d_sap"],
  ["mcp_cmms", "d_cmms"],
  ["mcp_supplier", "d_supplier"],
  ["a_rca", "rag_rewrite"],
  ["a_safety", "rag_retr"],
  ["rag_rewrite", "rag_retr"],
  ["rag_retr", "rag_vdb"],
  ["rag_embed", "rag_vdb"],
  ["rag_retr", "rag_grade"],
  ["rag_vdb", "rag_rerank"],
  ["rag_vdb", "d_docs"],
  ["rag_vdb", "d_history"],
];

export const BANDS: { layer: Layer; x: number; y: number; w: number; h: number; label: string }[] = [
  { layer: "experience", x: 10, y: 14, w: 1040, h: 76, label: "EXPERIENCE & TRIGGERS" },
  { layer: "orchestration", x: 10, y: 112, w: 1040, h: 112, label: "ORCHESTRATION LAYER" },
  { layer: "agent", x: 10, y: 244, w: 1040, h: 88, label: "AGENT LAYER" },
  { layer: "mcp", x: 10, y: 352, w: 520, h: 145, label: "MCP LAYER · tools & actions" },
  { layer: "rag", x: 540, y: 352, w: 510, h: 145, label: "RAG LAYER · grounded knowledge" },
  { layer: "data", x: 10, y: 520, w: 1040, h: 92, label: "ENTERPRISE SYSTEMS & DATA" },
  { layer: "guard", x: 1060, y: 112, w: 120, h: 500, label: "GUARDRAILS · OBS" },
];
