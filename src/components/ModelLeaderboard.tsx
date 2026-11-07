"use client";

import { useEffect, useMemo, useState } from "react";

type LeaderboardModel = any;

type ModelLeaderboardProps = {
  models?: LeaderboardModel[];
  results?: any[];
  title?: string;
  weakestCount?: number;
  className?: string;
};

function toNumber(value: any): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function scoreForModel(model: any, results: any[]): number | null {
  // Prefer explicit scores coming from the data layer.
  for (const key of ["score", "overallScore", "avgScore", "mmluScore"]) {
    const n = toNumber(model?.[key]);
    if (n != null) return n;
  }

  const slug = model?.slug;
  const modelId = model?.id;
  const relevant = (results || []).filter((r: any) => {
    if (!r) return false;
    if (slug && (r?.model?.slug === slug || r?.modelSlug === slug || r?.slug === slug)) return true;
    if (modelId && (r?.model?.id === modelId || r?.modelId === modelId)) return true;
    return false;
  });

  const overallVals = relevant
    .map((r: any) => toNumber(r?.overallScore ?? r?.overall ?? r?.score))
    .filter((n): n is number => n != null);
  if (overallVals.length) {
    return overallVals.reduce((a, b) => a + b, 0) / overallVals.length;
  }

  // Fallback: average any category scores we do have.
  const categoryKeys = ["reasoningScore", "codingScore", "mathScore", "knowledgeScore"];
  const catVals: number[] = [];
  for (const r of relevant) {
    for (const key of categoryKeys) {
      const n = toNumber(r?.[key]);
      if (n != null) catVals.push(n);
    }
  }
  if (catVals.length) {
    return catVals.reduce((a, b) => a + b, 0) / catVals.length;
  }

  return null;
}

function tierLabel(model: any): string {
  return String(model?.tier || model?.badge || model?.minPlan || "—");
}

function formatScore(n: number | null): string {
  if (n == null) return "—";
  return n.toFixed(1);
}

