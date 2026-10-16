import type { Deck } from "./types";

const O = "#fb923c";
const R = "#f43f5e";
const S = "#0ea5e9";
const G = "#10b981";
const A = "#f59e0b";
const V = "#8b5cf6";
const P = "#d946ef";

export const crewaiDeck: Deck = {
  id: "crewai",
  title: "CrewAI",
  subtitle: "Role-playing agent crews + event-driven Flows",
  emoji: "👥",
  gradient: "from-orange-500 to-rose-500",
  accent: O,
  slides: [
    {
      layout: "title",
      kicker: "Deck 3 · Agentic AI frameworks",
      title: "CrewAI",
      subtitle: "Orchestrate teams of role-playing agents — with Flows for precise control",
      emoji: "👥",
      chips: ["Open source · MIT", "Python", "Standalone (not built on LangChain)", "Crews = autonomy", "Flows = control", "CrewAI AMP (enterprise)"],
      notes:
        "CrewAI (founded by João Moura) models multi-agent systems like a human team: agents have a role, goal and backstory; tasks have expected outputs; a crew runs them under a process. Flows were added for deterministic, event-driven orchestration around crews.",
    },
    {
      kicker: "Mental model",
      title: "Agents · Tasks · Crew · Process",
      cards: [
        { title: "Agent", sub: "who", body: "role, goal, backstory, tools, llm, memory, allow_delegation, max_iter, max_rpm", color: S, emoji: "🧑‍🔧" },
        { title: "Task", sub: "what", body: "description, expected_output, agent, context (other tasks), output_pydantic, guardrail, human_input, async_execution", color: G, emoji: "📋" },
        { title: "Crew", sub: "the team", body: "agents + tasks + process, memory, knowledge_sources, planning, manager_llm", color: O, emoji: "👥" },
        { title: "Process", sub: "how", body: "sequential (task order) or hierarchical (a manager agent plans, delegates and validates)", color: V, emoji: "🎼" },
      ],
      cols: 4,
      bullets: [
        "Very **intuitive for business stakeholders** — you describe a team, not a state machine.",
        "Task outputs flow into later tasks as **context** — that's the shared state of a crew.",
      ],
      notes: "Ask the audience to map our plant team: Vibration Analyst, Reliability Engineer, Procurement Specialist, Maintenance Planner, Safety Officer.",
    },
    {
      kicker: "Project structure",
      title: "YAML-first crews with @CrewBase",
      bullets: [
        "`crewai create crew plant_maintenance` scaffolds a project.",
        "**config/agents.yaml** & **config/tasks.yaml** keep prompts out of code — domain experts can edit them.",
        "`crew.py` wires them up with decorators; `crewai run` executes.",
      ],
      code: {
        title: "agents.yaml  +  crew.py",
        code: `reliability_engineer:
  role: Reliability Engineer
  goal: Find the root cause of {machine} anomalies using manuals and history
  backstory: 15 years maintaining DMG MORI machining centres.

@CrewBase
class PlantMaintenanceCrew:
    agents_config = "config/agents.yaml"
    tasks_config = "config/tasks.yaml"

    @agent
    def reliability_engineer(self) -> Agent:
        return Agent(config=self.agents_config["reliability_engineer"],
                     knowledge_sources=[oem_manuals], llm=llm)

    @task
    def root_cause_task(self) -> Task:
        return Task(config=self.tasks_config["root_cause_task"],
                    output_pydantic=RootCause)

    @crew
    def crew(self) -> Crew:
        return Crew(agents=self.agents, tasks=self.tasks,
                    process=Process.sequential, memory=True)`,
      },
    },
    {
      kicker: "Processes",
      title: "Sequential vs hierarchical",
      flow: [
        { label: "Sequential", color: G, steps: ["Diagnose (Analyst)", "Root cause (Reliability)", "Source parts (Procurement)", "Schedule (Planner)", "Review (Safety)"] },
        { label: "Hierarchical", color: V, steps: ["Manager LLM plans", "delegates task → best agent", "validates output", "re-delegates if weak", "assembles final result"] },
      ],
      table: {
        head: ["", "Sequential", "Hierarchical"],
        rows: [
          ["Who orders work", "Task list order", "Manager agent (manager_llm or custom manager_agent)"],
          ["Predictability", "High", "Medium — LLM-driven delegation"],
          ["Cost / latency", "Lower", "Higher (extra manager calls)"],
          ["Best for", "Known pipelines", "Open-ended goals, dynamic delegation"],
        ],
      },
    },
    {
      kicker: "Control",
      title: "Flows: event-driven orchestration",
      bullets: [
        "`@start()` entry points, `@listen(step)` reactions, `@router(step)` branching with labels.",
        "`or_(...)` / `and_(...)` to join multiple events.",
        "**Structured state** (Pydantic) shared across steps; `@persist` for resumable flows.",
        "Steps can call plain Python, a single LLM call, an Agent — or kick off a whole **Crew**.",
      ],
      code: {
        title: "Plant incident flow",
        code: `from crewai.flow.flow import Flow, start, listen, router
from pydantic import BaseModel

class IncidentState(BaseModel):
    alert: dict = {}
    severity: str = ""
    plan: str = ""

class IncidentFlow(Flow[IncidentState]):
    @start()
    def triage(self):
        self.state.severity = classify(self.state.alert)

    @router(triage)
    def route(self):
        return "critical" if self.state.severity == "HIGH" else "routine"

    @listen("critical")
    def run_maintenance_crew(self):
        out = PlantMaintenanceCrew().crew().kickoff(inputs=self.state.alert)
        self.state.plan = out.raw

    @listen("routine")
    def log_ticket(self):
        cmms.create_ticket(self.state.alert)

IncidentFlow().kickoff(inputs={"alert": alert})`,
      },
      notes: "Key insight: Crews give agency, Flows give control. Production CrewAI apps typically use a Flow as the backbone with crews inside specific steps.",
    },
    {
      kicker: "MCP & tools",
      title: "Tools, MCP and knowledge",
      cards: [
        { title: "crewai-tools", body: "Ready-made: web search, scraping, file/dir read, code interpreter, many RAG search tools (PDF, CSV, DOCX, website…).", color: G, emoji: "🧰" },
        { title: "Custom tools", body: "Subclass BaseTool (with args_schema) or use the @tool decorator. Caching & usage limits per tool.", color: S, emoji: "🔧" },
        { title: "MCP", body: "MCPServerAdapter connects stdio, SSE or Streamable HTTP MCP servers and exposes their tools to agents.", color: P, emoji: "🔌" },
        { title: "Knowledge", body: "knowledge_sources on Agent or Crew: strings, text, PDF, CSV, Excel, JSON — chunked, embedded and retrieved automatically (RAG).", color: A, emoji: "📚" },
      ],
      cols: 4,
      code: {
        code: `from crewai_tools import MCPServerAdapter
from crewai.knowledge.source.pdf_knowledge_source import PDFKnowledgeSource

with MCPServerAdapter({"url": "http://sap-mcp:8000/mcp", "transport": "streamable-http"}) as sap_tools:
    procurement = Agent(role="Procurement Specialist", goal="Secure spare parts",
                        backstory="Knows SAP MM", tools=sap_tools)

safety = Agent(role="Safety Officer", goal="Enforce LOTO", backstory="Plant EHS lead",
               knowledge_sources=[PDFKnowledgeSource(file_paths=["SOP-MNT-022.pdf"])])`,
      },
    },
    {
      kicker: "Memory",
      title: "Crew memory system",
      cards: [
        { title: "Short-term", body: "Recent interactions & task outputs of the current run (RAG over recent context).", color: S, emoji: "⏱️" },
        { title: "Long-term", body: "Learnings and task results persisted across runs → crews improve over time.", color: V, emoji: "🗄️" },
        { title: "Entity", body: "Facts about people, assets, suppliers (e.g. ‘CNC-07’, ‘SKF distributor’).", color: A, emoji: "🏷️" },
        { title: "Contextual", body: "Combines the above to give each agent the most relevant context per task.", color: G, emoji: "🧩" },
      ],
      cols: 4,
      bullets: ["Enable with `Crew(memory=True)`; configure the **embedder** (OpenAI, Ollama, Google, Azure…) for private deployments.", "External memory providers (e.g. Mem0) can be plugged in."],
    },
    {
      kicker: "Reliability",
      title: "Guardrails, retries & structured outputs",
      bullets: [
        "**Task guardrails** — a function (or LLM-based check) validates output; on failure the agent retries with feedback (`guardrail_max_retries`).",
        "**output_pydantic / output_json** — typed results downstream code can trust.",
        "**max_iter, max_rpm, max_execution_time, max_retry_limit** — bound loops, rate and time.",
        "**planning=True** — an AgentPlanner drafts a step plan before the crew runs.",
        "**human_input=True** — human review before a task is accepted.",
      ],
      code: {
        title: "Guardrail = fallback + recovery",
        code: `def validate_loto(output) -> tuple[bool, Any]:
    t = output.raw.lower()
    if "lockout" not in t or "zero energy" not in t:
        return (False, "Add LOTO + zero-energy verification per SOP-MNT-022")
    return (True, output)

review = Task(
    description="Safety-review the maintenance plan",
    expected_output="Approved plan with SOP citations",
    agent=safety,
    guardrail=validate_loto,
    guardrail_max_retries=2,
    human_input=True,
)`,
      },
    },
    {
      kicker: "Operate",
      title: "CLI, observability & enterprise",
      cards: [
        { title: "CLI", body: "crewai create · run · train (human feedback iterations) · test (evaluate N runs) · replay (from a task) · reset-memories", color: O, emoji: "⌨️" },
        { title: "Observability", body: "Built-in tracing plus integrations: Langfuse, Arize Phoenix, MLflow, Weave, AgentOps, OpenTelemetry…", color: R, emoji: "🔭" },
        { title: "CrewAI AMP", body: "Enterprise platform: deploy crews/flows as APIs, monitoring, RBAC, visual studio, triggers.", color: V, emoji: "🏢" },
        { title: "LLMs", body: "LiteLLM-backed: Groq, OpenAI, Anthropic, Gemini, Bedrock, Azure, Ollama… e.g. LLM(model=\"groq/openai/gpt-oss-120b\").", color: G, emoji: "🧠" },
      ],
      cols: 4,
    },
    {
      kicker: "Decision guide",
      title: "When to choose CrewAI",
      table: {
        head: ["✅ Great for", "⚠️ Think twice when"],
        rows: [
          ["Business processes that map to human roles", "You need fine-grained, deterministic branching (use Flows or LangGraph)"],
          ["Fast multi-agent POCs non-developers can read", "Token budget is tight (role prompts are verbose)"],
          ["Content, research, analysis and back-office crews", "Strict audit of every transition is mandatory"],
          ["Flows + crews for structured production apps", "You need sub-second latency"],
        ],
      },
      bullets: ["**Rule of thumb:** Flow as the backbone, Crews for the parts that benefit from collaborative autonomy."],
    },
  ],
};
