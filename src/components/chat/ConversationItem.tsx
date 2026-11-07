"use client";

import React from "react";
import { Pencil, Trash2, Check, X as XIcon } from "lucide-react";
import clsx from "clsx";

export type Conversation = {
  id: string;
  title?: string | null;
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
  model?: { slug?: string; name?: string } | null;
  modelSlug?: string;
  messages?: Array<{ content?: string | null }>;
};

export type ConversationItemProps = {
  conversation: Conversation;
  active?: boolean;
  editing?: boolean;
  editTitle?: string;
  onEditTitleChange?: (value: string) => void;
  onSelect?: (id: string) => void;
  onStartEdit?: (conversation: Conversation) => void;
  onCommitEdit?: (id: string, title: string) => void;
  onCancelEdit?: () => void;
  onDelete?: (id: string) => void;
  className?: string;
};

function formatStamp(conversation: Conversation): string {
  const raw = conversation.updatedAt ?? conversation.createdAt;
  if (!raw) return "";
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationItem({
  conversation,
  active = false,
  editing = false,
  editTitle = "",
  onEditTitleChange,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onDelete,
  className,
}: ConversationItemProps) {
  const title = conversation.title?.trim() || "Untitled conversation";
  const stamp = formatStamp(conversation);

  function handleCommit() {
    const next = editTitle.trim() || title;
    onCommitEdit?.(conversation.id, next);
  }

  return (
    <div
      className={clsx(
        "group relative rounded-lg px-3 py-2 transition duration-150",
        active
          ? "bg-surface-2 text-fg"
          : "text-muted hover:bg-surface hover:text-fg",
        className,
      )}
    >
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={editTitle}
            autoFocus
            onChange={(e) => onEditTitleChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommit();
              if (e.key === "Escape") onCancelEdit?.();
            }}
            onBlur={handleCommit}
            className="w-full rounded-md border border-border bg-bg px-2 py-1 text-sm text-fg focus:border-strong focus:outline-none focus:ring-2 focus:ring-accent/40"
            aria-label="Rename conversation"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCommit}
            className="rounded p-1 text-success hover:bg-surface"
            aria-label="Save name"
          >
            <Check size={12} aria-hidden="true" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCancelEdit?.()}
            className="rounded p-1 text-subtle hover:bg-surface"
            aria-label="Cancel rename"
          >
            <XIcon size={12} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => onSelect?.(conversation.id)}
            className="block w-full text-left"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{title}</span>
              {stamp ? (
                <span className="shrink-0 text-[10px] text-subtle">{stamp}</span>
              ) : null}
            </div>
          </button>

          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit?.(conversation);
              }}
              className="rounded p-1 text-subtle transition hover:bg-surface hover:text-fg"
              aria-label="Rename conversation"
            >
              <Pencil size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(conversation.id);
              }}
              className="rounded p-1 text-subtle transition hover:bg-danger/10 hover:text-danger"
              aria-label="Delete conversation"
            >
              <Trash2 size={12} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ConversationItem;
