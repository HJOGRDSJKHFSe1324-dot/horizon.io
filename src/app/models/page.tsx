"use client";
import Nav from "@/components/Nav";
import { useEffect, useState } from "react";
import Link from "next/link";

function usePromoCountdown(iso: string | null) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!iso) { setLabel(""); return; }
    const tick = () => {
      const diff = new Date(iso).getTime() - Date.now();
      if (diff <= 0) { setLabel("Promotion ended"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(`${d}d ${h}h ${m}m`);
    };
    tick(); const id = setInterval(tick, 60000); return () => clearInterval(id);
  }, [iso]);
  return label;
}

export default function ModelsPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/models").then(async r => { const t = await r.text(); try { setData(t ? JSON.parse(t) : null); } catch { setData(null); } }).catch(() => {}); }, []);
  return (
    <main><Nav />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold mb-4">Models</h1>
        <div className="mb-8 glass rounded-xl px-4 py-3 text-sm">
          Zenith-1.1 is free. Halo 1.5, Halo 2.5, and Nova 5.2 are paid models; Nova 5.2 requires Ultra.
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {(data?.models || []).map((m: any) => (
            <div key={m.id} className="glass rounded-2xl p-6">
              <div className="text-xs tracking-widest text-slate-400">{m.badge || m.tier}</div>
              <h3 className="text-2xl mt-2 font-semibold">{m.name}</h3>
              <p className="mt-3 text-slate-400 text-sm">{m.description}</p>
              <div className="mt-4 text-xs text-slate-500">Plan{m.plans?.length > 1 ? "s" : ""}: {(m.plans || [m.minPlan]).join(", ")}</div>
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