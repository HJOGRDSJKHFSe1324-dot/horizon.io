"use client";
import Nav from "@/components/Nav";
import Image from "next/image";
import { siteCopy } from "@/content/site-copy";

export default function BenchmarksPage() {
  return (
    <main id="main"><Nav />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-semibold mb-2">{siteCopy.benchmarks.title}</h1>
        <p className="text-slate-400 mb-10">{siteCopy.benchmarks.subtitle}</p>

        <div className="mb-10">
          <Image
            src="/HORIZON_HARD_BENCHMARK.png"
            alt="Harder HORIZON reasoning benchmark results with all model names"
            width={1180}
            height={680}
            className="rounded-2xl border border-white/10 max-w-full h-auto"
            priority
          />
        </div>

        <p className="text-sm text-slate-500 max-w-2xl">
          A harder 12-question suite across math, logic, programming, law, medicine, and science. Accuracy is measured from model answers. Scores separate the Nova flagship from the rest.
        </p>
      </div>
    </main>
  );
}
