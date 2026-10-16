"use client";

import { ORCH_GRAPHS, type OrchNode } from "@/lib/demo/frameworks";
import { STATUS_META, type Framework, type Status } from "@/lib/demo/types";

function size(n: OrchNode) {
  const w = n.w ?? 120;
  const h = n.shape === "pill" ? 26 : n.shape === "diamond" ? 40 : n.sub ? 36 : 26;
  return { w, h };
}

function clipPoint(from: OrchNode, to: OrchNode, which: "start" | "end") {
  const node = which === "start" ? from : to;
  const { w, h } = size(node);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const s = Math.min(dx === 0 ? Infinity : w / 2 / Math.abs(dx), dy === 0 ? Infinity : h / 2 / Math.abs(dy));
  return which === "start" ? { x: from.x + dx * s, y: from.y + dy * s } : { x: to.x - dx * s, y: to.y - dy * s };
}

export default function OrchestrationGraph({
  framework,
  activeNode,
  activeEdge,
  visited,
  status,
}: {
  framework: Framework;
  activeNode: string | null;
  activeEdge?: string[];
  visited: Set<string>;
  status: Status | null;
}) {
  const g = ORCH_GRAPHS[framework];
  const byId = Object.fromEntries(g.nodes.map((n) => [n.id, n]));
  const statusColor = status ? STATUS_META[status].color : "#38bdf8";
  const alert = status === "fail" || status === "fallback" || status === "warn" || status === "recover";
  const keyOf = (a: string, b: string) => `${a}>${b}`;
  const edgeSet = new Set(g.edges.map((e) => keyOf(e.from, e.to)));

  return (
    <div>
      <svg viewBox="0 0 420 440" className="h-auto w-full select-none">
        <defs>
          <marker id={`arrow-${framework}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="rgba(148,163,184,0.7)" />
          </marker>
          <marker id={`arrow-act-${framework}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={statusColor} />
          </marker>
          <filter id="oglow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {framework === "langchain" && (
          <g>
            <rect x={28} y={278} width={364} height={84} rx={10} fill="rgba(16,185,129,0.05)" stroke="rgba(16,185,129,0.4)" strokeDasharray="4 4" />
            <text x={36} y={274} fontSize={8.5} fill="#6ee7b7" fontWeight={700} letterSpacing={0.8}>
              TOOLS BOUND TO THE AGENT (MCP + RAG retriever)
            </text>
            <line x1={210} y1={238} x2={210} y2={278} stroke="rgba(16,185,129,0.5)" strokeDasharray="3 3" />
          </g>
        )}

        {[...g.edges, ...(activeEdge && !edgeSet.has(keyOf(activeEdge[0], activeEdge[1])) ? [{ from: activeEdge[0], to: activeEdge[1], dashed: false, label: undefined }] : [])].map((e) => {
          const a = byId[e.from];
          const b = byId[e.to];
          if (!a || !b) return null;
          const s = clipPoint(a, b, "start");
          const t = clipPoint(a, b, "end");
          const reverse = edgeSet.has(keyOf(e.to, e.from));
          const isActive = activeEdge && activeEdge[0] === e.from && activeEdge[1] === e.to;
          let d = `M${s.x},${s.y} L${t.x},${t.y}`;
          const vertical = Math.abs(t.x - s.x) < Math.abs(t.y - s.y);
          let lx = (s.x + t.x) / 2 + (vertical ? 5 : 0);
          let ly = (s.y + t.y) / 2 + (vertical ? 3 : -3);
          if (reverse) {
            const len = Math.hypot(t.x - s.x, t.y - s.y) || 1;
            const nx = -(t.y - s.y) / len;
            const ny = (t.x - s.x) / len;
            const cx = lx + nx * 16;
            const cy = ly + ny * 16;
            d = `M${s.x},${s.y} Q${cx},${cy} ${t.x},${t.y}`;
            lx = cx;
            ly = cy;
          }
          return (
            <g key={keyOf(e.from, e.to)}>
              <path
                d={d}
                fill="none"
                stroke={isActive ? statusColor : "rgba(148,163,184,0.45)"}
                strokeWidth={isActive ? 2.6 : 1.2}
                strokeDasharray={isActive ? undefined : e.dashed ? "4 4" : undefined}
                className={isActive ? "flow-edge" : undefined}
                markerEnd={`url(#${isActive ? "arrow-act-" : "arrow-"}${framework})`}
              />
              {e.label && (
                <text x={lx} y={ly} textAnchor={vertical && !reverse ? "start" : "middle"} fontSize={8.5} fill={isActive ? statusColor : "#94a3b8"} fontStyle="italic">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {g.nodes.map((n) => {
          const { w, h } = size(n);
          const isActive = n.id === activeNode;
          const wasVisited = visited.has(n.id);
          const stroke = isActive && alert ? statusColor : n.color;
          const common = {
            fill: isActive ? stroke : n.color,
            fillOpacity: isActive ? 0.35 : wasVisited ? 0.18 : 0.08,
            stroke,
            strokeWidth: isActive ? 2.4 : 1.2,
            strokeOpacity: isActive ? 1 : wasVisited ? 0.85 : 0.5,
            filter: isActive ? "url(#oglow)" : undefined,
          };
          return (
            <g key={n.id} className={isActive && status === "fail" ? "shake" : undefined}>
              {n.shape === "diamond" ? (
                <>
                  <polygon points={`${n.x},${n.y - h / 2} ${n.x + w / 2},${n.y} ${n.x},${n.y + h / 2} ${n.x - w / 2},${n.y}`} fill="#0b0e1d" />
                  <polygon points={`${n.x},${n.y - h / 2} ${n.x + w / 2},${n.y} ${n.x},${n.y + h / 2} ${n.x - w / 2},${n.y}`} {...common} />
                </>
              ) : (
                <>
                  <rect x={n.x - w / 2} y={n.y - h / 2} width={w} height={h} rx={n.shape === "pill" ? h / 2 : 8} fill="#0b0e1d" />
                  <rect x={n.x - w / 2} y={n.y - h / 2} width={w} height={h} rx={n.shape === "pill" ? h / 2 : 8} {...common} />
                </>
              )}
              {isActive && (
                <rect x={n.x - w / 2} y={n.y - h / 2} width={w} height={h} rx={n.shape === "pill" ? h / 2 : 8} fill="none" stroke={stroke} strokeWidth={2.5} className="pulse-ring" />
              )}
              <text x={n.x} y={n.sub ? n.y - 2 : n.y + 3.5} textAnchor="middle" fontSize={10.5} fontWeight={700} fill="#f1f5f9" fontFamily={framework === "langgraph" && n.shape !== "pill" ? "var(--font-mono), monospace" : undefined}>
                {n.label}
              </text>
              {n.sub && (
                <text x={n.x} y={n.y + 11} textAnchor="middle" fontSize={8.5} fill="#94a3b8">
                  {n.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{g.caption}</p>
    </div>
  );
}
