"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Clock, Zap } from "lucide-react";
import { siteCopy } from "@/content/site-copy";

export type BestModelsShowcaseProps = {
  models?: any[];
  results?: any[];
  title?: string;
  subtitle?: string;
  viewAllLabel?: string;
  viewAllHref?: string;
  chatHref?: (slug: string) => string;
  limit?: number;
  className?: string;
};

const STRENGTHS: Record<string, string[]> = {
  "zenith-1.1": ["Fast responses", "Everyday chat", "Summaries"],
  "nova-5.2": ["Knowledge tasks", "Knowledge-first depth", "Long context"],
  "nova-5.4-ultra": ["Flagship reasoning", "Deepest analysis", "Long context"],
};

const ROLES: Record<string, string> = {
  "zenith-1.1": "Baseline workhorse",
  "nova-5.2": "Knowledge-first paid model",
  "nova-5.4-ultra": "Flagship model",
};

function slugOf(result: any): string {
  return result?.model?.slug ?? result?.modelSlug ?? result?.slug ?? "";
}

function toNumber(value: any): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function average(results: any[], field: string): string | null {
  const vals = results
    .map((r) => toNumber(r?.[field]))
    .filter((n): n is number => n !== null);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(
    field === "tokensPerSecond" ? 1 : field === "latencyMs" ? 0 : 1
  );
}

function metricsFor(slug: string, results: any[]) {
  const rs = results.filter((r) => slugOf(r) === slug);
  return {
    tokensPerSecond: average(rs, "tokensPerSecond"),
    latencyMs: average(rs, "latencyMs"),
    overall: average(rs, "overallScore"),
    reasoning: average(rs, "reasoningScore"),
    coding: average(rs, "codingScore"),
    math: average(rs, "mathScore"),
    knowledge: average(rs, "knowledgeScore"),
  };
}

function overallScore(slug: string, results: any[]): number {
  const m = metricsFor(slug, results);
  return m.overall ? Number(m.overall) : -1;
}

function strengthsOf(model: any): string[] {
  if (Array.isArray(model?.strengths) && model.strengths.length) {
    return model.strengths.map(String);
  }
  if (STRENGTHS[model?.slug]) return STRENGTHS[model.slug];
  return model?.description ? [String(model.description)] : [];
}

function fallbackModels(): any[] {
  return siteCopy.home.models.map((m) => ({
    id: m.slug,
    name: m.name,
    slug: m.slug,
    description: m.desc,
    badge: m.tag,
    minPlan: m.chip === "Max" ? "PRO" : "FREE",
    chip: m.chip,
  }));
}

function accessLabel(model: any): string {
  if (typeof model?.canUse === "boolean") {
    return model.canUse
      ? siteCopy.modelsPage.available
      : model.reason || siteCopy.modelsPage.lockedHint;
  }
  const plan = model?.minPlan || model?.tier;
  return plan ? String(plan) : siteCopy.modelsPage.available;
}

