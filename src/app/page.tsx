"use client";
import Nav from "@/components/Nav";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { siteCopy } from "@/content/site-copy";
import { useShouldUsePosterFrame } from "@/lib/motion";
import HeroText from "@/components/HeroText";
import LogoSpinScroll from "@/components/LogoSpinScroll";
import FrameLoader from "@/components/FrameLoader";
import SpinPoster from "@/components/SpinPoster";
import SpinToModelsTransition from "@/components/SpinToModelsTransition";
import BestModelsShowcase from "@/components/BestModelsShowcase";
import ModelLeaderboard from "@/components/ModelLeaderboard";

export default function Home() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const decision = useShouldUsePosterFrame();

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
    <main id="main" className="min-h-screen overflow-x-hidden">
      <Nav />

      <section className="max-w-7xl mx-auto px-6 pt-28 pb-20 reveal">
        <div className="max-w-3xl animate-fade">
          <p className="text-xs tracking-[0.35em] text-[var(--muted)] mb-6">{siteCopy.home.eyebrow}</p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            {siteCopy.home.heroTitle}
          </h1>
          <p className="mt-6 text-lg text-[var(--muted)] max-w-xl leading-relaxed">
            {siteCopy.home.heroLead}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/register" className="px-6 py-3 rounded-full bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-90 flex items-center gap-2">
              {siteCopy.home.primaryCta} <ArrowRight size={16} />
            </Link>
            <Link href="/models" className="px-6 py-3 rounded-full border border-[var(--border)] hover:bg-[var(--surface)]">
              {siteCopy.home.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll-driven spin hero */}
      <section className="container-xl pb-8">
        <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-raised)]">
          {decision.useCanvas ? (
            <LogoSpinScroll
              manifest="/frames/manifest.json"
              heightVh={300}
              ariaLabel="HORIZON logo rotation"
            />
          ) : (
            <div className="flex items-center justify-center py-16">
              <SpinPoster src="/frames/preview.webp" priority width={420} height={420} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <HeroText size="lg" />
          </div>
        </div>
      </section>

      {/* Hand-off from the final frame into the models sections */}
      <SpinToModelsTransition
        overlapPx={96}
        finalFrame={
          decision.useCanvas ? (
            <FrameLoader
              manifest={{ frames: ["/frames/512/frame_143.webp"] }}
              alt="Final HORIZON frame"
              showPercentage={false}
              className="h-40 w-40 rounded-[var(--radius-card)] overflow-hidden"
            />
          ) : (
            <SpinPoster src="/frames/512/frame_143.webp" priority width={320} height={320} />
          )
        }
      >
        <BestModelsShowcase />
        <ModelLeaderboard title="Full model lineup" className="container-xl" />
      </SpinToModelsTransition>

      <section className="max-w-7xl mx-auto px-6 py-16 reveal">
        <div className="glass rounded-3xl p-8 sm:p-12 text-center">
          <Sparkles className="mx-auto mb-4 text-blue-300" size={28} />
          <h2 className="text-3xl sm:text-4xl font-semibold">{siteCopy.home.ctaTitle}</h2>
          <p className="text-[var(--muted)] mt-4 max-w-2xl mx-auto leading-relaxed">
            {siteCopy.home.ctaBody}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/pricing" className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 text-black font-medium hover:opacity-90">
              {siteCopy.home.ctaPlans}
            </Link>
            <Link href="/benchmarks" className="px-6 py-3 rounded-full border border-[var(--border)] hover:bg-[var(--surface)]">
              {siteCopy.home.ctaBenchmarks}
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
            placeholder={siteCopy.home.composerPlaceholder}
            aria-label="Message HORIZON"
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 outline-none text-sm"
          />
          <div className="flex flex-wrap items-center justify-between px-2 pb-1 gap-2">
            <span className="text-xs text-[var(--muted)]">{siteCopy.home.composerHint}</span>
            <button onClick={goChat} className="text-xs px-4 py-1.5 rounded-full bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-90">
              {siteCopy.home.sendButton}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
