"use client";
import Nav from "@/components/Nav";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function VerifyEmailInner() {
  const sp = useSearchParams();
  const [status, setStatus] = useState("Verifying...");
  useEffect(() => {
    const token = sp.get("token");
    const email = sp.get("email");
    if (!token || !email) { setStatus("Missing token."); return; }
    fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, email }) })
      .then(async (r) => { const t = await r.text(); let d = {}; try { d = t ? JSON.parse(t) : {}; } catch {} return d; })
      .then(d => setStatus((d as any).ok ? "Email verified. You can sign in." : ((d as any).error || "Failed")))
      .catch(() => setStatus("Error"));
  }, [sp]);
  return <main><Nav /><div className="max-w-md mx-auto px-6 py-20 text-center">{status}</div></main>;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading...</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}