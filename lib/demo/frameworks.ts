import type { Framework } from "./types";

export interface OrchNode {
  id: string;
  label: string;
  sub?: string;
  x: number;
  y: number;
  w?: number;
  shape?: "rect" | "pill" | "diamond";
  color: string;
}

export interface OrchGraph {
  nodes: OrchNode[];
  edges: { from: string; to: string; label?: string; dashed?: boolean }[];
  caption: string;
}

const V = "#8b5cf6"; // orchestration
const S = "#0ea5e9"; // agent
const E = "#10b981"; // mcp
const A = "#f59e0b"; // rag
const R = "#f43f5e"; // guard
const P = "#d946ef"; // human / io
const O = "#fb923c"; // fallback

/** Internal orchestration topology of each framework (SVG viewBox 420 x 440). */
export const ORCH_GRAPHS: Record<Framework, OrchGraph> = {
  langchain: {
    caption: "create_agent → a model ↔ tools loop. The LLM decides the next step; middleware wraps every model & tool call.",
    nodes: [
      { id: "lc_input", label: "Input: alert", x: 80, y: 40, w: 110, shape: "pill", color: P },
      { id: "lc_agent", label: "Agent (LLM)", sub: "reason · choose tool", x: 210, y: 118, w: 150, color: V },
      { id: "lc_mw", label: "Middleware", sub: "retry · fallback · HITL", x: 360, y: 200, w: 110, color: R },
      { id: "lc_tools", label: "Tool Node", sub: "MCP tools + retriever", x: 210, y: 220, w: 150, color: E },
      { id: "lc_observe", label: "Observation", sub: "ToolMessage → history", x: 64, y: 200, w: 110, color: A },
      { id: "lc_output", label: "Final answer", x: 340, y: 40, w: 110, shape: "pill", color: P },
      { id: "lc_t1", label: "read_sensor_history", x: 110, y: 300, w: 140, color: E },
      { id: "lc_t2", label: "search_manuals (RAG)", x: 310, y: 300, w: 140, color: A },
      { id: "lc_t3", label: "check_stock", x: 110, y: 340, w: 140, color: E },
      { id: "lc_t4", label: "create_work_order", x: 310, y: 340, w: 140, color: E },
    ],
    edges: [
      { from: "lc_input", to: "lc_agent" },
      { from: "lc_agent", to: "lc_tools", label: "tool_calls" },
      { from: "lc_tools", to: "lc_observe" },
      { from: "lc_observe", to: "lc_agent", label: "loop" },
      { from: "lc_mw", to: "lc_agent", dashed: true },
      { from: "lc_mw", to: "lc_tools", dashed: true },
      { from: "lc_agent", to: "lc_output", label: "no more tools" },
    ],
  },
  langgraph: {
    caption: "StateGraph: explicit nodes, typed shared state, conditional edges, cycles, checkpointer & interrupt().",
    nodes: [
      { id: "lg_start", label: "START", x: 210, y: 24, shape: "pill", color: P, w: 70 },
      { id: "lg_super", label: "supervisor", sub: "route_next()", x: 210, y: 84, w: 130, color: V },
      { id: "lg_sensor", label: "sensor", sub: "MCP", x: 50, y: 160, w: 80, color: E },
      { id: "lg_rca", label: "rca", sub: "RAG", x: 145, y: 160, w: 80, color: A },
      { id: "lg_parts", label: "parts", sub: "MCP", x: 265, y: 160, w: 80, color: E },
      { id: "lg_sched", label: "scheduler", sub: "MCP", x: 365, y: 160, w: 84, color: E },
      { id: "lg_grade", label: "grade_docs", x: 145, y: 236, w: 92, shape: "diamond", color: A },
      { id: "lg_rewrite", label: "rewrite", sub: "CRAG", x: 50, y: 300, w: 76, color: O },
      { id: "lg_fallback", label: "alt_supplier", sub: "fallback", x: 265, y: 236, w: 92, color: O },
      { id: "lg_safety", label: "safety", sub: "RAG + guardrail", x: 210, y: 306, w: 120, color: R },
      { id: "lg_reflect", label: "reflect", sub: "revise plan", x: 355, y: 306, w: 90, color: O },
      { id: "lg_human", label: "human", sub: "interrupt()", x: 210, y: 368, w: 110, color: P },
      { id: "lg_end", label: "END", x: 210, y: 418, shape: "pill", color: P, w: 70 },
    ],
    edges: [
      { from: "lg_start", to: "lg_super" },
      { from: "lg_super", to: "lg_sensor" },
      { from: "lg_super", to: "lg_rca" },
      { from: "lg_super", to: "lg_parts" },
      { from: "lg_super", to: "lg_sched" },
      { from: "lg_rca", to: "lg_grade" },
      { from: "lg_grade", to: "lg_rewrite", label: "irrelevant", dashed: true },
      { from: "lg_rewrite", to: "lg_rca", dashed: true },
      { from: "lg_parts", to: "lg_fallback", label: "error", dashed: true },
      { from: "lg_super", to: "lg_safety" },
      { from: "lg_safety", to: "lg_reflect", label: "violation", dashed: true },
      { from: "lg_reflect", to: "lg_safety", dashed: true },
      { from: "lg_safety", to: "lg_human", label: "pass" },
      { from: "lg_human", to: "lg_end" },
    ],
  },
  crewai: {
    caption: "Crew with Process.hierarchical: a manager LLM delegates role-based Tasks to agents; guardrails & human_input on tasks.",
    nodes: [
      { id: "cr_kick", label: "crew.kickoff()", x: 210, y: 28, shape: "pill", color: P, w: 120 },
      { id: "cr_mgr", label: "Manager Agent", sub: "manager_llm · delegation", x: 210, y: 92, w: 170, color: V },
      { id: "cr_sensor", label: "Vibration", sub: "Analyst", x: 46, y: 176, w: 76, color: S },
      { id: "cr_rel", label: "Reliability", sub: "Engineer", x: 128, y: 176, w: 76, color: S },
      { id: "cr_proc", label: "Procure-", sub: "ment", x: 210, y: 176, w: 76, color: S },
      { id: "cr_plan", label: "Maint.", sub: "Planner", x: 292, y: 176, w: 76, color: S },
      { id: "cr_safe", label: "Safety", sub: "Officer", x: 374, y: 176, w: 76, color: S },
      { id: "cr_tools", label: "Tools", sub: "MCPServerAdapter", x: 110, y: 256, w: 140, color: E },
      { id: "cr_know", label: "Knowledge", sub: "knowledge_sources (RAG)", x: 310, y: 256, w: 150, color: A },
      { id: "cr_guard", label: "Task Guardrail", sub: "validate → retry", x: 110, y: 330, w: 140, color: R },
      { id: "cr_deleg", label: "Re-delegate / Retry", sub: "max_retry_limit", x: 310, y: 330, w: 150, color: O },
      { id: "cr_human", label: "human_input", sub: "approval", x: 120, y: 404, w: 120, shape: "pill", color: P },
      { id: "cr_out", label: "CrewOutput", x: 300, y: 404, w: 110, shape: "pill", color: P },
    ],
    edges: [
      { from: "cr_kick", to: "cr_mgr" },
      { from: "cr_mgr", to: "cr_sensor" },
      { from: "cr_mgr", to: "cr_rel" },
      { from: "cr_mgr", to: "cr_proc" },
      { from: "cr_mgr", to: "cr_plan" },
      { from: "cr_mgr", to: "cr_safe" },
      { from: "cr_sensor", to: "cr_tools" },
      { from: "cr_proc", to: "cr_tools" },
      { from: "cr_rel", to: "cr_know" },
      { from: "cr_safe", to: "cr_know" },
      { from: "cr_tools", to: "cr_guard", dashed: true },
      { from: "cr_guard", to: "cr_deleg", label: "fail", dashed: true },
      { from: "cr_deleg", to: "cr_mgr", dashed: true },
      { from: "cr_guard", to: "cr_human" },
      { from: "cr_human", to: "cr_out" },
    ],
  },
};

