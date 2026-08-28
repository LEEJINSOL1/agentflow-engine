import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentFlow Engine — Distributed Inference Gateway for AI Agents",
  description:
    "High-throughput, low-latency distributed inference gateway for autonomous AI agents. OpenAI-compatible API powered by vLLM and FastAPI.",
  keywords: [
    "AI agents",
    "LLM inference",
    "vLLM",
    "distributed inference",
    "A2A protocol",
  ],
  openGraph: {
    title: "AgentFlow Engine",
    description:
      "Sub-second inference gateway for autonomous AI agents. Production-ready, OpenAI-compatible API.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#030712] text-gray-100">
        {children}
      </body>
    </html>
  );
}
