"use client";
import Nav from "@/components/Nav";
import { useEffect, useState } from "react";

export default function ToolsPage() {
  const [tools, setTools] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  useEffect(() => { fetch("/api/tools").then(r=>r.json()).then(d=>setTools(d.tools||[])); }, []);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch(`/api/tools/search?q=${encodeURIComponent(query)}`);
    const t = await r.text(); let d:any={}; try { d = t?JSON.parse(t):{}; } catch {}
    setResult(d);
  }

  return (
    <main><Nav />
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold mb-8">HORIZON Tools</h1>
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {tools.map(t => <div key={t.name} className="glass rounded-xl p-4"><div className="font-semibold">{t.name}</div><div className="text-sm text-slate-400">{t.description}</div><div className="text-xs text-slate-500 mt-1">{t.method} {t.path}</div></div>)}
        </div>
        <form onSubmit={runSearch} className="flex gap-2 mb-6">
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the web..." className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10" />
          <button className="px-4 py-2 rounded-xl bg-white text-black">Search</button>
        </form>
        {result && <pre className="glass rounded-xl p-4 text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
      </div>
    </main>
  );
}