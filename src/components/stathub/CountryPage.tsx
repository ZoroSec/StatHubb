"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { COUNTRY_MAP } from "@/lib/stathub/countries";
import { TOPIC_MAP, TOPICS } from "@/lib/stathub/topics";
import { DatasetCard } from "./DatasetCard";
import { ArrowLeft, MapPin, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CountryPageProps {
  id: string;
}

export function CountryPage({ id }: CountryPageProps) {
  const { navigate } = useStatHub();
  const { datasets: DATASETS } = useDatasets();
  const country = COUNTRY_MAP[id];

  if (!country) {
    return (
      <div className="max-w-[1120px] mx-auto px-5 py-20 text-center">
        <p className="text-[var(--sh-ink-soft)]">Country not found.</p>
        <button className="sh-btn mt-4" onClick={() => navigate({ name: "home" })}>← Back home</button>
      </div>
    );
  }

  const datasets = DATASETS.filter((d) => d.country === id && d.published);

  // Topic breakdown
  const topicCounts: Record<string, number> = {};
  datasets.forEach((d) => {
    topicCounts[d.category] = (topicCounts[d.category] || 0) + 1;
  });
  const topTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8 sh-fade-up">
      <button
        className="flex items-center gap-1.5 text-sm text-[var(--sh-ink-soft)] hover:text-[var(--sh-brand)] transition-colors mb-6 font-medium"
        onClick={() => navigate({ name: "home" })}
      >
        <ArrowLeft size={16} /> All countries
      </button>

      {/* Hero */}
      <div className="sh-card p-6 sm:p-9 mb-8">
        <div className="flex items-start gap-5 mb-5">
          <div className="text-6xl sm:text-7xl">{country.flag}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} className="text-[var(--sh-ink-soft)]" />
              <span className="text-sm text-[var(--sh-ink-soft)]">{country.region}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-[var(--sh-ink)] mb-3 leading-tight" style={{ letterSpacing: "-1.5px" }}>
              {country.name}
            </h1>
            <p className="text-base text-[var(--sh-ink-soft)] leading-relaxed max-w-2xl">
              {country.overview}
            </p>
          </div>
        </div>

        {/* Key Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-[var(--sh-line)]">
          {country.indicators.map((ind, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: "var(--sh-surface-alt)" }}>
              <div className="text-[10px] uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-1">{ind.label}</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold text-[var(--sh-ink)]">{ind.value}</span>
                {ind.trend === "up" && <TrendingUp size={13} className="text-[#10b981]" />}
                {ind.trend === "down" && <TrendingDown size={13} className="text-[#ef4444]" />}
                {ind.trend === "neutral" && <Minus size={13} className="text-[var(--sh-ink-soft)]" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topic breakdown */}
      {topTopics.length > 0 && (
        <div className="sh-card p-6 mb-8">
          <div className="sh-eyebrow mb-4">Topic breakdown</div>
          <div className="space-y-3">
            {topTopics.map(([topicId, count]) => {
              const topic = TOPIC_MAP[topicId];
              if (!topic) return null;
              const pct = (count / datasets.length) * 100;
              return (
                <div key={topicId} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32 flex-shrink-0">
                    <span style={{ color: topic.color }}>{topic.icon}</span>
                    <button
                      className="text-sm font-semibold text-[var(--sh-ink)] hover:text-[var(--sh-brand)] transition-colors"
                      onClick={() => navigate({ name: "topic", id: topicId })}
                    >
                      {topic.label}
                    </button>
                  </div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--sh-surface-alt)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: topic.color }} />
                  </div>
                  <span className="text-xs text-[var(--sh-ink-soft)] font-semibold w-12 text-right">{count} ds</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Datasets */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <h2 className="sh-section-title">Datasets for {country.name}</h2>
          <span className="text-sm text-[var(--sh-ink-soft)]">{datasets.length} total</span>
        </div>
        {datasets.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((ds, i) => (
              <DatasetCard key={ds.id} dataset={ds} index={i} />
            ))}
          </div>
        ) : (
          <div className="sh-card p-12 text-center">
            <p className="text-[var(--sh-ink-soft)] mb-4">No datasets available for {country.name} yet.</p>
            <button className="sh-btn" onClick={() => navigate({ name: "home" })}>Browse all datasets</button>
          </div>
        )}
      </div>
    </div>
  );
}