function ModelLeaderboard({
  models: modelsProp,
  results: resultsProp,
  title = "Full model lineup",
  weakestCount = 3,
  className = "",
}: ModelLeaderboardProps) {
  const [models, setModels] = useState<any[]>(Array.isArray(modelsProp) ? modelsProp : []);
  const [results, setResults] = useState<any[]>(Array.isArray(resultsProp) ? resultsProp : []);
  const [loadingModels, setLoadingModels] = useState(modelsProp === undefined);
  const [loadingResults, setLoadingResults] = useState(resultsProp === undefined);

  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"name" | "tier" | "score">("score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Sync external props.
  useEffect(() => {
    if (modelsProp !== undefined) {
      setModels(Array.isArray(modelsProp) ? modelsProp : []);
      setLoadingModels(false);
    }
  }, [modelsProp]);

  useEffect(() => {
    if (resultsProp !== undefined) {
      setResults(Array.isArray(resultsProp) ? resultsProp : []);
      setLoadingResults(false);
    }
  }, [resultsProp]);

  // Fetch models if none were provided.
  useEffect(() => {
    if (modelsProp !== undefined) return;
    let alive = true;
    setLoadingModels(true);
    fetch("/api/models")
      .then(async (r) => {
        const t = await r.text();
        try {
          const d = t ? JSON.parse(t) : null;
          if (alive) setModels(Array.isArray(d?.models) ? d.models : []);
        } catch {
          if (alive) setModels([]);
        }
      })
      .catch(() => {
        if (alive) setModels([]);
      })
      .finally(() => {
        if (alive) setLoadingModels(false);
      });
    return () => {
      alive = false;
    };
  }, [modelsProp]);

  // Fetch benchmark results if none were provided, so scores can be derived.
  useEffect(() => {
    if (resultsProp !== undefined) return;
    let alive = true;
    setLoadingResults(true);
    fetch("/api/benchmarks")
      .then(async (r) => {
        const t = await r.text();
        try {
          const d = t ? JSON.parse(t) : null;
          if (alive) setResults(Array.isArray(d?.results) ? d.results : []);
        } catch {
          if (alive) setResults([]);
        }
      })
      .catch(() => {
        if (alive) setResults([]);
      })
      .finally(() => {
        if (alive) setLoadingResults(false);
      });
    return () => {
      alive = false;
    };
  }, [resultsProp]);

  const rows = useMemo(() => {
    return (models || []).map((m: any) => ({
      model: m,
      name: String(m?.name || "Unnamed model"),
      slug: m?.slug,
      tier: tierLabel(m),
      score: scoreForModel(m, results),
      canUse: m?.canUse,
    }));
  }, [models, results]);

  const tiers = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) set.add(r.tier);
    return ["all", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (tierFilter !== "all" && r.tier !== tierFilter) return false;
      return true;
    });
  }, [rows, query, tierFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (sortKey === "name") {
        const cmp = a.name.localeCompare(b.name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortKey === "tier") {
        const cmp = String(a.tier).localeCompare(String(b.tier));
        return sortDir === "asc" ? cmp : -cmp;
      }
      // score: nulls always last, otherwise follow sortDir
      if (a.score == null && b.score == null) return 0;
      if (a.score == null) return 1;
      if (b.score == null) return -1;
      const cmp = a.score - b.score;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const scoreRows = useMemo(() => rows.filter((r) => r.score != null), [rows]);
  const highest = useMemo(() => {
    if (!scoreRows.length) return null;
    return scoreRows.reduce((best, r) => (r.score! > best.score! ? r : best), scoreRows[0]);
  }, [scoreRows]);
  const lowest = useMemo(() => {
    if (!scoreRows.length) return null;
    return scoreRows.reduce((worst, r) => (r.score! < worst.score! ? r : worst), scoreRows[0]);
  }, [scoreRows]);

  const weakest = useMemo(() => {
    const withScores = scoreRows.slice().sort((a, b) => a.score! - b.score!);
    return withScores.slice(0, Math.max(1, weakestCount));
  }, [scoreRows, weakestCount]);

  const loading = loadingModels || loadingResults;

  function toggleSort(key: "name" | "tier" | "score") {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "score" ? "desc" : "asc");
    }
  }

  const sortIndicator = (key: "name" | "tier" | "score") => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <section className={`mt-16 ${className}`}>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--subtle)]">Lineup</div>
          <h2 className="text-2xl font-semibold mt-1">{title}</h2>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-2xl">
            Every model in the lineup, ranked by our limited test scores. Sort and filter to compare best and
            worst performers. Scores are unverified (see note below).
          </p>
        </div>
      </div>

      {/* Summary: best and worst */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-[var(--border)] rounded-[var(--radius-card)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--subtle)] uppercase tracking-widest">Highest score</div>
          <div className="mt-2 text-2xl font-semibold">{highest ? formatScore(highest.score) : "—"}</div>
          <div className="text-sm text-[var(--muted)] mt-1">{highest ? highest.name : "No data"}</div>
        </div>
        <div className="border border-[var(--border)] rounded-[var(--radius-card)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--subtle)] uppercase tracking-widest">Lowest score</div>
          <div className="mt-2 text-2xl font-semibold">{lowest ? formatScore(lowest.score) : "—"}</div>
          <div className="text-sm text-[var(--muted)] mt-1">{lowest ? lowest.name : "No data"}</div>
        </div>
        <div className="border border-[var(--border)] rounded-[var(--radius-card)] bg-[var(--surface)] p-4">
          <div className="text-xs text-[var(--subtle)] uppercase tracking-widest">Models scored</div>
          <div className="mt-2 text-2xl font-semibold">
            {scoreRows.length} / {rows.length}
          </div>
          <div className="text-sm text-[var(--muted)] mt-1">with published results</div>
        </div>
      </div>

      {/* Honest section for weakest models */}
      <div className="border border-[var(--border)] rounded-[var(--radius-card)] bg-[var(--surface)] p-5 mb-8">
        <div className="flex items-center gap-2">
          <div className="text-xs uppercase tracking-widest text-[var(--warning)]">Weakest models (unverified)</div>
        </div>
        {loading && weakest.length === 0 ? (
          <p className="text-sm text-[var(--muted)] mt-3">Loading lineup data…</p>
        ) : weakest.length === 0 ? (
          <p className="text-sm text-[var(--muted)] mt-3">
            No published scores yet, so a weakest-model comparison is not available. Treat any single result as
            unverified.
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--muted)] mt-2">
              These models scored lowest on our limited test set. Results may be incomplete and are not an
              official ranking.
            </p>
            <ul className="mt-3 space-y-2">
              {weakest.map((r, idx) => (
                <li key={r.slug || r.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[var(--subtle)] font-mono text-xs">{String(idx + 1).padStart(2, "0")}</span>
                    <span className="truncate">{r.name}</span>
                    <span className="text-xs text-[var(--subtle)]">({r.tier})</span>
                  </span>
                  <span className="font-mono text-[var(--danger)]">{formatScore(r.score)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <label className="text-sm text-[var(--muted)]">
          Search
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name…"
            className="ml-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] text-sm text-[var(--fg)] focus:outline-none"
            aria-label="Search models by name"
          />
        </label>
        <label className="text-sm text-[var(--muted)]">
          Tier
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="ml-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] text-sm text-[var(--fg)] focus:outline-none"
            aria-label="Filter by tier"
          >
            {tiers.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All tiers" : t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[var(--muted)]">
          Sort
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(":");
              setSortKey(k as "name" | "tier" | "score");
              setSortDir(d as "asc" | "desc");
            }}
            className="ml-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-raised)] text-sm text-[var(--fg)] focus:outline-none"
            aria-label="Sort leaderboard"
          >
            <option value="score:desc">Score (high to low)</option>
            <option value="score:asc">Score (low to high)</option>
            <option value="name:asc">Name (A to Z)</option>
            <option value="name:desc">Name (Z to A)</option>
            <option value="tier:asc">Tier (A to Z)</option>
            <option value="tier:desc">Tier (Z to A)</option>
          </select>
        </label>
        {(query || tierFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTierFilter("all");
            }}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Leaderboard table */}
      <div className="overflow-x-auto border border-[var(--border)] rounded-[var(--radius-card)] bg-[var(--surface)]">
        <table className="w-full text-sm">
          <thead className="text-[var(--muted)] border-b border-[var(--border)]">
            <tr>
              <th className="text-left p-3 w-12">#</th>
              <th className="text-left p-3">
                <button type="button" onClick={() => toggleSort("name")} className="font-medium hover:text-[var(--fg)]">
                  Model{sortIndicator("name")}
                </button>
              </th>
              <th className="text-left p-3">
                <button type="button" onClick={() => toggleSort("tier")} className="font-medium hover:text-[var(--fg)]">
                  Tier{sortIndicator("tier")}
                </button>
              </th>
              <th className="text-right p-3">
                <button
                  type="button"
                  onClick={() => toggleSort("score")}
                  className="font-medium hover:text-[var(--fg)]"
                >
                  Score{sortIndicator("score")}
                </button>
              </th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-[var(--muted)]">
                  Loading models…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-[var(--muted)]">
                  No models match the current filters.
                </td>
              </tr>
            ) : (
              sorted.map((r, idx) => {
                const isBest = highest && r.slug === highest.slug && r.score != null;
                const isWorst = lowest && r.slug === lowest.slug && r.score != null && rows.length > 1;
                return (
                  <tr key={r.slug || r.name} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-3 font-mono text-[var(--subtle)]">{String(idx + 1).padStart(2, "0")}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{r.name}</span>
                        {isBest && (
                          <span className="text-[10px] uppercase tracking-widest text-[var(--success)] border border-[var(--success)]/40 rounded-full px-2 py-0.5">
                            Best
                          </span>
                        )}
                        {isWorst && (
                          <span className="text-[10px] uppercase tracking-widest text-[var(--danger)] border border-[var(--danger)]/40 rounded-full px-2 py-0.5">
                            Worst
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-[var(--muted)]">{r.tier}</td>
                    <td className="p-3 text-right font-mono">{formatScore(r.score)}</td>
                    <td className="p-3 text-[var(--muted)]">
                      {r.canUse === undefined ? "—" : r.canUse ? "Available" : "Locked"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Methodology note */}
      <div className="mt-6 border border-[var(--border)] rounded-[var(--radius-card)] bg-[var(--bg-raised)] p-4">
        <div className="text-xs uppercase tracking-widest text-[var(--subtle)] mb-2">Methodology (unverified)</div>
        <p className="text-xs text-[var(--muted)] leading-relaxed">
          Scores are averages of published HORIZON benchmark runs on a limited question set, measured on our own
          servers. They are <strong>unverified</strong>: not independently audited, not comparable across providers or
          to public benchmarks such as MMLU-Pro, and they may change as the test set or hardware changes. A missing
          score means no published result exists for that model. Treat this leaderboard as directional, not as
          proof of quality.
        </p>
      </div>
    </section>
  );
}

export { ModelLeaderboard };
export default ModelLeaderboard;
