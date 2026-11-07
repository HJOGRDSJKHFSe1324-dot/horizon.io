"use client";

import { AlertCircle, CheckCircle2, Clock, RefreshCw, WifiOff, X } from "lucide-react";
import React from "react";
import type { ChatErrorInfo, ChatErrorKind } from "@/lib/chatReliability";
import { classifyChatError } from "@/lib/chatReliability";

export interface ChatErrorStateProps {
  error?: ChatErrorInfo | { kind?: ChatErrorKind; type?: ChatErrorKind; message?: string; retryable?: boolean; status?: number; retryAfterMs?: number } | string | null;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retrying?: boolean;
  retryLabel?: string;
  dismissLabel?: string;
  isOffline?: boolean;
  compact?: boolean;
  className?: string;
  showDetails?: boolean;
}

function normalizeError(error: ChatErrorStateProps["error"]): ChatErrorInfo {
  if (!error) {
    return classifyChatError("Something went wrong. Please try again.");
  }
  if (typeof error === "string") {
    return classifyChatError(error);
  }
  if ((error as any)?.message || (error as any)?.kind || (error as any)?.type) {
    const candidate = error as any;
    const info = classifyChatError(candidate?.original ?? candidate?.message ?? candidate);
    if (candidate.kind) info.kind = candidate.kind;
    if (candidate.type) info.type = candidate.type;
    if (candidate.message) info.message = candidate.message;
    if (typeof candidate.retryable === "boolean") info.retryable = candidate.retryable;
    if (candidate.status != null) info.status = candidate.status;
    if (candidate.retryAfterMs != null) info.retryAfterMs = candidate.retryAfterMs;
    return info;
  }
  return classifyChatError(error);
}

function iconFor(kind: ChatErrorKind) {
  switch (kind) {
    case "offline":
    case "network":
      return WifiOff;
    case "timeout":
    case "rate_limit":
      return Clock;
    case "abort":
      return X;
    default:
      return AlertCircle;
  }
}

function titleFor(kind: ChatErrorKind): string {
  switch (kind) {
    case "offline":
      return "You're offline";
    case "network":
      return "Connection problem";
    case "timeout":
      return "Request timed out";
    case "rate_limit":
      return "Too many requests";
    case "auth":
      return "Authentication required";
    case "not_found":
      return "Not found";
    case "server":
      return "Server error";
    case "abort":
      return "Request cancelled";
    case "parse":
      return "Invalid response";
    default:
      return "Something went wrong";
  }
}

export function ChatErrorState({
  error,
  title,
  onRetry,
  onDismiss,
  retrying = false,
  retryLabel = "Try again",
  dismissLabel = "Dismiss",
  isOffline = false,
  compact = false,
  className,
  showDetails = false,
}: ChatErrorStateProps) {
  const info = normalizeError(error);
  const effectiveOffline = isOffline || info.kind === "offline";
  const Icon = effectiveOffline ? WifiOff : iconFor(info.kind);
  const displayTitle = title || titleFor(info.kind);
  const canRetry = Boolean(onRetry) && info.retryable !== false;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`rounded-2xl border border-red-400/20 bg-red-500/5 backdrop-blur-sm ${compact ? "px-3 py-2" : "px-4 py-3"} ${className || ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-300">
          <Icon size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-red-100">{displayTitle}</div>
          <div className="mt-1 text-xs leading-relaxed text-red-200/80">
            {effectiveOffline
              ? "You appear to be offline. Reconnect and try again."
              : info.message}
          </div>
          {info.retryAfterMs != null && info.kind === "rate_limit" && (
            <div className="mt-1 text-[11px] text-red-200/60">
              Retry suggested after {Math.ceil(info.retryAfterMs / 1000)}s.
            </div>
          )}
          {showDetails && info.status != null && (
            <div className="mt-1 font-mono text-[10px] text-red-200/50">Status: {info.status}</div>
          )}
          {(canRetry || onDismiss) && (
            <div className="mt-3 flex items-center gap-2">
              {canRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={retrying}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {retrying ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  {retrying ? "Retrying…" : retryLabel}
                </button>
              )}
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  <X size={12} />
                  {dismissLabel}
                </button>
              )}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="rounded-md p-1 text-red-200/60 transition hover:bg-white/5 hover:text-red-100"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ChatErrorState;

// Optional success/notice helper for completeness.
export function ChatNotice({
  message,
  tone = "info",
}: {
  message: string;
  tone?: "info" | "success" | "warning";
}) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
      <Icon size={12} className="mr-1 inline" />
      {message}
    </div>
  );
}
