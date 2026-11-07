"use client";
import Nav from "@/components/Nav";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordInner() {
  const sp = useSearchParams();
  const [email, setEmail] = useState(sp.get("email") || "");
  const [token, setToken] = useState(sp.get("token") || "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [stage, setStage] = useState<"request" | "confirm">(sp.get("token") ? "confirm" : "request");

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/password-reset/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const t = await res.text(); let d: any = {}; try { d = t ? JSON.parse(t) : {}; } catch {}
    setMsg(d.message || "Sent");
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/auth/password-reset/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token, password }) });
    const t = await res.text(); let d: any = {}; try { d = t ? JSON.parse(t) : {}; } catch {}
    setMsg(res.ok ? "Password updated. Sign in." : (d.error || "Failed"));
  }

  return (
    <main id="main"><Nav />
      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-3xl font-semibold mb-8">Reset password</h1>
        {msg && <div className="text-green-400 mb-4 text-sm">{msg}</div>}
        {stage === "request" && (
          <form onSubmit={requestReset} className="space-y-4">
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="Email" aria-label="Email" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" />
            <button className="w-full py-3 rounded-xl bg-white text-black font-medium">Send reset link</button>
          </form>
        )}
        {stage === "confirm" && (
          <form onSubmit={confirmReset} className="space-y-4">
            <input value={token} onChange={e=>setToken(e.target.value)} placeholder="Token" aria-label="Reset token" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" />
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="New password" aria-label="New password" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" />
            <button className="w-full py-3 rounded-xl bg-white text-black font-medium">Update password</button>
          </form>
        )}
        <button onClick={() => setStage(stage === "request" ? "confirm" : "request")} className="mt-4 text-sm text-slate-400 underline">Switch mode</button>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}