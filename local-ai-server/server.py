"""OpenAI-compatible inference server for HORIZON (runs on YOUR PC).

This server proxies chat requests to a local Ollama instance by default. Ollama
models (with their own knowledge) are used directly. Set MODELS to the exact
Ollama tags you want to expose.
"""
import json
import os
import time
import urllib.request
import urllib.error
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

_env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(_env_path):
    for _line in open(_env_path, encoding="utf-8"):
        _line = _line.strip()
        if not _line or _line.startswith("#") or "=" not in _line:
            continue
        _k, _v = _line.split("=", 1)
        os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))

API_KEY = os.getenv("AI_SERVER_API_KEY", "")
PORT = int(os.getenv("PORT", "8080"))
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
MODELS = [m.strip().strip('"').strip("'") for m in os.getenv("MODELS", "zenith-1.1,halo-1.5,halo-2.5").split(",") if m.strip()]
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", MODELS[0] if MODELS else "")

app = FastAPI(title="Horizon Local AI")


def auth_check(authorization: str | None):
    if API_KEY:
        if not authorization or authorization != f"Bearer {API_KEY}":
            raise HTTPException(status_code=401, detail="Unauthorized")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    stream: bool = False
    max_tokens: int | None = None
    stream_options: dict | None = None


@app.get("/health")
def health():
    try:
        with urllib.request.urlopen(f"{OLLAMA_BASE_URL}/api/tags", timeout=5) as r:
            tags = json.loads(r.read().decode("utf-8")).get("models", [])
        ollama_models = [m.get("name") for m in tags]
    except Exception as e:
        ollama_models = []
        ollama_error = str(e)
    else:
        ollama_error = None
    return {
        "status": "ok" if ollama_error is None else "degraded",
        "ollama": ollama_error is None,
        "models": MODELS,
        "ollama_models": ollama_models,
        "error": ollama_error,
    }


@app.get("/models")
def list_models(authorization: str | None = Header(default=None)):
    auth_check(authorization)
    return {"data": [{"id": m, "object": "model"} for m in MODELS]}


def _ollama_payload(req: ChatRequest, stream: bool):
    system_text = "\n\n".join(m.content for m in req.messages if m.role == "system")
    other = [m for m in req.messages if m.role != "system"]
    messages = []
    if system_text.strip():
        messages.append({"role": "system", "content": system_text})
    messages.extend({"role": m.role, "content": m.content} for m in other)
    payload = {"model": req.model, "messages": messages, "stream": stream, "think": False}
    if req.max_tokens:
        payload["options"] = {"num_predict": req.max_tokens}
    return payload


def _ollama_chat_sync(req: ChatRequest) -> str:
    payload = _ollama_payload(req, False)
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/chat", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(request, timeout=300) as resp:
        obj = json.loads(resp.read().decode("utf-8"))
    return (obj.get("message") or {}).get("content", "")


@app.post("/v1/chat/completions")
def chat(req: ChatRequest, authorization: str | None = Header(default=None)):
    auth_check(authorization)
    if req.model not in MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown model: {req.model}")

    if req.stream:
        def gen():
            payload = _ollama_payload(req, True)
            data = json.dumps(payload).encode("utf-8")
            request = urllib.request.Request(f"{OLLAMA_BASE_URL}/api/chat", data=data, headers={"Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(request, timeout=600) as resp:
                    for raw_line in resp:
                        raw_line = raw_line.strip()
                        if not raw_line:
                            continue
                        try:
                            obj = json.loads(raw_line.decode("utf-8"))
                        except Exception:
                            continue
                        content = (obj.get("message") or {}).get("content", "")
                        if content:
                            yield f"data: {json.dumps({'choices': [{'delta': {'content': content}, 'index': 0}]})}\n\n"
                        if obj.get("done"):
                            usage = {
                                "prompt_tokens": obj.get("prompt_eval_count", 0),
                                "completion_tokens": obj.get("eval_count", 0),
                                "total_tokens": obj.get("prompt_eval_count", 0) + obj.get("eval_count", 0),
                            }
                            yield f"data: {json.dumps({'usage': usage, 'choices': []})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
            finally:
                yield "data: [DONE]\n\n"

        return StreamingResponse(gen(), media_type="text/event-stream")

    # Non-streaming fallback
    try:
        text = _ollama_chat_sync(req)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {
        "choices": [{"message": {"role": "assistant", "content": text}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2},
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=PORT)