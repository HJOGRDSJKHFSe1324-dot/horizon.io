"use client";

import { useRef, useCallback, useState } from "react";
import { useChatStore } from "@/lib/chat-store";
import {
  classifyChatError,
  readChatSseStream,
  type ChatErrorInfo,
} from "@/lib/chatReliability";

async function safeFetchJson(r: Response): Promise<any> {
  const t = await r.text();
  try {
    return t ? JSON.parse(t) : {};
  } catch {
    return {};
  }
}

export function useChatStream() {
  const abortRef = useRef<AbortController | null>(null);
  const lastTextRef = useRef<string>("");
  const [error, setError] = useState<ChatErrorInfo | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const send = useCallback(async (overrideText?: string) => {
    const store = useChatStore.getState();
    const text = (overrideText ?? store.input).trim();
    if (!text || store.streaming) return;

    lastTextRef.current = text;
    store.setInput("");
    store.setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);

    const controller = new AbortController();
    abortRef.current = controller;
    store.setStreaming(true);

    const selectedModel = store.modelSlug;
    const asstId = `a-${Date.now()}`;
    store.setMessages((prev) => [...prev, { id: asstId, role: "assistant", content: "", _streaming: true }]);

    const { effort, thinkHarder, webSearch, attachments, location, activeId } = store;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          modelSlug: selectedModel,
          message: text,
          effort,
          thinkHarder,
          webSearch,
          attachmentIds: attachments.map((a: any) => a.id),
          latitude: location?.lat,
          longitude: location?.lon,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const d = await safeFetchJson(res);
        const info = classifyChatError(null, res);
        if (d?.error) info.message = d.error;
        setError(info);
        useChatStore.getState().setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, content: `Error: ${info.message}`, _streaming: false } : m))
        );
        useChatStore.getState().setStreaming(false);
        await useChatStore.getState().loadModels();
        return;
      }

      setError(null);
      const result = await readChatSseStream(
        res,
        {
          onDelta: (content) => {
            useChatStore.getState().setMessages((prev) =>
              prev.map((m) => (m.id === asstId ? { ...m, content: m.content + content } : m))
            );
          },
          onDone: (j) => {
            useChatStore.getState().setMessages((prev) =>
              prev.map((m) =>
                m.id === asstId ? { ...m, id: j.message?.id ?? m.id, content: j.message?.content ?? m.content, _streaming: false } : m
              )
            );
            if (j.conversationId) useChatStore.getState().setActiveId(j.conversationId);
            useChatStore.getState().setTokenInfo((prev: any) => ({ ...prev, remainingTokens: j.tokens?.balanceAfter }));
            useChatStore.getState().setCooldownUntil(j.tokens?.cooldownUntil || null);
            void useChatStore.getState().loadConversations();
          },
          onError: (message) => {
            const info = classifyChatError(new Error(message));
            setError(info);
            useChatStore.getState().setMessages((prev) =>
              prev.map((m) => (m.id === asstId ? { ...m, content: `Error: ${message}`, _streaming: false } : m))
            );
          },
        },
        { signal: controller.signal, inactivityTimeoutMs: 90_000 },
      );

      if (!result.ok && result.error) {
        setError((prev) => prev ?? result.error ?? null);
        const msg = result.error.message;
        // Only overwrite if an assistant placeholder is still streaming.
        const state = useChatStore.getState();
        const target = state.messages.find((m) => m.id === asstId);
        if (target?._streaming) {
          state.setMessages((prev) =>
            prev.map((m) => (m.id === asstId ? { ...m, content: m.content ? m.content : `Error: ${msg}`, _streaming: false } : m))
          );
        }
      }
    } catch (e: any) {
      const info = classifyChatError(e);
      if (info.kind !== "abort") {
        setError(info);
        useChatStore.getState().setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, content: `Error: ${info.message}`, _streaming: false } : m))
        );
      } else {
        useChatStore.getState().setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, _streaming: false } : m))
        );
      }
    }

    useChatStore.getState().setStreaming(false);
    await useChatStore.getState().loadModels();
  }, []);

  const regenerate = useCallback(async (msg: any) => {
    const store = useChatStore.getState();
    if (store.streaming) return;

    store.setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, content: "", _streaming: true } : m)));
    store.setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const asstId = msg.id;
    const selectedModel = useChatStore.getState().modelSlug;
    const { effort, thinkHarder, webSearch, activeId } = useChatStore.getState();

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          modelSlug: selectedModel,
          message: "",
          regenerateAssistantId: msg.id,
          effort,
          thinkHarder,
          webSearch,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const d = await safeFetchJson(res);
        const info = classifyChatError(null, res);
        if (d?.error) info.message = d.error;
        setError(info);
        useChatStore.getState().setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, content: `Error: ${info.message}`, _streaming: false } : m))
        );
        useChatStore.getState().setStreaming(false);
        await useChatStore.getState().loadModels();
        return;
      }

      setError(null);
      const result = await readChatSseStream(
        res,
        {
          onDelta: (content) => {
            useChatStore.getState().setMessages((prev) =>
              prev.map((m) => (m.id === asstId ? { ...m, content: m.content + content } : m))
            );
          },
          onDone: (j) => {
            useChatStore.getState().setMessages((prev) =>
              prev.map((m) =>
                m.id === asstId ? { ...m, id: j.message?.id ?? m.id, content: j.message?.content ?? m.content, _streaming: false } : m
              )
            );
            useChatStore.getState().setTokenInfo((prev: any) => ({ ...prev, remainingTokens: j.tokens?.balanceAfter }));
            useChatStore.getState().setCooldownUntil(j.tokens?.cooldownUntil || null);
            void useChatStore.getState().loadConversations();
          },
          onError: (message) => {
            const info = classifyChatError(new Error(message));
            setError(info);
            useChatStore.getState().setMessages((prev) =>
              prev.map((m) => (m.id === asstId ? { ...m, content: `Error: ${message}`, _streaming: false } : m))
            );
          },
        },
        { signal: controller.signal, inactivityTimeoutMs: 90_000 },
      );

      if (!result.ok && result.error) {
        setError((prev) => prev ?? result.error ?? null);
      }
    } catch (e: any) {
      const info = classifyChatError(e);
      if (info.kind !== "abort") {
        setError(info);
        useChatStore.getState().setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, content: `Error: ${info.message}`, _streaming: false } : m))
        );
      } else {
        useChatStore.getState().setMessages((prev) =>
          prev.map((m) => (m.id === asstId ? { ...m, _streaming: false } : m))
        );
      }
    }

    useChatStore.getState().setStreaming(false);
    await useChatStore.getState().loadModels();
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const retry = useCallback(async () => {
    clearError();
    const text = lastTextRef.current;
    if (!text) return;
    // Put text back into store input then send.
    useChatStore.getState().setInput(text);
    // Delegate to send after state update.
    await send(text);
  }, [clearError, send]);

  return { send, regenerate, stop, error, clearError, retry };
}
