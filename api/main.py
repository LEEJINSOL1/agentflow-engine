"""AgentFlow Engine — Beta API Gateway (CPU-only demo)."""

from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="AgentFlow Engine API",
    description="OpenAI-compatible inference gateway (beta)",
    version="0.1.0-beta",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: str = "llama-3-8b-instruct"
    messages: list[ChatMessage]
    stream: bool = False
    max_tokens: int = Field(default=512, le=4096)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "agentflow-engine-gateway",
        "version": "0.1.0-beta",
        "mode": "cpu-gateway",
        "gpu_workers": 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/v1/models")
def list_models() -> dict:
    return {
        "object": "list",
        "data": [
            {
                "id": "llama-3-8b-instruct",
                "object": "model",
                "owned_by": "agentflow-engine",
            },
            {
                "id": "mistral-7b-instruct",
                "object": "model",
                "owned_by": "agentflow-engine",
            },
        ],
    }


@app.post("/v1/chat/completions")
def chat_completions(body: ChatCompletionRequest) -> dict:
    if body.stream:
        raise HTTPException(
            status_code=501,
            detail="Streaming enabled after GPU beta deployment (Q4 2026).",
        )

    user_msg = next((m.content for m in reversed(body.messages) if m.role == "user"), "")

    return {
        "id": "chatcmpl-agentflow-beta",
        "object": "chat.completion",
        "created": int(datetime.now(timezone.utc).timestamp()),
        "model": body.model,
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": (
                        f"AgentFlow Engine beta gateway is online. "
                        f"Received: \"{user_msg[:120]}\". "
                        "GPU inference workers deploy in Q4 2026 cloud beta."
                    ),
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    }
