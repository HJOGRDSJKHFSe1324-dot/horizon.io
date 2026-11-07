"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ChatErrorKind =
  | "abort"
  | "timeout"
  | "offline"
  | "rate_limit"
  | "network"
  | "server"
  | "auth"
  | "not_found"
  | "parse"
  | "unknown";

export interface ChatErrorInfo {
  kind: ChatErrorKind;
  type: ChatErrorKind;
  message: string;
  retryable: boolean;
  status?: number;
  retryAfterMs?: number;
  original?: unknown;
}

export class ChatReliabilityError extends Error {
  kind: ChatErrorKind;
  type: ChatErrorKind;
  status?: number;
  retryAfterMs?: number;
  retryable: boolean;

  constructor(
    message: string,
    options?: {
      kind?: ChatErrorKind;
      status?: number;
      retryAfterMs?: number;
      retryable?: boolean;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "ChatReliabilityError";
    this.kind = options?.kind ?? "unknown";
    this.type = this.kind;
    this.status = options?.status;
    this.retryAfterMs = options?.retryAfterMs;
    this.retryable = options?.retryable ?? false;
    if (options?.cause !== undefined) (this as any).cause = options.cause;
  }
}

export const DEFAULT_CHAT_TIMEOUT_MS = 120_000;
export const DEFAULT_INACTIVITY_TIMEOUT_MS = 90_000;
export const MAX_RETRY_ATTEMPTS = 3;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ChatReliabilityError("Aborted", { kind: "abort", retryable: false }));
      return;
    }
    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      cleanup();
      reject(new ChatReliabilityError("Aborted", { kind: "abort", retryable: false }));
    };
    const cleanup = () => {
      signal?.removeEventListener("abort", onAbort);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  const e = error as any;
  if (e?.name === "AbortError") return true;
  if (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof ChatReliabilityError && e.kind === "abort") return true;
  return false;
}

export function isTimeoutError(error: unknown): boolean {
  if (!error) return false;
  const e = error as any;
  if (e?.name === "TimeoutError") return true;
  if (error instanceof ChatReliabilityError && e.kind === "timeout") return true;
  const message = String(e?.message ?? e ?? "").toLowerCase();
  return message.includes("timeout") || message.includes("timed out");
}

export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  if (!isOnline()) return true;
  const e = error as any;
  if (error instanceof TypeError) return true;
  const message = String(e?.message ?? e ?? "").toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("network") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  );
}

export function isRateLimitError(error: unknown, status?: number): boolean {
  const code = status ?? (error as any)?.status;
  if (code === 429) return true;
  const message = String((error as any)?.message ?? error ?? "").toLowerCase();
  return message.includes("too many requests") || message.includes("rate limit");
}

export function parseRetryAfterMs(input: unknown): number | undefined {
  if (input == null) return undefined;

  if (typeof input === "number" && Number.isFinite(input)) {
    // Interpret small numbers as seconds, larger as ms.
    return input > 10_000 ? input : input * 1000;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return undefined;
    const asNumber = Number(trimmed);
    if (Number.isFinite(asNumber)) {
      return asNumber > 10_000 ? asNumber : asNumber * 1000;
    }
    const dateMs = Date.parse(trimmed);
    if (!Number.isNaN(dateMs)) {
      const delta = dateMs - Date.now();
      return delta > 0 ? delta : undefined;
    }
    return undefined;
  }

  if (input instanceof Response) {
    return parseRetryAfterMs(input.headers);
  }

  if (input instanceof Headers) {
    const retryAfter = input.get("retry-after") || input.get("Retry-After");
    if (retryAfter) return parseRetryAfterMs(retryAfter);
    const reset = input.get("x-ratelimit-reset") || input.get("X-RateLimit-Reset");
    if (reset) {
      const value = Number(reset);
      if (Number.isFinite(value)) {
        // Could be epoch seconds or ms.
        const asMs = value > 10_000_000_00 ? value * 1000 : value * 1000;
        const delta = asMs - Date.now();
        return delta > 0 ? delta : undefined;
      }
    }
    return undefined;
  }

  if (typeof input === "object") {
    const obj = input as any;
    if (obj.headers) return parseRetryAfterMs(obj.headers);
    if (obj.retryAfterMs != null) return parseRetryAfterMs(obj.retryAfterMs);
    if (obj.retryAfter != null) return parseRetryAfterMs(obj.retryAfter);
  }

  return undefined;
}

