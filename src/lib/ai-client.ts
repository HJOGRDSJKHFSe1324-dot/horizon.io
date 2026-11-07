import { prisma } from "@/lib/prisma";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface StreamResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

function resolveEndpoint(model: { apiBaseUrl: string | null; apiModelId: string | null; apiType: string }) {
  const base = (model.apiBaseUrl || "").replace(/\/+$/, "");
  if (!base) throw new Error("Model API base URL is not configured.");
  const modelId = model.apiModelId || "default";
  let url = base;
  if (!/\/(v1|api)$/i.test(base)) url = `${base}/v1`;
  url = `${url}/chat/completions`;
  return { url, modelId };
}

export async function checkAIServerHealth(): Promise<{
  ok: boolean;
  latencyMs: number;
  details?: any;
  error?: string;
}> {
  const model = await prisma.model.findFirst({ where: { enabled: true } });
  const base = model?.apiBaseUrl || process.env.AI_SERVER_BASE_URL || "";
  if (!base) return { ok: false, latencyMs: 0, error: "No AI server base URL configured." };
  const t0 = Date.now();
  try {
    const endpoint = base.replace(/\/+$/, "");
    const res = await fetch(`${endpoint}/models`, {
      method: "GET",
      headers: authHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - t0;
    if (!res.ok) {
      // try health endpoint
      return { ok: false, latencyMs, error: `HTTP ${res.status}` };
    }
    const data = await res.json().catch(() => null);
    return { ok: true, latencyMs, details: data };
  } catch (e: any) {
    return { ok: false, latencyMs: Date.now() - t0, error: e?.message || "Unreachable" };
  }
}

function authHeaders() {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.AI_SERVER_API_KEY) h["Authorization"] = `Bearer ${process.env.AI_SERVER_API_KEY}`;
  return h;
}

export async function* streamChat(params: {
  modelDbId: string;
  messages: ChatMessage[];
  maxTokens?: number;
  signal?: AbortSignal;
}): AsyncGenerator<{ delta: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }, StreamResult, void> {
  const model = await prisma.model.findUnique({ where: { id: params.modelDbId } });
  if (!model || !model.enabled) throw new Error("Model not available.");
  // Some local models (e.g. DeepSeek/Qwen3) reject multiple system messages. Merge them.
  const merged: ChatMessage[] = [];
  const systemText = params.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  if (systemText.trim()) merged.push({ role: "system", content: systemText });
  for (const m of params.messages) if (m.role !== "system") merged.push(m);
  params.messages = merged;

  const { url, modelId } = resolveEndpoint(model);

  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      model: modelId,
      messages: params.messages,
      stream: true,
      stream_options: { include_usage: true },
      ...(params.maxTokens ? { max_tokens: params.maxTokens } : {}),
    }),
    signal: params.signal,
  });
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI server error ${res.status}: ${text || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let usage: any = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data:")) continue;
      try {
        const json = JSON.parse(trimmed.slice(5).trim());
        const delta = json?.choices?.[0]?.delta?.content;
        if (delta) {
          full += delta;
          yield { delta, usage: json.usage };
        }
        if (json.usage) usage = json.usage;
      } catch {
        // ignore parse errors
      }
    }
  }

  const inputTokens = usage?.prompt_tokens ?? Math.ceil(params.messages.map((m) => m.content).join(" ").length / 4);
  const outputTokens = usage?.completion_tokens ?? Math.ceil(full.length / 4);
  const totalTokens = usage?.total_tokens ?? inputTokens + outputTokens;
  return { content: full, inputTokens, outputTokens, totalTokens };
}