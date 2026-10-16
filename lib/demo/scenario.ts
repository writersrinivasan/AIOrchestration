import type { Framework, Scenario, Step } from "./types";

export const SCENARIOS: { id: Scenario; label: string; emoji: string; blurb: string }[] = [
  { id: "happy", label: "Happy path", emoji: "✅", blurb: "Everything works — see the layers cooperate end to end." },
  { id: "llm-outage", label: "LLM outage → model fallback", emoji: "⚡", blurb: "Primary model is rate-limited; the gateway fails over to a backup model." },
  { id: "rag-lowconf", label: "Weak retrieval → Corrective RAG", emoji: "🧲", blurb: "First retrieval is irrelevant; grader rejects it, query is rewritten, re-retrieved." },
  { id: "mcp-timeout", label: "SAP MCP timeout → circuit breaker", emoji: "🔌", blurb: "ERP tool times out; retries, circuit breaker, then an alternate data path." },
  { id: "guardrail", label: "Unsafe plan → reflection loop", emoji: "🛡️", blurb: "Guardrail blocks a LOTO violation; the plan is critiqued and revised." },
];

export const USE_CASE = {
  title: "Predictive Maintenance & Incident Response",
  plant: "Precision auto-components plant · Chennai · Line 3",
  asset: "CNC-07 — DMG MORI NHX-5000 horizontal machining centre",
  stakes: [
    { k: "Unplanned downtime", v: "₹18 lakh / hour" },
    { k: "Bearing lead time", v: "36–72 h" },
    { k: "Safety regime", v: "OSHA 1910.147 · ISO 45001" },
    { k: "Systems touched", v: "SCADA · SAP · Maximo · Teams" },
  ],
};

