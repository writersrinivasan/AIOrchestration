"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, BookOpen, Factory, Home, Presentation, Sparkles } from "lucide-react";

const links = [
  { href: "/", label: "Overview", icon: Home, color: "from-violet-500 to-fuchsia-500" },
  { href: "/learn", label: "Learning Hub", icon: BookOpen, color: "from-sky-500 to-cyan-400" },
  { href: "/present", label: "Presentations", icon: Presentation, color: "from-fuchsia-500 to-pink-500" },
  { href: "/demo", label: "Industrial Demo", icon: Factory, color: "from-emerald-500 to-lime-400" },
  { href: "/assistant", label: "AI Assistant", icon: Bot, color: "from-amber-500 to-orange-500" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070914]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1760px] items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-sky-500 to-emerald-400 shadow-lg shadow-violet-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-sm font-bold text-white">AI Orchestration Studio</span>
            <span className="block text-[11px] text-slate-400">From one agent to many</span>
          </span>
        </Link>
        <nav className="ml-auto flex gap-1 overflow-x-auto">
          {links.map(({ href, label, icon: Icon, color }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? `bg-gradient-to-r ${color} text-white shadow-md`
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