export const parseRetryAfter = parseRetryAfterMs;

export function classifyChatError(error: unknown, response?: Response | null): ChatErrorInfo {
  if (response) {
    if (response.status === 429) {
      return {
        kind: "rate_limit",
        type: "rate_limit",
        message: "Too many requests. Please wait and try again.",
        retryable: true,
        status: 429,
        retryAfterMs: parseRetryAfterMs(response),
        original: error,
      };
    }
    if (response.status === 401 || response.status === 403) {
      return {
        kind: "auth",
        type: "auth",
        message: response.status === 401 ? "You need to sign in again." : "This request is not allowed.",
        retryable: false,
        status: response.status,
        original: error,
      };
    }
    if (response.status === 404) {
      return {
        kind: "not_found",
        type: "not_found",
        message: "The requested chat resource no longer exists.",
        retryable: false,
        status: 404,
        original: error,
      };
    }
    if (response.status === 408) {
      return {
        kind: "timeout",
        type: "timeout",
        message: "The request timed out. Please try again.",
        retryable: true,
        status: 408,
        original: error,
      };
    }
    if (response.status >= 500) {
      return {
        kind: "server",
        type: "server",
        message: "The server is unavailable right now. Please try again in a moment.",
        retryable: true,
        status: response.status,
        original: error,
      };
    }
    if (!response.ok) {
      const message = `Request failed (${response.status}).`;
      return {
        kind: "unknown",
        type: "unknown",
        message,
        retryable: response.status >= 500,
        status: response.status,
        original: error,
      };
    }
  }

  if (isAbortError(error)) {
    // Only treat as non-retryable user abort. Timeout errors use isTimeoutError.
    if (isTimeoutError(error)) {
      return {
        kind: "timeout",
        type: "timeout",
        message: "The request timed out. Please try again.",
        retryable: true,
        original: error,
      };
    }
    return {
      kind: "abort",
      type: "abort",
      message: "The request was cancelled.",
      retryable: false,
      original: error,
    };
  }

  if (isTimeoutError(error)) {
    return {
      kind: "timeout",
      type: "timeout",
      message: "The request timed out. Please try again.",
      retryable: true,
      original: error,
    };
  }

  if (!isOnline()) {
    return {
      kind: "offline",
      type: "offline",
      message: "You appear to be offline. Check your connection and try again.",
      retryable: true,
      original: error,
    };
  }

  if (isNetworkError(error)) {
    return {
      kind: "network",
      type: "network",
      message: "Network error. Check your connection and try again.",
      retryable: true,
      original: error,
    };
  }

  if (isRateLimitError(error)) {
    return {
      kind: "rate_limit",
      type: "rate_limit",
      message: "Too many requests. Please wait and try again.",
      retryable: true,
      retryAfterMs: parseRetryAfterMs(error),
      original: error,
    };
  }

  const e = error as any;
  if (typeof e?.status === "number" && e.status >= 500) {
    return {
      kind: "server",
      type: "server",
      message: e?.message || "The server returned an error. Please try again.",
      retryable: true,
      status: e.status,
      original: error,
    };
  }

  if (error instanceof TypeError) {
    return {
      kind: "network",
      type: "network",
      message: "Network error. Check your connection and try again.",
      retryable: true,
      original: error,
    };
  }

  const message =
    (typeof error === "string" && error) ||
    e?.message ||
    "Something went wrong. Please try again.";

  // Try to detect common HTTP status embedded in message like "error 429".
  return {
    kind: "unknown",
    type: "unknown",
    message,
    retryable: true,
    original: error,
  };
}