export interface FrameworkInfo {
  name: string;
  tagline: string;
  gradient: string;
  accent: string;
  style: string;
  traits: { k: string; v: string }[];
  strengths: string[];
  watchOuts: string[];
  code: string;
}

export const FRAMEWORKS: Record<Framework, FrameworkInfo> = {
  langchain: {
    name: "LangChain",
    tagline: "Agent loop + composable building blocks",
    gradient: "from-emerald-500 to-teal-500",
    accent: "#10b981",
    style: "LLM-driven control flow",
    traits: [
      { k: "Orchestration model", v: "Single agent loop (ReAct: reason → tool → observe). Multi-agent = sub-agents exposed as tools." },
      { k: "Who decides the next step?", v: "The LLM, on every turn of the loop." },
      { k: "State", v: "Message history (+ optional custom state via middleware); checkpointer for threads." },
      { k: "Fallback & recovery", v: "Middleware: ModelFallbackMiddleware, ToolRetryMiddleware, model/tool call limits, .with_fallbacks()." },
      { k: "Human-in-the-loop", v: "HumanInTheLoopMiddleware(interrupt_on={...})" },
      { k: "MCP", v: "langchain-mcp-adapters → MultiServerMCPClient.get_tools()" },
      { k: "RAG", v: "Retrievers / vector stores wrapped as tools (create_retriever_tool)." },
    ],
    strengths: ["Fastest path from idea to working agent", "Huge integration ecosystem (models, vector DBs, loaders)", "Middleware gives clean hooks for guardrails & retries"],
    watchOuts: ["Control flow is implicit — harder to guarantee the order of steps", "Quality gates (e.g. RAG grading) must be added explicitly", "Complex multi-agent flows usually graduate to LangGraph (create_agent runs on it)"],
    code: `from langchain.agents import create_agent
from langchain.agents.middleware import (
    ModelFallbackMiddleware, ToolRetryMiddleware, HumanInTheLoopMiddleware)
from langchain_groq import ChatGroq
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.checkpoint.memory import InMemorySaver

# ── MCP layer: plant systems exposed as standard tools ──────────────
mcp = MultiServerMCPClient({
    "scada": {"url": "http://scada-mcp:8000/mcp", "transport": "streamable_http"},
    "sap":   {"url": "http://sap-mcp:8000/mcp",   "transport": "streamable_http"},
    "cmms":  {"url": "http://cmms-mcp:8000/mcp",  "transport": "streamable_http"},
})
mcp_tools = await mcp.get_tools()

# ── RAG layer: OEM manuals + past work orders as a retriever tool ───
search_manuals = create_retriever_tool(
    vectorstore.as_retriever(search_type="mmr", search_kwargs={"k": 5}),
    name="search_manuals",
    description="Search OEM manuals, SOPs and past incidents for CNC assets",
)

# ── Orchestration: one agent loop + middleware for resilience ────────
agent = create_agent(
    model=ChatGroq(model="openai/gpt-oss-120b"),
    tools=[*mcp_tools, search_manuals],
    system_prompt=MAINTENANCE_SUPERVISOR_PROMPT,
    middleware=[
        ModelFallbackMiddleware("groq:openai/gpt-oss-20b"),      # LLM outage
        ToolRetryMiddleware(max_retries=3, backoff_factor=2.0),     # flaky MCP server
        HumanInTheLoopMiddleware(interrupt_on={"create_work_order": True}),
    ],
    checkpointer=InMemorySaver(),
)

result = await agent.ainvoke(
    {"messages": [{"role": "user", "content": alert_json}]},
    config={"configurable": {"thread_id": "CNC-07"}},
)`,
  },
  langgraph: {
    name: "LangGraph",
    tagline: "Explicit, stateful graphs for reliable agents",
    gradient: "from-violet-500 to-indigo-500",
    accent: "#8b5cf6",
    style: "Developer-defined control flow",
    traits: [
      { k: "Orchestration model", v: "StateGraph of nodes (agents / functions) with conditional edges and cycles. Supervisor, hierarchical, swarm patterns." },
      { k: "Who decides the next step?", v: "You do — edges & routing functions; LLMs decide only inside nodes / router." },
      { k: "State", v: "Typed shared state (TypedDict / Pydantic) with reducers; persisted by a checkpointer." },
      { k: "Fallback & recovery", v: "RetryPolicy per node, conditional 'error' edges, corrective loops, time-travel replay from checkpoints." },
      { k: "Human-in-the-loop", v: "interrupt() pauses the graph; resume with Command(resume=...)." },
      { k: "MCP", v: "MCP tools via langchain-mcp-adapters inside nodes / ToolNode." },
      { k: "RAG", v: "Agentic / Corrective RAG as explicit retrieve → grade → rewrite cycle." },
    ],
    strengths: ["Deterministic, auditable control flow — ideal for regulated industry", "Durable execution: checkpoints, resume after crash, replay", "First-class quality gates, loops and human approvals"],
    watchOuts: ["More code & design up front", "You must model state and transitions carefully", "Graph can sprawl without good sub-graph boundaries"],
    code: `from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.types import RetryPolicy, interrupt
from langgraph.checkpoint.postgres import PostgresSaver

class PlantState(TypedDict, total=False):
    alert: dict;  findings: dict;  docs: list;  doc_score: float
    parts: dict;  schedule: dict;  safety: dict; work_order: dict; approved: bool

g = StateGraph(PlantState)
g.add_node("supervisor", supervisor)                  # LLM router over shared state
g.add_node("sensor", sensor_agent)                    # MCP → scada.read_sensor_history
g.add_node("rca", rca_agent)                          # RAG → hybrid retriever + rerank
g.add_node("rewrite", rewrite_query)                  # Corrective RAG
g.add_node("parts", parts_agent,
           retry_policy=RetryPolicy(max_attempts=3, backoff_factor=2.0))
g.add_node("alt_supplier", supplier_fallback)         # MCP → supplier.find_alternate
g.add_node("scheduler", scheduler_agent)              # MCP → cmms.find_window
g.add_node("safety", safety_agent)                    # RAG (OSHA/SOP) + guardrail
g.add_node("reflect", revise_plan)                    # self-correction
g.add_node("human", human_approval)

g.add_edge(START, "supervisor")
g.add_conditional_edges("supervisor", route_next)     # → sensor|rca|parts|scheduler|safety
for worker in ["sensor", "scheduler", "alt_supplier"]:
    g.add_edge(worker, "supervisor")
g.add_conditional_edges("rca", grade_docs, {"relevant": "supervisor", "irrelevant": "rewrite"})
g.add_edge("rewrite", "rca")
g.add_conditional_edges("parts", stock_ok, {"ok": "supervisor", "fallback": "alt_supplier"})
g.add_conditional_edges("safety", check_policy, {"pass": "human", "violation": "reflect"})
g.add_edge("reflect", "safety")
g.add_edge("human", END)

def human_approval(state: PlantState):
    decision = interrupt({"work_order": state["work_order"]})   # pauses + checkpoints
    return {"approved": decision == "approve"}

app = g.compile(checkpointer=PostgresSaver.from_conn_string(DB_URI))
app.invoke({"alert": alert}, config={"configurable": {"thread_id": "CNC-07"}})`,
  },
  crewai: {
    name: "CrewAI",
    tagline: "Role-playing agent teams (Crews) + event-driven Flows",
    gradient: "from-orange-500 to-rose-500",
    accent: "#fb923c",
    style: "Role & task-driven collaboration",
    traits: [
      { k: "Orchestration model", v: "Crew of role-based Agents executing Tasks. Process.sequential or Process.hierarchical (manager agent). Flows add event-driven control." },
      { k: "Who decides the next step?", v: "Sequential: task order. Hierarchical: the manager LLM delegates & validates." },
      { k: "State", v: "Task outputs passed as context; crew memory (short/long-term, entity); Flow state for structured control." },
      { k: "Fallback & recovery", v: "Task guardrails with retries, agent max_retry_limit, delegation, Flow @router branches." },
      { k: "Human-in-the-loop", v: "Task(human_input=True) or Flow-level human feedback steps." },
      { k: "MCP", v: "crewai-tools MCPServerAdapter (stdio / SSE / streamable HTTP)." },
      { k: "RAG", v: "knowledge_sources on Agent/Crew (PDF, text, etc.) or RAG tools." },
    ],
    strengths: ["Very intuitive mental model: roles, goals, backstories, tasks", "Quick to build collaborative multi-agent teams", "Flows give production-grade, event-driven control when needed"],
    watchOuts: ["Hierarchical manager adds LLM calls & non-determinism", "Fine-grained branching needs Flows, not just Crews", "Watch token cost of verbose role prompts"],
    code: `from crewai import Agent, Task, Crew, Process, LLM
from crewai_tools import MCPServerAdapter
from crewai.knowledge.source.pdf_knowledge_source import PDFKnowledgeSource

llm = LLM(model="groq/openai/gpt-oss-120b")
plant_docs = PDFKnowledgeSource(file_paths=["oem/nhx5000_spindle.pdf", "sop/SOP-MNT-022_LOTO.pdf"])

servers = [{"url": "http://scada-mcp:8000/mcp", "transport": "streamable-http"},
           {"url": "http://sap-mcp:8000/mcp",   "transport": "streamable-http"},
           {"url": "http://cmms-mcp:8000/mcp",  "transport": "streamable-http"}]

with MCPServerAdapter(servers) as tools:                      # ── MCP layer
    analyst = Agent(role="Vibration Analyst", goal="Diagnose the CNC-07 anomaly",
                    backstory="20 years in condition monitoring",
                    tools=[tools["read_sensor_history"]], llm=llm)
    reliability = Agent(role="Reliability Engineer", goal="Find the root cause",
                        backstory="Owns OEM manuals & failure history",
                        knowledge_sources=[plant_docs], llm=llm)     # ── RAG layer
    procurement = Agent(role="Procurement Specialist", goal="Secure spare parts",
                        backstory="Knows SAP MM and suppliers",
                        tools=[tools["check_stock"], tools["find_alternate"]],
                        max_retry_limit=3, llm=llm)
    planner = Agent(role="Maintenance Planner", goal="Book the least disruptive window",
                    backstory="Runs the CMMS schedule", tools=[tools["find_window"]], llm=llm)
    safety = Agent(role="Safety Officer", goal="Enforce LOTO & ISO 45001",
                   backstory="Plant EHS lead", knowledge_sources=[plant_docs], llm=llm)

    review = Task(description="Review the maintenance plan against LOTO SOP-MNT-022",
                  expected_output="Approved work order with citations", agent=safety,
                  guardrail=validate_loto, guardrail_max_retries=2, human_input=True)

    crew = Crew(agents=[analyst, reliability, procurement, planner, safety],
                tasks=[diagnose, root_cause, source_parts, schedule, review],
                process=Process.hierarchical, manager_llm=llm, memory=True)   # ── Orchestration
    result = crew.kickoff(inputs={"alert": alert})`,
  },
};
