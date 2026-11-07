"use client";
import Nav from "@/components/Nav";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/user/me").then(async r => { const t = await r.text(); try { setData(t ? JSON.parse(t) : null); } catch {} }).catch(()=>{});
    fetch("/api/token-history").then(async r => { const t = await r.text(); try { setHistory(t ? JSON.parse(t) : []); } catch { setHistory([]); } }).catch(()=>{});
  }, []);
  async function cancel() { await fetch("/api/subscriptions/cancel", { method: "POST" }); location.reload(); }
  async function delAccount() {
    if (!confirm("Delete your account permanently?")) return;
    await fetch("/api/user/me", { method: "DELETE" });
    window.location.href = "/";
  }
  if (!data) return <main id="main"><Nav /><div className="p-10">Loading...</div></main>;
  return (
    <main id="main"><Nav />
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <div className="glass rounded-2xl p-6 grid md:grid-cols-2 gap-6">
          <div><div className="text-slate-400 text-sm">Plan</div><div className="text-2xl font-bold">{data.plan?.name || "Free"}</div></div>
          <div><div className="text-slate-400 text-sm">Tokens remaining</div><div className="text-2xl font-bold">{data.remainingTokens}</div></div>
          <div><div className="text-slate-400 text-sm">Email</div><div>{data.user?.email}</div></div>
          <div><div className="text-slate-400 text-sm">Member since</div><div>{new Date(data.user?.createdAt).toLocaleDateString()}</div></div>
        </div>
        {data.user?.subscription?.status === "ACTIVE" && (
          <button onClick={cancel} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm">Cancel subscription</button>
        )}
        <div className="glass rounded-2xl p-6">
          <h2 className="font-semibold mb-3">Token usage history</h2>
          {history.length === 0 ? <div className="text-slate-400 text-sm">No transactions.</div> : (
            <table className="w-full text-xs">
              <thead className="text-slate-400"><tr><th className="p-1 text-left">Date</th><th className="p-1">Type</th><th className="p-1">Amount</th><th className="p-1">Balance after</th></tr></thead>
              <tbody>
                {history.map((t: any) => (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="p-1">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="p-1 text-center">{t.type}</td>
                    <td className="p-1 text-center">{t.amount}</td>
                    <td className="p-1 text-center">{t.balanceAfter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Link href="/pricing" className="inline-block px-4 py-2 rounded-lg bg-white/10 text-sm">Change plan</Link>
        <div>
          <button onClick={delAccount} className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm">Delete account</button>
        </div>
      </div>
    </main>
  );
}