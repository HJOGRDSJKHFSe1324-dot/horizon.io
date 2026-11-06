"use client";
import Nav from "@/components/Nav";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      if (res.error.includes("EmailNotVerified")) setErr("Please verify your email first.");
      else if (res.error.includes("AccountDisabled")) setErr("Account disabled.");
      else setErr("Invalid credentials.");
    } else {
      router.push(sp.get("callbackUrl") || "/chat");
    }
  }

  return (
    <main><Nav />
      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-3xl font-semibold mb-2">Welcome back</h1>
        <p className="text-slate-400 mb-8">Sign in to HORIZON.</p>
        {err && <div className="text-red-400 mb-4 text-sm">{err}</div>}
        <form onSubmit={submit} className="space-y-4">
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required placeholder="Email" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" />
          <input value={password} onChange={e=>setPassword(e.target.value)} type="password" required placeholder="Password" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 outline-none" />
          <button disabled={loading} className="w-full py-3 rounded-xl bg-white text-black font-medium disabled:opacity-50">{loading ? "..." : "Sign in"}</button>
        </form>
        <div className="mt-4 flex justify-between text-sm text-slate-400">
          <Link href="/register">Create account</Link>
          <Link href="/reset-password">Forgot password?</Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <LoginInner />
    </Suspense>
  );
}