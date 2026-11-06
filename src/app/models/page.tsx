"use client";
import Nav from "@/components/Nav";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ModelsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/models").then(async r => { const t = await r.text(); try { setData(t ? JSON.parse(t) : null); } catch { setData(null); } }).catch(() => {}); }, []);
  return (
    <main><Nav />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold mb-10">Models</h1>
        <div className="grid md:grid-cols-3 gap-6">
          {(data?.models || []).map((m: any) => (
            <div key={m.id} className="glass rounded-2xl p-6">
              <div className="text-xs tracking-widest text-slate-400">{m.badge || m.tier}</div>
              <h3 className="text-2xl mt-2 font-semibold">{m.name}</h3>
              <p className="mt-3 text-slate-400 text-sm">{m.description}</p>
              <div className="mt-4 text-xs text-slate-500">Min plan: {m.minPlan}</div>
              <div className="mt-6 flex items-center justify-between">
                <span className={`text-xs ${m.canUse ? "text-green-400" : "text-amber-400"}`}>{m.canUse ? "Available" : m.reason}</span>
                <Link href={`/chat?model=${m.slug}`} className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium">Chat</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}