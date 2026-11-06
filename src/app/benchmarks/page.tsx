"use client";
import Nav from "@/components/Nav";
import { useEffect, useState } from "react";

export default function BenchmarksPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetch("/api/benchmarks").then(async r => { const t = await r.text(); try { setData(t ? JSON.parse(t) : null); } catch {} }).catch(()=>{}); }, []);

  const models = data?.models || [];
  const results = data?.results || [];

  function avg(slug: string, field: string) {
    const rs = results.filter((r: any) => r.model.slug === slug && r[field] != null);
    if (!rs.length) return null;
    const vals = rs.map((r: any) => Number(r[field]));
    return (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2);
  }
  function avgTps(slug: string) {
    const rs = results.filter((r: any) => r.model.slug === slug && r.tokensPerSecond != null);
    if (!rs.length) return null;
    const vals = rs.map((r: any) => Number(r.tokensPerSecond));
    return (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
  }
  function avgLat(slug: string) {
    const rs = results.filter((r: any) => r.model.slug === slug && r.latencyMs != null);
    if (!rs.length) return null;
    const vals = rs.map((r: any) => Number(r.latencyMs));
    return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  }

  return (
    <main><Nav />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold mb-2">Horizon Benchmarks</h1>
        <p className="text-slate-400 mb-10">Real measured results from running identical tests against each model.</p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {models.map((m: any) => (
            <div key={m.id} className="glass rounded-2xl p-6">
              <h3 className="text-xl font-semibold">{m.name}</h3>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-slate-500">Tokens/sec</div><div className="text-2xl font-bold">{avgTps(m.slug) ?? "—"}</div></div>
                <div><div className="text-slate-500">Avg latency</div><div className="text-2xl font-bold">{avgLat(m.slug) != null ? `${avgLat(m.slug)}ms` : "—"}</div></div>
                <div><div className="text-slate-500">Reasoning</div><div className="text-2xl font-bold">{avg(m.slug, "reasoningScore") ?? "—"}</div></div>
                <div><div className="text-slate-500">Coding</div><div className="text-2xl font-bold">{avg(m.slug, "codingScore") ?? "—"}</div></div>
                <div><div className="text-slate-500">Math</div><div className="text-2xl font-bold">{avg(m.slug, "mathScore") ?? "—"}</div></div>
                <div><div className="text-slate-500">Knowledge</div><div className="text-2xl font-bold">{avg(m.slug, "knowledgeScore") ?? "—"}</div></div>
                <div className="col-span-2"><div className="text-slate-500">Overall</div><div className="text-3xl font-bold">{avg(m.slug, "overallScore") ?? "—"}</div></div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-semibold mb-4">Results</h2>
        <div className="overflow-x-auto glass rounded-2xl">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-white/5">
              <tr>
                <th className="text-left p-3">Model</th><th className="text-left p-3">Test</th><th className="text-left p-3">Category</th>
                <th className="p-3">Tokens/sec</th><th className="p-3">Latency ms</th><th className="p-3">Overall</th><th className="p-3">Measured/Manual</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r: any) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="p-3">{r.model.name}</td>
                  <td className="p-3">{r.test.name}</td>
                  <td className="p-3">{r.test.category}</td>
                  <td className="p-3 text-center">{r.tokensPerSecond != null ? Number(r.tokensPerSecond).toFixed(1) : "—"}</td>
                  <td className="p-3 text-center">{r.latencyMs ?? "—"}</td>
                  <td className="p-3 text-center">{r.overallScore != null ? Number(r.overallScore).toFixed(0) : "—"}</td>
                  <td className="p-3 text-center">{r.manuallyEntered ? "Manual" : "Measured"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {results.length === 0 && <p className="text-slate-500 mt-6">No published benchmark results yet.</p>}
      </div>
    </main>
  );
}