export function buildSteps(fw: Framework, sc: Scenario, mcp: boolean, rag: boolean): Step[] {
  const p = <T,>(lc: T, lg: T, cr: T): T => (fw === "langchain" ? lc : fw === "langgraph" ? lg : cr);
  const steps: Step[] = [];
  const add = (s: Step) => steps.push(s);
  let healthy = true; // becomes false when a missing layer poisons the outcome

  // 1 ─ Trigger
  add({
    title: "Anomaly detected on CNC-07",
    detail:
      "The IoT stream publishes an OPC-UA event: spindle vibration 11.2 mm/s RMS (ISO 10816 alarm limit 7.1) and bearing temperature 78 °C on CNC-07, Line 3. The event lands on the orchestrator as a new mission.",
    why: "Enterprise orchestration usually starts from an event, not a chat box. The orchestrator turns a raw signal into a goal: “prevent unplanned downtime on CNC-07”.",
    layer: "experience",
    status: "info",
    arch: ["iot", "orchestrator"],
    edges: [["iot", "orchestrator"]],
    orch: p("lc_input", "lg_start", "cr_kick"),
    orchEdge: p(["lc_input", "lc_agent"], ["lg_start", "lg_super"], ["cr_kick", "cr_mgr"]),
    trace: p(
      `agent.ainvoke({"messages":[alert]}, thread_id="CNC-07")`,
      `app.invoke({"alert": alert}, {"configurable": {"thread_id": "CNC-07"}})`,
      `crew.kickoff(inputs={"alert": alert})`
    ),
    state: { alert: { machine: "CNC-07", vib_rms_mm_s: 11.2, limit: 7.1, bearing_temp_c: 78, severity: "HIGH" }, status: "received" },
    metrics: { ms: 40 },
  });

  // 1b ─ LLM outage scenario
  if (sc === "llm-outage") {
    add({
      title: "Primary LLM unavailable",
      detail:
        "The very first planning call to Groq openai/gpt-oss-120b returns HTTP 429 (rate limit) followed by a 503. Without a fallback, the whole mission would stall here.",
      why: "A single model is a single point of failure. Production orchestrators treat the LLM as a replaceable dependency behind a gateway.",
      layer: "orchestration",
      status: "fail",
      arch: ["orchestrator", "llm"],
      edges: [["orchestrator", "llm"]],
      orch: p("lc_agent", "lg_super", "cr_mgr"),
      trace: p(
        `ChatGroq.invoke → RateLimitError: 429 Too Many Requests`,
        `node "supervisor" raised RateLimitError (429)`,
        `manager_llm call failed: litellm.RateLimitError 429`
      ),
      state: { llm: { primary: "openai/gpt-oss-120b", health: "DOWN (429/503)" } },
      metrics: { llm: 1, ms: 2100 },
    });
    add({
      title: "Model fallback engaged",
      detail:
        "The policy engine retries once with jitter, then the LLM gateway routes to the backup model (openai/gpt-oss-20b). Same prompt, same tools, same shared state — only the ‘brain’ is swapped.",
      why: p(
        "In LangChain this is one line of middleware: ModelFallbackMiddleware tries the next model automatically.",
        "In LangGraph you combine a node RetryPolicy with a model that has .with_fallbacks([...]); the checkpoint means no work is lost.",
        "In CrewAI the LLM is LiteLLM-backed, so you configure router fallbacks (or wrap the LLM) to fail over providers."
      ),
      layer: "orchestration",
      status: "fallback",
      arch: ["policy", "llm", "orchestrator"],
      edges: [["policy", "llm"], ["state", "policy"]],
      orch: p("lc_mw", "lg_super", "cr_mgr"),
      orchEdge: p(["lc_mw", "lc_agent"], undefined, undefined),
      trace: p(
        `ModelFallbackMiddleware → switching to "groq:openai/gpt-oss-20b"`,
        `RetryPolicy exhausted → llm.with_fallbacks([backup]) → backup model`,
        `LiteLLM router fallbacks → groq/openai/gpt-oss-20b`
      ),
      metrics: { llm: 1, ms: 900 },
    });
    add({
      title: "Planning resumed on backup model",
      detail: "The mission continues with no data loss. Trace records the failover so SREs can see that 100% of this run used the backup model.",
      layer: "orchestration",
      status: "recover",
      arch: ["llm", "orchestrator", "g_trace"],
      edges: [["llm", "orchestrator"]],
      orch: p("lc_agent", "lg_super", "cr_mgr"),
      trace: `span llm.call model=openai/gpt-oss-20b fallback=true status=OK`,
      state: { llm: { primary: "openai/gpt-oss-120b", health: "DOWN", active: "openai/gpt-oss-20b (fallback)" } },
      metrics: { llm: 1, ms: 600 },
    });
  }

  // 2 ─ Plan
  add({
    title: "Orchestrator plans the mission",
    detail:
      "The planner decomposes the goal into six sub-tasks and writes them into shared state: ① diagnose the signal ② find root cause ③ secure spare parts ④ book a maintenance window ⑤ safety review ⑥ draft & approve the work order.",
    why: p(
      "LangChain: the plan is implicit — on every loop turn the LLM decides which tool to call next.",
      "LangGraph: the plan is explicit — the supervisor writes typed state and conditional edges route deterministically.",
      "CrewAI: the manager agent (hierarchical process) reads the task list and delegates to agents by role."
    ),
    layer: "orchestration",
    status: "ok",
    arch: ["orchestrator", "planner", "llm", "state"],
    edges: [["orchestrator", "planner"], ["orchestrator", "state"], ["policy", "llm"]],
    orch: p("lc_agent", "lg_super", "cr_mgr"),
    trace: p(
      `AIMessage(tool_calls=[read_sensor_history])   # LLM picks next tool`,
      `supervisor → Command(goto="sensor", update={"plan": [...6 tasks]})`,
      `Manager: delegating "Diagnose vibration anomaly" → Vibration Analyst`
    ),
    state: { plan: ["diagnose", "root_cause", "parts", "schedule", "safety_review", "work_order"], status: "planning" },
    metrics: { llm: 1, ms: 1400, tokens: 1800 },
  });

  // 3 ─ Sensor diagnostics (MCP)
  if (mcp) {
    add({
      title: "Sensor agent reads live telemetry via MCP",
      detail:
        "The Sensor Diagnostics agent discovers tools from the SCADA MCP server (tools/list) and calls read_sensor_history(machine='CNC-07', window='72h'). FFT shows a peak at BPFO 142 Hz — an outer-race bearing defect — with amplitude up 3.2× in 48 h.",
      why: "MCP gives agents ‘hands and eyes’ on live systems through one standard protocol (JSON-RPC: tools, resources, prompts). Any framework, any model, same SCADA server.",
      layer: "mcp",
      status: "ok",
      arch: ["a_sensor", "mcp_client", "mcp_scada", "d_plc"],
      edges: [["orchestrator", "a_sensor"], ["a_sensor", "mcp_client"], ["mcp_client", "mcp_scada"], ["mcp_scada", "d_plc"]],
      orch: p("lc_t1", "lg_sensor", "cr_sensor"),
      orchEdge: p(["lc_agent", "lc_tools"], ["lg_super", "lg_sensor"], ["cr_mgr", "cr_sensor"]),
      trace: p(
        `tool_call read_sensor_history {"machine":"CNC-07","window":"72h"} → MCP:scada ✓`,
        `node sensor → scada.read_sensor_history → state.findings ✓`,
        `Vibration Analyst » Using tool: read_sensor_history (MCP) ✓`
      ),
      state: { findings: { fault: "Outer-race bearing defect (BPFO 142 Hz)", trend: "3.2× in 48h", confidence: 0.87, source: "SCADA (live)" } },
      metrics: { llm: 1, tool: 1, ms: 1200, tokens: 2400 },
    });
  } else {
    healthy = false;
    add({
      title: "Sensor agent is blind — no MCP layer",
      detail:
        "No MCP servers are registered, so the agent cannot reach SCADA. It can only reason over the alert text, and the LLM speculates: “possibly spindle imbalance or a loose fixture”. No FFT, no trend, no evidence.",
      why: "Without MCP (or an equivalent tool layer) the orchestrator can think but cannot sense or act. Every downstream decision now inherits a guess.",
      layer: "agent",
      status: "fail",
      arch: ["a_sensor"],
      edges: [["orchestrator", "a_sensor"]],
      orch: p("lc_agent", "lg_sensor", "cr_sensor"),
      trace: p(`tools=[]  → AIMessage("Likely imbalance…")  # no evidence`, `node sensor: no tools bound → LLM-only guess`, `Vibration Analyst: no tools available — answering from reasoning only`),
      state: { findings: { fault: "UNVERIFIED guess: imbalance?", confidence: 0.31, source: "LLM speculation" } },
      metrics: { llm: 1, ms: 900 },
    });
  }

  // 4 ─ Root cause (RAG)
  const rcaArch = ["a_rca", "rag_rewrite", "rag_retr", "rag_vdb", "rag_rerank", "d_docs", "d_history"];
  if (rag) {
    if (sc === "rag-lowconf") {
      add({
        title: "RCA agent retrieves knowledge (attempt 1)",
        detail:
          "Query “spindle vibration high” → hybrid search returns a coolant-pump SOP and a lathe manual. The top re-ranked chunk scores only 0.41.",
        layer: "rag",
        status: "warn",
        arch: ["a_rca", "rag_retr", "rag_vdb", "d_docs"],
        edges: [["orchestrator", "a_rca"], ["a_rca", "rag_rewrite"], ["rag_rewrite", "rag_retr"], ["rag_retr", "rag_vdb"], ["rag_vdb", "d_docs"]],
        orch: p("lc_t2", "lg_rca", "cr_rel"),
        orchEdge: p(["lc_agent", "lc_tools"], ["lg_super", "lg_rca"], ["cr_mgr", "cr_rel"]),
        trace: p(
          `tool_call search_manuals {"query":"spindle vibration high"} → 5 docs`,
          `node rca → retriever.invoke("spindle vibration high") → 5 docs`,
          `Reliability Engineer » querying knowledge sources…`
        ),
        state: { docs: { query: "spindle vibration high", top_score: 0.41, hits: ["SOP coolant pump", "Lathe L-200 manual"] } },
        metrics: { llm: 1, rag: 1, ms: 800 },
      });
      add({
        title: "Relevance grader rejects the context",
        detail:
          "A grader scores each chunk against the question: 0.41 < threshold 0.70 → “irrelevant”. Answering now would produce a confident but wrong root cause.",
        why: p(
          "LangChain has no built-in grading step — you add it as middleware or a retriever wrapper; otherwise the LLM may simply accept weak context.",
          "LangGraph makes the quality gate a first-class conditional edge: grade_docs → rewrite → rca (Corrective RAG).",
          "CrewAI validates task output with a guardrail; on failure the task is retried with the feedback."
        ),
        layer: "rag",
        status: "fail",
        arch: ["rag_rerank", "rag_grade", "a_rca"],
        edges: [["rag_vdb", "rag_rerank"], ["rag_retr", "rag_grade"]],
        orch: p("lc_observe", "lg_grade", "cr_guard"),
        orchEdge: p(["lc_tools", "lc_observe"], ["lg_rca", "lg_grade"], ["cr_tools", "cr_guard"]),
        trace: p(
          `Observation: low-relevance docs (grader middleware → score 0.41 ✗)`,
          `grade_docs → "irrelevant" (0.41 < 0.70)`,
          `Task guardrail validate_citations → (False, "sources don't match asset")`
        ),
        metrics: { llm: 1, ms: 700 },
      });
      add({
        title: "Fallback: Corrective RAG — rewrite & filter",
        detail:
          "The rewriter enriches the query with the sensor evidence — “DMG MORI NHX-5000 spindle bearing outer-race BPFO 142 Hz failure” — and adds metadata filters {asset_model: NHX-5000, doc_type: [OEM manual, work order]}.",
        why: "Recovery means changing strategy, not repeating the same call. Better query + tighter filters is the RAG equivalent of a retry with a different route.",
        layer: "rag",
        status: "fallback",
        arch: ["rag_rewrite", "rag_retr", "rag_vdb", "policy", "state"],
        edges: [["a_rca", "rag_rewrite"], ["rag_rewrite", "rag_retr"], ["rag_retr", "rag_vdb"], ["state", "policy"]],
        orch: p("lc_agent", "lg_rewrite", "cr_deleg"),
        orchEdge: p(["lc_observe", "lc_agent"], ["lg_grade", "lg_rewrite"], ["cr_guard", "cr_deleg"]),
        trace: p(
          `LLM decides to call search_manuals again with a rewritten query`,
          `rewrite → rca   (attempt 2 of 3)`,
          `Retrying task "Root cause" (guardrail retry 1/2) with feedback`
        ),
        metrics: { llm: 1, rag: 1, ms: 900 },
      });
      add({
        title: "Grounded root cause recovered",
        detail:
          "Re-ranked score 0.89. Evidence: OEM manual §7.4 — “Spindle bearing SKF 7014 ACD/P4A, replace when BPFO amplitude > 8 mm/s” — plus three similar past incidents (WO-2025-1187, -1342, -2210) with mean time-to-failure of 9 days.",
        layer: "rag",
        status: "recover",
        arch: ["a_rca", "rag_rerank", "rag_grade", "d_history", "d_docs"],
        edges: [["rag_vdb", "rag_rerank"], ["rag_retr", "rag_grade"], ["rag_vdb", "d_history"]],
        orch: p("lc_agent", "lg_grade", "cr_rel"),
        orchEdge: p(undefined, ["lg_rewrite", "lg_rca"], ["cr_deleg", "cr_mgr"]),
        trace: p(`Observation: 5 docs (score 0.89) ✓ citations attached`, `grade_docs → "relevant" (0.89) → supervisor`, `Task guardrail validate_citations → (True) ✓`),
        state: {
          docs: { query: "NHX-5000 spindle bearing BPFO 142Hz", top_score: 0.89, citations: ["OEM §7.4", "WO-2025-1187", "WO-2025-1342"] },
          root_cause: { cause: "SKF 7014 ACD/P4A outer-race wear", part: "SKF 7014 ACD/P4A", ttf_days: 9, grounded: true },
        },
        metrics: { llm: 1, ms: 600 },
      });
    } else {
      add({
        title: "RCA agent grounds the diagnosis with RAG",
        detail:
          "A query built from the sensor findings runs a hybrid (BM25 + vector) search over 18k chunks of OEM manuals, SOPs and 12k past work orders, then a cross-encoder re-ranks the top 5 (score 0.89). Root cause: SKF 7014 ACD/P4A outer-race wear; similar incidents failed within ~9 days.",
        why: "RAG gives agents plant-specific memory: the exact bearing, the exact limit, the exact history — with citations a human can verify.",
        layer: "rag",
        status: "ok",
        arch: rcaArch.concat("rag_grade"),
        edges: [["orchestrator", "a_rca"], ["a_rca", "rag_rewrite"], ["rag_rewrite", "rag_retr"], ["rag_retr", "rag_vdb"], ["rag_vdb", "rag_rerank"], ["rag_vdb", "d_docs"], ["rag_vdb", "d_history"], ["rag_retr", "rag_grade"]],
        orch: p("lc_t2", "lg_rca", "cr_rel"),
        orchEdge: p(["lc_agent", "lc_tools"], ["lg_super", "lg_rca"], ["cr_mgr", "cr_rel"]),
        trace: p(
          `tool_call search_manuals {"query":"NHX-5000 bearing BPFO 142Hz"} → 5 docs (0.89) ✓`,
          `node rca → retrieve → rerank → grade_docs "relevant" ✓`,
          `Reliability Engineer » knowledge hit: OEM §7.4, WO-2025-1187 ✓`
        ),
        state: {
          docs: { top_score: 0.89, citations: ["OEM §7.4", "WO-2025-1187", "WO-2025-1342"] },
          root_cause: { cause: "SKF 7014 ACD/P4A outer-race wear", part: "SKF 7014 ACD/P4A", ttf_days: 9, grounded: true },
        },
        metrics: { llm: 1, rag: 1, ms: 1100, tokens: 3600 },
      });
    }
  } else {
    healthy = false;
    add({
      title: "RCA agent answers from memory — no RAG layer",
      detail:
        "No retriever exists. The LLM answers from parametric memory: “likely a lubrication issue; replace bearing 6205-2RS, torque 95 Nm”. Both the part number and the torque are invented — neither exists for this spindle.",
      why: "Without RAG the orchestrator has no access to plant-specific knowledge. Fluent ≠ correct: a hallucinated spec here is a cost AND a safety risk.",
      layer: "agent",
      status: "fail",
      arch: ["a_rca", "llm"],
      edges: [["orchestrator", "a_rca"]],
      orch: p("lc_agent", "lg_rca", "cr_rel"),
      trace: p(`AIMessage("Replace bearing 6205-2RS, 95 Nm")  # no citations`, `node rca: no retriever → ungrounded answer`, `Reliability Engineer: no knowledge sources — answering from training data`),
      state: { root_cause: { cause: "lubrication? (hallucinated)", part: "6205-2RS (WRONG)", grounded: false } },
      metrics: { llm: 1, ms: 900 },
    });
  }

  // 5 ─ Parts (MCP → SAP)
  if (mcp) {
    if (sc === "mcp-timeout") {
      add({
        title: "Parts agent calls SAP via MCP — timeout",
        detail: "check_stock(part='SKF 7014 ACD/P4A', plant='CHN1') — the SAP MCP server does not respond within the 10 s tool timeout.",
        layer: "mcp",
        status: "fail",
        arch: ["a_parts", "mcp_client", "mcp_sap", "d_sap"],
        edges: [["orchestrator", "a_parts"], ["a_parts", "mcp_client"], ["mcp_client", "mcp_sap"]],
        orch: p("lc_t3", "lg_parts", "cr_proc"),
        orchEdge: p(["lc_agent", "lc_tools"], ["lg_super", "lg_parts"], ["cr_mgr", "cr_proc"]),
        trace: p(`ToolMessage: TimeoutError after 10s (sap.check_stock) ✗`, `node parts raised TimeoutError ✗`, `Procurement Specialist » tool error: check_stock timed out ✗`),
        state: { parts: { status: "SAP MCP timeout" } },
        metrics: { llm: 1, tool: 1, ms: 10000 },
      });
      add({
        title: "Retry with backoff → circuit breaker opens",
        detail:
          "The policy engine retries 3× (1 s → 2 s → 4 s + jitter). All fail, so the circuit breaker OPENS for the SAP server for 5 minutes — no other agent will hammer a sick system.",
        why: "Fallbacks must be bounded. Retries absorb transient faults; circuit breakers stop cascading failures; then you degrade gracefully.",
        layer: "orchestration",
        status: "fallback",
        arch: ["policy", "mcp_client", "mcp_sap", "state"],
        edges: [["state", "policy"], ["mcp_client", "mcp_sap"]],
        orch: p("lc_mw", "lg_parts", "cr_deleg"),
        orchEdge: p(["lc_mw", "lc_tools"], undefined, ["cr_proc", "cr_tools"]),
        trace: p(
          `ToolRetryMiddleware(max_retries=3, backoff_factor=2.0) → exhausted`,
          `RetryPolicy(max_attempts=3) exhausted → stock_ok() = "fallback"`,
          `max_retry_limit=3 reached for Procurement Specialist`
        ),
        state: { circuit_breaker: { "sap-mcp": "OPEN (5 min)" } },
        metrics: { tool: 3, ms: 7000 },
      });
      add({
        title: "Graceful degradation: alternate data path",
        detail:
          "The orchestrator re-routes: (1) read the cached SAP inventory snapshot (12 min old) → 1 unit in the Pune warehouse; (2) call Supplier MCP find_alternate(part) → SKF distributor, 36 h delivery, ₹48,500. Both are tagged ‘unverified-live’ in state.",
        layer: "mcp",
        status: "fallback",
        arch: ["a_parts", "mcp_client", "mcp_supplier", "d_supplier", "state"],
        edges: [["a_parts", "mcp_client"], ["mcp_client", "mcp_supplier"], ["mcp_supplier", "d_supplier"], ["orchestrator", "state"]],
        orch: p("lc_agent", "lg_fallback", "cr_deleg"),
        orchEdge: p(["lc_observe", "lc_agent"], ["lg_parts", "lg_fallback"], ["cr_deleg", "cr_mgr"]),
        trace: p(
          `LLM picks alternate tool: find_alternate (supplier MCP)`,
          `parts → alt_supplier (conditional edge "fallback")`,
          `Manager re-delegates: "Source part from alternate supplier"`
        ),
        metrics: { llm: 1, tool: 1, ms: 1500 },
      });
      add({
        title: "Decision recovered — with provenance",
        detail:
          "Plan continues: transfer 1 unit from Pune (ETA 8 h) and raise a backup PO with the distributor. The orchestrator records that stock data came from cache, so the human approver will see the caveat.",
        why: "Recovery isn’t just “try again” — it’s choosing the next-best trustworthy source and being transparent about it.",
        layer: "orchestration",
        status: "recover",
        arch: ["orchestrator", "state", "a_parts"],
        edges: [["orchestrator", "a_parts"], ["orchestrator", "state"]],
        orch: p("lc_agent", "lg_super", "cr_mgr"),
        orchEdge: p(undefined, ["lg_fallback", "lg_super"], undefined),
        trace: `state.parts = {source: "cache+supplier", caveat: "SAP unverified"} ✓`,
        state: { parts: { part: "SKF 7014 ACD/P4A", plan: "Transfer 1 from Pune (8h) + backup PO", source: "cache + supplier MCP", caveat: "SAP live check pending" } },
        metrics: { ms: 300 },
      });
    } else {
      add({
        title: "Parts agent checks SAP stock via MCP",
        detail: "sap.check_stock → 2 units of SKF 7014 ACD/P4A in Chennai stores (bin A-14-03). sap.reserve_material creates reservation #4410982.",
        why: "The same MCP client serves every agent; the SAP server owns auth, rate limits and the business API — agents never see credentials.",
        layer: "mcp",
        status: "ok",
        arch: ["a_parts", "mcp_client", "mcp_sap", "d_sap"],
        edges: [["orchestrator", "a_parts"], ["a_parts", "mcp_client"], ["mcp_client", "mcp_sap"], ["mcp_sap", "d_sap"]],
        orch: p("lc_t3", "lg_parts", "cr_proc"),
        orchEdge: p(["lc_agent", "lc_tools"], ["lg_super", "lg_parts"], ["cr_mgr", "cr_proc"]),
        trace: p(`tool_call check_stock {"part":"SKF 7014 ACD/P4A"} → MCP:sap ✓ qty=2`, `node parts → sap.check_stock ✓ → stock_ok() = "ok"`, `Procurement Specialist » Using tool: check_stock ✓`),
        state: { parts: { part: "SKF 7014 ACD/P4A", qty: 2, location: "CHN1 A-14-03", reservation: "4410982" } },
        metrics: { llm: 1, tool: 2, ms: 1300 },
      });
    }
  } else {
    add({
      title: "Parts agent cannot reach SAP",
      detail: "No MCP → no ERP access. The LLM asserts “the part is probably in stock” — an unverifiable claim. Nothing can be reserved or ordered.",
      layer: "agent",
      status: "fail",
      arch: ["a_parts"],
      edges: [["orchestrator", "a_parts"]],
      orch: p("lc_agent", "lg_parts", "cr_proc"),
      trace: p(`AIMessage("Part is probably in stock")  # unverified`, `node parts: no tools → assumption written to state`, `Procurement Specialist: cannot verify inventory`),
      state: { parts: { status: "UNKNOWN — assumed in stock" } },
      metrics: { llm: 1, ms: 700 },
    });
  }

  // 6 ─ Schedule (MCP → CMMS)
  if (mcp) {
    add({
      title: "Scheduler books a window via CMMS MCP",
      detail:
        "cmms.find_window(asset='CNC-07', duration='4h', skills=['spindle-cert']) → Saturday 22:00, Shift C, technician R. Kumar (certified). One low-priority batch is moved to Line 4.",
      layer: "mcp",
      status: "ok",
      arch: ["a_sched", "mcp_client", "mcp_cmms", "d_cmms"],
      edges: [["orchestrator", "a_sched"], ["a_sched", "mcp_client"], ["mcp_client", "mcp_cmms"], ["mcp_cmms", "d_cmms"]],
      orch: p("lc_tools", "lg_sched", "cr_plan"),
      orchEdge: p(["lc_agent", "lc_tools"], ["lg_super", "lg_sched"], ["cr_mgr", "cr_plan"]),
      trace: p(`tool_call find_window {"asset":"CNC-07","duration":"4h"} → MCP:cmms ✓`, `node scheduler → cmms.find_window ✓ → supervisor`, `Maintenance Planner » Using tool: find_window ✓`),
      state: { schedule: { window: "Sat 22:00–02:00 (Shift C)", technician: "R. Kumar (spindle-cert)", impact: "1 batch → Line 4" } },
      metrics: { llm: 1, tool: 1, ms: 1000 },
    });
  } else {
    add({
      title: "Scheduler can't see the CMMS",
      detail: "Proposes “the next available slot” without knowing shifts, technician certifications or the production plan.",
      layer: "agent",
      status: "fail",
      arch: ["a_sched"],
      edges: [["orchestrator", "a_sched"]],
      orch: p("lc_agent", "lg_sched", "cr_plan"),
      trace: `scheduler: no CMMS access → generic suggestion`,
      state: { schedule: { window: "“ASAP” (unverified)" } },
      metrics: { llm: 1, ms: 600 },
    });
  }

  // 7 ─ Safety review (RAG + guardrails)
  const safetyEdges: [string, string][] = [["orchestrator", "a_safety"], ["a_safety", "rag_retr"], ["rag_retr", "rag_vdb"], ["rag_vdb", "d_docs"]];
  if (rag && sc === "guardrail") {
    add({
      title: "Safety guardrail BLOCKS the plan",
      detail:
        "The draft plan says “swap the bearing with the spindle in standby to save 40 min”. The safety agent retrieves OSHA 1910.147 (Lockout/Tagout) and plant SOP-MNT-022 → violation: full energy isolation is mandatory. Guardrail returns BLOCK with a reason.",
      why: "Guardrails are part of orchestration, not an afterthought: they sit between ‘the model proposed’ and ‘the system acted’.",
      layer: "guard",
      status: "fail",
      arch: ["a_safety", "rag_retr", "d_docs", "g_guard"],
      edges: safetyEdges,
      orch: p("lc_mw", "lg_safety", "cr_guard"),
      orchEdge: p(["lc_mw", "lc_agent"], ["lg_super", "lg_safety"], ["cr_safe", "cr_know"]),
      trace: p(`after_model guardrail middleware → BLOCK: LOTO violation ✗`, `check_policy() → "violation" ✗`, `Task guardrail validate_loto → (False, "LOTO step missing") ✗`),
      state: { safety: { verdict: "BLOCK", reason: "LOTO (OSHA 1910.147 / SOP-MNT-022) missing" } },
      metrics: { llm: 1, rag: 1, ms: 1200 },
    });
    add({
      title: "Reflection loop: critique → revise",
      detail:
        "The orchestrator sends the critique back to the planner (max 2 revisions). The revised plan adds: LOTO on the main breaker, hydraulic accumulator bleed, zero-energy verification and permit-to-work PTW-7781. +40 min, zero shortcuts.",
      why: "Self-correction is an orchestration pattern: an evaluator gives structured feedback and the generator retries — always bounded by a max iteration count.",
      layer: "orchestration",
      status: "fallback",
      arch: ["orchestrator", "planner", "llm", "policy"],
      edges: [["orchestrator", "planner"], ["policy", "llm"], ["state", "policy"]],
      orch: p("lc_agent", "lg_reflect", "cr_deleg"),
      orchEdge: p(["lc_mw", "lc_agent"], ["lg_safety", "lg_reflect"], ["cr_guard", "cr_deleg"]),
      trace: p(`ToolMessage(guardrail_feedback) → LLM revises plan`, `reflect → safety   (revision 1 of 2)`, `Task re-executed with guardrail feedback (retry 1/2)`),
      metrics: { llm: 2, ms: 1600 },
    });
    add({
      title: "Revised plan passes the safety review",
      detail: "Guardrail re-checks against SOP-MNT-022: LOTO ✓ PPE ✓ permit ✓. Verdict PASS, with citations attached to the plan.",
      layer: "guard",
      status: "recover",
      arch: ["a_safety", "g_guard", "rag_retr"],
      edges: [["a_safety", "rag_retr"], ["orchestrator", "a_safety"]],
      orch: p("lc_agent", "lg_safety", "cr_safe"),
      orchEdge: p(undefined, ["lg_reflect", "lg_safety"], ["cr_deleg", "cr_mgr"]),
      trace: p(`guardrail middleware → PASS ✓`, `check_policy() → "pass" → human`, `Task guardrail validate_loto → (True) ✓`),
      state: { safety: { verdict: "PASS", citations: ["OSHA 1910.147", "SOP-MNT-022 §4"], permit: "PTW-7781" } },
      metrics: { llm: 1, rag: 1, ms: 900 },
    });
  } else if (rag) {
    add({
      title: "Safety & compliance review passes",
      detail:
        "The safety agent retrieves OSHA 1910.147 and SOP-MNT-022 and checks the plan: LOTO ✓, PPE ✓, permit-to-work ✓. Guardrails also check for PII and policy violations → PASS.",
      why: "RAG doesn’t only power answers — it powers verification. Guardrails are only as good as the policies they can retrieve.",
      layer: "guard",
      status: "ok",
      arch: ["a_safety", "rag_retr", "d_docs", "g_guard"],
      edges: safetyEdges,
      orch: p("lc_mw", "lg_safety", "cr_safe"),
      orchEdge: p(["lc_mw", "lc_agent"], ["lg_super", "lg_safety"], ["cr_mgr", "cr_safe"]),
      trace: p(`guardrail middleware → PASS ✓`, `check_policy() → "pass" → human`, `Safety Officer » knowledge: SOP-MNT-022 ✓ PASS`),
      state: { safety: { verdict: "PASS", citations: ["OSHA 1910.147", "SOP-MNT-022 §4"], permit: "PTW-7781" } },
      metrics: { llm: 1, rag: 1, ms: 1000 },
    });
  } else {
    add({
      title: "Safety review cannot verify anything",
      detail: "There is no SOP or regulation corpus to check against. The guardrail flags the plan as UNGROUNDED (no citations) → mandatory escalation to a human.",
      layer: "guard",
      status: "warn",
      arch: ["a_safety", "g_guard"],
      edges: [["orchestrator", "a_safety"]],
      orch: p("lc_mw", "lg_safety", "cr_guard"),
      trace: `guardrail → ESCALATE: ungrounded plan (0 citations)`,
      state: { safety: { verdict: "ESCALATE", reason: "no citations / ungrounded" } },
      metrics: { llm: 1, ms: 700 },
    });
  }

  // 8 ─ Work order draft + evaluation
  add({
    title: healthy ? "Work order drafted & evaluated" : "Work order drafted — evaluator scores it low",
    detail: healthy
      ? "The Work-Order Writer composes WO-2026-4471 from shared state (findings, root cause, parts, window, safety). An LLM-as-judge evaluator scores it: faithfulness 0.94, completeness 0.92, citations 5/5."
      : "The writer composes a work order from guesses. The evaluator scores faithfulness 0.38 and completeness 0.41: unverified part, unknown stock, no citations.",
    why: "Evaluation closes the loop: every run is traced and scored so you can detect quality drift before users do.",
    layer: "agent",
    status: healthy ? "ok" : "warn",
    arch: ["a_report", "state", "g_eval", "g_trace"],
    edges: [["orchestrator", "a_report"], ["orchestrator", "state"]],
    orch: p("lc_agent", "lg_super", "cr_mgr"),
    trace: healthy ? `eval: faithfulness=0.94 completeness=0.92 citations=5/5 ✓` : `eval: faithfulness=0.38 completeness=0.41 citations=0/5 ✗`,
    state: { work_order: healthy ? { id: "WO-2026-4471", eval_score: 0.93 } : { id: "DRAFT", eval_score: 0.39 } },
    metrics: { llm: 2, ms: 1500, tokens: 2600 },
  });

  // 9 ─ Human in the loop
  add({
    title: "Human-in-the-loop approval",
    detail:
      "Execution pauses and the state is checkpointed. The Maintenance Manager sees the plan, the evidence, citations and any caveats in the Ops Console, and decides.",
    why: p(
      "LangChain: HumanInTheLoopMiddleware interrupts before the create_work_order tool runs.",
      "LangGraph: interrupt() persists the graph; the run can resume hours later — even on another server — with Command(resume=…).",
      "CrewAI: human_input=True on the review task asks for human feedback before the task completes."
    ),
    layer: "experience",
    status: "info",
    arch: ["orchestrator", "hitl", "ui", "state"],
    edges: [["orchestrator", "hitl"], ["orchestrator", "state"], ["ui", "orchestrator"]],
    orch: p("lc_mw", "lg_human", "cr_human"),
    orchEdge: p(["lc_mw", "lc_tools"], ["lg_safety", "lg_human"], ["cr_guard", "cr_human"]),
    trace: p(`HumanInTheLoopMiddleware → interrupt on create_work_order ⏸`, `interrupt({"work_order": …}) — checkpoint saved ⏸`, `human_input=True — awaiting approval ⏸`),
    state: { status: "awaiting_approval" },
    metrics: { ms: 200 },
  });

  // 10 ─ Execute or reject
  if (healthy) {
    add({
      title: "Approved → actions executed through MCP",
      detail:
        "cmms.create_work_order → WO-2026-4471; sap.reserve_material confirmed; teams.post_message to the Line-3 channel. Estimated outcome: a 4 h planned stop instead of ~22 h of unplanned downtime.",
      layer: "mcp",
      status: "done",
      arch: ["hitl", "orchestrator", "mcp_client", "mcp_cmms", "d_cmms", "notify", "g_trace"],
      edges: [["orchestrator", "hitl"], ["orchestrator", "notify"], ["a_sched", "mcp_client"], ["mcp_client", "mcp_cmms"], ["mcp_cmms", "d_cmms"]],
      orch: p("lc_output", "lg_end", "cr_out"),
      orchEdge: p(["lc_agent", "lc_output"], ["lg_human", "lg_end"], ["cr_human", "cr_out"]),
      trace: p(`Command(resume={"decisions":[{"type":"approve"}]}) → create_work_order ✓`, `app.invoke(Command(resume="approve")) → END ✓`, `CrewOutput: WO-2026-4471 approved ✓`),
      state: { approved: true, status: "completed", outcome: { planned_stop_h: 4, downtime_avoided_h: 18, saving_inr: "₹3.2 Cr" } },
      metrics: { tool: 3, ms: 1200 },
    });
  } else {
    add({
      title: "Manager rejects the plan",
      detail:
        "Evidence is missing or ungrounded, so the manager cannot approve. The incident is handled manually — the ‘agentic’ system added latency, cost and risk, but no value.",
      layer: "experience",
      status: "fail",
      arch: ["hitl", "ui", "orchestrator"],
      edges: [["orchestrator", "hitl"]],
      orch: p("lc_output", "lg_end", "cr_out"),
      trace: `decision = "reject" — reason: ungrounded / unverifiable plan ✗`,
      state: { approved: false, status: "escalated_to_manual" },
      metrics: { ms: 200 },
    });
  }

  return steps;
}
