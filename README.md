# AI Orchestration Studio — From One Agent to Many

Interactive training app for a 2-hour session on AI orchestration (single agent → multi-agent),
with an industrial predictive-maintenance demo shown on LangChain, LangGraph and CrewAI.

## Run

```bash
npm install
cp .env.local.example .env.local   # paste your GROQ_API_KEY
npm run dev                        # http://localhost:3000
```

No key yet? Everything except the AI Assistant works without one. You can also paste a key in
AI Assistant → ⚙ settings (it is stored only in that browser).

## Pages

| Route | What it is |
|---|---|
| `/` | Overview: single vs multi-agent, Orchestration × MCP × RAG |
| `/learn` | Learning Hub: 2-hour agenda, 9 modules with visuals & quizzes, glossary |
| `/present` | Presentation mode: 4 slide decks (LangChain, LangGraph, CrewAI, wider landscape & methodologies) with speaker notes |
| `/demo` | Industrial demo: live architecture, framework internals, event log, shared state, metrics |
| `/assistant` | Groq-powered teaching assistant ("Ask AI" buttons also appear on demo steps & modules) |

## Presenter tips (slides)

- **← → / Space** navigate · **F** fullscreen · **N** speaker notes · **G** overview grid · **Home/End**
- Deep link: `/present?deck=langgraph&s=6` (`deck` = langchain|langgraph|crewai|landscape)
- "Ask AI about this slide" generates a talk-track + likely audience question

## Presenter tips (demo)

- **Space** play/pause · **← →** step · **R** reset
- Scenarios: happy path, LLM outage → model fallback, weak retrieval → Corrective RAG,
  SAP MCP timeout → circuit breaker, unsafe plan → reflection loop
- Toggle **MCP OFF** / **RAG OFF** to show why orchestration fails without them
- Deep links: `/demo?fw=crewai&sc=mcp-timeout&step=6` (`fw` = langchain|langgraph|crewai,
  `sc` = happy|llm-outage|rag-lowconf|mcp-timeout|guardrail, optional `mcp=off`, `rag=off`)

The demo is a scripted simulation for teaching; the code tab shows illustrative framework code for the same use case.
