"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/models", label: "Models" },
  { href: "/chat", label: "Chat" },
  { href: "/pricing", label: "Pricing" },
  { href: "/benchmarks", label: "Benchmarks" },
];

export default function Nav() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-[#05070d]/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-widest text-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
          HORIZON
        </Link>
        <nav className="hidden md:flex gap-8 text-sm text-slate-300">
          {links.map(l => <Link key={l.href} href={l.href} className="hover:text-white transition">{l.label}</Link>)}
        </nav>
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <span className="text-xs text-slate-500">...</span>
          ) : session?.user ? (
            <>
              {(session.user as any).role === "ADMIN" && <Link href="/admin" className="text-xs px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5">Admin</Link>}
              <Link href="/dashboard" className="text-sm hover:text-white">{session.user.name || session.user.email}</Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm px-3 py-1.5">Sign in</Link>
              <Link href="/register" className="text-sm px-4 py-1.5 rounded-full bg-white text-black font-medium hover:bg-slate-200">Get Started</Link>
            </>
          )}
          <button onClick={() => setOpen(!open)} className="md:hidden px-2 py-1" aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden px-6 py-4 border-t border-white/5 flex flex-col gap-3 bg-[#070a12]">
          {links.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-slate-300 hover:text-white">{l.label}</Link>)}
        </div>
      )}
    </header>
  );
}