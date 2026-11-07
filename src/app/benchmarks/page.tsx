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
            src="/MMLU_PRO_SAMPLE.png"
            alt="MMLU-Pro sample benchmark results for HORIZON models"
            width={1120}
            height={640}
            className="rounded-2xl border border-white/10 max-w-full h-auto"
            priority
          />
        </div>

        <p className="text-sm text-slate-500 max-w-2xl">
          A 12-question MMLU-Pro style sample across science, humanities, and professional reasoning tasks. Scores are measured model outputs; latency and throughput are not shown here.
        </p>
      </div>
    </main>
  );
}
