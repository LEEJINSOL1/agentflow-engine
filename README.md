# AgentFlow Engine

**High-throughput, Low-latency Distributed Inference Gateway for Autonomous AI Agents**

[![Website](https://img.shields.io/badge/website-agentflowengine.com-blue)](https://agentflowengine.com)
[![Stack](https://img.shields.io/badge/stack-vLLM%20%7C%20FastAPI%20%7C%20Next.js-green)]()

OpenAI-compatible API gateway for production agent deployments. Route requests across GPU worker nodes with sub-second latency and streaming responses.

**Live demo:** https://agentflowengine.com

---

## Features

- **OpenAI-compatible API** — Drop-in replacement for LangChain, AutoGen, CrewAI
- **Distributed routing** — Latency-aware load balancing across GPU workers
- **Streaming SSE** — Real-time token delivery for agent workflows
- **A2A Protocol Ready** — Designed for agent-to-agent communication patterns

---

## Architecture

```
Agent Request → Load Balancer/Router → GPU Worker Nodes (L4/A10G/A100) → Streaming Response
```

| Component | Technology |
|-----------|------------|
| Inference | vLLM, PyTorch, CUDA 12.x |
| API Server | Python 3.11, FastAPI |
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Deploy | Docker, Railway, GCP/Azure/AWS |

---

## Repository Structure

```
├── landing-page/          # Marketing site & API docs (Next.js)
├── infrastructure/
│   ├── scripts/           # Node setup, health monitoring, GPU orchestration
│   └── docker/            # Container templates
└── README.md
```

---

## Quick Start

### Landing Page (Local)

```bash
cd landing-page
npm install
npm run dev
```

Open http://localhost:3000

### GPU Node Setup (Ubuntu 22.04/24.04)

```bash
bash infrastructure/scripts/setup_node.sh
```

### Health Monitor

```bash
pip install -r infrastructure/scripts/requirements.txt
export TELEGRAM_BOT_TOKEN=your_token
export TELEGRAM_CHAT_ID=your_chat_id
python infrastructure/scripts/health_monitor.py
```

### Node Identity (Ed25519 / did:key)

```bash
pip install cryptography
python infrastructure/scripts/generate_did_key.py node_identity.json
```

---

## API Example

```bash
curl https://api.agentflowengine.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AGENTFLOW_API_KEY" \
  -d '{
    "model": "llama-3-8b-instruct",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": true
  }'
```

---

## Benchmarks (vLLM 0.6.x, batch size 1)

| Model | GPU | TTFT (P50) | TPS |
|-------|-----|------------|-----|
| LLaMA-3-8B-Instruct | NVIDIA L4 | 142ms | 847 |
| LLaMA-3-70B-Instruct | NVIDIA A10G | 318ms | 124 |
| Mistral-7B-Instruct | NVIDIA L4 | 98ms | 1,024 |

---

## Roadmap

- [x] Landing page & OpenAI-compatible API design
- [x] Distributed architecture prototype
- [x] Infrastructure automation scripts
- [ ] Multi-node vLLM router (Q4 2026 beta)
- [ ] Public API launch (Q1 2027)

---

## Contact

- **Website:** https://agentflowengine.com
- **Email:** contact@agentflowengine.com

---

## License

MIT
