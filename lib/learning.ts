export type Block =
  | { type: "text"; text: string }
  | { type: "bullets"; items: string[] }
  | { type: "code"; title?: string; code: string }
  | { type: "table"; head: string[]; rows: string[][] }
  | { type: "callout"; tone: "info" | "tip" | "warn"; text: string }
  | { type: "visual"; name: "ladder" | "patterns" | "mcp" | "rag" | "defense" | "anatomy" | "frameworks" };

export interface QuizQ {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface Module {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
  minutes: number;
  sections: { heading: string; blocks: Block[] }[];
  takeaways: string[];
  quiz?: QuizQ[];
}

export const AGENDA = [
  { time: "0:00", mins: 10, title: "Why orchestration? The cost of unplanned downtime", where: "Overview", color: "#d946ef" },
  { time: "0:10", mins: 20, title: "Agents 101 → from one agent to many", where: "Modules 1–2", color: "#8b5cf6" },
  { time: "0:30", mins: 20, title: "Orchestration patterns", where: "Module 3", color: "#6366f1" },
  { time: "0:50", mins: 15, title: "The context layers: MCP & RAG", where: "Modules 5–6", color: "#10b981" },
  { time: "1:05", mins: 30, title: "LIVE: LangChain vs LangGraph vs CrewAI on the plant use case", where: "Industrial Demo", color: "#0ea5e9" },
  { time: "1:35", mins: 15, title: "Breaking it on purpose: fallback & recovery", where: "Module 4 + Demo scenarios", color: "#fb923c" },
  { time: "1:50", mins: 10, title: "Production checklist · Q&A with the AI assistant", where: "Modules 8–9", color: "#f59e0b" },
];

export const MODULES: Module[] = [
  {
    id: "foundations",
    emoji: "🧩",
    title: "Agents & Orchestration 101",
    subtitle: "What an agent really is, and what ‘orchestration’ adds",
    gradient: "from-violet-500 to-fuchsia-500",
    minutes: 10,
    sections: [
      {
        heading: "Anatomy of an AI agent",
        blocks: [
          { type: "text", text: "An AI agent is an LLM placed in a loop with the ability to use tools, keep memory and pursue a goal. It perceives (inputs, tool results), reasons (the LLM), acts (tool calls) and repeats until the goal is met or a limit is hit." },
          { type: "visual", name: "anatomy" },
          {
            type: "bullets",
            items: [
              "**Model (brain)** — reasons, plans, chooses tools. E.g. GPT-OSS 120B on Groq.",
              "**Tools (hands)** — functions/APIs the model can call: read sensors, query SAP, create work orders.",
              "**Knowledge (memory)** — RAG over documents + short-term (conversation) and long-term memory.",
              "**Instructions (role)** — system prompt, goals, constraints, output format.",
              "**Loop (autonomy)** — think → act → observe → repeat, with stop conditions and budgets.",
            ],
          },
        ],
      },
      {
        heading: "So what is AI orchestration?",
        blocks: [
          { type: "text", text: "Orchestration is the control layer that coordinates models, agents, tools, knowledge and humans to complete a multi-step goal reliably. It decides **who** does **what**, **when**, with **which context**, and **what happens when something fails**." },
          {
            type: "table",
            head: ["Responsibility", "Question it answers", "Plant example"],
            rows: [
              ["Planning / decomposition", "What sub-tasks achieve the goal?", "Diagnose → root cause → parts → schedule → safety → WO"],
              ["Routing / delegation", "Which agent or tool handles this?", "Vibration data → Sensor agent"],
              ["State management", "What do we know so far?", "findings, root_cause, parts, schedule"],
              ["Control flow", "In what order? In parallel? Loop?", "Parts & schedule in parallel; retry RAG if weak"],
              ["Resilience", "What if a step fails?", "SAP timeout → cache → alternate supplier"],
              ["Governance", "Is it safe, compliant, approved?", "LOTO guardrail + manager approval"],
              ["Observability", "What happened and why?", "Full trace in LangSmith / OTel"],
            ],
          },
          { type: "callout", tone: "tip", text: "Analogy for the audience: agents are musicians, MCP gives them instruments, RAG gives them the sheet music — and the orchestrator is the conductor keeping everyone in time." },
        ],
      },
    ],
    takeaways: ["Agent = model + tools + memory + instructions + loop", "Orchestration = planning, routing, state, control flow, resilience, governance, observability", "Without orchestration, multiple agents are just multiple chatbots"],
    quiz: [
      { q: "Which responsibility belongs to the orchestration layer rather than to an individual agent?", options: ["Generating fluent text", "Deciding which agent handles the next sub-task and what to do if it fails", "Embedding a document", "Tokenizing the prompt"], answer: 1, explain: "Routing, sequencing and failure handling across agents are core orchestration responsibilities." },
    ],
  },
  {
    id: "evolution",
    emoji: "🪜",
    title: "From One Agent to Many",
    subtitle: "The autonomy ladder and when to go multi-agent",
    gradient: "from-sky-500 to-indigo-500",
    minutes: 10,
    sections: [
      {
        heading: "The autonomy ladder",
        blocks: [
          { type: "visual", name: "ladder" },
          { type: "text", text: "Each rung adds autonomy *and* risk. Climb only as high as the problem requires — many production wins live on rungs 2–4." },
        ],
      },
      {
        heading: "When a single agent stops being enough",
        blocks: [
          {
            type: "bullets",
            items: [
              "**Too many tools** — beyond ~10–20 tools, tool selection accuracy drops; split by domain.",
              "**Conflicting instructions** — a ‘safety reviewer’ and a ‘speed optimiser’ in one prompt fight each other.",
              "**Different context needs** — the RCA agent needs manuals; the parts agent needs ERP — keep contexts small and focused.",
              "**Parallelism** — parts check and scheduling can run at the same time.",
              "**Separation of duties** — a reviewer agent should not grade its own work (compliance!).",
              "**Team ownership** — different teams own different agents and MCP servers.",
            ],
          },
          { type: "callout", tone: "warn", text: "Multi-agent is not free: more LLM calls, more latency, more cost, more failure points. Start with one well-tooled agent; split when you can name the reason." },
        ],
      },
      {
        heading: "Single vs multi-agent for our plant",
        blocks: [
          {
            type: "table",
            head: ["Aspect", "Single agent", "Multi-agent (supervisor)"],
            rows: [
              ["Tools in one prompt", "All 12 tools", "2–3 per specialist"],
              ["Context window", "Manuals + ERP + SOPs mixed", "Focused per agent"],
              ["Safety review", "Self-review (weak)", "Independent safety agent + guardrail"],
              ["Failure blast radius", "Whole run", "One specialist; orchestrator reroutes"],
              ["Latency / cost", "Lower", "Higher — justify with quality & safety"],
            ],
          },
        ],
      },
    ],
    takeaways: ["Climb the ladder only as far as needed", "Split agents for focus, safety and ownership — not for fashion", "Multi-agent needs an orchestrator; otherwise it's chaos"],
    quiz: [
      { q: "Which is the BEST reason to split one agent into several?", options: ["Multi-agent sounds more advanced", "The agent has 40 tools and conflicting goals (speed vs safety)", "To increase token usage", "Because LLMs can't call tools"], answer: 1, explain: "Tool overload and conflicting instructions are classic signals that specialisation will improve quality." },
    ],
  },
  {
    id: "patterns",
    emoji: "🕸️",
    title: "Orchestration Patterns",
    subtitle: "Nine patterns you will meet in every framework",
    gradient: "from-indigo-500 to-violet-500",
    minutes: 20,
    sections: [
      {
        heading: "Pattern gallery",
        blocks: [{ type: "visual", name: "patterns" }],
      },
      {
        heading: "Choosing a pattern",
        blocks: [
          {
            type: "table",
            head: ["If your workflow…", "Use", "Framework fit"],
            rows: [
              ["is a fixed series of steps", "Sequential / pipeline", "LangChain chains, CrewAI sequential"],
              ["classifies and dispatches requests", "Router", "LangGraph conditional edges, CrewAI Flow @router"],
              ["has independent sub-tasks", "Parallel fan-out / fan-in", "LangGraph Send API, async tasks in CrewAI"],
              ["needs dynamic delegation", "Supervisor", "LangGraph supervisor, CrewAI hierarchical"],
              ["spans multiple departments", "Hierarchical (teams of teams)", "LangGraph sub-graphs, nested crews"],
              ["is long and plannable up front", "Plan-and-execute", "LangGraph plan/execute/replan"],
              ["needs quality iteration", "Evaluator–optimizer (reflection)", "LangGraph loops, CrewAI guardrails"],
              ["is conversational between specialists", "Network / handoffs (swarm)", "LangGraph swarm, OpenAI Agents SDK handoffs"],
              ["shares a knowledge workspace", "Blackboard / shared state", "LangGraph typed state, CrewAI memory"],
            ],
          },
          { type: "callout", tone: "info", text: "Our plant demo combines four patterns: supervisor (routing), parallel (parts + schedule), evaluator–optimizer (safety reflection), and human-in-the-loop approval." },
        ],
      },
    ],
    takeaways: ["Patterns are framework-independent — frameworks are just implementations", "Real systems compose several patterns", "Prefer deterministic patterns where the process is known; LLM routing where it isn't"],
    quiz: [
      { q: "A safety agent critiques a maintenance plan and sends it back for revision up to 2 times. Which pattern is this?", options: ["Router", "Evaluator–optimizer (reflection)", "Fan-out", "Blackboard"], answer: 1, explain: "A generator + evaluator loop with bounded iterations is the evaluator–optimizer / reflection pattern." },
    ],
  },
  {
    id: "resilience",
    emoji: "🛟",
    title: "Fallback, Recovery & Self-Correction",
    subtitle: "How orchestrators fail gracefully and regain the right decision",
    gradient: "from-orange-500 to-rose-500",
    minutes: 15,
    sections: [
      {
        heading: "Defense in depth",
        blocks: [
          { type: "visual", name: "defense" },
          { type: "text", text: "Fallback answers *‘what do we do instead?’*; recovery answers *‘how do we get back to a correct, trusted decision?’*. Good orchestrators detect failure early, degrade gracefully, and make the degradation visible." },
        ],
      },
      {
        heading: "Failure → detection → fallback → recovery",
        blocks: [
          {
            type: "table",
            head: ["Failure", "How it's detected", "Fallback", "Recovery / regain"],
            rows: [
              ["LLM rate-limit / outage", "HTTP 429/5xx, timeout", "Retry w/ jitter → backup model/provider", "Resume from checkpoint; log failover"],
              ["Tool / MCP server down", "Timeout, error result", "Backoff retries → circuit breaker → cache / alt server", "Tag data provenance; re-verify later"],
              ["Weak retrieval", "Relevance grader score < threshold", "Query rewrite, filters, web/alt corpus", "Re-grade; answer only when grounded"],
              ["Hallucination / unsafe plan", "Guardrail, policy check, LLM-as-judge", "Block + structured critique", "Reflection loop (bounded) → re-check"],
              ["Invalid output format", "Schema validation (Pydantic)", "Re-ask with the validation error", "Typed state stays consistent"],
              ["Agent loops forever", "Step / token / cost budget", "Stop, summarise, escalate", "Human takes over with full trace"],
              ["Low confidence decision", "Confidence < threshold", "Escalate to human-in-the-loop", "Human decision written back to state"],
            ],
          },
        ],
      },
      {
        heading: "Framework mechanics",
        blocks: [
          {
            type: "code",
            title: "LangGraph — retry policy, error edge and bounded reflection",
            code: `from langgraph.types import RetryPolicy

g.add_node("parts", parts_agent,
           retry_policy=RetryPolicy(max_attempts=3, initial_interval=1.0, backoff_factor=2.0))

def stock_ok(state) -> str:
    return "fallback" if state.get("parts_error") else "ok"

g.add_conditional_edges("parts", stock_ok, {"ok": "supervisor", "fallback": "alt_supplier"})

def check_policy(state) -> str:
    if state["safety"]["verdict"] == "PASS":
        return "pass"
    return "violation" if state["revisions"] < 2 else "escalate"   # bounded!`,
          },
          {
            type: "code",
            title: "LangChain — model fallback & tool retry as middleware",
            code: `agent = create_agent(
    model="groq:openai/gpt-oss-120b",
    tools=tools,
    middleware=[
        ModelFallbackMiddleware("groq:openai/gpt-oss-20b"),
        ToolRetryMiddleware(max_retries=3, backoff_factor=2.0),
        ModelCallLimitMiddleware(run_limit=25),          # stop runaway loops
    ],
)`,
          },
          {
            type: "code",
            title: "CrewAI — task guardrail with retries",
            code: `def validate_loto(output) -> tuple[bool, Any]:
    text = output.raw.lower()
    if "lockout" not in text or "zero energy" not in text:
        return (False, "Plan must include LOTO and zero-energy verification (SOP-MNT-022)")
    return (True, output)

review = Task(description="Safety review of the maintenance plan", agent=safety_officer,
              expected_output="Approved plan with citations",
              guardrail=validate_loto, guardrail_max_retries=2)`,
          },
        ],
      },
    ],
    takeaways: ["Every fallback must be bounded (retries, revisions, budgets)", "Degrade gracefully and record provenance", "Recovery = change strategy + verify again, not just ‘try again’", "Humans are the final fallback — give them the trace"],
    quiz: [
      { q: "SAP's MCP server times out three times in a row. What should a well-designed orchestrator do next?", options: ["Keep retrying forever", "Open a circuit breaker and switch to a cached / alternate data source, flagging provenance", "Let the LLM guess the stock level", "Crash the run"], answer: 1, explain: "Bounded retries → circuit breaker → graceful degradation with transparent provenance." },
    ],
  },
  {
    id: "mcp",
    emoji: "🔌",
    title: "MCP — Model Context Protocol",
    subtitle: "The universal adapter between agents and enterprise systems",
    gradient: "from-emerald-500 to-teal-500",
    minutes: 8,
    sections: [
      {
        heading: "Architecture",
        blocks: [
          { type: "visual", name: "mcp" },
          {
            type: "bullets",
            items: [
              "**Host** — the AI application (your orchestrator, Claude Desktop, an IDE).",
              "**Client** — lives in the host; one connection per server; speaks JSON-RPC 2.0.",
              "**Server** — wraps a system (SCADA, SAP, Maximo, Teams) and exposes capabilities.",
              "**Primitives** — *Tools* (actions the model calls), *Resources* (data the app reads), *Prompts* (reusable templates). Clients can also offer *sampling* and *elicitation*.",
              "**Transports** — stdio for local processes; Streamable HTTP for remote servers (with OAuth-based authorization).",
            ],
          },
        ],
      },
      {
        heading: "Why MCP is critical for orchestration",
        blocks: [
          {
            type: "table",
            head: ["Without MCP", "With MCP"],
            rows: [
              ["N agents × M systems = N×M custom integrations", "N clients + M servers = N+M"],
              ["Each framework re-implements SAP access", "One SAP MCP server works with LangChain, LangGraph, CrewAI…"],
              ["Credentials sprinkled across agent code", "Auth, rate limits and audit live in the server"],
              ["Static tool lists", "Dynamic discovery via tools/list"],
              ["Hard to swap frameworks", "Framework-agnostic tool layer"],
            ],
          },
          {
            type: "code",
            title: "A minimal SAP stock MCP server (Python SDK · FastMCP)",
            code: `from mcp.server.fastmcp import FastMCP

mcp = FastMCP("sap-erp")

@mcp.tool()
def check_stock(part: str, plant: str = "CHN1") -> dict:
    """Return on-hand quantity and bin location for a material in a plant."""
    row = sap_client.get_stock(material=part, plant=plant)    # your SAP OData / RFC call
    return {"part": part, "plant": plant, "qty": row.qty, "bin": row.bin}

@mcp.resource("sap://plants/{plant}/policy")
def procurement_policy(plant: str) -> str:
    return load_policy(plant)

if __name__ == "__main__":
    mcp.run(transport="streamable-http")`,
          },
          { type: "callout", tone: "warn", text: "Security: treat MCP servers like any production API — least-privilege scopes, allow-listed tools per agent, input validation, human approval for destructive actions, and watch for tool-description prompt injection (‘tool poisoning’)." },
        ],
      },
    ],
    takeaways: ["MCP standardises how agents reach tools & data", "It turns N×M integrations into N+M", "It makes the tool layer framework-agnostic — the same servers power all three demos"],
    quiz: [
      { q: "In MCP, which primitive represents an action the model can invoke, like create_work_order?", options: ["Resource", "Prompt", "Tool", "Sampling"], answer: 2, explain: "Tools are model-controlled actions; resources are application-controlled data; prompts are user-controlled templates." },
    ],
  },
  {
    id: "rag",
    emoji: "📚",
    title: "RAG — Retrieval-Augmented Generation",
    subtitle: "Grounding agents in plant knowledge, from naive to agentic RAG",
    gradient: "from-amber-500 to-orange-500",
    minutes: 8,
    sections: [
      {
        heading: "The pipeline",
        blocks: [
          { type: "visual", name: "rag" },
          {
            type: "bullets",
            items: [
              "**Ingest** — OEM manuals, SOPs, OSHA/ISO standards, 12k past work orders; parse tables & diagrams.",
              "**Chunk** — by structure (section/heading), 300–800 tokens with overlap; keep metadata (asset model, doc type, revision).",
              "**Embed & index** — vector DB (pgvector, Qdrant, Weaviate, Pinecone…) + keyword index for hybrid search.",
              "**Retrieve** — hybrid (BM25 + vector) with metadata filters; top-k 20.",
              "**Re-rank** — cross-encoder reduces to the best 3–5 chunks.",
              "**Generate with citations** — answer only from context; cite the source section.",
            ],
          },
        ],
      },
      {
        heading: "Agentic RAG variants",
        blocks: [
          {
            type: "table",
            head: ["Variant", "Idea", "When to use"],
            rows: [
              ["Naive RAG", "Retrieve once, then generate", "Simple FAQ"],
              ["Corrective RAG (CRAG)", "Grade retrieved docs; if weak → rewrite query / alt source", "High-stakes answers (our demo)"],
              ["Self-RAG", "Model reflects on whether to retrieve and whether its answer is supported", "Mixed knowledge questions"],
              ["Adaptive RAG", "Route by question type: no retrieval / single / multi-step", "Varied workloads"],
              ["GraphRAG", "Knowledge graph of entities & relations + community summaries", "‘Which lines share this bearing supplier?’"],
              ["Agentic RAG", "An agent decides when, where and how to retrieve, as a tool", "Multi-source enterprise knowledge"],
            ],
          },
          { type: "callout", tone: "info", text: "Measure it: faithfulness, answer relevance, context precision and context recall (e.g. RAGAS / LLM-as-judge). In our demo the grader threshold is 0.70." },
        ],
      },
    ],
    takeaways: ["RAG = plant-specific, citable memory for agents", "Quality gates (grading) turn RAG into a self-correcting loop", "No RAG → fluent hallucinations of specs and procedures"],
    quiz: [
      { q: "In Corrective RAG, what happens when the grader marks retrieved chunks as irrelevant?", options: ["Answer anyway", "Rewrite the query and/or use an alternate source, then retrieve again", "Delete the vector DB", "Increase temperature"], answer: 1, explain: "CRAG adds a quality gate: weak context triggers query rewriting or alternative retrieval before answering." },
    ],
  },
  {
    id: "frameworks",
    emoji: "🧰",
    title: "Agentic AI Frameworks",
    subtitle: "LangChain · LangGraph · CrewAI — and the wider landscape",
    gradient: "from-teal-500 to-sky-500",
    minutes: 15,
    sections: [
      {
        heading: "The big three in this session",
        blocks: [
          { type: "visual", name: "frameworks" },
          { type: "callout", tone: "tip", text: "Open the Industrial Demo and switch frameworks with the same scenario — the architecture stays the same; only the orchestration internals change. That's the key insight: MCP and RAG are shared layers, orchestration style is the choice." },
        ],
      },
      {
        heading: "The wider landscape",
        blocks: [
          {
            type: "table",
            head: ["Framework", "Orchestration style", "Notable for"],
            rows: [
              ["LangChain", "Agent loop + middleware", "Integrations, fast start"],
              ["LangGraph", "Stateful graphs", "Durable, controllable, HITL"],
              ["CrewAI", "Role-based crews + Flows", "Intuitive multi-agent teams"],
              ["Microsoft Agent Framework / AutoGen", "Conversational multi-agent + workflows", "Group chat, .NET & Python, Azure"],
              ["OpenAI Agents SDK", "Agents + handoffs + guardrails", "Lightweight handoff orchestration"],
              ["LlamaIndex (Workflows)", "Event-driven steps", "Document-heavy RAG agents"],
              ["Google ADK", "Hierarchical agents, workflow agents", "Gemini / Vertex ecosystem, A2A"],
              ["Pydantic AI", "Typed agents & graphs", "Type safety, structured outputs"],
            ],
          },
          { type: "text", text: "Beyond MCP (agent ↔ tool), the **A2A (Agent2Agent) protocol** standardises agent ↔ agent communication across vendors — useful when your CrewAI crew must talk to a partner's agent." },
        ],
      },
    ],
    takeaways: ["Choose by control needs: implicit (LangChain), explicit (LangGraph), role-based (CrewAI)", "MCP + RAG are reusable across all frameworks", "Protocols (MCP, A2A) reduce framework lock-in"],
    quiz: [
      { q: "Your plant needs auditable, deterministic control flow with resumable human approvals. Which framework fits best?", options: ["LangGraph", "A single prompt", "Spreadsheet macros", "None — use RAG only"], answer: 0, explain: "LangGraph's explicit graph, checkpointers and interrupt() target exactly this." },
    ],
  },
  {
    id: "ops",
    emoji: "🔭",
    title: "Observability, Evaluation & Governance",
    subtitle: "You can't orchestrate what you can't see",
    gradient: "from-pink-500 to-rose-500",
    minutes: 5,
    sections: [
      {
        heading: "What to instrument",
        blocks: [
          {
            type: "bullets",
            items: [
              "**Traces** — every LLM call, tool call, retrieval and state transition (LangSmith, Langfuse, Arize Phoenix, OpenTelemetry GenAI conventions).",
              "**Metrics** — latency per node, tokens & cost per run, tool error rate, fallback rate, human-override rate.",
              "**Quality evals** — offline datasets + online LLM-as-judge: faithfulness, task success, safety.",
              "**Guardrails** — input (prompt injection, PII), output (policy, toxicity, schema), action (approval for destructive tools).",
              "**Audit** — who approved what, with which evidence — essential in regulated plants.",
            ],
          },
          {
            type: "table",
            head: ["KPI", "Target (example)", "Why"],
            rows: [
              ["Task success rate", "> 90%", "Business value"],
              ["Grounded answer rate (citations)", "> 95%", "Trust & safety"],
              ["Fallback rate", "< 10% of runs", "Rising = upstream health issue"],
              ["Human override rate", "Trending down", "Agent quality improving"],
              ["Cost per incident", "< ₹150", "Economics"],
            ],
          },
        ],
      },
    ],
    takeaways: ["Trace everything, evaluate continuously", "Fallback rate is a health signal, not just a safety net", "Governance = guardrails + approvals + audit trail"],
  },
  {
    id: "production",
    emoji: "🚀",
    title: "Production Checklist & Anti-patterns",
    subtitle: "Taking orchestration from demo to plant floor",
    gradient: "from-lime-500 to-emerald-500",
    minutes: 5,
    sections: [
      {
        heading: "Checklist",
        blocks: [
          {
            type: "bullets",
            items: [
              "✅ Clear goal, success criteria and stop conditions per run",
              "✅ Typed shared state & structured outputs (Pydantic / JSON schema)",
              "✅ Per-node timeouts, bounded retries, circuit breakers, budgets",
              "✅ Model fallback chain across providers",
              "✅ MCP servers with least-privilege auth & allow-listed tools",
              "✅ RAG with metadata, hybrid search, re-ranking and grading",
              "✅ Guardrails on input, output and actions",
              "✅ Human-in-the-loop for irreversible / high-risk actions",
              "✅ Checkpointing for resume & replay",
              "✅ Tracing, evals, dashboards and on-call runbooks",
            ],
          },
        ],
      },
      {
        heading: "Anti-patterns",
        blocks: [
          {
            type: "table",
            head: ["Anti-pattern", "Symptom", "Fix"],
            rows: [
              ["Agent soup", "8 agents chatting, nobody owns the outcome", "Supervisor or explicit graph; fewer agents"],
              ["Infinite reflection", "Costs explode, no convergence", "Max iterations + escalate"],
              ["Silent fallback", "Degraded answers look normal", "Record provenance; show caveats"],
              ["Prompt-only safety", "‘Please be safe’ in the system prompt", "Deterministic guardrails + approvals"],
              ["RAG without evaluation", "Retrieval drift unnoticed", "Grader + offline eval set"],
              ["God-tool", "One tool that can do anything in SAP", "Narrow, purpose-specific MCP tools"],
            ],
          },
        ],
      },
    ],
    takeaways: ["Reliability is designed in, not prompted in", "Narrow tools, bounded loops, visible fallbacks", "Humans for high-risk actions"],
  },
];

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Agent", def: "An LLM in a loop with tools, memory and a goal." },
  { term: "Orchestrator / Supervisor", def: "Component that plans, routes and coordinates agents and handles failures." },
  { term: "MCP", def: "Model Context Protocol — open standard for connecting AI apps to tools, resources and prompts via JSON-RPC." },
  { term: "A2A", def: "Agent2Agent protocol — open standard for agents from different vendors to communicate." },
  { term: "RAG", def: "Retrieval-Augmented Generation — fetch relevant knowledge and give it to the model as context." },
  { term: "Corrective RAG", def: "RAG with a grader that triggers query rewriting / alternate retrieval when context is weak." },
  { term: "Checkpointer", def: "Persists graph state after each step so runs can pause, resume and be replayed." },
  { term: "Human-in-the-loop (HITL)", def: "Pausing the workflow for a human decision before continuing." },
  { term: "Guardrail", def: "Deterministic or model-based check that blocks or modifies unsafe inputs, outputs or actions." },
  { term: "Circuit breaker", def: "Stops calling a failing dependency for a cool-down period to prevent cascading failures." },
  { term: "Reflection", def: "Evaluator critiques an output and the generator revises it, within a bounded loop." },
  { term: "Handoff", def: "One agent transfers control (and context) to another agent." },
  { term: "LLM-as-judge", def: "Using a model to score outputs for faithfulness, relevance or safety." },
  { term: "LOTO", def: "Lockout/Tagout — OSHA 1910.147 energy-isolation procedure for maintenance." },
];
