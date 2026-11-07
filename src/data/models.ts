// HORIZON model data layer (SA-12)
//
// Static, typed metadata for HORIZON models. Values come ONLY from
// project sources that already exist in this repository:
//   - prisma/seed.ts (model names, slugs, tiers, descriptions, badges, plans)
//   - src/content/site-copy.ts (product positioning copy)
//   - Modelfile OTHER_MODELS notes (parameter counts + self-reported benchmark
//     comparisons such as Zenith 52.94% / Halo 1.5 47.06% / Halo 2.5 82.35%)
//   - The HORIZON database benchmark_results table (measured, published runs)
//
// Benchmarks that are not backed by real data are stored as null with
// status "unverified". The MMLU_PRO_SCORES.png asset exists in /public but is
// an image that we do not parse here; no numbers from it are fabricated.

export type ModelTier = "FREE" | "PAID";

export type PlanSlug = "FREE" | "PLUS" | "PRO" | "ULTRA";

export type BenchmarkStatus = "verified" | "unverified";

export interface ModelBenchmarks {
  /** Whether the numbers below come from real measured data. */
  status: BenchmarkStatus;
  /** Number of published benchmark runs averaged (null when unverified). */
  sampleSize: number | null;
  overallScore: number | null;
  reasoningScore: number | null;
  codingScore: number | null;
  mathScore: number | null;
  knowledgeScore: number | null;
  tokensPerSecond: number | null;
  latencyMs: number | null;
  /** Provenance of the numbers, or null when unverified. */
  source: string | null;
}

export interface ModelData {
  name: string;
  slug: string;
  tier: ModelTier;
  minPlan: PlanSlug;
  badge: string | null;
  description: string;
  /** Published parameter count string, when documented. */
  parameters: string | null;
  /** Whether the model is generally available (documented in the database). */
  enabled: boolean;
  strengths: string[];
  weaknesses: string[];
  benchmarks: ModelBenchmarks;
}

const UNVERIFIED_BENCHMARKS: ModelBenchmarks = {
  status: "unverified",
  sampleSize: null,
  overallScore: null,
  reasoningScore: null,
  codingScore: null,
  mathScore: null,
  knowledgeScore: null,
  tokensPerSecond: null,
  latencyMs: null,
  source: null,
};

const VERIFIED_SOURCE =
  "HORIZON published benchmark_results (averaged over 17 completed runs, 2026-11-07)";

export const modelsData: ModelData[] = [
  {
    name: "Zenith-1.1",
    slug: "zenith-1.1",
    tier: "FREE",
    minPlan: "FREE",
    badge: "FREE MODEL",
    description: "Horizon's free flagship model. Fast, capable, and accessible to everyone.",
    parameters: "1.5B",
    enabled: true,
    strengths: [
      "Fast baseline for everyday chat, summaries, and light reasoning (site copy)",
      "Code generation strength noted in its own system prompt",
      "Highest measured throughput of the lineup (82.42 tokens/s average)",
    ],
    weaknesses: [
      "Measured reasoning average of 16.67% in the HORIZON benchmark suite",
      "Measured math average of 40% in the HORIZON benchmark suite",
    ],
    benchmarks: {
      status: "verified",
      sampleSize: 17,
      overallScore: 52.94,
      reasoningScore: 16.67,
      codingScore: 100,
      mathScore: 40,
      knowledgeScore: 100,
      tokensPerSecond: 82.42,
      latencyMs: 209,
      source: VERIFIED_SOURCE,
    },
  },
  {
    name: "Halo 1.5",
    slug: "halo-1.5",
    tier: "FREE",
    minPlan: "FREE",
    badge: "FREE MODEL",
    description: "Advanced reasoning and coding model, now free.",
    parameters: "3B",
    enabled: true,
    strengths: [
      "Positioned for stronger reasoning, coding, and long-context work (site copy)",
      "Measured coding average of 100% in the HORIZON benchmark suite",
      "Measured reasoning average of 50% in the HORIZON benchmark suite",
    ],
    weaknesses: [
      "Measured math average of 20% in the HORIZON benchmark suite",
      "Measured overall average of 47.06%, below Zenith-1.1 in the same suite",
    ],
    benchmarks: {
      status: "verified",
      sampleSize: 17,
      overallScore: 47.06,
      reasoningScore: 50,
      codingScore: 100,
      mathScore: 20,
      knowledgeScore: 50,
      tokensPerSecond: 59.32,
      latencyMs: 462,
      source: VERIFIED_SOURCE,
    },
  },
  {
    name: "Halo 2.5",
    slug: "halo-2.5",
    tier: "PAID",
    minPlan: "PRO",
    badge: "FLAGSHIP MODEL",
    description: "Flagship Horizon model with top-tier performance.",
    parameters: "9B",
    enabled: true,
    strengths: [
      "Flagship, top-tier performance positioning (seed + site copy)",
      "Highest measured overall average in the suite (82.35%)",
      "Measured coding, knowledge, and reasoning averages of 100%, 100%, and 66.67%",
    ],
    weaknesses: [
      "Measured math average of 80% in the HORIZON benchmark suite",
      "Lowest measured throughput of the three benchmarked models (25.04 tokens/s average)",
    ],
    benchmarks: {
      status: "verified",
      sampleSize: 17,
      overallScore: 82.35,
      reasoningScore: 66.67,
      codingScore: 100,
      mathScore: 80,
      knowledgeScore: 100,
      tokensPerSecond: 25.04,
      latencyMs: 478,
      source: VERIFIED_SOURCE,
    },
  },
  {
    name: "Nova 5.2",
    slug: "nova-5.2",
    tier: "PAID",
    minPlan: "ULTRA",
    badge: "ULTRA EXCLUSIVE",
    description: "An independent ultra-tier knowledge-first model, reserved for Ultra subscribers.",
    parameters: "12B",
    enabled: true,
    strengths: ['Independent ultra-tier, knowledge-first model (seed description)'],
    weaknesses: [
      'No published HORIZON benchmark results yet (unverified)',
    ],
    benchmarks: { ...UNVERIFIED_BENCHMARKS },
  },
  {
    name: "Nova 5.4 Ultra",
    slug: "nova-5.4-ultra",
    tier: "PAID",
    minPlan: "ULTRA",
    badge: "FLAGSHIP ADMIN",
    description: "The most powerful, smartest AI model HORIZON has ever released. Admin-preview only.",
    parameters: "26B",
    enabled: false,
    strengths: ['Described as the most powerful, smartest HORIZON model released (database record)'],
    weaknesses: [
      'Admin-preview only; not generally available',
      'No published HORIZON benchmark results yet (unverified)',
    ],
    benchmarks: { ...UNVERIFIED_BENCHMARKS },
  },
];

export function getModelData(slug: string): ModelData | undefined {
  return modelsData.find((m) => m.slug === slug);
}

export function getAllModelsData(): ModelData[] {
  return modelsData;
}