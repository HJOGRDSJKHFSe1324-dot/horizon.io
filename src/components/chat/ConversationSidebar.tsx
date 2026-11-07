"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { useChatStore } from "@/lib/chat-store";
import { NewConversationButton } from "./NewConversationButton";
import { ConversationSearch } from "./ConversationSearch";
import { ConversationItem, type Conversation } from "./ConversationItem";

export type ConversationSidebarProps = {
  conversations?: Conversation[];
  activeId?: string | null;
  loading?: boolean;
  error?: string | null;

  onSelect?: (id: string) => void;
  onNew?: () => void | Promise<void>;
  onRename?: (id: string, title: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;

  searchQuery?: string;
  onSearchChange?: (value: string) => void;

  emptyLabel?: string;
  showSearch?: boolean;
  showNewButton?: boolean;
  className?: string;
};

export function ConversationSidebar({
  conversations: conversationsProp,
  activeId: activeIdProp,
  loading = false,
  error = null,
  onSelect,
  onNew,
  onRename,
  onDelete,
  searchQuery,
  onSearchChange,
  emptyLabel = "No conversations yet",
  showSearch = true,
  showNewButton = true,
  className,
}: ConversationSidebarProps) {
  const store = useChatStore();

  const controlled = conversationsProp !== undefined;
  const conversations = (controlled ? conversationsProp : store.conversations) as Conversation[];
  const activeId = activeIdProp !== undefined ? activeIdProp : store.activeId;

  const [query, setQuery] = useState(searchQuery ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    if (!controlled) {
      void store.loadConversations();
    }
  }, [controlled]);

  useEffect(() => {
    if (searchQuery !== undefined) setQuery(searchQuery);
  }, [searchQuery]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) => {
      const title = String(conversation.title ?? "").toLowerCase();
      const preview = String(conversation.messages?.[0]?.content ?? "").toLowerCase();
      return title.includes(term) || preview.includes(term);
    });
  }, [conversations, query]);

  function handleSearchChange(next: string) {
    if (searchQuery === undefined) setQuery(next);
    onSearchChange?.(next);
  }

  async function handleNew() {
    if (onNew) {
      await onNew();
      return;
    }
    if (!controlled) store.newConv();
  }

  function handleSelect(id: string) {
    if (onSelect) {
      onSelect(id);
      return;
    }
    if (!controlled) store.selectConv(id);
  }

  function startEdit(conversation: Conversation) {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title ?? "");
    if (!controlled) {
      store.setEditingId(conversation.id);
      store.setEditTitle(conversation.title ?? "");
    }
  }

  async function commitEdit(id: string, title: string) {
    const next = title.trim() || "New conversation";
    if (onRename) {
      await onRename(id, next);
    } else if (!controlled) {
      store.setEditTitle(next);
      await store.renameConv(id);
    }
    setEditingId(null);
    setEditingTitle("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle("");
    if (!controlled) store.setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (onDelete) {
      await onDelete(id);
      return;
    }
    if (!controlled) {
      await store.deleteConv(id);
    }
  }

  return (
    <aside
      className={clsx(
        "flex h-full w-72 flex-col border-r border-border bg-bg-raised",
        className,
      )}
      aria-label="Conversations"
    >
      <div className="space-y-3 p-4">
        {showNewButton ? (
          <NewConversationButton
            onClick={() => void handleNew()}
            label="New chat"
          />
        ) : null}
        {showSearch ? (
          <ConversationSearch
            value={query}
            onChange={handleSearchChange}
            placeholder="Search conversations"
          />
        ) : null}
      </div>

      {error ? (
        <div className="mx-4 mb-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-2 pb-3 scrollbar-thin">
        {loading ? (
          <div className="space-y-2 px-2 py-2" aria-live="polite" aria-busy="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-10 animate-pulse rounded-lg bg-surface"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-muted">
            {query ? "No matching conversations" : emptyLabel}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeId}
                editing={editingId === conversation.id}
                editTitle={editingTitle}
                onEditTitleChange={setEditingTitle}
                onSelect={handleSelect}
                onStartEdit={startEdit}
                onCommitEdit={(id, title) => void commitEdit(id, title)}
                onCancelEdit={cancelEdit}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

export default ConversationSidebar;
