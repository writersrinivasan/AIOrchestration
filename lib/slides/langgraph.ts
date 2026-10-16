import type { Deck } from "./types";

const V = "#8b5cf6";
const I = "#6366f1";
const S = "#0ea5e9";
const G = "#10b981";
const A = "#f59e0b";
const R = "#f43f5e";
const O = "#fb923c";
const P = "#d946ef";

export const langgraphDeck: Deck = {
  id: "langgraph",
  title: "LangGraph",
  subtitle: "Low-level orchestration for stateful, durable agents",
  emoji: "🕸️",
  gradient: "from-violet-500 to-indigo-500",
  accent: V,
  slides: [
    {
      layout: "title",
      kicker: "Deck 2 · Agentic AI frameworks",
      title: "LangGraph",
      subtitle: "Build controllable, stateful, long-running agents as graphs",
      emoji: "🕸️",
      chips: ["Open source · MIT", "Python & JS", "v1.0 (Oct 2025)", "Pregel-inspired runtime", "Durable execution", "Human-in-the-loop"],
      notes:
        "LangGraph is the orchestration engine of the LangChain ecosystem — but usable standalone. It models an application as a state machine: nodes do work, edges decide what runs next, and a checkpointer saves state after every step.",
    },
    {
      kicker: "Mental model",
      title: "State + Nodes + Edges",
      cards: [
        { title: "State", sub: "the shared memory", body: "A TypedDict / Pydantic schema. Each key can have a reducer (e.g. add_messages appends instead of overwriting).", color: G, emoji: "🧠" },
        { title: "Nodes", sub: "the workers", body: "Plain functions (or agents) that read state and return a partial update.", color: S, emoji: "⚙️" },
        { title: "Edges", sub: "the control flow", body: "Normal edges (always), conditional edges (router function), START / END. Cycles allowed.", color: V, emoji: "➡️" },
      ],
      cols: 3,
      bullets: [
        "**You** define the control flow; LLMs make decisions only where you let them (inside nodes / routers).",
        "That is the core difference vs. a free-running agent loop → predictable, auditable, testable.",
      ],
      notes: "Draw the analogy: a flowchart that can loop and remember. For regulated industries, being able to point to the exact edge that ran is gold.",
    },
    {
      kicker: "Hello graph",
      title: "Building a graph",
      code: {
        title: "Maintenance triage graph",
        code: `from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

class PlantState(TypedDict):
    messages: Annotated[list, add_messages]   # reducer: append
    findings: dict
    severity: str

def diagnose(state: PlantState):
    return {"findings": sensor_agent(state["messages"]), "severity": "HIGH"}

def route(state: PlantState) -> str:
    return "escalate" if state["severity"] == "HIGH" else "log"

g = StateGraph(PlantState)
g.add_node("diagnose", diagnose)
g.add_node("escalate", escalate)
g.add_node("log", log_only)
g.add_edge(START, "diagnose")
g.add_conditional_edges("diagnose", route, {"escalate": "escalate", "log": "log"})
g.add_edge("escalate", END)
g.add_edge("log", END)
app = g.compile(checkpointer=checkpointer)`,
      },
      bullets: [
        "`add_node` registers work.",
        "`add_conditional_edges` = **router**.",
        "`compile()` validates the graph and attaches persistence.",
        "Invoke with a `thread_id` → resumable run.",
      ],
    },
    {
      kicker: "Runtime",
      title: "Execution model: super-steps, parallelism & Command",
      cards: [
        { title: "Super-steps", body: "Pregel/BSP-style: all nodes triggered in a step run (in parallel), then state updates merge via reducers.", color: I, emoji: "🧮" },
        { title: "Send API", body: "Dynamic fan-out (map-reduce): send one task per machine / document to the same node in parallel.", color: S, emoji: "📤" },
        { title: "Command", body: "A node can update state AND choose the next node: Command(goto=\"parts\", update={...}) — ideal for handoffs.", color: V, emoji: "🧭" },
        { title: "Subgraphs", body: "A compiled graph can be a node of another graph → hierarchical teams with their own state.", color: G, emoji: "🪆" },
      ],
      cols: 4,
      code: {
        code: `from langgraph.types import Send, Command

def fan_out(state):             # check stock in every warehouse in parallel
    return [Send("check_stock", {"wh": w}) for w in state["warehouses"]]

def supervisor(state) -> Command:
    nxt = llm_router(state)       # "sensor" | "parts" | "safety" | END
    return Command(goto=nxt, update={"last_route": nxt})`,
      },
    },
    {
      kicker: "Persistence",
      title: "Checkpointers = durable execution",
      bullets: [
        "State is saved after **every super-step** to a checkpointer: `InMemorySaver`, `SqliteSaver`, `PostgresSaver` (+ Redis, MongoDB…).",
        "**Threads** (`thread_id`) isolate runs; resume after crashes, deploys or hours of waiting.",
        "**Time travel**: inspect history, replay from any checkpoint, or fork with edited state.",
        "**Durability modes** trade speed vs safety (`exit`, `async`, `sync`).",
        "**Fault tolerance**: a failed node's siblings' writes are kept; retry only what failed.",
      ],
      code: {
        title: "Inspect & replay",
        code: `cfg = {"configurable": {"thread_id": "CNC-07"}}
app.invoke({"messages": [alert]}, cfg)

snap = app.get_state(cfg)              # current values + next nodes
for h in app.get_state_history(cfg):   # every checkpoint
    print(h.config["configurable"]["checkpoint_id"], h.next)

# fork: fix a bad value and continue from there
new_cfg = app.update_state(cfg, {"severity": "MEDIUM"})
app.invoke(None, new_cfg)`,
      },
      notes: "This is the feature that makes LangGraph production-grade. Ask the audience: what happens to a 3-hour approval flow when your pod restarts? With a checkpointer — nothing bad.",
    },
    {
      kicker: "Human-in-the-loop",
      title: "interrupt() & Command(resume=…)",
      flow: [{ label: "Approval flow", color: P, steps: ["safety node passes", "human node calls interrupt(payload)", "graph pauses · checkpoint saved", "UI shows plan to manager", "Command(resume=decision)", "continue → END"] }],
      code: {
        code: `from langgraph.types import interrupt, Command

def human_approval(state):
    decision = interrupt({
        "question": "Approve work order?",
        "work_order": state["work_order"],
        "caveats": state.get("caveats", []),
    })
    if decision["action"] == "edit":
        return {"work_order": decision["work_order"], "approved": True}
    return {"approved": decision["action"] == "approve"}

# later — possibly another process, hours later:
app.invoke(Command(resume={"action": "approve"}), cfg)`,
      },
      bullets: ["Patterns: **approve / reject**, **edit state**, **review tool calls**, **multi-turn clarification**.", "Requires a checkpointer — the pause is persisted, not held in memory."],
    },
    {
      kicker: "Memory",
      title: "Short-term vs long-term memory",
      cards: [
        { title: "Short-term (thread)", sub: "checkpointer", body: "The state of one run/conversation: messages, findings, plan. Trim or summarise to fit the context window.", color: S, emoji: "📝" },
        { title: "Long-term (store)", sub: "BaseStore", body: "Cross-thread memory in namespaces, e.g. (\"plant\", \"CNC-07\"). Key-value + optional semantic search.", color: V, emoji: "🗄️" },
        { title: "Memory types", sub: "what to store", body: "Semantic (facts), episodic (past incidents), procedural (learned instructions / prompts).", color: A, emoji: "🧩" },
      ],
      cols: 3,
      code: {
        code: `def remember_fix(state, *, store):
    store.put(("assets", "CNC-07"), "last_bearing_change",
              {"date": "2026-10-17", "part": "SKF 7014 ACD/P4A"})

app = g.compile(checkpointer=PostgresSaver(...), store=PostgresStore(...))`,
      },
    },
    {
      kicker: "Multi-agent",
      title: "Multi-agent architectures in LangGraph",
      cards: [
        { title: "Supervisor", body: "Central router agent delegates to workers and collects results (langgraph-supervisor helper or hand-built).", color: V, emoji: "🎼" },
        { title: "Hierarchical", body: "Supervisors of supervisors using subgraphs — e.g. Maintenance team + Procurement team.", color: I, emoji: "🏛️" },
        { title: "Swarm / handoffs", body: "Agents hand off directly with Command(goto=…); the active agent is remembered (langgraph-swarm).", color: S, emoji: "🐝" },
        { title: "Network", body: "Any agent can call any other — flexible but harder to reason about.", color: O, emoji: "🕸️" },
        { title: "Custom workflow", body: "Deterministic edges between specialised nodes — most common in production.", color: G, emoji: "🛠️" },
      ],
      cols: 5,
      callout: "Our industrial demo uses: supervisor routing + Corrective-RAG loop + error edge to a fallback node + reflection loop + interrupt() approval.",
    },
    {
      kicker: "Agentic patterns",
      title: "Classic agent architectures you can build as graphs",
      table: {
        head: ["Pattern", "Graph shape", "Use it for"],
        rows: [
          ["ReAct agent", "model ⇄ tools loop", "General tool use (create_react_agent / create_agent)"],
          ["Plan-and-Execute", "planner → executor ⟲ replanner", "Long multi-step jobs"],
          ["ReWOO", "planner → parallel tool workers → solver", "Fewer LLM calls, predictable cost"],
          ["Reflection / Reflexion", "generate ⇄ critique (bounded)", "Quality-critical outputs"],
          ["Corrective / Self / Adaptive RAG", "retrieve → grade → rewrite ⟲ → generate", "Grounded answers"],
          ["LATS", "tree search over actions + reflection", "Hard reasoning, exploration"],
          ["Map-reduce", "Send fan-out → reduce node", "Batch analysis of many assets / docs"],
        ],
      },
    },
    {
      kicker: "Developer experience",
      title: "Streaming, Functional API & tooling",
      cards: [
        { title: "Streaming modes", body: "values · updates · messages (tokens) · custom · debug — stream progress to the operator console.", color: A, emoji: "📡" },
        { title: "Functional API", body: "@entrypoint + @task: add persistence & interrupts to plain Python code without drawing a graph.", color: G, emoji: "🧪" },
        { title: "LangGraph Studio", body: "Visual IDE: see the graph, step through runs, edit state, replay — great for teaching!", color: P, emoji: "🎨" },
        { title: "Deployment", body: "LangSmith Deployment (formerly LangGraph Platform) / Agent Server: assistants, threads, runs, cron, task queue.", color: R, emoji: "🚀" },
      ],
      cols: 4,
      code: {
        code: `for chunk in app.stream({"messages": [alert]}, cfg, stream_mode="updates"):
    print(chunk)   # {'diagnose': {'findings': {...}, 'severity': 'HIGH'}}`,
      },
    },
    {
      kicker: "Decision guide",
      title: "When to choose LangGraph",
      table: {
        head: ["✅ Great for", "⚠️ Think twice when"],
        rows: [
          ["Regulated / safety-critical workflows needing audit trails", "A single prompt or simple chain is enough"],
          ["Long-running jobs with human approvals", "Team wants a no-code / role-based abstraction"],
          ["Explicit quality gates, loops and fallbacks", "Rapid throwaway prototype (start with create_agent)"],
          ["Multi-agent systems with clear ownership of state", "You can't invest in state design up front"],
        ],
      },
      bullets: ["**Rule of thumb:** if you can draw the process on a whiteboard, encode it as a graph and let LLMs fill in the judgement calls."],
    },
  ],
};
