"use client";
import Nav from "@/components/Nav";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Copy, Trash2, Plus, Send, RefreshCw, Pencil, Square } from "lucide-react";
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
    conversations,
    activeId,
    messages,
    models,
    modelSlug,
    input,
    streaming,
    tokenInfo,
    cooldownUntil,
    editingId,
    editTitle,
    effort,
    webSearch,
    thinkHarder,
    attachments,
    location,
    setActiveId,
    setMessages,
    setModelSlug,
    setInput,
    setStreaming,
    setTokenInfo,
    setCooldownUntil,
    setEditingId,
    setEditTitle,
    setEffort,
    setWebSearch,
    setThinkHarder,
    setAttachments,
    setLocation,
    loadConversations,
    loadModels,
    loadMessages,
    newConv,
    renameConv,
    deleteConv,
    uploadFile,
    removeAttachment,
  } = useChatStore();

  const { send, regenerate, stop } = useChatStream();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
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
  }, [sp]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.push("/login"); return; }
    loadConversations();
    loadModels();
  }, [session, status]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) { setAttachments([]); return; }
    fetch(`/api/attachments?conversationId=${activeId}`).then(async (r) => {
      const t = await r.text();
      try { const d = t ? JSON.parse(t) : []; if (Array.isArray(d)) setAttachments(d); } catch {}
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

  const startEdit = (c: any) => { setEditingId(c.id); setEditTitle(c.title || ""); };

  const handleRename = (id: string) => { renameConv(id); };

  const handleDelete = (id: string) => { deleteConv(id); };

  const handleNewConv = () => { newConv(); setSidebarOpen(false); };

  const handleSelectConv = (id: string) => { setActiveId(id); setSidebarOpen(false); };

  return (
    <main id="main" className="h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex overflow-hidden">
        {/* mobile sidebar overlay */}
        {sidebarOpen && <button onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" aria-label="Close conversations overlay" />}
        {/* sidebar */}
        <aside aria-label="Conversations" className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} fixed md:static inset-y-0 left-0 z-50 md:z-auto w-72 max-w-[85vw] border-r border-white/5 flex flex-col bg-[#070a12] transition-transform duration-200`}>
          <div className="flex items-center justify-between p-4">
            <button onClick={handleNewConv} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center gap-2 text-sm">
              <Plus size={16} /> New chat
            </button>
            <button onClick={() => setSidebarOpen(false)} aria-label="Close conversations" className="md:hidden ml-2 px-2 py-1 rounded-lg border border-white/10 text-xs">Close</button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
            {conversations.map((c: any) => (
              <div key={c.id} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelectConv(c.id); } }} className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${activeId === c.id ? "bg-white/10" : "hover:bg-white/5"}`}>
                <div onClick={() => handleSelectConv(c.id)} className="flex-1 truncate text-sm">{c.title || "Untitled"}</div>
                {editingId === c.id ? (
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={() => handleRename(c.id)} onKeyDown={e => { if (e.key === "Enter") handleRename(c.id); }} className="w-20 text-xs bg-white/10 rounded px-1" autoFocus />
                ) : (
                  <>
                    <button onClick={() => startEdit(c)} aria-label="Rename conversation" className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"><Pencil size={12} aria-hidden="true" /></button>
                    <button onClick={() => handleDelete(c.id)} aria-label="Delete conversation" className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400"><Trash2 size={12} aria-hidden="true" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </aside>

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
          <div ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions" className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <ChatEmptyState onPromptSelect={setInput} />
            )}
            {messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-white text-black" : "glass"}`}>
                  {m.role === "assistant" ? (
                    <div className="markdown text-sm leading-relaxed">
                      <MarkdownContent content={m.content || ""} streaming={!!m._streaming} />
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content || (m._streaming ? "..." : "")}</div>
                  )}
                  {m.role === "assistant" && !m._streaming && m.content && (
                    <div className="mt-2 flex gap-2 text-xs text-slate-400">
                      <button onClick={() => copyText(m.content)} aria-label="Copy message" className="hover:text-white flex items-center gap-1"><Copy size={12} aria-hidden="true" /> Copy</button>
                      <button onClick={() => regenerate(m)} aria-label="Regenerate response" className="hover:text-white flex items-center gap-1"><RefreshCw size={12} aria-hidden="true" /> Regenerate</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* input */}
          <div className="border-t border-white/5 p-3">
            <div className="max-w-3xl mx-auto">
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((a: any) => (
                    <span key={a.id} className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 flex items-center gap-1">
                      {a.fileName}
                      <button onClick={() => removeAttachment(a.id)} aria-label={`Remove ${a.fileName}`} className="hover:text-red-400"><Trash2 size={10} aria-hidden="true" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={siteCopy.chat.composerPlaceholder}
                  aria-label="Message HORIZON"
                  rows={1}
                  className="w-full resize-none px-3 py-2 bg-transparent outline-none text-sm"
                />
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <input ref={fileInputRef} type="file" multiple hidden aria-label="Upload files" onChange={e => { if (e.target.files) Array.from(e.target.files).forEach(uploadFile); e.target.value = ""; }} />
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15" title="Add files or zips">+ Files</button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
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
                    {streaming ? (
                      <button onClick={stop} aria-label="Stop generating" className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30" title="Stop">
                        <Square size={14} aria-hidden="true" />
                      </button>
                    ) : (
                      <button onClick={() => send()} disabled={!input.trim()} aria-label="Send message" className="px-4 py-1.5 rounded-lg bg-white text-black disabled:opacity-40">
                        <Send size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
