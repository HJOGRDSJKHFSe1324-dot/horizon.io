"use client";

import { create } from "zustand";
import { siteCopy } from "@/content/site-copy";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

function asUpdater<T>(value: T | ((prev: T) => T), prev: T): T {
  return typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
}

async function safeJson(r: Response): Promise<any> {
  const t = await r.text();
  try {
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
}

interface ChatState {
  conversations: any[];
  activeId: string | null;
  messages: any[];
  models: any[];
  modelSlug: string;
  input: string;
  streaming: boolean;
  tokenInfo: any;
  cooldownUntil: string | null;
  editingId: string | null;
  editTitle: string;
  effort: string;
  webSearch: boolean;
  thinkHarder: boolean;
  attachments: any[];
  location: { lat: number; lon: number } | null;

  setConversations: Setter<any[]>;
  setActiveId: (value: string | null) => void;
  setMessages: Setter<any[]>;
  setModels: Setter<any[]>;
  setModelSlug: (value: string) => void;
  setInput: Setter<string>;
  setStreaming: (value: boolean) => void;
  setTokenInfo: Setter<any>;
  setCooldownUntil: (value: string | null) => void;
  setEditingId: (value: string | null) => void;
  setEditTitle: (value: string) => void;
  setEffort: (value: string) => void;
  setWebSearch: (value: boolean | ((prev: boolean) => boolean)) => void;
  setThinkHarder: (value: boolean | ((prev: boolean) => boolean)) => void;
  setAttachments: Setter<any[]>;
  setLocation: (value: { lat: number; lon: number } | null) => void;

  loadConversations: () => Promise<void>;
  loadModels: () => Promise<void>;
  loadMessages: (id: string) => Promise<void>;
  selectConv: (id: string) => void;
  newConv: () => void;
  renameConv: (id: string) => Promise<void>;
  deleteConv: (id: string) => Promise<void>;
  ensureConversation: () => Promise<string | null>;
  uploadFile: (file: File) => Promise<void>;
  removeAttachment: (id: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeId: null,
  messages: [],
  models: [],
  modelSlug: "zenith-1.1",
  input: "",
  streaming: false,
  tokenInfo: null,
  cooldownUntil: null,
  editingId: null,
  editTitle: "",
  effort: "medium",
  webSearch: false,
  thinkHarder: false,
  attachments: [],
  location: null,

  setConversations: (value) =>
    set((s) => ({ conversations: asUpdater(value, s.conversations) })),
  setActiveId: (value) => set({ activeId: value }),
  setMessages: (value) => set((s) => ({ messages: asUpdater(value, s.messages) })),
  setModels: (value) => set((s) => ({ models: asUpdater(value, s.models) })),
  setModelSlug: (value) => set({ modelSlug: value }),
  setInput: (value) => set((s) => ({ input: asUpdater(value, s.input) })),
  setStreaming: (value) => set({ streaming: value }),
  setTokenInfo: (value) => set((s) => ({ tokenInfo: asUpdater(value, s.tokenInfo) })),
  setCooldownUntil: (value) => set({ cooldownUntil: value }),
  setEditingId: (value) => set({ editingId: value }),
  setEditTitle: (value) => set({ editTitle: value }),
  setEffort: (value) => set({ effort: value }),
  setWebSearch: (value) => set((s) => ({ webSearch: asUpdater(value, s.webSearch) })),
  setThinkHarder: (value) => set((s) => ({ thinkHarder: asUpdater(value, s.thinkHarder) })),
  setAttachments: (value) => set((s) => ({ attachments: asUpdater(value, s.attachments) })),
  setLocation: (value) => set({ location: value }),

  loadConversations: async () => {
    try {
      const r = await fetch("/api/conversations");
      if (r.ok) {
        const d = await safeJson(r);
        if (Array.isArray(d)) set({ conversations: d });
      }
    } catch {
      // ignore
    }
  },

  loadModels: async () => {
    try {
      const r = await fetch("/api/models");
      if (r.ok) {
        const d = await safeJson(r);
        if (d) {
          set({ models: d.models || [], tokenInfo: d, cooldownUntil: d.cooldownUntil });
        }
      }
    } catch {
      // ignore
    }
  },

  loadMessages: async (id: string) => {
    try {
      const r = await fetch(`/api/conversations/${id}`);
      if (r.ok) {
        const d = await safeJson(r);
        if (d) set({ messages: d.messages || [] });
      }
    } catch {
      // ignore
    }
  },

  selectConv: (id: string) => set({ activeId: id }),

  newConv: () => set({ activeId: null, messages: [], attachments: [] }),

  renameConv: async (id: string) => {
    const editTitle = get().editTitle;
    try {
      await fetch(`/api/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle }),
      });
    } catch {
      // ignore
    }
    set({ editingId: null });
    await get().loadConversations();
  },

  deleteConv: async (id: string) => {
    if (!confirm(siteCopy.chat.deleteConfirm)) return;
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
    if (get().activeId === id) {
      set({ activeId: null, messages: [], attachments: [] });
    }
    await get().loadConversations();
  },

  ensureConversation: async () => {
    const activeId = get().activeId;
    if (activeId) return activeId;
    try {
      const modelSlug = get().modelSlug;
      const r = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelSlug, title: siteCopy.chat.newConversationTitle }),
      });
      const c = await r.json().catch(() => null);
      if (c?.id) {
        set({ activeId: c.id });
        return c.id;
      }
    } catch {
      // ignore
    }
    return null;
  },

  uploadFile: async (file: File) => {
    const cid = await get().ensureConversation();
    if (!cid) return;
    const form = new FormData();
    form.append("file", file);
    form.append("conversationId", cid);
    try {
      const r = await fetch("/api/attachments", { method: "POST", body: form });
      const t = await r.text();
      let d: any = {};
      try {
        d = t ? JSON.parse(t) : {};
      } catch {
        d = {};
      }
      if (r.ok && d?.id) {
        set((s) => ({ attachments: [...s.attachments, d] }));
      } else {
        alert(d.error || siteCopy.chat.attachments.uploadFailed);
      }
    } catch {
      alert(siteCopy.chat.attachments.uploadFailed);
    }
  },

  removeAttachment: async (id: string) => {
    try {
      await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
    set((s) => ({ attachments: s.attachments.filter((a) => a.id !== id) }));
  },
}));
