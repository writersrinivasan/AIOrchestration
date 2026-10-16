"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, LayoutGrid, NotebookPen, Play, Shrink, X } from "lucide-react";
import { DECKS, DECK_MAP, type Deck, type Slide } from "@/lib/slides";
import SlideView, { SLIDE_H, SLIDE_W } from "./SlideView";
import AskAI from "@/components/AskAI";

function slideToText(s: Slide) {
  const parts = [s.title, s.subtitle, ...(s.bullets ?? []), ...(s.cards?.map((c) => `${c.title}: ${c.body ?? (c.tags ?? []).join(", ")}`) ?? [])];
  if (s.table) parts.push(s.table.head.join(" | "), ...s.table.rows.map((r) => r.join(" | ")));
  if (s.flow) parts.push(...s.flow.map((f) => `${f.label ?? "flow"}: ${f.steps.join(" -> ")}`));
  if (s.code) parts.push(`Code shown:\n${s.code.code}`);
  if (s.callout) parts.push(s.callout);
  return parts.filter(Boolean).join("\n");
}

/** Scales a 1280×720 slide to the width of its container. */
function Scaled({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setScale(w / SLIDE_W);
      else raf = requestAnimationFrame(update); // not laid out yet — try next frame
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} style={{ aspectRatio: "16 / 9", ...style }}>
      <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: "top left", opacity: scale ? 1 : 0 }}>{children}</div>
    </div>
  );
}

export default function Presenter() {
  const [deckId, setDeckId] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [notes, setNotes] = useState(false);
  const [grid, setGrid] = useState(false);
  const [fs, setFs] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const deck: Deck | null = deckId ? DECK_MAP[deckId] ?? null : null;
  const total = deck?.slides.length ?? 0;
  const slide = deck?.slides[idx];

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const d = q.get("deck");
    if (d && DECK_MAP[d]) {
      setDeckId(d);
      const s = Number(q.get("s"));
      if (s > 0) setIdx(Math.min(s - 1, DECK_MAP[d].slides.length - 1));
    }
  }, []);

  useEffect(() => {
    const url = deckId ? `?deck=${deckId}&s=${idx + 1}` : window.location.pathname;
    history.replaceState(null, "", url);
  }, [deckId, idx]);

  const open = (id: string, at = 0) => {
    setDeckId(id);
    setIdx(at);
    setGrid(false);
    window.scrollTo({ top: 0 });
  };

  const go = useCallback((d: number) => setIdx((i) => Math.max(0, Math.min(total - 1, i + d))), [total]);

  const toggleFs = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stageRef.current?.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (!deck) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        go(1);
      } else if (["ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") setIdx(0);
      else if (e.key === "End") setIdx(total - 1);
      else if (e.key.toLowerCase() === "f") toggleFs();
      else if (e.key.toLowerCase() === "n") setNotes((v) => !v);
      else if (e.key.toLowerCase() === "g" || e.key.toLowerCase() === "o") setGrid((v) => !v);
      else if (e.key === "Escape") setGrid(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deck, go, total, toggleFs]);

  if (!deck || !slide) return <Landing onOpen={open} />;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="glass flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2">
        <button onClick={() => setDeckId(null)} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" /> Decks
        </button>
        <div className="flex gap-1 overflow-x-auto">
          {DECKS.map((d) => (
            <button
              key={d.id}
              onClick={() => open(d.id)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${d.id === deck.id ? `bg-gradient-to-r ${d.gradient} text-white shadow` : "text-slate-300 hover:bg-white/10"}`}
            >
              {d.emoji} {d.title}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <AskAI
            label="Ask AI about this slide"
            prompt={`I'm presenting the slide "${slide.title}" from my ${deck.title} deck. Give me a crisp talk-track (60–90 seconds) for a live audience, one concrete example from our CNC predictive-maintenance use case, and one likely audience question with its answer.`}
            context={`Deck: ${deck.title}. Slide ${idx + 1}/${total}.\n${slideToText(slide)}`}
          />
          <ToolBtn on={notes} onClick={() => setNotes((v) => !v)} title="Speaker notes (N)">
            <NotebookPen className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn on={grid} onClick={() => setGrid((v) => !v)} title="Slide overview (G)">
            <LayoutGrid className="h-4 w-4" />
          </ToolBtn>
          <ToolBtn on={false} onClick={toggleFs} title="Fullscreen (F)">
            <Expand className="h-4 w-4" />
          </ToolBtn>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[250px_1fr]">
        {/* Slide list */}
        <aside className="glass scrollbar-thin hidden max-h-[calc(100vh-170px)] overflow-y-auto rounded-2xl p-2 xl:block">
          {deck.slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`mb-1 flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition ${i === idx ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"}`}
            >
              <span className="w-5 shrink-0 text-right font-mono text-[11px] leading-5" style={{ color: i === idx ? deck.accent : undefined }}>
                {i + 1}
              </span>
              <span className="leading-5">{s.title}</span>
            </button>
          ))}
        </aside>

        <div className="min-w-0 space-y-3">
          {/* Stage */}
          <div
            ref={stageRef}
            className={fs ? "group relative flex h-screen w-screen items-center justify-center bg-black" : "group relative mx-auto"}
            style={fs ? undefined : { maxWidth: "calc((100vh - 200px) * 16 / 9)" }}
          >
            <Scaled
              className={fs ? "" : "rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/50"}
              style={fs ? { width: "min(100vw, calc(100vh * 16 / 9))" } : { width: "100%" }}
            >
              <div key={`${deck.id}-${idx}`} className="fade-in">
                <SlideView slide={slide} deck={deck} index={idx} total={total} />
              </div>
            </Scaled>
            <button onClick={() => go(-1)} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 disabled:hidden" disabled={idx === 0}>
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button onClick={() => go(1)} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100 disabled:hidden" disabled={idx === total - 1}>
              <ChevronRight className="h-6 w-6" />
            </button>
            {fs && (
              <button onClick={toggleFs} className="absolute right-4 top-4 rounded-lg bg-black/50 p-2 text-white opacity-0 transition group-hover:opacity-100">
                <Shrink className="h-5 w-5" />
              </button>
            )}
            {fs && notes && slide.notes && (
              <div className="absolute bottom-4 left-1/2 w-[min(900px,90vw)] -translate-x-1/2 rounded-xl bg-black/80 p-3 text-sm text-slate-200">{slide.notes}</div>
            )}
          </div>

          {/* Progress */}
          <div className="mx-auto flex items-center gap-3" style={{ maxWidth: "calc((100vh - 200px) * 16 / 9)" }}>
            <button onClick={() => go(-1)} disabled={idx === 0} className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex flex-1 gap-1">
              {deck.slides.map((s, i) => (
                <button key={i} onClick={() => setIdx(i)} title={`${i + 1}. ${s.title}`} className="h-1.5 flex-1 rounded-full transition" style={{ background: i <= idx ? deck.accent : "rgba(148,163,184,0.18)" }} />
              ))}
            </div>
            <span className="font-mono text-xs text-slate-400">
              {idx + 1}/{total}
            </span>
            <button onClick={() => go(1)} disabled={idx === total - 1} className="rounded-lg bg-white/5 p-2 text-slate-300 hover:bg-white/10 disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {notes && (
            <div className="fade-in mx-auto rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm leading-relaxed text-violet-50" style={{ maxWidth: "calc((100vh - 200px) * 16 / 9)" }}>
              <div className="mb-1 text-xs font-bold uppercase tracking-widest text-violet-300">Speaker notes</div>
              {slide.notes ?? "No notes for this slide — use “Ask AI about this slide” for a talk-track."}
            </div>
          )}
          <p className="text-center text-xs text-slate-500">← → / Space navigate · F fullscreen · N notes · G overview · Home / End</p>
        </div>
      </div>

      {grid && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070914]/95 p-6 backdrop-blur" onClick={() => setGrid(false)}>
          <div className="mx-auto max-w-[1600px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center">
              <h2 className="text-xl font-bold text-white">
                {deck.emoji} {deck.title} — {total} slides
              </h2>
              <button onClick={() => setGrid(false)} className="ml-auto rounded-lg p-2 text-slate-300 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {deck.slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIdx(i);
                    setGrid(false);
                  }}
                  className={`overflow-hidden rounded-xl border text-left transition hover:scale-[1.02] ${i === idx ? "border-white/70" : "border-white/10"}`}
                >
                  <Scaled>
                    <SlideView slide={s} deck={deck} index={i} total={total} />
                  </Scaled>
                  <div className="truncate bg-white/5 px-2 py-1 text-xs text-slate-300">
                    {i + 1}. {s.title}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className={`rounded-lg p-2 transition ${on ? "bg-violet-500/30 text-white" : "text-slate-300 hover:bg-white/10"}`}>
      {children}
    </button>
  );
}

