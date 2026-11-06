"use client";
import Nav from "@/components/Nav";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Copy, Trash2, Plus, Send, RefreshCw, Pencil } from "lucide-react";

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
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [modelSlug, setModelSlug] = useState(sp.get("model") || "zenith-1.1");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const cooldownLabel = useCountdown(cooldownUntil);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function safeJson(r: Response) { const t = await r.text(); try { return t ? JSON.parse(t) : null; } catch { return null; } }
  async function loadConversations() {
    const r = await fetch("/api/conversations");
    if (r.ok) { const d = await safeJson(r); if (Array.isArray(d)) setConversations(d); }
  }
  async function loadModels() {
    const r = await fetch("/api/models");
    if (r.ok) {
      const d = await safeJson(r);
      if (d) { setModels(d.models || []); setTokenInfo(d); setCooldownUntil(d.cooldownUntil); }
    }
  }
  async function loadMessages(id: string) {
    const r = await fetch(`/api/conversations/${id}`);
    if (r.ok) {
      const d = await safeJson(r);
      if (d) setMessages(d.messages || []);
    }
  }

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) { router.push("/login"); return; }
    loadConversations(); loadModels();
  }, [session, status]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function selectConv(id: string) { setActiveId(id); }
  async function newConv() { setActiveId(null); setMessages([]); }

  async function renameConv(id: string) {
    await fetch(`/api/conversations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: editTitle }) });
    setEditingId(null);
    loadConversations();
  }
  async function deleteConv(id: string) {
    if (!confirm("Delete conversation?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeId === id) { setActiveId(null); setMessages([]); }
    loadConversations();
  }

  async function safeFetchJson(r: Response) { const t = await r.text(); try { return t ? JSON.parse(t) : {}; } catch { return {}; } }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setStreaming(true);
    const selectedModel = modelSlug;
    // assistant placeholder
    const asstId = `a-${Date.now()}`;
    setMessages(prev => [...prev, { id: asstId, role: "assistant", content: "", _streaming: true }]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, modelSlug: selectedModel, message: text }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: `Error: ${d.error || res.statusText}`, _streaming: false } : m));
        setStreaming(false);
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const j = JSON.parse(t.slice(5).trim());
            if (j.type === "delta") {
              setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content + j.content } : m));
            } else if (j.type === "done") {
              setMessages(prev => prev.map(m => m.id === asstId ? { ...m, id: j.message.id, content: j.message.content, _streaming: false } : m));
              if (j.conversationId) setActiveId(j.conversationId);
              setTokenInfo((prev: any) => ({ ...prev, remainingTokens: j.tokens?.balanceAfter }));
              setCooldownUntil(j.tokens?.cooldownUntil || null);
              loadConversations();
            } else if (j.type === "error") {
              setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: `Error: ${j.message}`, _streaming: false } : m));
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: `Error: ${e?.message}`, _streaming: false } : m));
    }
    setStreaming(false);
    loadModels();
  }

  async function copyText(t: string) { await navigator.clipboard.writeText(t); }
  async function regenerate(msg: any) {
    if (streaming) return;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: "", _streaming: true } : m));
    setStreaming(true);
    const asstId = msg.id;
    const selectedModel = modelSlug;
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, modelSlug: selectedModel, message: "", regenerateAssistantId: msg.id }),
      });
      if (!res.ok) {
        const d = await safeFetchJson(res);
        setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: `Error: ${d.error || res.statusText}`, _streaming: false } : m));
        setStreaming(false);
        return;
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const j = JSON.parse(t.slice(5).trim());
            if (j.type === "delta") {
              setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: m.content + j.content } : m));
            } else if (j.type === "done") {
              setMessages(prev => prev.map(m => m.id === asstId ? { ...m, id: j.message.id, content: j.message.content, _streaming: false } : m));
              setTokenInfo((prev: any) => ({ ...prev, remainingTokens: j.tokens?.balanceAfter }));
              setCooldownUntil(j.tokens?.cooldownUntil || null);
              loadConversations();
            } else if (j.type === "error") {
              setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: `Error: ${j.message}`, _streaming: false } : m));
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, content: `Error: ${e?.message}`, _streaming: false } : m));
    }
    setStreaming(false);
    loadModels();
  }

  const selectedModelInfo = models.find(m => m.slug === modelSlug);

  return (
    <main className="h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex overflow-hidden">
        {/* sidebar */}
        <aside className="w-72 border-r border-white/5 flex flex-col bg-[#070a12]">
          <div className="p-4">
            <button onClick={newConv} className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center gap-2 text-sm">
              <Plus size={16} /> New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
            {conversations.map(c => (
              <div key={c.id} className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${activeId === c.id ? "bg-white/10" : "hover:bg-white/5"}`}>
                <div onClick={() => selectConv(c.id)} className="flex-1 truncate text-sm">{c.title || "Untitled"}</div>
                {editingId === c.id ? (
                  <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} onBlur={() => renameConv(c.id)} onKeyDown={e=>{if(e.key==="Enter") renameConv(c.id);}} className="w-20 text-xs bg-white/10 rounded px-1" autoFocus />
                ) : (
                  <>
                    <button onClick={() => { setEditingId(c.id); setEditTitle(c.title || ""); }} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white"><Pencil size={12} /></button>
                    <button onClick={() => deleteConv(c.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400"><Trash2 size={12} /></button>
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
            <select value={modelSlug} onChange={e=>setModelSlug(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm">
              {models.map(m => (
                <option key={m.id} value={m.slug} disabled={!m.canUse}>{m.name} {m.canUse ? "" : "(locked)"}</option>
              ))}
            </select>
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <div>Tokens left: <span className="text-white font-medium">{tokenInfo?.remainingTokens ?? "—"}</span></div>
              {cooldownUntil && <div>Cooldown: <span className="text-amber-400 font-medium">{cooldownLabel}</span></div>}
              <div>{selectedModelInfo?.name}</div>
            </div>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-20">Start a conversation.</div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-white text-black" : "glass"}`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content || (m._streaming ? "..." : "")}</div>
                  {m.role === "assistant" && !m._streaming && m.content && (
                    <div className="mt-2 flex gap-2 text-xs text-slate-400">
                      <button onClick={() => copyText(m.content)} className="hover:text-white flex items-center gap-1"><Copy size={12}/>Copy</button>
                      <button onClick={() => regenerate(m)} className="hover:text-white flex items-center gap-1"><RefreshCw size={12}/>Regenerate</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* input */}
          <div className="border-t border-white/5 p-4">
            <div className="max-w-3xl mx-auto flex gap-2">
              <textarea
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Message HORIZON..."
                rows={1}
                className="flex-1 resize-none px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none text-sm"
              />
              <button onClick={send} disabled={streaming || !input.trim()} className="px-4 py-3 rounded-xl bg-white text-black disabled:opacity-40">
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <ChatInner />
    </Suspense>
  );
}