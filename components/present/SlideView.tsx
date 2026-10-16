"use client";

import { useLayoutEffect, useRef } from "react";
import type { Deck, Slide } from "@/lib/slides/types";
import { highlight } from "@/lib/highlight";

export const SLIDE_W = 1280;
export const SLIDE_H = 720;

/** Renders **bold** and `code` inside short slide strings. */
function rich(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((t, i) => {
    if (t.startsWith("**")) return <strong key={i} className="font-semibold text-white">{t.slice(2, -2)}</strong>;
    if (t.startsWith("`")) return <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.85em] text-emerald-200">{t.slice(1, -1)}</code>;
    return t;
  });
}

/** A single 1280×720 slide. Dense content is auto-shrunk (CSS zoom) so it always fits. */
export default function SlideView({ slide, deck, index, total }: { slide: Slide; deck: Deck; index: number; total: number }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    const inner = innerRef.current;
    if (!body || !inner) return;
    inner.style.zoom = "1";
    // Shrink code blocks whose longest line is wider than the block
    inner.querySelectorAll("pre").forEach((pre) => {
      pre.style.fontSize = "";
      const ratio = pre.clientWidth / pre.scrollWidth;
      if (ratio < 1) pre.style.fontSize = `${Math.max(10, 13.5 * ratio * 0.98)}px`;
    });
    const avail = body.clientHeight;
    const need = inner.scrollHeight;
    if (need > avail) inner.style.zoom = String(Math.max(0.55, (avail / need) * 0.98));
  }, [slide]);

  const accent = deck.accent;

  return (
    <div
      className="relative overflow-hidden text-slate-200"
      style={{
        width: SLIDE_W,
        height: SLIDE_H,
        background: `radial-gradient(900px 500px at 105% -10%, ${accent}33, transparent 60%), radial-gradient(700px 500px at -10% 110%, #8b5cf622, transparent 60%), #090b18`,
      }}
    >
      <div className={`absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r ${deck.gradient}`} />

      {slide.layout === "title" ? (
        <div className="flex h-full items-center gap-10 px-20">
          <div className="min-w-0 flex-1">
            {slide.kicker && (
              <div className="mb-5 text-[17px] font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>
                {slide.kicker}
              </div>
            )}
            <h1 className={`bg-gradient-to-r ${deck.gradient} bg-clip-text pb-2 text-[68px] font-black leading-[1.05] text-transparent`}>{slide.title}</h1>
            {slide.subtitle && <p className="mt-5 max-w-[820px] text-[26px] leading-snug text-slate-300">{slide.subtitle}</p>}
            {slide.chips && (
              <div className="mt-9 flex max-w-[860px] flex-wrap gap-2.5">
                {slide.chips.map((c) => (
                  <span key={c} className="rounded-full border px-4 py-1.5 text-[16px] font-semibold text-white" style={{ borderColor: accent + "88", background: accent + "1f" }}>
                    {c}
                  </span>
                ))}
              </div>
            )}
          </div>
          {slide.emoji && <div className="shrink-0 text-[150px] leading-none drop-shadow-[0_0_40px_rgba(139,92,246,0.35)]">{slide.emoji}</div>}
        </div>
      ) : (
        <div className="flex h-full flex-col px-14 pb-12 pt-10">
          <header className="mb-5 shrink-0">
            {slide.kicker && (
              <div className="mb-1.5 text-[14px] font-bold uppercase tracking-[0.22em]" style={{ color: accent }}>
                {slide.kicker}
              </div>
            )}
            <h2 className="text-[38px] font-extrabold leading-tight text-white">
              {slide.emoji && <span className="mr-3">{slide.emoji}</span>}
              {slide.title}
            </h2>
            {slide.subtitle && <p className="mt-1 text-[19px] text-slate-400">{slide.subtitle}</p>}
          </header>

          <div ref={bodyRef} className="min-h-0 flex-1 overflow-hidden">
            <div ref={innerRef} className="flex flex-col gap-5">
              {slide.flow?.map((f, i) => <FlowRow key={i} {...f} />)}

              {slide.cards && <Cards cards={slide.cards} cols={slide.cols ?? 3} />}

              {slide.code && (
                <div className={slide.bullets ? "grid grid-cols-[0.82fr_1.18fr] gap-6" : ""}>
                  {slide.bullets && <Bullets items={slide.bullets} accent={accent} />}
                  <CodeBlock title={slide.code.title} code={slide.code.code} />
                </div>
              )}

              {slide.table && <Table head={slide.table.head} rows={slide.table.rows} accent={accent} />}

              {!slide.code && slide.bullets && <Bullets items={slide.bullets} accent={accent} />}

              {slide.callout && (
                <div className="rounded-2xl border px-5 py-3.5 text-[18px] font-medium text-white" style={{ borderColor: accent + "77", background: `linear-gradient(90deg, ${accent}2a, transparent)` }}>
                  💡 {rich(slide.callout)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="absolute bottom-3 left-14 right-14 flex items-center text-[13px] text-slate-500">
        <span>
          {deck.emoji} {deck.title}
        </span>
        <span className="mx-3 h-3 w-px bg-slate-700" />
        <span>AI Orchestration — from one agent to many</span>
        <span className="ml-auto font-mono">
          {index + 1} / {total}
        </span>
      </footer>
    </div>
  );
}

function Bullets({ items, accent }: { items: string[]; accent: string }) {
  return (
    <ul className="space-y-3">
      {items.map((b) => (
        <li key={b} className="flex gap-3 text-[20px] leading-snug text-slate-300">
          <span className="mt-[9px] h-2.5 w-2.5 shrink-0 rotate-45 rounded-[2px]" style={{ background: accent }} />
          <span>{rich(b)}</span>
        </li>
      ))}
    </ul>
  );
}

function Cards({ cards, cols }: { cards: NonNullable<Slide["cards"]>; cols: number }) {
  const grid = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" }[cols] ?? "grid-cols-3";
  return (
    <div className={`grid ${grid} gap-3.5`}>
      {cards.map((c) => (
        <div key={c.title} className="rounded-2xl border p-4" style={{ borderColor: c.color + "66", background: `linear-gradient(160deg, ${c.color}26, ${c.color}08 70%)` }}>
          <div className="flex items-center gap-2">
            {c.emoji && <span className="text-[24px]">{c.emoji}</span>}
            <div className="min-w-0">
              <div className="text-[18px] font-bold leading-tight text-white">{c.title}</div>
              {c.sub && (
                <div className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: c.color }}>
                  {c.sub}
                </div>
              )}
            </div>
          </div>
          {c.body && <p className="mt-2 text-[14.5px] leading-snug text-slate-300">{c.body}</p>}
          {c.tags && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {c.tags.map((t) => (
                <span key={t} className="rounded-md px-2 py-0.5 text-[13px] font-medium text-white" style={{ background: c.color + "33" }}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FlowRow({ label, color, steps }: { label?: string; color: string; steps: string[] }) {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="w-[120px] shrink-0 text-[13px] font-bold uppercase tracking-wider" style={{ color }}>
          {label}
        </span>
      )}
      <div className="flex flex-1 flex-wrap items-center gap-1.5">
        {steps.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="rounded-xl border px-3 py-2 text-[15px] font-semibold text-white" style={{ borderColor: color + "88", background: color + "24" }}>
              {s}
            </span>
            {i < steps.length - 1 && <span className="text-[18px] text-slate-500">→</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#04050c]">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        {title && <span className="ml-2 text-[13px] text-slate-400">{title}</span>}
      </div>
      <pre className="overflow-hidden whitespace-pre px-4 py-3 font-mono text-[13.5px] leading-[1.5]">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  );
}

function Table({ head, rows, accent }: { head: string[]; rows: string[][]; accent: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="w-full text-[15px]">
        <thead>
          <tr style={{ background: accent + "22" }}>
            {head.map((h, i) => (
              <th key={i} className="px-3.5 py-2.5 text-left text-[13px] font-bold uppercase tracking-wider text-white">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 ? "bg-white/[0.025]" : ""}>
              {r.map((c, j) => (
                <td key={j} className={`border-t border-white/5 px-3.5 py-2 align-top leading-snug ${j === 0 ? "font-semibold text-white" : "text-slate-300"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