function Landing({ onOpen }: { onOpen: (id: string, at?: number) => void }) {
  return (
    <div className="space-y-6">
      <header className="glass rounded-3xl p-8">
        <div className="text-xs font-semibold uppercase tracking-widest text-violet-300">Presentation mode</div>
        <h1 className="mt-1 text-4xl font-black text-white">
          Framework decks · <span className="gradient-text">the 360° view</span>
        </h1>
        <p className="mt-2 max-w-3xl text-slate-300">
          Four presenter-ready decks with speaker notes, real code for the plant use case, and an AI talk-track on every slide. Present in the browser or go fullscreen (F).
        </p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        {DECKS.map((d, n) => (
          <div key={d.id} className="glass group overflow-hidden rounded-2xl">
            <button onClick={() => onOpen(d.id)} className="block w-full text-left">
              <Scaled>
                <SlideView slide={d.slides[0]} deck={d} index={0} total={d.slides.length} />
              </Scaled>
            </button>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{d.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Deck {n + 1} · {d.slides.length} slides
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{d.title}</h2>
                  <p className="text-sm text-slate-400">{d.subtitle}</p>
                </div>
                <button onClick={() => onOpen(d.id)} className={`flex items-center gap-2 rounded-xl bg-gradient-to-r ${d.gradient} px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:brightness-110`}>
                  <Play className="h-4 w-4" /> Present
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {d.slides.slice(1).map((s, i) => (
                  <button key={i} onClick={() => onOpen(d.id, i + 1)} className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white">
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
