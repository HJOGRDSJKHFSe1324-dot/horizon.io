"use client";
import Nav from "@/components/Nav";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    const res = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }), headers: { "Content-Type": "application/json" } });
    const text = await res.text();
    let data: any = {}; try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    setLoading(false);
    if (!res.ok) setErr(data.error || "Failed");
    else {
      setMsg(data.message || "Registered. Check your email.");
      if (data.verificationUrl) setMsg((m) => `${m} Verify link (dev): ${data.verificationUrl}`);
    }
  }

  return (
    <main><Nav />
      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-3xl font-semibold mb-2">Create account</h1>
        <p className="text-slate-400 mb-8">Join HORIZON.</p>
        {err && <div className="text-red-400 mb-4 text-sm">{err}</div>}
        {msg && <div className="text-green-400 mb-4 text-sm">{msg}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" />
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="Password (8+ chars)" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" />
          <button disabled={loading} className="w-full py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50">{loading ? "..." : "Register"}</button>
        </form>
        <p className="mt-6 text-sm text-slate-400">Already have an account? <Link href="/login" className="text-white">Sign in</Link></p>
      </div>
    </main>
  );
}