export function humanizeChatError(error: unknown, response?: Response | null): string {
  return classifyChatError(error, response).message;
}

export function shouldRetryChatError(info: ChatErrorInfo, attempt: number, maxAttempts: number): boolean {
  if (!info.retryable) return false;
  if (attempt >= maxAttempts) return false;
  return true;
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  signal?: AbortSignal;
  shouldRetry?: (info: ChatErrorInfo, attempt: number) => boolean;
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void;
}

export async function retryOperation<T>(
  operation: (attempt: number, signal?: AbortSignal) => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? MAX_RETRY_ATTEMPTS);
  const baseDelayMs = options.baseDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 8_000;
  const signal = options.signal;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new ChatReliabilityError("Aborted", { kind: "abort", retryable: false });
    }
    try {
      return await operation(attempt, signal);
    } catch (error) {
      lastError = error;
      const info = classifyChatError(error);
      const retryable =
        options.shouldRetry?.(info, attempt) ?? shouldRetryChatError(info, attempt, maxAttempts);
      if (!retryable || attempt === maxAttempts) {
        throw error;
      }
      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      const finalDelay = info.retryAfterMs ? Math.min(maxDelayMs, Math.max(delay, info.retryAfterMs)) : delay;
      options.onRetry?.(attempt, finalDelay, error);
      await sleep(finalDelay, signal);
    }
  }
  throw lastError;
}

export const withRetry = retryOperation;

export function createAbortController(previous?: AbortController | null): AbortController {
  try {
    previous?.abort();
  } catch {
    // ignore
  }
  return new AbortController();
}

export function abortController(controller: AbortController | null | undefined): void {
  try {
    controller?.abort();
  } catch {
    // ignore
  }
}

