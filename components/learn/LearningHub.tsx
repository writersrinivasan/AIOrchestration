"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Info, Lightbulb, TriangleAlert, XCircle } from "lucide-react";
import { AGENDA, GLOSSARY, MODULES, type Block, type QuizQ } from "@/lib/learning";
import { Anatomy, DefenseVisual, FrameworksVisual, Ladder, McpVisual, PatternGallery, RagVisual } from "./Visuals";
import AskAI from "@/components/AskAI";
import { Markdown } from "@/lib/markdown";

export default function LearningHub() {
  const [active, setActive] = useState<string>("agenda");

  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h) setActive(h);
  }, []);

  const select = (id: string) => {
    setActive(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const mod = MODULES.find((m) => m.id === active);

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-[80px] lg:self-start">
        <div className="glass rounded-2xl p-3">
          <div className="px-2 pb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Learning path</div>
          <NavItem id="agenda" active={active} onClick={select} emoji="🗓️" title="2-hour session agenda" gradient="from-fuchsia-500 to-violet-500" />
          {MODULES.map((m, i) => (
            <NavItem key={m.id} id={m.id} active={active} onClick={select} emoji={m.emoji} title={`${i + 1}. ${m.title}`} gradient={m.gradient} />
          ))}
          <NavItem id="glossary" active={active} onClick={select} emoji="📖" title="Glossary" gradient="from-slate-500 to-slate-600" />
        </div>
      </aside>

      <div className="min-w-0">
        {active === "agenda" && <AgendaView onOpen={select} />}
        {active === "glossary" && <GlossaryView />}
        {mod && (
          <article key={mod.id} className="fade-in space-y-5">
            <header className={`overflow-hidden rounded-2xl bg-gradient-to-r ${mod.gradient} p-[1px]`}>
              <div className="rounded-2xl bg-[#0b0e1d]/90 p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="text-5xl">{mod.emoji}</div>
                  <div className="min-w-[240px] flex-1">
                    <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{mod.title}</h1>
                    <p className="mt-1 text-slate-300">{mod.subtitle}</p>
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" /> ~{mod.minutes} min in session
                    </div>
                  </div>
                  <AskAI
                    label="Ask AI about this module"
                    prompt={`Teach the module "${mod.title}" (${mod.subtitle}) to my audience in a crisp, engaging way. Include one real-world example from manufacturing and one common misconception.`}
                    context={`Learning Hub module: ${mod.title}. Key takeaways: ${mod.takeaways.join("; ")}`}
                  />
                </div>
              </div>
            </header>

            {mod.sections.map((s) => (
              <section key={s.heading} className="glass rounded-2xl p-5">
                <h2 className="mb-3 text-lg font-bold text-white">{s.heading}</h2>
                <div className="space-y-4">
                  {s.blocks.map((b, i) => (
                    <BlockView key={i} block={b} />
                  ))}
                </div>
              </section>
            ))}

            <section className="grid gap-5 md:grid-cols-2">
              <div className="glass rounded-2xl p-5">
                <h2 className="mb-3 text-lg font-bold text-white">🎯 Key takeaways</h2>
                <ul className="space-y-2">
                  {mod.takeaways.map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              {mod.quiz && (
                <div className="glass rounded-2xl p-5">
                  <h2 className="mb-3 text-lg font-bold text-white">🧠 Knowledge check</h2>
                  {mod.quiz.map((q, i) => (
                    <Quiz key={i} q={q} />
                  ))}
                </div>
              )}
            </section>

            <ModulePager current={mod.id} onOpen={select} />
          </article>
        )}
      </div>
    </div>
  );
}

function NavItem({ id, active, onClick, emoji, title, gradient }: { id: string; active: string; onClick: (id: string) => void; emoji: string; title: string; gradient: string }) {
  const on = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${on ? `bg-gradient-to-r ${gradient} font-semibold text-white shadow` : "text-slate-300 hover:bg-white/5"}`}
    >
      <span className="text-base">{emoji}</span>
      <span className="truncate">{title}</span>
    </button>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return <div className="text-[15px] leading-relaxed text-slate-300"><Markdown text={block.text} /></div>;
    case "bullets":
      return (
        <ul className="space-y-2">
          {block.items.map((it) => (
            <li key={it} className="flex gap-2 text-sm text-slate-300">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-violet-400 to-sky-400" />
              <span className="min-w-0 flex-1 [&_p]:m-0">
                <Markdown text={it} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "code":
      return (
        <div>
          {block.title && <div className="mb-1 text-xs font-semibold text-sky-300">{block.title}</div>}
          <pre className="scrollbar-thin overflow-x-auto rounded-xl border border-white/10 bg-[#05060f] p-4 font-mono text-[12.5px] leading-relaxed text-emerald-200">
            <code>{block.code}</code>
          </pre>
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-white/5">
              <tr>
                {block.head.map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-sky-300">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-white/5 odd:bg-white/[0.015]">
                  {r.map((c, j) => (
                    <td key={j} className={`px-3 py-2 align-top ${j === 0 ? "font-semibold text-slate-100" : "text-slate-300"}`}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout": {
      const tone = {
        info: { cls: "border-sky-400/40 bg-sky-500/10 text-sky-100", icon: <Info className="h-4 w-4 text-sky-300" /> },
        tip: { cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100", icon: <Lightbulb className="h-4 w-4 text-emerald-300" /> },
        warn: { cls: "border-amber-400/40 bg-amber-500/10 text-amber-100", icon: <TriangleAlert className="h-4 w-4 text-amber-300" /> },
      }[block.tone];
      return (
        <div className={`flex gap-2 rounded-xl border p-3 text-sm ${tone.cls}`}>
          <span className="mt-0.5 shrink-0">{tone.icon}</span>
          <span>{block.text}</span>
        </div>
      );
    }
    case "visual":
      return {
        ladder: <Ladder />,
        patterns: <PatternGallery />,
        mcp: <McpVisual />,
        rag: <RagVisual />,
        defense: <DefenseVisual />,
        anatomy: <Anatomy />,
        frameworks: <FrameworksVisual />,
      }[block.name];
  }
}

function Quiz({ q }: { q: QuizQ }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div className="mb-3">
      <div className="mb-2 text-sm font-semibold text-slate-100">{q.q}</div>
      <div className="space-y-1.5">
        {q.options.map((o, i) => {
          const chosen = pick === i;
          const correct = i === q.answer;
          const show = pick !== null;
          return (
            <button
              key={o}
              onClick={() => setPick(i)}
              className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                show && correct ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100" : show && chosen ? "border-rose-400/60 bg-rose-500/15 text-rose-100" : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/5"
              }`}
            >
              {show && correct ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : show && chosen ? <XCircle className="h-4 w-4 text-rose-400" /> : <span className="h-4 w-4 rounded-full border border-slate-500" />}
              {o}
            </button>
          );
        })}
      </div>
      {pick !== null && <div className="fade-in mt-2 text-xs text-slate-400">💡 {q.explain}</div>}
    </div>
  );
}

