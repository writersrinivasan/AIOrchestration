import type { Deck } from "./types";

const G = "#10b981"; // emerald
const T = "#14b8a6"; // teal
const S = "#0ea5e9";
const A = "#f59e0b";
const V = "#8b5cf6";
const R = "#f43f5e";

export const langchainDeck: Deck = {
  id: "langchain",
  title: "LangChain",
  subtitle: "The composable foundation for LLM apps & agents",
  emoji: "🦜",
  gradient: "from-emerald-500 to-teal-500",
  accent: G,
  slides: [
    {
      layout: "title",
      kicker: "Deck 1 · Agentic AI frameworks",
      title: "LangChain",
      subtitle: "The composable foundation for building LLM applications and agents",
      emoji: "🦜🔗",
      chips: ["Open source · MIT", "Python & JavaScript", "v1.0 (Oct 2025)", "create_agent + middleware", "1000+ integrations"],
      notes:
        "LangChain started in late 2022 (Harrison Chase) as a library of building blocks for LLM apps. With v1.0 it was streamlined around one agent abstraction — create_agent — built on the LangGraph runtime, plus middleware for control. Legacy chains live on in langchain-classic.",
    },
    {
      kicker: "Positioning",
      title: "Where LangChain fits in the stack",
      bullets: [
        "**LangChain** — high-level: models, tools, retrievers, and a ready-made agent loop (`create_agent`).",
        "**LangGraph** — low-level orchestration runtime: state, graphs, persistence, interrupts. LangChain agents run on it.",
        "**LangSmith** — tracing, evaluation, prompt management and deployment (framework-agnostic).",
        "**Integration packages** — `langchain-groq`, `langchain-openai`, `langchain-anthropic`, vector stores, loaders…",
      ],
      cards: [
        { title: "langchain-core", sub: "interfaces", body: "Messages, Runnables, tools, retrievers — the stable base.", color: S, emoji: "🧱" },
        { title: "langchain", sub: "agents", body: "create_agent, middleware, structured output.", color: G, emoji: "🦜" },
        { title: "langgraph", sub: "runtime", body: "Durable state machine underneath agents.", color: V, emoji: "🕸️" },
        { title: "langsmith", sub: "ops", body: "Observe, evaluate, deploy.", color: R, emoji: "🔭" },
      ],
      cols: 4,
      notes: "Key message: LangChain = batteries-included. When you need precise control flow, you drop one level down to LangGraph — same ecosystem.",
    },
    {
      kicker: "Building blocks",
      title: "The core abstractions",
      cards: [
        { title: "Chat models", body: "init_chat_model(\"groq:openai/gpt-oss-120b\") — one interface, any provider. Tool calling, streaming, structured output.", color: V, emoji: "🧠" },
        { title: "Messages", body: "System / Human / AI / Tool messages — the universal conversation format between models and tools.", color: S, emoji: "💬" },
        { title: "Tools", body: "@tool turns a typed Python function into a schema the model can call. MCP tools via adapters.", color: G, emoji: "🔧" },
        { title: "Retrievers & vector stores", body: "100+ vector DB integrations, loaders, text splitters, embeddings → RAG.", color: A, emoji: "🧲" },
        { title: "Structured output", body: "Pydantic / JSON schema responses via provider-native or tool-based strategies.", color: T, emoji: "📐" },
        { title: "Runnables (LCEL)", body: "prompt | model | parser — composable pipelines with batch, stream, async for free.", color: R, emoji: "⛓️" },
      ],
      cols: 3,
      notes: "Spend a minute on Tools and Retrievers — these are exactly where MCP and RAG plug into LangChain.",
    },
    {
      kicker: "Orchestration model",
      title: "create_agent: the agent loop",
      flow: [
        { label: "Every turn", color: G, steps: ["Input messages", "Model reasons", "Tool calls?", "Execute tools", "ToolMessages → history", "Repeat until no tool calls", "Final answer"] },
      ],
      bullets: [
        "The **LLM decides** the next action on every iteration (ReAct-style tool calling).",
        "Built on the LangGraph runtime → checkpointing, streaming and interrupts come for free.",
        "Great default for a **single capable agent** with a focused toolset.",
      ],
      code: {
        title: "Minimal agent",
        code: `from langchain.agents import create_agent
from langchain.tools import tool

@tool
def read_sensor_history(machine: str, window: str = "72h") -> dict:
    """Return vibration & temperature trend for a machine."""
    return scada.history(machine, window)

agent = create_agent(
    model="groq:openai/gpt-oss-120b",
    tools=[read_sensor_history],
    system_prompt="You are a reliability engineer for Line 3.",
)

result = agent.invoke({"messages": [
    {"role": "user", "content": "CNC-07 vibration alarm — diagnose"}]})`,
      },
      notes: "Point at the flow: the loop ends only when the model stops calling tools. That's implicit orchestration — powerful, but the order of steps is the model's choice.",
    },
    {
      kicker: "Control & resilience",
      title: "Middleware: hooks around every model & tool call",
      bullets: [
        "Hooks: `before_model`, `after_model`, `wrap_model_call`, `wrap_tool_call` (+ before/after agent).",
        "Built-ins: **ModelFallback**, **ToolRetry**, **ModelCallLimit / ToolCallLimit**, **Summarization**, **HumanInTheLoop**, **PII** redaction.",
        "This is where **fallback & recovery** live in LangChain.",
      ],
      code: {
        title: "Resilient plant agent",
        code: `from langchain.agents.middleware import (
    ModelFallbackMiddleware, ToolRetryMiddleware,
    ModelCallLimitMiddleware, SummarizationMiddleware,
    HumanInTheLoopMiddleware)

agent = create_agent(
    model="groq:openai/gpt-oss-120b",
    tools=tools,
    middleware=[
        ModelFallbackMiddleware("groq:openai/gpt-oss-20b"),
        ToolRetryMiddleware(max_retries=3, backoff_factor=2.0),
        ModelCallLimitMiddleware(run_limit=25),
        SummarizationMiddleware(model="groq:openai/gpt-oss-20b"),
        HumanInTheLoopMiddleware(
            interrupt_on={"create_work_order": True}),
    ],
    checkpointer=InMemorySaver(),
)`,
      },
      notes: "Middleware is the big v1 change. Before, you'd hand-roll these behaviours. Connect back to the demo's LLM-outage and SAP-timeout scenarios.",
    },
    {
      kicker: "MCP layer",
      title: "Tools & MCP in LangChain",
      bullets: [
        "`@tool` for local functions — docstring + type hints become the schema.",
        "`langchain-mcp-adapters` → **MultiServerMCPClient** loads tools from any MCP server (stdio or Streamable HTTP).",
        "MCP tools are ordinary LangChain tools: mix them with retrievers and local tools.",
        "Keep toolsets small per agent; narrow, well-described tools beat one ‘god tool’.",
      ],
      code: {
        title: "Plant systems via MCP",
        code: `from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "scada": {"transport": "streamable_http",
              "url": "http://scada-mcp:8000/mcp"},
    "sap":   {"transport": "streamable_http",
              "url": "http://sap-mcp:8000/mcp"},
    "docs":  {"transport": "stdio", "command": "python",
              "args": ["docs_server.py"]},
})
tools = await client.get_tools()

agent = create_agent("groq:openai/gpt-oss-120b", tools=tools)`,
      },
    },
    {
      kicker: "RAG layer",
      title: "RAG with LangChain",
      flow: [
        { label: "Index", color: "#6366f1", steps: ["Document loaders", "Text splitters", "Embeddings", "Vector store"] },
        { label: "Query", color: A, steps: ["Retriever (MMR / hybrid)", "Retriever tool", "Agent decides when to search", "Answer + citations"] },
      ],
      code: {
        title: "Retriever as a tool (agentic RAG)",
        code: `splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=120)
chunks = splitter.split_documents(PyPDFLoader("nhx5000_manual.pdf").load())
store = PGVector.from_documents(chunks, embeddings, collection_name="oem")

@tool
def search_manuals(query: str) -> str:
    """Search OEM manuals, SOPs and past incidents."""
    docs = store.as_retriever(search_type="mmr", search_kwargs={"k": 5}).invoke(query)
    return "\\n\\n".join(f"[{d.metadata['source']}] {d.page_content}" for d in docs)`,
      },
      notes: "Agentic RAG: retrieval is a tool the agent chooses to call. Add a grading step via middleware if you need Corrective RAG guarantees.",
    },
    {
      kicker: "Multi-agent",
      title: "Going multi-agent with LangChain",
      cards: [
        { title: "Sub-agents as tools", body: "Wrap specialist agents (sensor, parts, safety) as tools of a supervisor agent. Simple, context-isolated.", color: G, emoji: "🧰" },
        { title: "Handoffs", body: "Agents transfer control to each other via tool calls that update state — conversational routing.", color: S, emoji: "🤝" },
        { title: "Graduate to LangGraph", body: "Need explicit order, parallel branches, quality gates or long-running approvals? Model it as a graph.", color: V, emoji: "🕸️" },
      ],
      cols: 3,
      code: {
        title: "Supervisor with sub-agents as tools",
        code: `@tool
def diagnose(alert: str) -> str:
    """Delegate sensor diagnosis to the vibration specialist."""
    return sensor_agent.invoke({"messages": [{"role": "user", "content": alert}]})["messages"][-1].content

supervisor = create_agent("groq:openai/gpt-oss-120b", tools=[diagnose, find_root_cause, source_parts, safety_review])`,
      },
    },
    {
      kicker: "Memory & ops",
      title: "Memory, streaming & observability",
      cards: [
        { title: "Short-term memory", body: "checkpointer + thread_id keeps conversation state; SummarizationMiddleware trims long histories.", color: S, emoji: "🧠" },
        { title: "Long-term memory", body: "A store (namespaced key-value + semantic search) shared across threads — e.g. plant preferences.", color: V, emoji: "🗄️" },
        { title: "Streaming", body: "agent.stream(..., stream_mode=\"updates\" | \"messages\") for token & step streaming to UIs.", color: A, emoji: "📡" },
        { title: "LangSmith", body: "Set LANGSMITH_TRACING=true → every model/tool call traced; datasets, evaluators, online evals.", color: R, emoji: "🔭" },
      ],
      cols: 4,
      callout: "Same tracing & memory primitives as LangGraph — because a LangChain agent IS a LangGraph graph under the hood.",
    },
    {
      kicker: "Decision guide",
      title: "When to choose LangChain",
      table: {
        head: ["✅ Great for", "⚠️ Think twice when"],
        rows: [
          ["Fast prototypes and single tool-using agents", "You must guarantee step order / approvals at specific points"],
          ["RAG apps needing many loaders, vector DBs, models", "Workflows run for hours/days with complex branching"],
          ["Adding resilience quickly via middleware", "Many agents with explicit coordination rules"],
          ["Teams already on LangSmith", "You want zero framework abstraction"],
        ],
      },
      bullets: ["**Rule of thumb:** start with `create_agent`; move the parts that need determinism into a LangGraph graph."],
      notes: "Bridge to the next deck: LangGraph is where explicit orchestration lives.",
    },
  ],
};
