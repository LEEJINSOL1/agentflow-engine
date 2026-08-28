"use client";

import { motion } from "framer-motion";
import { ArrowRight, Target, Zap } from "lucide-react";

function BetaTargetBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm"
    >
      <Target className="h-3.5 w-3.5 text-amber-400" />
      <span className="text-amber-400 font-mono font-medium">
        Beta target: P50 TTFT &lt;200ms
      </span>
      <span className="text-gray-500">· Q4 2026</span>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-24 pb-20 md:pt-32 md:pb-28">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/80 px-4 py-1.5 text-sm text-gray-400"
        >
          <Zap className="h-3.5 w-3.5 text-blue-400" />
          A2A Protocol Ready · vLLM · FastAPI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl leading-tight"
        >
          Decentralized, Sub-second
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Inference Gateway
          </span>
          <br />
          for Autonomous AI Agents
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-gray-400"
        >
          Production-grade distributed inference serving with OpenAI-compatible
          APIs. Route agent requests across GPU worker nodes with sub-second
          latency and streaming responses.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <BetaTargetBadge />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <a
            href="#api"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors glow-ring"
          >
            View API Docs
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://api.agentflowengine.com/health"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-900/50 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-600 transition-colors"
          >
            API Health Check
          </a>
        </motion.div>
      </div>
    </section>
  );
}
