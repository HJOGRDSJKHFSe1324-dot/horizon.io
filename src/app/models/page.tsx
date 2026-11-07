"use client";
import Nav from "@/components/Nav";
import { useEffect, useState } from "react";
import Link from "next/link";
import { siteCopy } from "@/content/site-copy";
import ModelLeaderboard from "@/components/ModelLeaderboard";
import BestModelsShowcase from "@/components/BestModelsShowcase";

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
    <main id="main"><Nav />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold mb-4">{siteCopy.modelsPage.title}</h1>
        <div className="mb-8 glass rounded-xl px-4 py-3 text-sm">
          {siteCopy.modelsPage.freeNote}
        </div>
        <BestModelsShowcase models={data?.models} />
        <ModelLeaderboard models={data?.models} />
      </div>
    </main>
  );
}