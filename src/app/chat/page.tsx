"use client";
import Nav from "@/components/Nav";
import { useEffect, useState, useRef, Suspense } from "react";
import type { RefObject } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Copy, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";
const MarkdownContent = dynamic(() => import("@/components/chat/MarkdownContent").then((m) => m.default), {
  ssr: false,
  loading: () => <span className="text-slate-500 text-sm">Loading…</span>,
});
import Dropdown from "@/components/Dropdown";
import { siteCopy } from "@/content/site-copy";
import { useChatStore } from "@/lib/chat-store";
import { useChatStream } from "@/hooks/useChatStream";
import ChatEmptyState from "@/components/chat/ChatEmptyState";
import ConversationSidebar from "@/components/chat/ConversationSidebar";
import ChatInput from "@/components/chat/ChatInput";
import ChatErrorState from "@/components/chat/ChatErrorState";
import ScrollToBottom, { useScrollToBottom } from "@/components/chat/ScrollToBottom";
import FeedbackButtons from "@/components/chat/FeedbackButtons";
import MessageEntrance from "@/components/chat/MessageEntrance";

function useCountdown(iso: string | null) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!iso) { setLabel(""); return; }
    const tick = () => {
      const diff = new Date(iso).getTime() - Date.now();
      if (diff <= 0) { setLabel("Available now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);
  return label;
}

function ChatInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const {
    activeId,
    messages,
    models,
    modelSlug,
    input,
    streaming,
    tokenInfo,
    cooldownUntil,
    effort,
    webSearch,
    thinkHarder,
    attachments,
    setActiveId,
    setMessages,
    setModelSlug,
    setInput,
    setEditTitle,
    setEffort,
    setWebSearch,
    setThinkHarder,
    loadConversations,
    loadModels,
    loadMessages,
    newConv,
    renameConv,
    deleteConv,
    uploadFile,
    removeAttachment,
  } = useChatStore();

  const { send, regenerate, stop, error, clearError, retry } = useChatStream();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { visible: showScrollBtn, scrollToBottom } = useScrollToBottom(
    scrollRef as unknown as RefObject<HTMLElement | null>,
  );

  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => useChatStore.getState().setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { maximumAge: 600000, timeout: 5000 }
      );
    }
  }, []);

  useEffect(() => {
    const d = sp.get("draft");
    if (d) setInput(d);
    const m = sp.get("model");
    if (m) setModelSlug(m);
  }, [sp, setInput, setModelSlug]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.push("/login"); return; }
    loadConversations();
    loadModels();
  }, [session, status, router, loadConversations, loadModels]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages, setMessages]);

  useEffect(() => {
    if (!activeId) { useChatStore.getState().setAttachments([]); return; }
    fetch(`/api/attachments?conversationId=${activeId}`).then(async (r) => {
      const t = await r.text();
      try { const d = t ? JSON.parse(t) : []; if (Array.isArray(d)) useChatStore.getState().setAttachments(d); } catch {}
    }).catch(() => {});
  }, [activeId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < 160) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const cooldownLabel = useCountdown(cooldownUntil);

  const copyText = async (t: string) => { await navigator.clipboard.writeText(t); };

  const selectedModelInfo = models.find((m: any) => m.slug === modelSlug);

  const handleDelete = (id: string) => { deleteConv(id); };
  const handleNewConv = () => { newConv(); setSidebarOpen(false); };
  const handleSelectConv = (id: string) => { setActiveId(id); setSidebarOpen(false); };
  const handleRenameSidebar = async (id: string, title: string) => {
    setEditTitle(title);
    await renameConv(id);
  };

  return (
    <main id="main" className="h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && <button onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" aria-label="Close conversations overlay" />}
        <ConversationSidebar
          onNew={handleNewConv}
          onSelect={handleSelectConv}
          onRename={handleRenameSidebar}
          onDelete={handleDelete}
          className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} fixed md:static inset-y-0 left-0 z-50 md:z-auto max-w-[85vw] transition-transform duration-200`}
        />

        {/* main chat */}
        <section className="flex-1 flex flex-col">
          {/* top bar */}
          <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden px-2 py-1 rounded-lg border border-white/10 text-xs" aria-label="Open conversations">Chats</button>
            <Dropdown
              value={modelSlug}
              onChange={setModelSlug}
              options={models.map((m: any) => ({ value: m.slug, label: `${m.name}${m.canUse ? "" : " (locked)"}`, disabled: !m.canUse, hint: m.canUse ? undefined : "Locked" }))}
              className=""
            />
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <div>{siteCopy.chat.tokensLeft}: <span className="text-white font-medium">{tokenInfo?.remainingTokens ?? "—"}</span></div>
              {cooldownUntil && <div>{siteCopy.chat.cooldown}: <span className="text-amber-400 font-medium">{cooldownLabel}</span></div>}
              <div>{selectedModelInfo?.name}</div>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions" className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-6 relative">
            {error && (
              <ChatErrorState
                error={error}
                onRetry={() => retry()}
                onDismiss={clearError}
                compact
                className="mb-4"
              />
            )}
            {messages.length === 0 && (
              <ChatEmptyState onPromptSelect={setInput} />
            )}
            {messages.map((m: any) => (
              <MessageEntrance key={m.id} role={m.role === "user" ? "user" : "assistant"}>
                <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-white text-black" : "glass"}`}>
                    {m.role === "assistant" ? (
                      <div className="markdown text-sm leading-relaxed">
                        <MarkdownContent content={m.content || ""} streaming={!!m._streaming} />
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content || (m._streaming ? "..." : "")}</div>
                    )}
                    {m.role === "assistant" && !m._streaming && m.content && (
                      <div className="mt-2 flex gap-2 text-xs text-slate-400 items-center flex-wrap">
                        <button onClick={() => copyText(m.content)} aria-label="Copy message" className="hover:text-white flex items-center gap-1"><Copy size={12} aria-hidden="true" /> Copy</button>
                        <button onClick={() => regenerate(m)} aria-label="Regenerate response" className="hover:text-white flex items-center gap-1"><RefreshCw size={12} aria-hidden="true" /> Regenerate</button>
                        <FeedbackButtons messageId={m.id} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              </MessageEntrance>
            ))}
            <div className="absolute bottom-3 right-3 z-10">
              <ScrollToBottom visible={showScrollBtn} onClick={scrollToBottom} />
            </div>
          </div>

          {/* input */}
          <div className="border-t border-white/5 p-3">
            <div className="max-w-3xl mx-auto space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Dropdown
                  value={modelSlug}
                  onChange={setModelSlug}
                  options={models.map((m: any) => ({ value: m.slug, label: `${m.name}${m.canUse ? "" : " (locked)"} — ${(m.plans || [m.minPlan]).join(", ")}`, disabled: !m.canUse, hint: m.canUse ? undefined : "Locked" }))}
                  size="sm"
                  placement="up"
                />
                <Dropdown
                  value={effort}
                  onChange={setEffort}
                  options={[
                    { value: "low", label: "Low (0.5x)" },
                    { value: "medium", label: "Medium (recommended)" },
                    { value: "high", label: "High (2x)" },
                    { value: "xhigh", label: "X-High (3x)" },
                    { value: "max", label: "Max (6x usage)" },
                  ]}
                  size="sm"
                  placement="up"
                />
                <button onClick={() => setThinkHarder((v: boolean) => !v)} className={`text-xs px-2 py-1 rounded-lg border ${thinkHarder ? "bg-cyan-500/20 border-cyan-400/40" : "bg-white/5 border-white/10"}`}>
                  Think harder
                </button>
                <button onClick={() => setWebSearch((v: boolean) => !v)} className={`text-xs px-2 py-1 rounded-lg border ${webSearch ? "bg-cyan-500/20 border-cyan-400/40" : "bg-white/5 border-white/10"}`}>
                  Web search
                </button>
              </div>
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={(value) => { void send(value); }}
                streaming={streaming}
                onStop={stop}
                placeholder={siteCopy.chat.composerPlaceholder}
                attachments={attachments}
                files={attachments}
                onFiles={(files) => files.forEach((f) => uploadFile(f))}
                onRemoveAttachment={removeAttachment}
                ariaLabel="Message HORIZON"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10">{siteCopy.chat.loading}</div>}>
      <ChatInner />
    </Suspense>
  );
}