function Stat({
  icon: Icon,
  label,
  value,
  mono = true,
}: {
  icon: any;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--subtle)]">
        <Icon size={12} aria-hidden="true" />
        {label}
      </div>
      <div
        className={[
          "text-xl font-semibold text-[var(--fg)]",
          mono ? "font-mono tabular-nums" : "font-display",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function BestModelsShowcase({
  models: modelsProp,
  results: resultsProp,
  title = siteCopy.home.modelsTitle,
  subtitle = siteCopy.home.modelsSubtitle,
  viewAllLabel = siteCopy.home.modelsViewAll,
  viewAllHref = "/models",
  chatHref = (slug) => `/chat?model=${slug}`,
  limit = 3,
  className,
}: BestModelsShowcaseProps) {
  const [models, setModels] = useState<any[]>(
    modelsProp && modelsProp.length ? modelsProp : fallbackModels()
  );
  const [results, setResults] = useState<any[]>(
    resultsProp && resultsProp.length ? resultsProp : []
  );

  useEffect(() => {
    if (modelsProp && modelsProp.length) {
      setModels(modelsProp);
      setResults(resultsProp && resultsProp.length ? resultsProp : []);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [modelRes, benchRes] = await Promise.all([
          fetch("/api/models"),
          fetch("/api/benchmarks"),
        ]);
        const modelData = modelRes.ok ? await modelRes.json() : null;
        const benchData = benchRes.ok ? await benchRes.json() : null;
        if (cancelled) return;
        setModels(
          modelData?.models && modelData.models.length
            ? modelData.models
            : fallbackModels()
        );
        setResults(benchData?.results ?? []);
      } catch {
        if (cancelled) return;
        setModels(fallbackModels());
        setResults([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modelsProp, resultsProp]);

  const ranked = [...models].sort((a, b) => {
    const flagship = (slug: string) => (slug === "nova-5.4-ultra" ? -1 : 0);
    const pf = flagship(a.slug) - flagship(b.slug);
    if (pf !== 0) return pf;
    const diff = overallScore(b.slug, results) - overallScore(a.slug, results);
    if (diff !== 0) return diff;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  const featured = ranked[0];
  const rail = ranked.slice(1, Math.max(1, limit));

  if (!featured) {
    return (
      <section className={["container-xl py-16", className].filter(Boolean).join(" ")}>
        <div className="surface p-8 text-center text-[var(--muted)]">
          {siteCopy.benchmarks.noResults}
        </div>
      </section>
    );
  }

  const featuredMetrics = metricsFor(featured.slug, results);
  const featuredStrengths = strengthsOf(featured);

  return (
    <section className={["container-xl py-16 md:py-24", className].filter(Boolean).join(" ")}>
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--subtle)]">
            01 / Models
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-[var(--fg)] md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] md:text-base">
            {subtitle}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
        >
          {viewAllLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Featured model — asymmetric anchor */}
        <article className="surface p-6 md:p-8 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--subtle)]">
              {featured.badge || ROLES[featured.slug] || "Model"}
            </span>
            <span className="font-mono text-xs text-[var(--muted)]">
              {accessLabel(featured)}
            </span>
          </div>

          <h3 className="mt-5 font-display text-4xl font-semibold tracking-tight text-[var(--fg)] md:text-5xl">
            {featured.name}
          </h3>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--subtle)]">
            {ROLES[featured.slug] || ""}
          </p>
          <p className="mt-4 max-w-[60ch] text-sm leading-relaxed text-[var(--muted)] md:text-base">
            {featured.description || ""}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-6">
            <Stat
              icon={Zap}
              label={siteCopy.benchmarks.labels.tokensPerSecond}
              value={
                featuredMetrics.tokensPerSecond
                  ? `${featuredMetrics.tokensPerSecond}`
                  : "—"
              }
            />
            <Stat
              icon={Clock}
              label={siteCopy.benchmarks.labels.averageLatency}
              value={
                featuredMetrics.latencyMs
                  ? `${featuredMetrics.latencyMs}ms`
                  : "—"
              }
            />
            <Stat
              icon={BarChart3}
              label={siteCopy.benchmarks.labels.overall}
              value={featuredMetrics.overall ? featuredMetrics.overall : "—"}
            />
          </div>

          <div className="mt-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--subtle)]">
              Strengths
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {featuredStrengths.slice(0, 4).map((s, i) => (
                <li
                  key={`${featured.slug}-${i}-${s}`}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs text-[var(--fg)]"
                >
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <Link
              href={chatHref(featured.slug)}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-fg)] transition-opacity hover:opacity-90"
            >
              {siteCopy.home.modelChatAction}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </article>

        {/* Supporting models — vertical index, not equal cards */}
        <div className="lg:col-span-5">
          <div className="border-y border-[var(--border)]">
            {rail.map((m, index) => {
              const mm = metricsFor(m.slug, results);
              const ms = strengthsOf(m);
              return (
                <Link
                  key={m.id || m.slug || index}
                  href={chatHref(m.slug)}
                  className="group block border-b border-[var(--border)] py-5 last:border-b-0 transition-colors hover:bg-[var(--surface)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-xs tabular-nums text-[var(--subtle)]">
                        {String(index + 2).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-display text-lg font-semibold text-[var(--fg)]">
                            {m.name}
                          </h4>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--subtle)]">
                            {m.badge || ROLES[m.slug] || ""}
                          </span>
                        </div>
                        <p className="mt-1 max-w-[42ch] text-sm text-[var(--muted)]">
                          {m.description || ms.slice(0, 2).join(" · ")}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs tabular-nums text-[var(--muted)]">
                          <span>
                            {mm.tokensPerSecond
                              ? `${mm.tokensPerSecond} ${siteCopy.benchmarks.labels.tokensPerSecond.toLowerCase()}`
                              : "—"}
                          </span>
                          <span>
                            {mm.latencyMs ? `${mm.latencyMs}ms` : "—"}
                          </span>
                          <span>
                            {mm.overall ? `${mm.overall} ${siteCopy.benchmarks.labels.overall.toLowerCase()}` : "—"}
                          </span>
                        </div>
                        {ms.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {ms.slice(0, 3).map((s, i) => (
                              <span
                                key={`${m.slug}-chip-${i}`}
                                className="text-[10px] uppercase tracking-[0.16em] text-[var(--subtle)]"
                              >
                                {s}
                                {i < Math.min(ms.length, 3) - 1 ? " ·" : ""}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="mt-1 text-[var(--subtle)] transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
          {rail.length === 0 && (
            <div className="border-y border-[var(--border)] px-4 py-6 text-sm text-[var(--muted)]">
              {siteCopy.benchmarks.noResults}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export { BestModelsShowcase };
export default BestModelsShowcase;
