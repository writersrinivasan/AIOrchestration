import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-jb" });

export const metadata: Metadata = {
  title: "AI Orchestration Studio — From One to Many Agents",
  description:
    "Interactive training app: single-agent to multi-agent orchestration, MCP, RAG, fallback & recovery, demonstrated on LangChain, LangGraph and CrewAI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Nav />
        <main className="mx-auto max-w-[1760px] px-4 pb-16 pt-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
