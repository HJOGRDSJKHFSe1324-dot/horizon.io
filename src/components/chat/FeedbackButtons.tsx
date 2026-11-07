"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import clsx from "clsx";

export type FeedbackValue = "up" | "down" | null;

export type FeedbackButtonsProps = {
  messageId?: string;
  value?: FeedbackValue;
  defaultValue?: FeedbackValue;
  onChange?: (value: FeedbackValue) => void;
  onFeedback?: (messageId: string | undefined, value: FeedbackValue) => void | Promise<void>;
  disabled?: boolean;
  persist?: boolean;
  storageKey?: (messageId: string) => string;
  size?: "sm" | "md";
  labels?: { up?: string; down?: string };
  className?: string;
};

function defaultKey(messageId: string) {
  return `horizon:chat:feedback:${messageId}`;
}

export function FeedbackButtons({
  messageId,
  value,
  defaultValue = null,
  onChange,
  onFeedback,
  disabled = false,
  persist = true,
  storageKey,
  size = "sm",
  labels = { up: "Helpful", down: "Not helpful" },
  className,
}: FeedbackButtonsProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState<FeedbackValue>(defaultValue);

  useEffect(() => {
    if (controlled || !persist || !messageId) return;
    const key = (storageKey ?? defaultKey)(messageId);
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === "up" || stored === "down") {
        setInternal(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, [controlled, persist, messageId, storageKey]);

  const current = controlled ? (value ?? null) : internal;

  async function handle(next: Exclude<FeedbackValue, null>) {
    if (disabled) return;
    const resolved: FeedbackValue = current === next ? null : next;

    if (!controlled) {
      setInternal(resolved);
      if (persist && messageId) {
        const key = (storageKey ?? defaultKey)(messageId);
        try {
          if (resolved) window.localStorage.setItem(key, resolved);
          else window.localStorage.removeItem(key);
        } catch {
          // ignore storage errors
        }
      }
    }

    onChange?.(resolved);
    try {
      await onFeedback?.(messageId, resolved);
    } catch {
      // Callers may handle persistence; leave local state as-is.
    }
  }

  const buttonSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? 13 : 16;

  return (
    <div className={clsx("inline-flex items-center gap-1", className)} role="group" aria-label="Feedback">
      <button
        type="button"
        disabled={disabled}
        onClick={() => void handle("up")}
        aria-label={labels.up}
        aria-pressed={current === "up"}
        className={clsx(
          "inline-flex items-center justify-center rounded-md border transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
          buttonSize,
          current === "up"
            ? "border-success/40 bg-success/10 text-success"
            : "border-border text-subtle hover:border-strong hover:text-fg",
        )}
      >
        <ThumbsUp size={iconSize} aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => void handle("down")}
        aria-label={labels.down}
        aria-pressed={current === "down"}
        className={clsx(
          "inline-flex items-center justify-center rounded-md border transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
          buttonSize,
          current === "down"
            ? "border-danger/40 bg-danger/10 text-danger"
            : "border-border text-subtle hover:border-strong hover:text-fg",
        )}
      >
        <ThumbsDown size={iconSize} aria-hidden="true" />
      </button>
    </div>
  );
}

export default FeedbackButtons;
