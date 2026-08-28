"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Cpu, Globe, Layers, Server } from "lucide-react";

const nodes = [
  { id: "router", label: "Load Balancer", icon: Globe, x: 50, y: 15 },
  { id: "w1", label: "Worker L4", icon: Server, x: 20, y: 55 },
  { id: "w2", label: "Worker A10G", icon: Server, x: 50, y: 55 },
  { id: "w3", label: "Worker L4", icon: Server, x: 80, y: 55 },
  { id: "vllm", label: "vLLM Engine", icon: Cpu, x: 50, y: 85 },
];

const connections = [
  ["router", "w1"],
  ["router", "w2"],
  ["router", "w3"],
  ["w1", "vllm"],
  ["w2", "vllm"],
  ["w3", "vllm"],
];

export default function Architecture() {
  const [active, setActive] = useState<string | null>(null);

  const getPos = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <section id="architecture" className="px-6 py-20 border-t border-gray-800">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white">Architecture</h2>
          <p className="mt-3 text-gray-400">
            Distributed node orchestration with intelligent request routing
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 md:p-10"
        >
          <div className="relative aspect-[16/10] w-full max-w-3xl mx-auto">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 w-full h-full"
              aria-hidden
            >
              {connections.map(([from, to]) => {
                const a = getPos(from);
                const b = getPos(to);
                const isActive =
                  active === from ||
                  active === to ||
                  active === null;
                return (
                  <line
                    key={`${from}-${to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={
                      isActive && active !== null
                        ? "#3b82f6"
                        : "rgba(75, 85, 99, 0.5)"
                    }
                    strokeWidth="0.3"
                    strokeDasharray={active === null ? "1 1" : "none"}
                  />
                );
              })}
            </svg>

            {nodes.map((node) => {
              const Icon = node.icon;
              const isHighlighted = active === node.id || active === null;
              return (
                <button
                  key={node.id}
                  type="button"
                  onMouseEnter={() => setActive(node.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(node.id)}
                  onBlur={() => setActive(null)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <div
                    className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg border transition-colors ${
                      isHighlighted && active === node.id
                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                        : "border-gray-700 bg-gray-800 text-gray-400"
                    }`}
                  >
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap">
                    {node.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                icon: Globe,
                title: "Smart Router",
                desc: "Latency-aware load balancing across GPU nodes",
              },
              {
                icon: Layers,
                title: "Streaming",
                desc: "Server-sent events for real-time token delivery",
              },
              {
                icon: Cpu,
                title: "vLLM Backend",
                desc: "PagedAttention with continuous batching",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-gray-800 bg-gray-900 p-4"
              >
                <item.icon className="h-5 w-5 text-blue-400 mb-2" />
                <h3 className="font-semibold text-white text-sm">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
