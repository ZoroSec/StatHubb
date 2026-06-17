"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { getTrending, getRecentlyAdded } from "@/lib/stathub/analytics";
import { TOPICS } from "@/lib/stathub/topics";
import { COUNTRIES } from "@/lib/stathub/countries";
import { ChartCanvas } from "./ChartCanvas";
import { DatasetCard } from "./DatasetCard";
import { ArrowRight, TrendingUp, Sparkles, Clock, Search, Globe2, BarChart3 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { searchDatasets } from "@/lib/stathub/analytics";

export function HomePage() {
  const { navigate, setSearchQuery } = useStatHub();
  const { datasets: DATASETS } = useDatasets();
  const [searchVal, setSearchVal] = useState("");
  const [trendingTab, setTrendingTab] = useState<"most-viewed" | "recent" | "editors">("most-viewed");

  // Daily rotation: pick featured dataset based on day of year
  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  const featuredList = DATASETS.filter((d) => d.featured);
  const heroDataset = featuredList[dayOfYear % featuredList.length] || DATASETS[0];
  const heroLatest = heroDataset?.data[heroDataset.data.length - 1];
  const heroPrev = heroDataset?.data[heroDataset.data.length - 2];
  const heroChange = heroPrev ? heroLatest.value - heroPrev.value : 0;

  const trending = getTrending(DATASETS, 8);
  const recent = getRecentlyAdded(DATASETS, 8);
  const editors = DATASETS.filter((d) => d.editorsPick).slice(0, 8);

  const railData = trendingTab === "most-viewed" ? trending : trendingTab === "recent" ? recent : editors;

  // Live search results
  const searchResults = useMemo(() => {
    if (searchVal.trim().length < 1) return [];
    return searchDatasets(DATASETS, { query: searchVal }).slice(0, 8);
  }, [searchVal, DATASETS]);

  const totalDataPoints = DATASETS.reduce((s, d) => s + d.data.length, 0);
  const totalInsights = DATASETS.reduce((s, d) => s + d.insights.length, 0);

  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8 sm:py-12">
      {/* ═══ Hero Section ═══════════════════════════════════════════════════ */}
      <section className="grid lg:grid-cols-[1.35fr_0.9fr] gap-5 mb-12 sh-fade-up">
        {/* Hero Statistic */}
        <div className="sh-card p-6 sm:p-9 relative overflow-hidden">
          <div
            className="absolute -right-20 -top-20 w-60 h-60 rounded-full opacity-50 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${heroDataset.accent}22, transparent 65%)` }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="sh-eyebrow !text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: heroDataset.accent + "12" }}>
                <Sparkles size={12} />
                Statistic of the Day
              </span>
            </div>

            <div className="sh-hero-stat-value mb-2">
              {heroLatest.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              <span className="text-3xl sm:text-4xl font-bold ml-1 sh-accent-text" style={{ color: heroDataset.accent }}>
                {heroDataset.unit}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-4 text-sm">
              <span
                className="font-bold px-2.5 py-1 rounded-md"
                style={{
                  color: heroChange >= 0 ? "#34d399" : "#f87171",
                  background: (heroChange >= 0 ? "#34d399" : "#f87171") + "15",
                }}
              >
                {heroChange >= 0 ? "↑" : "↓"} {Math.abs(heroChange).toFixed(1)}{heroDataset.unit}
              </span>
              <span className="text-[var(--sh-ink-soft)]">{heroLatest.label} vs {heroPrev?.label}</span>
            </div>

            <p className="text-base sm:text-lg text-[var(--sh-ink)] leading-relaxed mb-5 max-w-xl" style={{ fontWeight: 500 }}>
              {heroDataset.insights[0]}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--sh-ink-soft)] mb-6">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: heroDataset.accent }} />
                <strong className="text-[var(--sh-ink)]">{heroDataset.source}</strong>
              </span>
              <span>Updated {heroDataset.lastUpdated}</span>
              <span>{heroDataset.data.length} data points</span>
            </div>

            <button
              className="sh-btn sh-btn-primary"
              onClick={() => navigate({ name: "dataset", id: heroDataset.id })}
            >
              Explore Full Dataset
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Featured Chart */}
        <div className="sh-card p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="sh-eyebrow">Featured Chart</span>
            <BarChart3 size={14} className="text-[var(--sh-ink-soft)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--sh-ink)] mb-1 leading-tight" style={{ letterSpacing: "-0.3px" }}>
            {heroDataset.title}
          </h3>
          <p className="text-xs text-[var(--sh-ink-soft)] mb-4 line-clamp-2">
            {heroDataset.subtitle}
          </p>
          <div
            className="flex-1 rounded-xl p-3 border min-h-[200px]"
            style={{ background: `linear-gradient(180deg, ${heroDataset.accent}06, transparent)`, borderColor: "var(--sh-line)" }}
          >
            <ChartCanvas dataset={heroDataset} height={200} interactive showAnnotations={false} />
          </div>
          <button
            className="sh-btn sh-btn-primary w-full mt-4 justify-center"
            onClick={() => navigate({ name: "dataset", id: heroDataset.id })}
          >
            View Dataset
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* ═══ Enhanced Search ════════════════════════════════════════════════ */}
      <section className="mb-12 sh-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="sh-card p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="sh-section-title mb-2">Find the data you need</h2>
            <p className="sh-section-sub max-w-xl mx-auto">
              Search across {DATASETS.length} datasets, {TOPICS.length} topics, and {COUNTRIES.length} countries. Filter by year, source, or region.
            </p>
          </div>

          <div className="max-w-2xl mx-auto relative">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sh-ink-soft)]" />
              <input
                className="sh-search-input"
                placeholder="Try: GDP, inflation, India, CO₂ emissions..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchVal.trim()) {
                    setSearchQuery(searchVal);
                    navigate({ name: "search", q: searchVal });
                  }
                }}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="sh-search-results">
                {searchResults.map((r) => (
                  <div
                    key={r.ds.id}
                    className="sh-search-item"
                    onClick={() => navigate({ name: "dataset", id: r.ds.id })}
                  >
                    <span style={{ color: r.ds.accent, fontSize: 18 }}>▦</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-[var(--sh-ink)] truncate">{r.ds.title}</div>
                      <div className="text-xs text-[var(--sh-ink-soft)] truncate">{r.ds.subtitle}</div>
                    </div>
                    <ArrowRight size={14} className="text-[var(--sh-ink-soft)] flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-6">
            {[
              { value: DATASETS.length, label: "Datasets" },
              { value: totalDataPoints, label: "Data Points" },
              { value: totalInsights, label: "Insights" },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl" style={{ background: "var(--sh-surface-alt)" }}>
                <div className="text-2xl font-bold text-[var(--sh-brand)]" style={{ letterSpacing: "-0.5px" }}>{s.value}</div>
                <div className="text-[11px] text-[var(--sh-ink-soft)] uppercase tracking-wider font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Trending Datasets Rail ═════════════════════════════════════════ */}
      <section className="mb-12 sh-fade-up" style={{ animationDelay: "0.15s" }}>
        <div className="flex items-end justify-between mb-5 gap-4 flex-wrap">
          <div>
            <div className="sh-eyebrow mb-1.5">Discover</div>
            <h2 className="sh-section-title">Trending datasets</h2>
          </div>
          <div className="flex gap-2">
            <button
              className={`sh-chart-tab ${trendingTab === "most-viewed" ? "active" : ""}`}
              onClick={() => setTrendingTab("most-viewed")}
            >
              <TrendingUp size={13} /> Most Viewed
            </button>
            <button
              className={`sh-chart-tab ${trendingTab === "recent" ? "active" : ""}`}
              onClick={() => setTrendingTab("recent")}
            >
              <Clock size={13} /> Recently Added
            </button>
            <button
              className={`sh-chart-tab ${trendingTab === "editors" ? "active" : ""}`}
              onClick={() => setTrendingTab("editors")}
            >
              <Sparkles size={13} /> Editor's Picks
            </button>
          </div>
        </div>

        <div className="sh-rail">
          {railData.map((ds, i) => (
            <DatasetCard key={ds.id} dataset={ds} variant="rail" index={i} />
          ))}
        </div>
      </section>

      {/* ═══ Topic Explorer ══════════════════════════════════════════════════ */}
      <section className="mb-12 sh-fade-up" style={{ animationDelay: "0.2s" }}>
        <div className="mb-5">
          <div className="sh-eyebrow mb-1.5">Browse by theme</div>
          <h2 className="sh-section-title">Topic Explorer</h2>
          <p className="sh-section-sub mt-1">Explore curated datasets across {TOPICS.length} key statistical domains.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {TOPICS.map((t) => {
            const count = DATASETS.filter((d) => d.category === t.id).length;
            return (
              <div
                key={t.id}
                className="sh-topic-card"
                style={{
                  ["--topic-color" as string]: t.color,
                  ["--topic-color-soft" as string]: t.color + "20",
                }}
                onClick={() => navigate({ name: "topic", id: t.id })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate({ name: "topic", id: t.id })}
              >
                <div className="sh-topic-icon">{t.icon}</div>
                <h3 className="text-base font-bold text-[var(--sh-ink)] mb-1">{t.label}</h3>
                <p className="text-xs text-[var(--sh-ink-soft)] line-clamp-2 leading-relaxed mb-3">{t.description}</p>
                <div className="flex items-center justify-between">
                  <span className="sh-chip">{count} dataset{count !== 1 ? "s" : ""}</span>
                  <ArrowRight size={14} style={{ color: t.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ Country Quick Access ════════════════════════════════════════════ */}
      <section className="mb-12 sh-fade-up" style={{ animationDelay: "0.25s" }}>
        <div className="flex items-end justify-between mb-5 gap-4">
          <div>
            <div className="sh-eyebrow mb-1.5">Geographies</div>
            <h2 className="sh-section-title">Explore by country</h2>
          </div>
          <Globe2 className="text-[var(--sh-ink-soft)]" size={22} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COUNTRIES.map((c) => {
            const count = DATASETS.filter((d) => d.country === c.id).length;
            return (
              <div
                key={c.id}
                className="sh-card sh-card-hover p-4 cursor-pointer"
                onClick={() => navigate({ name: "country", id: c.id })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && navigate({ name: "country", id: c.id })}
              >
                <div className="text-3xl mb-2">{c.flag}</div>
                <div className="font-bold text-sm text-[var(--sh-ink)]">{c.name}</div>
                <div className="text-xs text-[var(--sh-ink-soft)]">{c.region}</div>
                <div className="sh-chip mt-2 inline-block">{count} dataset{count !== 1 ? "s" : ""}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ All Datasets Grid ════════════════════════════════════════════════ */}
      <section className="sh-fade-up" style={{ animationDelay: "0.3s" }}>
        <div className="flex items-end justify-between mb-5 gap-4">
          <div>
            <div className="sh-eyebrow mb-1.5">The Library</div>
            <h2 className="sh-section-title">All datasets</h2>
          </div>
          <span className="text-sm text-[var(--sh-ink-soft)]">{DATASETS.length} total</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DATASETS.filter((d) => d.published).map((ds, i) => (
            <DatasetCard key={ds.id} dataset={ds} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
