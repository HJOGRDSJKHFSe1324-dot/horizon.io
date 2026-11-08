"use client";

import { useEffect } from "react";
import Nav from "@/components/Nav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="min-h-screen">
      <Nav />
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-[0.75rem] uppercase tracking-[0.3em] text-[var(--muted)]">500</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-4 text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
          Our servers hit an unexpected error. Please try again.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-90"
          >
            Try again
          </button>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--border)] hover:bg-[var(--surface)]">
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
