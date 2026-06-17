"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { TOPIC_MAP, TOPICS } from "@/lib/stathub/topics";
import { DatasetCard } from "./DatasetCard";
import { ChartCanvas } from "./ChartCanvas";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface TopicPageProps {
  id: string;
}

export function TopicPage({ id }: TopicPageProps) {
  const { navigate } = useStatHub();
  const { datasets: DATASETS } = useDatasets();
  const topic = TOPIC_MAP[id];

  if (!topic) {
    return (
      <div className="max-w-[1120px] mx-auto px-5 py-20 text-center">
        <p className="text-[var(--sh-ink-soft)]">Topic not found.</p>
        <button className="sh-btn mt-4" onClick={() => navigate({ name: "home" })}>← Back home</button>
      </div>
    );
  }

  const datasets = DATASETS.filter((d) => d.category === id && d.published);
  const featured = datasets.find((d) => d.featured) || datasets[0];
  const trending = [...datasets].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
  const relatedTopics = TOPICS.filter((t) => t.id !== id).slice(0, 4);

  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8 sh-fade-up">
      <button
        className="flex items-center gap-1.5 text-sm text-[var(--sh-ink-soft)] hover:text-[var(--sh-brand)] transition-colors mb-6 font-medium"
        onClick={() => navigate({ name: "home" })}
      >
        <ArrowLeft size={16} /> All topics
      </button>

      {/* Hero */}
      <div className="sh-card p-6 sm:p-9 mb-8 relative overflow-hidden">
        <div
          className="absolute -right-24 -top-24 w-72 h-72 rounded-full opacity-40 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${topic.color}33, transparent 65%)` }}
        />
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
            style={{ background: topic.color + "18", color: topic.color }}
          >
            {topic.icon}
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-[var(--sh-ink)] mb-4 leading-tight" style={{ letterSpacing: "-1.5px" }}>
            {topic.label}
          </h1>
          <p className="text-base sm:text-lg text-[var(--sh-ink-soft)] leading-relaxed max-w-2xl mb-6">
            {topic.intro}
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="sh-chip">{datasets.length} datasets</span>
            <span className="sh-chip">{datasets.reduce((s, d) => s + d.data.length, 0)} data points</span>
            <span className="sh-chip">{datasets.reduce((s, d) => s + d.insights.length, 0)} insights</span>
          </div>
        </div>
      </div>

      {/* Featured Chart */}
      {featured && (
        <div className="sh-card p-5 sm:p-7 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="sh-eyebrow mb-1">Featured in {topic.label}</div>
              <h2 className="text-xl font-bold text-[var(--sh-ink)]">{featured.title}</h2>
            </div>
            <button
              className="sh-btn sh-btn-primary flex-shrink-0"
              onClick={() => navigate({ name: "dataset", id: featured.id })}
            >
              View Dataset <ArrowRight size={14} />
            </button>
          </div>
          <div
            className="rounded-xl p-3 border"
            style={{ background: `linear-gradient(180deg, ${featured.accent}06, transparent)`, borderColor: "var(--sh-line)" }}
          >
            <ChartCanvas dataset={featured} height={300} interactive showAnnotations={false} />
          </div>
        </div>
      )}

      {/* Trending in topic */}
      {trending.length > 0 && (
        <div className="mb-8">
          <div className="sh-eyebrow mb-3">Trending in {topic.label}</div>
          <div className="grid sm:grid-cols-3 gap-4">
            {trending.map((ds, i) => (
              <DatasetCard key={ds.id} dataset={ds} index={i} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* All datasets in topic */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-5">
          <h2 className="sh-section-title">All {topic.label.toLowerCase()} datasets</h2>
          <span className="text-sm text-[var(--sh-ink-soft)]">{datasets.length} total</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map((ds, i) => (
            <DatasetCard key={ds.id} dataset={ds} index={i} />
          ))}
        </div>
      </div>

      {/* Related topics */}
      <div>
        <div className="sh-eyebrow mb-3">Related topics</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {relatedTopics.map((t) => (
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
              <h3 className="text-sm font-bold text-[var(--sh-ink)]">{t.label}</h3>
              <p className="text-xs text-[var(--sh-ink-soft)] mt-1 line-clamp-2">{t.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
