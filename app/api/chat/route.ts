// Server-side proxy to Groq's OpenAI-compatible Chat Completions API.
// The key comes from GROQ_API_KEY (.env.local) or, as a fallback, from the
// x-groq-key header that the browser sends when the presenter pastes a key in the UI.

export const runtime = "nodejs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `You are "Orchestra", the AI teaching assistant for a 2-hour training session titled
"AI Orchestration — From Single Agent to Multi-Agent Architecture".
You are an expert on agentic AI: orchestration patterns (supervisor, hierarchical, sequential, parallel, router,
plan-and-execute, reflection, handoffs), fallback & recovery (retries, circuit breakers, model fallback, corrective RAG,
guardrails, human-in-the-loop, checkpoints), the Model Context Protocol (MCP), Retrieval-Augmented Generation (RAG),
and frameworks such as LangChain, LangGraph and CrewAI (also AutoGen / Microsoft Agent Framework, OpenAI Agents SDK, LlamaIndex, Google ADK).
The session's running industrial use case is predictive maintenance & incident response at a manufacturing plant
(CNC spindle vibration anomaly -> diagnosis -> parts check in SAP -> maintenance scheduling -> safety review -> human approval).
Ground truth you must stay consistent with:
- MCP (Model Context Protocol, open standard introduced by Anthropic) connects AI applications to TOOLS, RESOURCES and PROMPTS
  exposed by MCP servers (host -> client -> server, JSON-RPC 2.0, stdio or Streamable HTTP transports). It is agent-to-TOOL/DATA,
  not agent-to-agent messaging; agent-to-agent communication is the A2A protocol. MCP turns N x M custom integrations into N + M.
- RAG grounds model answers in retrieved documents (ingest, chunk, embed, index, retrieve, re-rank, generate with citations);
  Corrective RAG grades retrieved context and rewrites the query when it is weak.
- LangChain: create_agent tool-calling loop + middleware. LangGraph: StateGraph with nodes, conditional edges, checkpointers, interrupt().
  CrewAI: role-based Agents + Tasks in a Crew (sequential or hierarchical process with a manager LLM) and event-driven Flows.
Answer clearly for a live audience: start with a one-line answer, then structure with short headings or bullets,
use concrete examples from the manufacturing use case, and include short Python snippets when code helps.
Keep answers focused (under ~350 words unless asked for more).`;

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY || req.headers.get("x-groq-key") || "";
  if (!key) {
    return new Response(
      "No Groq API key configured. Add GROQ_API_KEY to .env.local (then restart `npm run dev`), or paste a key in the AI Assistant settings.",
      { status: 401 }
    );
  }

  let body: { messages?: Msg[]; model?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const messages: Msg[] = [
    { role: "system", content: SYSTEM_PROMPT + (body.context ? `\n\nCurrent screen context:\n${body.context}` : "") },
    ...(body.messages ?? []).filter((m) => m.role !== "system").slice(-20),
  ];

  const upstream = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: body.model || DEFAULT_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 1400,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(`Groq API error (${upstream.status}): ${text.slice(0, 500)}`, { status: upstream.status || 502 });
  }

  // Convert Groq's SSE stream into a plain text stream of content deltas.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // ignore partial / keep-alive lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}

export async function GET() {
  return Response.json({ configured: Boolean(process.env.GROQ_API_KEY), model: DEFAULT_MODEL });
}
