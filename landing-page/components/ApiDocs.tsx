"use client";

import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

const snippets = {
  curl: `curl https://api.agentflowengine.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $AGENTFLOW_API_KEY" \\
  -d '{
    "model": "llama-3-8b-instruct",
    "messages": [
      {"role": "user", "content": "Summarize the latest agent task."}
    ],
    "stream": true,
    "max_tokens": 512
  }'`,
  python: `import requests

response = requests.post(
    "https://api.agentflowengine.com/v1/chat/completions",
    headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "model": "llama-3-8b-instruct",
        "messages": [
            {"role": "user", "content": "Summarize the latest agent task."}
        ],
        "stream": True,
        "max_tokens": 512,
    },
    stream=True,
)

for line in response.iter_lines():
    if line:
        print(line.decode("utf-8"))`,
};

type Tab = keyof typeof snippets;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="absolute top-3 right-3 rounded-md p-1.5 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
      aria-label="Copy code"
    >
      {copied ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

export default function ApiDocs() {
  const [tab, setTab] = useState<Tab>("curl");
  const tabs: { id: Tab; label: string }[] = [
    { id: "curl", label: "cURL" },
    { id: "python", label: "Python" },
  ];

  return (
    <section id="api" className="px-6 py-20 border-t border-gray-800">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white">API Integration</h2>
          <p className="mt-3 text-gray-400">
            OpenAI-compatible endpoints — drop-in replacement for agent
            frameworks
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-800 bg-gray-900/50 overflow-hidden"
        >
          <div className="flex border-b border-gray-800">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "text-white border-b-2 border-blue-500 bg-gray-900"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <CopyButton text={snippets[tab]} />
            <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
              <code className="font-mono text-gray-300">{snippets[tab]}</code>
            </pre>
          </div>
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {["OpenAI Compatible", "Streaming SSE", "A2A Protocol Ready"].map(
            (badge) => (
              <span
                key={badge}
                className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-xs text-gray-400"
              >
                {badge}
              </span>
            )
          )}
        </div>
      </div>
    </section>
  );
}
