"use client";

import { motion } from "framer-motion";
import { Target, Clock, Gauge } from "lucide-react";

const benchmarks = [
  {
    model: "LLaMA-3-8B-Instruct",
    gpu: "NVIDIA L4",
    ttft: "~142ms",
    tps: "~847",
    status: "beta target",
  },
  {
    model: "LLaMA-3-70B-Instruct",
    gpu: "NVIDIA A10G",
    ttft: "~318ms",
    tps: "~124",
    status: "beta target",
  },
  {
    model: "Mistral-7B-Instruct-v0.3",
    gpu: "NVIDIA L4",
    ttft: "~98ms",
    tps: "~1,024",
    status: "beta target",
  },
  {
    model: "Mixtral-8x7B-Instruct",
    gpu: "NVIDIA A10G",
    ttft: "~276ms",
    tps: "~186",
    status: "beta target",
  },
];

export default function Benchmark() {
  return (
    <section id="benchmark" className="px-6 py-20 border-t border-gray-800">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white">Beta Target Benchmarks</h2>
          <p className="mt-3 text-gray-400">
            Projected inference performance for Q4 2026 GPU beta (vLLM load tests)
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900">
                  <th className="px-6 py-4 text-left font-medium text-gray-400">
                    Model
                  </th>
                  <th className="px-6 py-4 text-left font-medium text-gray-400">
                    GPU
                  </th>
                  <th className="px-6 py-4 text-left font-medium text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      TTFT (P50)
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left font-medium text-gray-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5" />
                      TPS
                    </span>
                  </th>
                  <th className="px-6 py-4 text-left font-medium text-gray-400">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {benchmarks.map((row, i) => (
                  <tr
                    key={row.model}
                    className={
                      i < benchmarks.length - 1
                        ? "border-b border-gray-800/50"
                        : ""
                    }
                  >
                    <td className="px-6 py-4 font-mono text-white">
                      {row.model}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{row.gpu}</td>
                    <td className="px-6 py-4 font-mono text-amber-400/90">
                      {row.ttft}
                    </td>
                    <td className="px-6 py-4 font-mono text-blue-400/90">
                      {row.tps}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-amber-400/90">
                        <Target className="h-3.5 w-3.5" />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Estimated targets · vLLM 0.6.x · batch size 1 · 512 token context ·
          validated in 90-day cloud GPU beta
        </p>
      </div>
    </section>
  );
}