export function combineAbortSignals(...signals: Array<AbortSignal | null | undefined>): AbortSignal {
  const controller = new AbortController();
  const abort = (reason?: unknown) => {
    if (!controller.signal.aborted) controller.abort(reason);
  };
  for (const signal of signals) {
    if (!signal) continue;
    if (signal.aborted) {
      abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", () => abort(signal.reason), { once: true });
  }
  return controller.signal;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_CHAT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const signal = init.signal ? combineAbortSignals(init.signal, controller.signal) : controller.signal;
  const timer = setTimeout(() => {
    controller.abort(new ChatReliabilityError("Request timed out", { kind: "timeout", retryable: true }));
  }, timeoutMs);

  try {
    return await fetch(input, { ...init, signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_CHAT_TIMEOUT_MS,
  message: string = "Operation timed out.",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ChatReliabilityError(message, { kind: "timeout", retryable: true }));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface OnlineStatus {
  online: boolean;
  offline: boolean;
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() => isOnline());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setOnline(isOnline());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}

export const useNetworkStatus = useOnlineStatus;

export function useIsOffline(): boolean {
  return !useOnlineStatus();
}

export interface AbortHandle {
  controller: AbortController;
  signal: AbortSignal;
  abort: (reason?: unknown) => void;
  reset: () => void;
}

export function useAbortController(): AbortHandle {
  const controllerRef = useRef<AbortController>(new AbortController());

  const abort = useCallback((reason?: unknown) => {
    try {
      controllerRef.current.abort(reason);
    } catch {
      // ignore
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current = new AbortController();
  }, []);

  return {
    get controller() {
      return controllerRef.current;
    },
    get signal() {
      return controllerRef.current.signal;
    },
    abort,
    reset,
  } as any;
}

// React 19 friendly wrapper: returns object with current controller via ref wrapper.
export function useChatAbortController(initial?: AbortController | null) {
  const ref = useRef<AbortController>(initial ?? new AbortController());
  const abort = useCallback((reason?: unknown) => {
    try {
      ref.current.abort(reason);
    } catch {
      // ignore
    }
  }, []);
  const replace = useCallback(() => {
    const prev = ref.current;
    try {
      prev.abort();
    } catch {
      // ignore
    }
    ref.current = new AbortController();
    return ref.current;
  }, []);
  return { ref, abort, replace, controller: ref.current, signal: ref.current.signal };
}

export type ChatStreamEvent = Record<string, any>;

export type ChatSseHandlers = {
  onEvent?: (event: ChatStreamEvent) => void;
  onDelta?: (content: string, event: ChatStreamEvent) => void;
  onDone?: (event: ChatStreamEvent) => void;
  onError?: (message: string, event?: ChatStreamEvent) => void;
};

export interface ReadChatSseOptions {
  signal?: AbortSignal | null;
  timeoutMs?: number;
  inactivityTimeoutMs?: number;
}

export async function readChatSseStream(
  response: Response,
  handlers: ChatSseHandlers = {},
  options: ReadChatSseOptions = {},
): Promise<{ ok: boolean; error?: ChatErrorInfo; events: ChatStreamEvent[] }> {
  const events: ChatStreamEvent[] = [];  
  const timeoutMs = options.timeoutMs ?? DEFAULT_CHAT_TIMEOUT_MS;
  const inactivityMs = options.inactivityTimeoutMs ?? DEFAULT_INACTIVITY_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;
  let aborted = false;

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };

  const armTimer = (reader: ReadableStreamDefaultReader<Uint8Array>, controller?: ReadableStreamDefaultController) => {
    clearTimer();
    if (inactivityMs <= 0) return;
    timer = setTimeout(() => {
      timedOut = true;
      try {
        reader.cancel("timeout");
      } catch {
        // ignore
      }
    }, inactivityMs);
  };

  if (!response.ok || !response.body) {
    let data: any = null;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }
    const info = classifyChatError(null, response);
    if (data?.error) info.message = data.error;
    handlers.onError?.(info.message);
    return { ok: false, error: info, events };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const onAbort = () => {
    aborted = true;
    try {
      reader.cancel("abort");
    } catch {
      // ignore
    }
  };
  options.signal?.addEventListener("abort", onAbort, { once: true });

  try {
    armTimer(reader);
    while (true) {
      if (options.signal?.aborted || aborted) {
        const info = classifyChatError(
          new ChatReliabilityError("Aborted", { kind: "abort", retryable: false }),
        );
        handlers.onError?.(info.message);
        return { ok: false, error: info, events };
      }

      const { value, done } = await reader.read();
      if (done) break;

      if (timedOut) {
        const info = new ChatReliabilityError("Stream timed out. Please try again.", {
          kind: "timeout",
          retryable: true,
        });
        const classified = classifyChatError(info);
        handlers.onError?.(classified.message);
        return { ok: false, error: classified, events };
      }

      armTimer(reader);
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (!trimmed.startsWith("data:")) continue;
        if (trimmed === "data: [DONE]") {
          const doneEvent = { type: "done" };
          events.push(doneEvent);
          handlers.onEvent?.(doneEvent);
          handlers.onDone?.(doneEvent);
          clearTimer();
          try {
            reader.cancel();
          } catch {
            // ignore
          }
          return { ok: true, events };
        }

        let parsed: ChatStreamEvent;
        try {
          parsed = JSON.parse(trimmed.slice(5).trim());
        } catch {
          const info = classifyChatError(
            new ChatReliabilityError("Failed to parse server response.", { kind: "parse", retryable: true }),
          );
          handlers.onError?.(info.message);
          return { ok: false, error: info, events };
        }

        events.push(parsed);
        handlers.onEvent?.(parsed);

        if (parsed.type === "delta" && typeof parsed.content === "string") {
          handlers.onDelta?.(parsed.content, parsed);
        } else if (parsed.type === "done") {
          handlers.onDone?.(parsed);
        } else if (parsed.type === "error") {
          const message = parsed.message || parsed.error || "Server error";
          handlers.onError?.(message, parsed);
          // Keep reading? Server closes after error usually.
        }
      }
    }

    clearTimer();
    return { ok: true, events };
  } catch (error) {
    clearTimer();
    if (timedOut) {
      const info = classifyChatError(
        new ChatReliabilityError("Stream timed out. Please try again.", { kind: "timeout", retryable: true }),
      );
      handlers.onError?.(info.message);
      return { ok: false, error: info, events };
    }
    if (options.signal?.aborted || aborted || isAbortError(error)) {
      const info = classifyChatError(
        new ChatReliabilityError("Aborted", { kind: "abort", retryable: false }),
      );
      return { ok: false, error: info, events };
    }
    const info = classifyChatError(error);
    handlers.onError?.(info.message);
    return { ok: false, error: info, events };
  } finally {
    clearTimer();
    try {
      options.signal?.removeEventListener("abort", onAbort);
    } catch {
      // ignore
    }
  }
}

export async function* parseSSEStream(response: Response, signal?: AbortSignal | null) {
  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }
    throw new ChatReliabilityError(data?.error || `Request failed (${response.status})`, {
      kind: response.status === 429 ? "rate_limit" : "server",
      status: response.status,
      retryable: response.status >= 500 || response.status === 429,
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const onAbort = () => {
    try {
      reader.cancel("abort");
    } catch {
      // ignore
    }
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        if (trimmed === "data: [DONE]") return;
        try {
          yield JSON.parse(trimmed.slice(5).trim());
        } catch {
          // skip unparseable
        }
      }
    }
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }
}

export const readChatSse = readChatSseStream;
export const readSseStream = readChatSseStream;
export const consumeSSEStream = readChatSseStream;
export const streamChatResponse = readChatSseStream;

// React hook bundling common reliability state.
export interface UseChatReliabilityResult {
  error: ChatErrorInfo | null;
  setError: (error: ChatErrorInfo | null) => void;
  clearError: () => void;
  isOffline: boolean;
  retry: <T>(operation: () => Promise<T>, options?: RetryOptions) => Promise<T>;
  aborted: boolean;
  abort: (reason?: unknown) => void;
  controller: AbortController;
  resetController: () => AbortController;
  lastError: ChatErrorInfo | null;
}

export function useChatReliability(): UseChatReliabilityResult {
  const [error, setErrorState] = useState<ChatErrorInfo | null>(null);
  const [aborted, setAborted] = useState(false);
  const controllerRef = useRef<AbortController>(new AbortController());
  const online = useOnlineStatus();

  const setError = useCallback((next: ChatErrorInfo | null) => {
    setErrorState(next);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const abort = useCallback((reason?: unknown) => {
    try {
      controllerRef.current.abort(reason);
    } catch {
      // ignore
    }
    setAborted(true);
  }, []);

  const resetController = useCallback(() => {
    try {
      controllerRef.current.abort();
    } catch {
      // ignore
    }
    const next = new AbortController();
    controllerRef.current = next;
    setAborted(false);
    return next;
  }, []);

  const retry = useCallback(
    async <T,>(operation: () => Promise<T>, options?: RetryOptions) => {
      clearError();
      const signal = controllerRef.current.signal;
      try {
        return await retryOperation(async () => operation(), { ...options, signal: options?.signal ?? signal });
      } catch (e) {
        const info = classifyChatError(e);
        setErrorState(info);
        throw e;
      }
    },
    [clearError],
  );

  return {
    error,
    setError,
    clearError,
    isOffline: !online,
    retry,
    aborted,
    abort,
    controller: controllerRef.current,
    resetController,
    lastError: error,
  };
}

const chatReliability = {
  classifyChatError,
  readChatSseStream,
  useChatReliability,
  useOnlineStatus,
};

export default chatReliability;
