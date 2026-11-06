"use client";
import Nav from "@/components/Nav";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans").then(async (r) => {
      const text = await r.text();
      let data = [];
      try { data = text ? JSON.parse(text) : []; } catch { data = []; }
      if (Array.isArray(data)) setPlans(data);
    }).catch(() => {});
  }, []);

  async function subscribe(planSlug: string) {
    if (!session?.user) { router.push("/login"); return; }
    setLoading(planSlug);
    const res = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planSlug }) });
    const text = await res.text();
    let d: any = {};
    try { d = text ? JSON.parse(text) : {}; } catch { d = {}; }
    setLoading(null);
    if (d.url) window.location.href = d.url;
    else alert(d.error || (res.ok ? "Failed" : `Request failed (${res.status})`));
  }

  const planInfo: Record<string, { desc: string; features: string[]; highlight?: string }> = {
    FREE: { desc: "Get started", features: ["200K tokens", "Zenith-1.1", "5-hour cooldown"] },
    PLUS: { desc: "Everyday use", features: ["500K tokens/cycle", "Zenith-1.1", "Standard priority"] },
    PRO: { desc: "All models, great value", features: ["1M tokens/cycle", "All models", "Standard priority"], highlight: "Popular" },
    ULTRA: { desc: "Maximum power", features: ["5M tokens/cycle", "All models", "Highest priority"], highlight: "Premium" },
  };

  return (
    <main><Nav />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold text-center mb-4">Pricing</h1>
        <p className="text-slate-400 text-center mb-12">Choose your plan.</p>
        <div className="grid md:grid-cols-4 gap-6">
          {plans.map(p => {
            const info = planInfo[p.slug] || { desc: "", features: [] };
            const price = (p.priceGbp / 100).toFixed(2);
            return (
              <div key={p.id} className={`glass rounded-2xl p-6 flex flex-col ${p.slug === "ULTRA" ? "border-cyan-400/30 glow" : ""}`}>
                {info.highlight && <div className="text-xs text-cyan-300 mb-2 tracking-widest">{info.highlight.toUpperCase()}</div>}
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="text-slate-400 text-sm mt-1">{info.desc}</p>
                <div className="mt-4 text-4xl font-bold">£{price}<span className="text-base text-slate-400 font-normal">/mo</span></div>
                <ul className="mt-6 space-y-2 text-sm text-slate-300 flex-1">
                  {(info.features).map(f => <li key={f}>• {f}</li>)}
                </ul>
                {p.slug === "FREE" ? (
                  <button disabled className="mt-6 w-full py-3 rounded-xl border border-white/10 text-slate-400">Free</button>
                ) : (
                  <button onClick={() => subscribe(p.slug)} disabled={loading === p.slug}
                    className={`mt-6 w-full py-3 rounded-xl font-medium ${p.slug === "PRO" ? "bg-white text-black" : "bg-white/10 hover:bg-white/15"}`}>
                    {loading === p.slug ? "..." : "Subscribe"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && <p className="text-center text-slate-500 text-xs mt-8">Configure Stripe to enable payments.</p>}
      </div>
    </main>
  );
}