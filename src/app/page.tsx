"use client";
import Nav from "@/components/Nav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const models = [
  { name: "Zenith-1.1", slug: "zenith-1.1", tag: "FREE MODEL", desc: "Fast, capable baseline for everyday chat, summaries, and light reasoning.", chip: "Free" },
  { name: "Halo 1.5", slug: "halo-1.5", tag: "FREE MODEL", desc: "Stronger reasoning, coding, and long-context performance for work that matters.", chip: "Free" },
  { name: "Halo 2.5", slug: "halo-2.5", tag: "FLAGSHIP", desc: "Our deepest model with top-tier long-form reasoning, analysis, and generation.", chip: "Max" },
];

export default function Home() {
  const router = useRouter();
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("is-visible");
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  function goChat() {
    const q = draft.trim();
    router.push(q ? `/chat?draft=${encodeURIComponent(q)}` : "/chat");
  }

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Nav />
      <section className="max-w-7xl mx-auto px-6 pt-28 pb-20 reveal">
        <div className="max-w-3xl animate-fade">
          <p className="text-xs tracking-[0.35em] text-[var(--muted)] mb-6">HORIZON PLATFORM</p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500">Beyond Limits.</span>
          </h1>
          <p className="mt-6 text-lg text-[var(--muted)] max-w-xl leading-relaxed">
            HORIZON gives you access to independently developed AI models — from fast open conversation to
            flagship long-form reasoning — all hosted on infrastructure you control.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/register" className="px-6 py-3 rounded-full bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-90 flex items-center gap-2">
              Get Started <ArrowRight size={16} />
            </Link>
            <Link href="/models" className="px-6 py-3 rounded-full border border-[var(--border)] hover:bg-[var(--surface)]">
              Explore Models
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 reveal">
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-semibold">Models built for different jobs.</h2>
            <p className="text-[var(--muted)] mt-2">Pick the right intelligence level as you work.</p>
          </div>
          <Link href="/models" className="hidden sm:inline-flex text-sm text-[var(--muted)] hover:text-[var(--fg)]">View all</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {models.map((m) => (
            <div key={m.name} className="glass rounded-2xl p-6 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,.35)] transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-widest text-[var(--muted)]">{m.tag}</span>
                <span className="text-[10px] px-2 py-1 rounded-full border border-[var(--border)]">{m.chip}</span>
              </div>
              <h3 className="text-2xl mt-3 font-semibold">{m.name}</h3>
              <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{m.desc}</p>
              <Link href={`/chat?model=${m.slug}`} className="mt-5 inline-flex items-center gap-1 text-sm hover:text-[var(--fg)]">
                Start chatting <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 reveal">
        <div className="glass rounded-3xl p-8 sm:p-12 text-center">
          <Sparkles className="mx-auto mb-4 text-cyan-300" size={28} />
          <h2 className="text-3xl sm:text-4xl font-semibold">Runs independently. Scales easily.</h2>
          <p className="text-[var(--muted)] mt-4 max-w-2xl mx-auto leading-relaxed">
            HORIZON routes requests securely to your own inference server through a configurable tunnel. Subscriptions, token accounting, bans, and benchmarks are enforced server-side.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/pricing" className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-medium hover:opacity-90">
              View Plans
            </Link>
            <Link href="/benchmarks" className="px-6 py-3 rounded-full border border-[var(--border)] hover:bg-[var(--surface)]">
              Horizon Benchmarks
            </Link>
          </div>
        </div>
      </section>


      {/* ChatGPT-style bottom composer */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(900px,96vw)] z-40">
        <div className="glass rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,.45)]">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                goChat();
              }
            }}
            placeholder="Message HORIZON..."
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 outline-none text-sm"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="text-xs text-[var(--muted)]">Press Enter to send · Shift+Enter for new line</span>
            <button onClick={goChat} className="text-xs px-4 py-1.5 rounded-full bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-90">
              Go
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}