function ModulePager({ current, onOpen }: { current: string; onOpen: (id: string) => void }) {
  const i = MODULES.findIndex((m) => m.id === current);
  const prev = MODULES[i - 1];
  const next = MODULES[i + 1];
  return (
    <div className="flex justify-between gap-3">
      {prev ? (
        <button onClick={() => onOpen(prev.id)} className="glass rounded-xl px-4 py-3 text-left text-sm hover:bg-white/5">
          <div className="text-xs text-slate-500">← Previous</div>
          <div className="font-semibold text-white">
            {prev.emoji} {prev.title}
          </div>
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button onClick={() => onOpen(next.id)} className="glass rounded-xl px-4 py-3 text-right text-sm hover:bg-white/5">
          <div className="text-xs text-slate-500">Next →</div>
          <div className="font-semibold text-white">
            {next.emoji} {next.title}
          </div>
        </button>
      )}
    </div>
  );
}

function AgendaView({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="fade-in space-y-5">
      <header className="glass rounded-2xl p-6">
        <div className="text-xs font-semibold uppercase tracking-widest text-fuchsia-400">Training session · 120 minutes</div>
        <h1 className="mt-1 text-3xl font-extrabold text-white">
          AI Orchestration: <span className="gradient-text">from a single agent to multi-agent architecture</span>
        </h1>
        <p className="mt-2 max-w-3xl text-slate-300">
          A hands-on journey through how orchestration plans, delegates, fails, falls back and recovers — grounded in a real predictive-maintenance use case and
          demonstrated on LangChain, LangGraph and CrewAI.
        </p>
      </header>

      <section className="glass rounded-2xl p-5">
        <h2 className="mb-4 text-lg font-bold text-white">🗓️ Session timeline</h2>
        <div className="mb-4 flex h-4 overflow-hidden rounded-full">
          {AGENDA.map((a) => (
            <div key={a.time} style={{ width: `${(a.mins / 120) * 100}%`, background: a.color }} title={a.title} />
          ))}
        </div>
        <ol className="space-y-2">
          {AGENDA.map((a) => (
            <li key={a.time} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <span className="w-12 font-mono text-sm font-bold" style={{ color: a.color }}>
                {a.time}
              </span>
              <span className="h-8 w-1 rounded-full" style={{ background: a.color }} />
              <span className="flex-1 text-sm font-semibold text-white">{a.title}</span>
              <span className="hidden text-xs text-slate-400 sm:block">{a.where}</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-slate-300">{a.mins} min</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m, i) => (
          <button key={m.id} onClick={() => onOpen(m.id)} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] text-left transition hover:-translate-y-0.5 hover:border-white/20">
            <div className={`h-1.5 bg-gradient-to-r ${m.gradient}`} />
            <div className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs font-semibold text-slate-500">Module {i + 1}</span>
              </div>
              <div className="mt-1 font-bold text-white group-hover:underline">{m.title}</div>
              <div className="text-xs text-slate-400">{m.subtitle}</div>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}

function GlossaryView() {
  return (
    <div className="fade-in glass rounded-2xl p-5">
      <h1 className="mb-4 text-2xl font-extrabold text-white">📖 Glossary</h1>
      <div className="grid gap-2 md:grid-cols-2">
        {GLOSSARY.map((g) => (
          <div key={g.term} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-sm font-bold text-sky-300">{g.term}</div>
            <div className="text-sm text-slate-300">{g.def}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
