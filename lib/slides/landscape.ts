import type { Deck } from "./types";

const V = "#8b5cf6";
const I = "#6366f1";
const S = "#0ea5e9";
const C = "#06b6d4";
const G = "#10b981";
const L = "#84cc16";
const A = "#f59e0b";
const O = "#fb923c";
const R = "#f43f5e";
const P = "#d946ef";
const Z = "#64748b";

export const landscapeDeck: Deck = {
  id: "landscape",
  title: "The Agentic AI Landscape",
  subtitle: "Other frameworks, platforms, protocols & methodologies",
  emoji: "🌐",
  gradient: "from-sky-500 via-cyan-500 to-lime-500",
  accent: C,
  slides: [
    {
      layout: "title",
      kicker: "Deck 4 · 360° view",
      title: "Beyond LangChain, LangGraph & CrewAI",
      subtitle: "The wider agentic AI landscape — frameworks, vendor SDKs, platforms, protocols and the methodologies underneath them all",
      emoji: "🌐",
      chips: ["30+ frameworks & platforms", "Protocols: MCP · A2A · AG-UI", "Reasoning methodologies", "Multi-agent coordination", "Evaluation & AgentOps", "How to choose"],
      notes:
        "Goal of this deck: participants leave with a mental map. Frameworks change fast; the underlying methodologies (ReAct, supervisor, reflection, RAG, MCP) do not. Teach the map, not the hype.",
    },
    {
      kicker: "Landscape map · 1/2",
      title: "Frameworks & SDKs (code-first)",
      cards: [
        { title: "Orchestration frameworks", emoji: "🕸️", color: V, tags: ["LangGraph", "CrewAI", "Microsoft Agent Framework", "AutoGen / AG2", "LlamaIndex Workflows", "Haystack"] },
        { title: "Vendor agent SDKs", emoji: "🏢", color: S, tags: ["OpenAI Agents SDK", "Google ADK", "AWS Strands Agents", "Claude Agent SDK", "Semantic Kernel"] },
        { title: "Lightweight & typed", emoji: "🪶", color: G, tags: ["Pydantic AI", "smolagents", "Agno", "DSPy", "Atomic Agents"] },
        { title: "TypeScript-first", emoji: "🟦", color: C, tags: ["Mastra", "Vercel AI SDK", "LangGraph.js", "OpenAI Agents SDK (JS)", "Genkit"] },
        { title: "Memory specialists", emoji: "🧠", color: A, tags: ["Letta (MemGPT)", "Mem0", "Zep / Graphiti"] },
        { title: "Research & role-play", emoji: "🔬", color: P, tags: ["MetaGPT", "CAMEL", "ChatDev", "OpenHands", "AutoGPT"] },
      ],
      cols: 3,
      notes: "Don't go deep here — this is the map. Next slides zoom into the most important ones.",
    },
    {
      kicker: "Landscape map · 2/2",
      title: "Platforms, protocols & tooling",
      cards: [
        { title: "Low-code / visual builders", emoji: "🧩", color: O, tags: ["n8n", "Langflow", "Flowise", "Dify", "Microsoft Copilot Studio", "Zapier Agents"] },
        { title: "Managed cloud agent services", emoji: "☁️", color: S, tags: ["Amazon Bedrock AgentCore", "Bedrock Agents", "Vertex AI Agent Engine", "Azure AI Foundry Agent Service"] },
        { title: "Enterprise agent platforms", emoji: "🏭", color: I, tags: ["Salesforce Agentforce", "ServiceNow AI Agents", "IBM watsonx Orchestrate", "UiPath Agentic Automation", "SAP Joule Agents"] },
        { title: "Interoperability protocols", emoji: "🔌", color: G, tags: ["MCP (agent ↔ tools)", "A2A (agent ↔ agent)", "AG-UI (agent ↔ UI)"] },
        { title: "Observability & evaluation", emoji: "🔭", color: R, tags: ["LangSmith", "Langfuse", "Arize Phoenix", "W&B Weave", "AgentOps", "RAGAS", "DeepEval", "Promptfoo"] },
        { title: "Guardrails & safety", emoji: "🛡️", color: L, tags: ["NVIDIA NeMo Guardrails", "Guardrails AI", "Llama Guard", "Prompt shields / injection filters"] },
      ],
      cols: 3,
    },
    {
      kicker: "Microsoft",
      title: "AutoGen → Microsoft Agent Framework",
      bullets: [
        "**AutoGen** (Microsoft Research) popularised **conversational multi-agent**: agents talk in a group chat until a termination condition.",
        "Teams: `RoundRobinGroupChat`, `SelectorGroupChat` (LLM picks next speaker), `Swarm` (handoffs), **Magentic-One** (orchestrator with task & progress ledgers).",
        "**Microsoft Agent Framework** unifies AutoGen's agent abstractions with **Semantic Kernel**'s enterprise features: Python & .NET, graph-based **workflows** with checkpointing & HITL, MCP/A2A, OpenTelemetry.",
        "**AG2** — community-driven continuation of the original AutoGen 0.2 API.",
      ],
      code: {
        title: "AutoGen AgentChat — selector group chat",
        code: `from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import SelectorGroupChat
from autogen_agentchat.conditions import TextMentionTermination

analyst = AssistantAgent("analyst", model_client=client,
    tools=[read_sensor_history],
    system_message="Diagnose machine vibration anomalies.")
planner = AssistantAgent("planner", model_client=client,
    tools=[find_window], system_message="Plan maintenance.")
safety = AssistantAgent("safety", model_client=client,
    system_message="Check LOTO. Say APPROVED when safe.")

team = SelectorGroupChat(
    [analyst, planner, safety],
    model_client=client,                 # LLM chooses next speaker
    termination_condition=TextMentionTermination("APPROVED"),
)
await team.run(task="CNC-07 spindle vibration 11.2 mm/s")`,
      },
      notes: "Orchestration style = conversation. Flexible and great for exploration; for production control, the Agent Framework's workflows add explicit graphs.",
    },
    {
      kicker: "OpenAI",
      title: "OpenAI Agents SDK",
      bullets: [
        "Minimal primitives: **Agents**, **Handoffs**, **Guardrails**, **Sessions**, built-in **Tracing**.",
        "Orchestration via **handoffs** (an agent transfers the conversation) or **agents-as-tools** (manager keeps control).",
        "Input/output guardrails run in parallel and can trip a wire to stop the run.",
        "Python & TypeScript; works with non-OpenAI models via LiteLLM / any OpenAI-compatible endpoint (e.g. Groq). Production successor of Swarm.",
      ],
      code: {
        title: "Triage with handoffs + guardrail",
        code: `from agents import Agent, Runner, function_tool, input_guardrail, GuardrailFunctionOutput

@function_tool
def check_stock(part: str) -> dict:
    return sap.stock(part)

parts = Agent(name="Parts", instructions="Secure spare parts.", tools=[check_stock])
safety = Agent(name="Safety", instructions="Enforce LOTO SOP-MNT-022.")

@input_guardrail
async def plant_only(ctx, agent, text):
    off_topic = "machine" not in str(text).lower()
    return GuardrailFunctionOutput(output_info=None, tripwire_triggered=off_topic)

triage = Agent(name="Triage",
               instructions="Route maintenance incidents to the right specialist.",
               handoffs=[parts, safety],
               input_guardrails=[plant_only])

result = await Runner.run(triage, "CNC-07 bearing needs replacement — parts?")
print(result.final_output)`,
      },
    },
    {
      kicker: "Google",
      title: "Google Agent Development Kit (ADK)",
      bullets: [
        "Code-first, model-agnostic (optimised for Gemini). Python, Java and more.",
        "**LlmAgent** for reasoning + **workflow agents** for deterministic control: `SequentialAgent`, `ParallelAgent`, `LoopAgent`.",
        "Multi-agent hierarchies via `sub_agents`, LLM-driven transfer, or `AgentTool` (agent as a tool).",
        "Shared session **state** (`output_key`), callbacks for guardrails, built-in eval, dev UI; deploy to **Vertex AI Agent Engine** / Cloud Run; native **A2A**.",
      ],
      code: {
        title: "Deterministic pipeline of LLM agents",
        code: `from google.adk.agents import LlmAgent, SequentialAgent, ParallelAgent, LoopAgent

sensor = LlmAgent(name="sensor", model="gemini-2.5-flash",
                  instruction="Diagnose the alert using tools.",
                  tools=[read_sensor_history], output_key="findings")
parts  = LlmAgent(name="parts", model="gemini-2.5-flash",
                  instruction="Source parts for {findings}.", tools=[check_stock])
sched  = LlmAgent(name="scheduler", model="gemini-2.5-flash",
                  instruction="Book a window for {findings}.", tools=[find_window])
review = LoopAgent(name="safety_loop", max_iterations=2,
                   sub_agents=[planner_agent, safety_critic])

pipeline = SequentialAgent(name="maintenance", sub_agents=[
    sensor,
    ParallelAgent(name="prepare", sub_agents=[parts, sched]),
    review,
])`,
      },
    },
    {
      kicker: "AWS & Anthropic",
      title: "Strands Agents & Claude Agent SDK",
      cards: [
        { title: "AWS Strands Agents", emoji: "🧬", color: O, body: "Open-source, model-driven: give the model tools + a prompt, let it plan. Multi-agent: agents-as-tools, swarm, graph, workflow. MCP-native; deploy on Bedrock AgentCore, Lambda, ECS.", tags: ["Python", "Bedrock", "MCP"] },
        { title: "Claude Agent SDK", emoji: "🤖", color: A, body: "The agent harness behind Claude Code, as a library: tool use, subagents, hooks, permissions, context compaction, MCP servers. Ideal for coding & computer-work agents.", tags: ["Python", "TypeScript", "MCP"] },
        { title: "Semantic Kernel", emoji: "🧠", color: I, body: "Enterprise SDK (C#, Python, Java): plugins, function calling, agents & process framework; converging into Microsoft Agent Framework.", tags: [".NET", "Azure"] },
      ],
      cols: 3,
      code: {
        title: "Strands in 6 lines",
        code: `from strands import Agent, tool

@tool
def check_stock(part: str) -> dict:
    """Check SAP stock for a part."""
    return sap.stock(part)

agent = Agent(tools=[check_stock], system_prompt="You are a procurement specialist.")
agent("Do we have SKF 7014 ACD/P4A bearings in Chennai?")`,
      },
    },
    {
      kicker: "Data-first",
      title: "LlamaIndex & Haystack — RAG-centric agents",
      cards: [
        { title: "LlamaIndex", emoji: "🦙", color: V, body: "Data framework for LLMs: 300+ connectors, LlamaParse for complex PDFs, advanced indexes. Workflows = event-driven steps; AgentWorkflow / FunctionAgent for multi-agent handoffs.", tags: ["Workflows", "AgentWorkflow", "LlamaCloud"] },
        { title: "Haystack (deepset)", emoji: "🌾", color: G, body: "Production pipelines of typed components (retrievers, rankers, generators) + an Agent component with tools. Strong for search & RAG in enterprises.", tags: ["Pipelines", "Agent", "Hayhooks"] },
      ],
      cols: 2,
      code: {
        title: "LlamaIndex Workflow — event-driven steps",
        code: `from llama_index.core.workflow import Workflow, step, Event, StartEvent, StopEvent

class Diagnosed(Event):
    fault: str

class MaintenanceFlow(Workflow):
    @step
    async def diagnose(self, ev: StartEvent) -> Diagnosed:
        return Diagnosed(fault=await sensor_agent.run(ev.alert))

    @step
    async def root_cause(self, ev: Diagnosed) -> StopEvent:
        answer = await manuals_index.as_query_engine().aquery(ev.fault)
        return StopEvent(result=str(answer))

result = await MaintenanceFlow(timeout=120).run(alert=alert)`,
      },
    },
    {
      kicker: "Lightweight & typed",
      title: "Pydantic AI, smolagents & Agno",
      cards: [
        { title: "Pydantic AI", emoji: "📐", color: R, body: "Type-safe agents from the Pydantic team: typed outputs, dependency injection, tools, pydantic-graph for workflows, Logfire tracing, MCP & A2A.", tags: ["type-safe", "FastAPI feel"] },
        { title: "smolagents", emoji: "🤗", color: A, body: "Hugging Face's minimal library. CodeAgent writes its actions as Python code (CodeAct) in a sandbox — fewer steps than JSON tool calls.", tags: ["CodeAct", "sandboxed"] },
        { title: "Agno", emoji: "⚡", color: G, body: "Fast, multimodal agents with memory & knowledge; Teams with route / coordinate / collaborate modes; AgentOS runtime.", tags: ["teams", "multimodal"] },
      ],
      cols: 3,
      code: {
        title: "Pydantic AI — typed output + tool",
        code: `from pydantic import BaseModel
from pydantic_ai import Agent

class Diagnosis(BaseModel):
    fault: str
    part: str
    confidence: float

agent = Agent("groq:openai/gpt-oss-120b", output_type=Diagnosis,
              instructions="Diagnose CNC anomalies using sensor data.")

@agent.tool_plain
def read_sensor_history(machine: str) -> dict:
    return scada.history(machine, "72h")

result = agent.run_sync("CNC-07 vibration alarm")
print(result.output.part)   # validated, typed`,
      },
    },
    {
      kicker: "Programming, not prompting",
      title: "DSPy — optimise the pipeline, not the prompt",
      bullets: [
        "Declare **Signatures** (inputs → outputs) and compose **Modules** (`Predict`, `ChainOfThought`, `ReAct`).",
        "**Optimizers** (BootstrapFewShot, MIPROv2, GEPA…) tune prompts/demos against a metric using your data.",
        "Swap models without rewriting prompts — re-compile instead.",
        "Great complement to an orchestrator: use DSPy inside a node for high-accuracy steps (e.g. root-cause classification).",
      ],
      code: {
        title: "Self-improving root-cause module",
        code: `import dspy
dspy.configure(lm=dspy.LM("groq/openai/gpt-oss-120b"))

class RootCause(dspy.Signature):
    """Identify the failing component from findings and manual excerpts."""
    findings: str = dspy.InputField()
    context: list[str] = dspy.InputField()
    component: str = dspy.OutputField()
    part_number: str = dspy.OutputField()

rca = dspy.ChainOfThought(RootCause)

optimizer = dspy.MIPROv2(metric=part_number_match, auto="light")
rca_tuned = optimizer.compile(rca, trainset=past_incidents)`,
      },
    },
    {
      kicker: "TypeScript ecosystem",
      title: "Mastra & Vercel AI SDK",
      cards: [
        { title: "Mastra", emoji: "🟦", color: C, body: "TypeScript agent framework: agents, graph workflows (.then / .branch / .parallel), suspend/resume for HITL, RAG, memory, evals, local dev playground.", tags: ["TS", "workflows", "evals"] },
        { title: "Vercel AI SDK", emoji: "▲", color: Z, body: "Provider-agnostic TS toolkit: generateText / streamText with tools and multi-step loops (stopWhen), structured output, React UI hooks for streaming chat.", tags: ["TS", "streaming UI"] },
        { title: "LangGraph.js / LangChain.js", emoji: "🕸️", color: V, body: "Same concepts as Python: StateGraph, checkpointers, interrupts — for Node & edge runtimes.", tags: ["TS", "parity"] },
      ],
      cols: 3,
      code: {
        title: "Mastra agent (TypeScript)",
        code: `import { Agent } from "@mastra/core/agent";
import { groq } from "@ai-sdk/groq";

export const plannerAgent = new Agent({
  name: "maintenance-planner",
  instructions: "Book the least disruptive maintenance window.",
  model: groq("openai/gpt-oss-120b"),
  tools: { findWindow, createWorkOrder },
});

const res = await plannerAgent.generate("Plan bearing swap on CNC-07");`,
      },
    },
    {
      kicker: "Research lineage",
      title: "Research & memory-centric frameworks",
      cards: [
        { title: "MetaGPT", emoji: "🏗️", color: P, body: "Encodes human SOPs into roles (PM → architect → engineer → QA). ‘Code = SOP(Team)’. Structured artefacts between roles." },
        { title: "CAMEL", emoji: "🐫", color: A, body: "Role-playing agents with inception prompting; large-scale agent societies & data generation." },
        { title: "ChatDev", emoji: "💻", color: S, body: "A virtual software company: chat chains between CEO, CTO, programmer, tester agents." },
        { title: "Letta (MemGPT)", emoji: "🧠", color: V, body: "Stateful agents with an OS-like memory hierarchy: core memory, recall & archival memory the agent edits itself." },
        { title: "OpenHands", emoji: "🙌", color: G, body: "Open platform for software-engineering agents (CodeAct): edit code, run commands, browse." },
      ],
      cols: 5,
      callout: "Many production ideas started here: role specialisation (MetaGPT/CAMEL), self-editing memory (MemGPT), code-as-action (CodeAct).",
    },
    {
      kicker: "Platforms",
      title: "Low-code builders & managed agent services",
      table: {
        head: ["Category", "Examples", "Strength", "Trade-off"],
        rows: [
          ["Visual / low-code", "n8n, Langflow, Flowise, Dify, Copilot Studio", "Fast, business-friendly, 100s of connectors", "Limited control, harder testing & versioning"],
          ["Cloud agent runtimes", "Bedrock AgentCore, Vertex AI Agent Engine, Azure AI Foundry Agent Service", "Managed scaling, identity, memory, observability", "Cloud lock-in, cost visibility"],
          ["Enterprise suites", "Agentforce, ServiceNow, watsonx Orchestrate, UiPath, SAP Joule", "Native access to business data & workflows", "Bound to the vendor's ecosystem"],
          ["Code frameworks", "LangGraph, CrewAI, ADK, Agents SDK, MS Agent Framework", "Full control, portability, testability", "You own the engineering & ops"],
        ],
      },
      bullets: ["Common enterprise pattern: **code-first orchestration** for core logic, deployed on a **managed runtime**, exposing tools via **MCP** and talking to vendor agents via **A2A**."],
    },
    {
      kicker: "Interoperability",
      title: "Protocols: MCP · A2A · AG-UI",
      table: {
        head: ["", "MCP", "A2A", "AG-UI"],
        rows: [
          ["Connects", "Agent ↔ tools, data & prompts", "Agent ↔ agent (across vendors/frameworks)", "Agent ↔ user interface"],
          ["Origin", "Anthropic (Nov 2024), now open governance", "Google (Apr 2025), Linux Foundation project", "CopilotKit & community"],
          ["Key concepts", "Host, client, server; tools, resources, prompts", "Agent Card, tasks, messages, artifacts, streaming", "Event stream: messages, tool calls, state deltas"],
          ["Plant example", "SAP / SCADA / CMMS servers", "Our crew ↔ supplier's quoting agent", "Live run view in the Ops Console"],
        ],
      },
      callout: "Think in layers: MCP gives agents hands, A2A gives them colleagues, AG-UI gives them a face.",
    },
    {
      kicker: "Methodology · single-agent reasoning",
      title: "Reasoning & acting patterns behind every framework",
      table: {
        head: ["Method", "Idea", "Where you see it"],
        rows: [
          ["Chain-of-Thought / Self-Consistency", "Reason step by step; sample several paths and vote", "Reasoning models, ChainOfThought modules"],
          ["ReAct", "Interleave Thought → Action (tool) → Observation", "create_agent, AssistantAgent, most agent loops"],
          ["Plan-and-Solve / Plan-and-Execute", "Plan first, then execute steps, re-plan if needed", "LangGraph planners, CrewAI planning=True"],
          ["ReWOO", "Plan all tool calls up front, run them, then solve", "Cost-efficient pipelines"],
          ["LLMCompiler", "Build a DAG of tool calls and run them in parallel", "Parallel function calling"],
          ["Reflexion / Self-Refine", "Critique own output, store lessons, retry", "Reflection loops, guardrail retries"],
          ["Tree of Thoughts / LATS", "Search over multiple reasoning/action branches", "Hard planning problems"],
          ["CodeAct", "Actions are executable code, not JSON", "smolagents, OpenHands"],
        ],
      },
    },
    {
      kicker: "Methodology · multi-agent coordination",
      title: "How agents coordinate",
      cards: [
        { title: "Supervisor / orchestrator–worker", emoji: "🎼", color: V, body: "One agent plans & delegates. LangGraph supervisor, CrewAI hierarchical, ADK sub_agents." },
        { title: "Hierarchical teams", emoji: "🏛️", color: I, body: "Supervisors of supervisors; mirrors org charts." },
        { title: "Handoffs / swarm", emoji: "🤝", color: S, body: "Control passes peer-to-peer. Agents SDK, LangGraph swarm, AutoGen Swarm." },
        { title: "Group chat + selector", emoji: "💬", color: C, body: "Shared conversation; an LLM picks the next speaker. AutoGen SelectorGroupChat." },
        { title: "Debate / critic", emoji: "⚖️", color: R, body: "Agents argue or review each other to improve accuracy." },
        { title: "Blackboard", emoji: "📋", color: G, body: "Agents read/write shared state; a controller picks who acts." },
        { title: "Market / contract-net", emoji: "🏷️", color: A, body: "Tasks announced; agents bid based on capability/cost." },
        { title: "SOP / ledger-driven", emoji: "📒", color: P, body: "Fixed SOPs (MetaGPT) or task & progress ledgers (Magentic-One) steer the team." },
      ],
      cols: 4,
    },
    {
      kicker: "Methodology · context",
      title: "Context engineering & memory",
      cards: [
        { title: "Write", emoji: "✍️", color: G, body: "Persist outside the window: scratchpads, state, long-term memory stores." },
        { title: "Select", emoji: "🎯", color: A, body: "Pull in only what's relevant: RAG, memory retrieval, tool selection." },
        { title: "Compress", emoji: "🗜️", color: S, body: "Summarise / trim history, compact tool outputs." },
        { title: "Isolate", emoji: "🧪", color: V, body: "Split context across sub-agents, sandboxes or state fields." },
      ],
      cols: 4,
      table: {
        head: ["Memory type", "Holds", "Plant example"],
        rows: [
          ["Working / short-term", "Current run's messages & state", "Today's CNC-07 findings"],
          ["Semantic", "Facts & knowledge", "Bearing specs, supplier lead times"],
          ["Episodic", "Past experiences", "WO-2025-1187: same fault, fixed in 4h"],
          ["Procedural", "How to do things (prompts, rules, skills)", "LOTO checklist, planner instructions"],
        ],
      },
    },
    {
      kicker: "Methodology · quality",
      title: "Evaluating agents",
      table: {
        head: ["Level", "What to measure", "How / tools"],
        rows: [
          ["Final outcome", "Task success, correctness, business KPI", "Golden datasets, LLM-as-judge, human review"],
          ["Trajectory", "Right tools, right order, no loops, cost & latency", "Trace-based evals (LangSmith, Phoenix, Langfuse)"],
          ["RAG", "Faithfulness, answer relevance, context precision/recall", "RAGAS, DeepEval"],
          ["Safety", "Policy violations, prompt injection, PII", "Red-teaming, Promptfoo, guardrail metrics"],
          ["Public benchmarks", "SWE-bench, GAIA, τ-bench, WebArena, OSWorld, BFCL", "Compare models & agent designs"],
        ],
      },
      flow: [{ label: "AgentOps loop", color: R, steps: ["Design", "Build", "Evaluate offline", "Deploy (guarded)", "Monitor traces & KPIs", "Collect failures → datasets", "Improve"] }],
    },
    {
      kicker: "Side by side",
      title: "Framework comparison",
      table: {
        head: ["Framework", "Lang", "Orchestration style", "Multi-agent", "Persistence / HITL", "MCP"],
        rows: [
          ["LangChain", "Py, JS", "Agent loop + middleware", "Sub-agents as tools", "Checkpointer, HITL middleware", "Adapters"],
          ["LangGraph", "Py, JS", "Explicit state graph", "Supervisor, swarm, hierarchical", "Checkpointers, interrupt()", "Adapters"],
          ["CrewAI", "Py", "Role-based crews + Flows", "Sequential / hierarchical", "Flow persistence, human_input", "MCPServerAdapter"],
          ["MS Agent Framework / AutoGen", "Py, .NET", "Conversation + graph workflows", "Group chat, Magentic, handoffs", "Workflow checkpoints, HITL", "Yes"],
          ["OpenAI Agents SDK", "Py, TS", "Handoffs & agents-as-tools", "Handoffs", "Sessions; HITL via approvals", "Yes"],
          ["Google ADK", "Py, Java+", "LLM + workflow agents", "Hierarchy, Seq/Par/Loop", "Session state, callbacks", "Yes (+A2A)"],
          ["Strands Agents", "Py", "Model-driven loop", "Agents-as-tools, swarm, graph", "Session managers", "Native"],
          ["LlamaIndex", "Py, TS", "Event-driven workflows", "AgentWorkflow handoffs", "Context/state, HITL events", "Yes"],
          ["Pydantic AI", "Py", "Typed agent + graphs", "Delegation, pydantic-graph", "Graph state persistence", "Yes"],
          ["smolagents", "Py", "Code-as-action loop", "Managed agents", "Minimal", "Yes"],
          ["Mastra", "TS", "Agents + graph workflows", "Agent networks", "Suspend / resume", "Yes"],
          ["DSPy", "Py", "Declarative modules + optimizers", "Composed modules", "—", "Via tools"],
        ],
      },
      notes: "Capabilities evolve monthly — treat this as orientation, and check current docs before committing.",
    },
    {
      kicker: "Decision guide",
      title: "How to choose",
      table: {
        head: ["If you need…", "Start with"],
        rows: [
          ["Deterministic, auditable, long-running workflows with approvals", "LangGraph · MS Agent Framework workflows · ADK workflow agents"],
          ["A quick, readable multi-agent team mapped to job roles", "CrewAI (Flows for control)"],
          ["One capable tool-using agent, fast", "LangChain create_agent · OpenAI Agents SDK · Strands · Pydantic AI"],
          ["Document-heavy RAG agents", "LlamaIndex · Haystack"],
          ["Azure / .NET enterprise stack", "Microsoft Agent Framework (Semantic Kernel lineage)"],
          ["Google Cloud / Gemini, A2A interoperability", "Google ADK"],
          ["TypeScript product teams", "Mastra · Vercel AI SDK · LangGraph.js"],
          ["Business users building automations", "n8n · Copilot Studio · Dify"],
          ["Maximum accuracy on a narrow step", "DSPy inside any orchestrator"],
        ],
      },
      callout: "Whatever you choose: expose tools via MCP, ground with RAG, trace everything, and keep fallbacks bounded.",
    },
    {
      layout: "title",
      kicker: "Wrap-up · the 360° view",
      title: "Frameworks change. Principles don't.",
      subtitle: "Orchestration decides · MCP connects · RAG grounds · Guardrails protect · Humans approve · Traces explain",
      emoji: "🎯",
      chips: ["Pick the control style you need", "Standardise tools with MCP", "Ground with RAG + grading", "Bound every fallback", "Evaluate continuously"],
      notes: "Close by sending people to the Industrial Demo to see the same use case orchestrated three ways, and invite questions to the AI assistant.",
    },
  ],
};
