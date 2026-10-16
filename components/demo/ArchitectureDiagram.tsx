"use client";

import { useState } from "react";
import { ARCH_EDGES, ARCH_NODES, ARCH_NODE_MAP, BANDS, type ArchNode } from "@/lib/demo/architecture";
import { LAYER_META, STATUS_META, type Status } from "@/lib/demo/types";

const DEFAULT_W = 158;
const DEFAULT_H = 44;

function edgePath(a: ArchNode, b: ArchNode) {
  if (Math.abs(a.y - b.y) < 4) return `M${a.x},${a.y} L${b.x},${b.y}`;
  const my = (a.y + b.y) / 2;
  return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
}

export default function ArchitectureDiagram({
  active,
  visited,
  activeEdges,
  status,
  mcpOn,
  ragOn,
  running,
}: {
  active: Set<string>;
  visited: Set<string>;
  activeEdges: [string, string][];
  status: Status | null;
  mcpOn: boolean;
  ragOn: boolean;
  running: boolean;
}) {
  const [hover, setHover] = useState<ArchNode | null>(null);
  const statusColor = status ? STATUS_META[status].color : "#38bdf8";
  const alertStatus = status === "fail" || status === "fallback" || status === "warn" || status === "recover";
  const disabled = (layer: string) => (layer === "mcp" && !mcpOn) || (layer === "rag" && !ragOn);

  return (
    <div className="relative">
      <svg viewBox="0 0 1190 625" className="h-auto w-full select-none" role="img" aria-label="Enterprise AI orchestration architecture">
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id="hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(244,63,94,0.25)" strokeWidth="4" />
          </pattern>
        </defs>

        {/* Layer bands */}
        {BANDS.map((b) => {
          const meta = LAYER_META[b.layer];
          const off = disabled(b.layer);
          return (
            <g key={b.layer}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={14} fill={meta.soft} stroke={meta.color} strokeOpacity={0.35} strokeDasharray={off ? "6 5" : undefined} />
              {off && <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={14} fill="url(#hatch)" />}
              <text x={b.x + 12} y={b.y + 15} fontSize={b.layer === "guard" ? 9 : 10} fontWeight={800} letterSpacing={1.2} fill={meta.color}>
                {b.label}
              </text>
              {off && (
                <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 8} textAnchor="middle" fontSize={26} fontWeight={900} fill="#fb7185" opacity={0.85} letterSpacing={3}>
                  LAYER DISABLED
                </text>
              )}
            </g>
          );
        })}

        {/* Static wiring */}
        {ARCH_EDGES.map(([a, b]) => {
          const na = ARCH_NODE_MAP[a];
          const nb = ARCH_NODE_MAP[b];
          return <path key={`${a}-${b}`} d={edgePath(na, nb)} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={1.4} />;
        })}

        {/* Active flows */}
        {activeEdges.map(([a, b], i) => {
          const na = ARCH_NODE_MAP[a];
          const nb = ARCH_NODE_MAP[b];
          if (!na || !nb) return null;
          return (
            <g key={`act-${a}-${b}-${i}`}>
              <path d={edgePath(na, nb)} fill="none" stroke={statusColor} strokeOpacity={0.25} strokeWidth={7} />
              <path d={edgePath(na, nb)} fill="none" stroke={statusColor} strokeWidth={2.6} className="flow-edge" />
            </g>
          );
        })}

        {/* Nodes */}
        {ARCH_NODES.map((n) => {
          const w = n.w ?? DEFAULT_W;
          const h = n.h ?? DEFAULT_H;
          const meta = LAYER_META[n.layer];
          const isActive = active.has(n.id);
          const wasVisited = visited.has(n.id);
          const off = disabled(n.layer);
          const stroke = isActive ? (alertStatus ? statusColor : meta.color) : meta.color;
          const narrow = w < 130;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x - w / 2}, ${n.y - h / 2})`}
              opacity={off ? 0.28 : 1}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "default" }}
            >
              {isActive && (
                <rect width={w} height={h} rx={11} fill="none" stroke={stroke} strokeWidth={3} className="pulse-ring" />
              )}
              <g className={isActive && status === "fail" ? "shake" : undefined}>
                <rect width={w} height={h} rx={11} fill="#0b0e1d" />
                <rect
                  width={w}
                  height={h}
                  rx={11}
                  fill={isActive ? stroke : meta.color}
                  fillOpacity={isActive ? 0.3 : wasVisited ? 0.16 : 0.07}
                  stroke={stroke}
                  strokeOpacity={isActive ? 1 : wasVisited ? 0.75 : 0.4}
                  strokeWidth={isActive ? 2.4 : 1.2}
                  filter={isActive ? "url(#glow)" : undefined}
                />
                {!narrow && (
                  <text x={10} y={h / 2 + 6} fontSize={16}>
                    {n.icon}
                  </text>
                )}
                <text x={narrow ? 8 : 33} y={h / 2 - 3} fontSize={narrow ? 10.5 : 11.5} fontWeight={700} fill={isActive ? "#fff" : "#e2e8f0"} opacity={isActive || wasVisited ? 1 : 0.8}>
                  {narrow ? `${n.icon} ${n.label}` : n.label}
                </text>
                <text x={narrow ? 8 : 33} y={h / 2 + 11} fontSize={narrow ? 8 : 9.5} fill={n.layer === "mcp" && narrow ? "#6ee7b7" : "#94a3b8"} fontFamily={narrow ? "var(--font-mono), monospace" : undefined}>
                  {n.sub}
                </text>
              </g>
              {n.id === "g_trace" && running && (
                <circle cx={w - 10} cy={10} r={4} fill="#f43f5e">
                  <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
      {hover && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/10 bg-[#0b0e1d]/95 px-3 py-2 text-xs shadow-xl">
          <div className="font-semibold" style={{ color: LAYER_META[hover.layer].color }}>
            {hover.icon} {hover.label}
          </div>
          <div className="text-slate-400">
            {LAYER_META[hover.layer].label} · {hover.sub}
          </div>
        </div>
      )}
    </div>
  );
}
