use axum::{
    body::Body,
    extract::{Json, State},
    http::StatusCode,
    routing::{get, post},
    Router,
};
use bytes::Bytes;
use futures_util::stream::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::env;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tokio::sync::mpsc;

#[derive(Clone)]
struct AppState {
    api_key: String,
    ollama_url: String,
    models: Vec<String>,
}

#[derive(Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Deserialize)]
struct ChatRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: Option<bool>,
    max_tokens: Option<u32>,
}

#[derive(Serialize)]
struct ModelInfo {
    id: String,
    object: &'static str,
}

#[derive(Serialize)]
struct ModelsResponse {
    data: Vec<ModelInfo>,
}

async fn load_env() {
    let path = std::path::Path::new(".env");
    if path.exists() {
        for line in std::fs::read_to_string(path).unwrap_or_default().lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') || !line.contains('=') {
                continue;
            }
            let mut parts = line.splitn(2, '=');
            if let (Some(k), Some(v)) = (parts.next(), parts.next()) {
                let key = k.trim();
                let val = v.trim().trim_matches('"').trim_matches('\'');
                std::env::set_var(key, val);
            }
        }
    }
}

fn models() -> Vec<String> {
    env::var("MODELS")
        .unwrap_or_else(|_| "Zenith-1.1:latest,Nova5.2:latest,Nova5.4-Ultra:latest".to_string())
        .split(',')
        .map(|s| s.trim().trim_matches('"').trim_matches('\'').to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

fn ollama_url() -> String {
    env::var("OLLAMA_BASE_URL").unwrap_or_else(|_| "http://127.0.0.1:11434".to_string()).trim_end_matches('/').to_string()
}

fn api_key() -> String {
    env::var("AI_SERVER_API_KEY").unwrap_or_default()
}

#[tokio::main]
async fn main() {
    load_env().await;
    let state = Arc::new(AppState {
        api_key: api_key(),
        ollama_url: ollama_url(),
        models: models(),
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/models", get(list_models))
        .route("/v1/chat/completions", post(chat))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port: u16 = env::var("PORT").ok().and_then(|v| v.parse().ok()).unwrap_or(8080);
    let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port))
        .await
        .expect("failed to bind port");
    tracing::info!("Horizon Rust gateway listening on 127.0.0.1:{}", port);
    axum::serve(listener, app).await.expect("server error");
}

async fn health(State(state): State<Arc<AppState>>) -> axum::Json<Value> {
    let mut ollama_ok = false;
    let mut ollama_models: Vec<String> = Vec::new();
    let mut err: Option<String> = None;
    match reqwest::get(format!("{}/api/tags", state.ollama_url)).await {
        Ok(resp) => {
            if let Ok(json) = resp.json::<Value>().await {
                if let Some(arr) = json.get("models").and_then(|v| v.as_array()) {
                    ollama_models = arr.iter().filter_map(|m| m.get("name").and_then(|n| n.as_str()).map(str::to_string)).collect();
                    ollama_ok = true;
                }
            }
        }
        Err(e) => err = Some(e.to_string()),
    }
    axum::Json(json!({
        "status": if ollama_ok { "ok" } else { "degraded" },
        "ollama": ollama_ok,
        "models": state.models,
        "ollama_models": ollama_models,
        "error": err,
    }))
}

async fn list_models(State(state): State<Arc<AppState>>, headers: axum::http::HeaderMap) -> Result<axum::Json<ModelsResponse>, StatusCode> {
    if !state.api_key.is_empty() {
        let auth = headers.get("authorization").and_then(|v| v.to_str().ok()).unwrap_or("");
        if auth != format!("Bearer {}", state.api_key) {
            return Err(StatusCode::UNAUTHORIZED);
        }
    }
    Ok(axum::Json(ModelsResponse {
        data: state.models.iter().map(|m| ModelInfo { id: m.clone(), object: "model" }).collect(),
    }))
}

async fn chat(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
    Json(req): Json<ChatRequest>,
) -> Result<axum::response::Response, StatusCode> {
    if !state.api_key.is_empty() {
        let auth = headers.get("authorization").and_then(|v| v.to_str().ok()).unwrap_or("");
        if auth != format!("Bearer {}", state.api_key) {
            return Err(StatusCode::UNAUTHORIZED);
        }
    }
    if !state.models.iter().any(|m| m == &req.model) {
        return Err(StatusCode::NOT_FOUND);
    }

    let stream = req.stream.unwrap_or(false);
    let client = reqwest::Client::new();
    let mut payload = json!({
        "model": req.model,
        "messages": req.messages.iter().map(|m| json!({"role": m.role, "content": m.content})).collect::<Vec<_>>(),
        "stream": stream,
        "think": false,
    });
    if let Some(mt) = req.max_tokens {
        payload["options"] = json!({"num_predict": mt});
    }

    if !stream {
        let resp = client
            .post(format!("{}/api/chat", state.ollama_url))
            .json(&payload)
            .send()
            .await
            .map_err(|_| StatusCode::BAD_GATEWAY)?;
        let obj: Value = resp.json().await.map_err(|_| StatusCode::BAD_GATEWAY)?;
        let text = obj.get("message").and_then(|m| m.get("content")).and_then(|v| v.as_str()).unwrap_or("");
        let body = json!({
            "choices": [{"message": {"role": "assistant", "content": text}, "finish_reason": "stop"}],
            "usage": {
                "prompt_tokens": obj.get("prompt_eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
                "completion_tokens": obj.get("eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
                "total_tokens": obj.get("prompt_eval_count").and_then(|v| v.as_u64()).unwrap_or(0) + obj.get("eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
            }
        });
        return Ok(([(axum::http::header::CONTENT_TYPE, "application/json")], body.to_string()).into_response());
    }

    let (tx, rx) = mpsc::channel::<Result<Bytes, std::io::Error>>(100);
    let ollama_url = state.ollama_url.clone();
    let model = req.model.clone();
    let messages = req.messages.iter().map(|m| json!({"role": m.role, "content": m.content})).collect::<Vec<_>>();
    let max_tokens = req.max_tokens;
    tokio::spawn(async move {
        let client = reqwest::Client::new();
        let mut payload = json!({"model": model, "messages": messages, "stream": true, "think": false});
        if let Some(mt) = max_tokens {
            payload["options"] = json!({"num_predict": mt});
        }
        let resp = match client.post(format!("{}/api/chat", ollama_url)).json(&payload).send().await {
            Ok(r) => r,
            Err(e) => {
                let s = format!("data: {}\n\n", json!({"error": e.to_string()}));
                let _ = tx.send(Ok(Bytes::from(s))).await;
                let _ = tx.send(Ok(Bytes::from("data: [DONE]\n\n"))).await;
                return;
            }
        };
        let mut stream = resp.bytes_stream();
        let mut buf = String::new();
        while let Some(chunk) = stream.next().await {
            let chunk = match chunk {
                Ok(c) => c,
                Err(e) => {
                    let s = format!("data: {}\n\n", json!({"error": e.to_string()}));
                    let _ = tx.send(Ok(Bytes::from(s))).await;
                    break;
                }
            };
            buf.push_str(&String::from_utf8_lossy(&chunk));
            while let Some(pos) = buf.find('\n') {
                let line = buf[..pos].trim().to_string();
                buf = buf[pos + 1..].to_string();
                if line.is_empty() {
                    continue;
                }
                if let Ok(obj) = serde_json::from_str::<Value>(&line) {
                    let content = obj.get("message").and_then(|m| m.get("content")).and_then(|v| v.as_str()).unwrap_or("");
                    if !content.is_empty() {
                        let s = format!("data: {}\n\n", json!({"choices": [{"delta": {"content": content}, "index": 0}]}) );
                        let _ = tx.send(Ok(Bytes::from(s))).await;
                    }
                    if obj.get("done").and_then(|v| v.as_bool()).unwrap_or(false) {
                        let usage = json!({
                            "prompt_tokens": obj.get("prompt_eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
                            "completion_tokens": obj.get("eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
                            "total_tokens": obj.get("prompt_eval_count").and_then(|v| v.as_u64()).unwrap_or(0) + obj.get("eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
                        });
                        let s = format!("data: {}\n\n", json!({"usage": usage, "choices": []}));
                        let _ = tx.send(Ok(Bytes::from(s))).await;
                    }
                }
            }
        }
        if !buf.trim().is_empty() {
            if let Ok(obj) = serde_json::from_str::<Value>(buf.trim()) {
                let content = obj.get("message").and_then(|m| m.get("content")).and_then(|v| v.as_str()).unwrap_or("");
                if !content.is_empty() {
                    let s = format!("data: {}\n\n", json!({"choices": [{"delta": {"content": content}, "index": 0}]}));
                    let _ = tx.send(Ok(Bytes::from(s))).await;
                }
                if obj.get("done").and_then(|v| v.as_bool()).unwrap_or(false) {
                    let usage = json!({
                        "prompt_tokens": obj.get("prompt_eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
                        "completion_tokens": obj.get("eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
                        "total_tokens": obj.get("prompt_eval_count").and_then(|v| v.as_u64()).unwrap_or(0) + obj.get("eval_count").and_then(|v| v.as_u64()).unwrap_or(0),
                    });
                    let s = format!("data: {}\n\n", json!({"usage": usage, "choices": []}));
                    let _ = tx.send(Ok(Bytes::from(s))).await;
                }
            }
        }
        let _ = tx.send(Ok(Bytes::from("data: [DONE]\n\n"))).await;
    });

    let stream = tokio_stream::wrappers::ReceiverStream::new(rx);
    Ok(axum::response::Response::builder()
        .status(200)
        .header("Content-Type", "text/event-stream")
        .body(Body::from_stream(stream))
        .unwrap())
}

use axum::response::IntoResponse;
