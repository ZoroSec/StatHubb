"use client";

import type { Dataset } from "@/lib/stathub/types";
import { useStatHub } from "@/lib/stathub/store";
import { ChartCanvas } from "./ChartCanvas";
import { Bookmark, Eye } from "lucide-react";
import { TOPIC_MAP } from "@/lib/stathub/topics";

interface DatasetCardProps {
  dataset: Dataset;
  variant?: "default" | "compact" | "rail";
  index?: number;
}

export function DatasetCard({ dataset, variant = "default", index = 0 }: DatasetCardProps) {
  const { navigate, isBookmarked, addBookmark, removeBookmark } = useStatHub();
  const bookmarked = isBookmarked(dataset.id);
  const latest = dataset.data[dataset.data.length - 1];
  const prev = dataset.data[dataset.data.length - 2];
  const change = prev ? latest.value - prev.value : 0;
  const changePct = prev && prev.value !== 0 ? ((change / Math.abs(prev.value)) * 100).toFixed(1) : "0";
  const topic = TOPIC_MAP[dataset.category];

  const cardWidth = variant === "rail" ? 300 : undefined;

  return (
    <div
      className={`sh-card sh-card-hover sh-fade-up ${variant === "rail" ? "w-[300px]" : ""}`}
      style={{ animationDelay: `${index * 0.04}s`, width: cardWidth }}
      onClick={() => navigate({ name: "dataset", id: dataset.id })}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate({ name: "dataset", id: dataset.id })}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex-shrink-0"
              style={{ color: dataset.accent, background: dataset.accent + "15" }}
            >
              {topic?.icon} {topic?.label}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (bookmarked) {
                removeBookmark(dataset.id);
              } else {
                addBookmark(dataset.id);
              }
            }}
            className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--sh-surface-alt)] transition-colors"
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark
              size={15}
              className={bookmarked ? "fill-[var(--sh-brand)] text-[var(--sh-brand)]" : "text-[var(--sh-ink-soft)]"}
            />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-bold leading-tight text-[var(--sh-ink)] mb-1.5 line-clamp-2" style={{ letterSpacing: "-0.4px" }}>
          {dataset.title}
        </h3>
        <p className="text-xs text-[var(--sh-ink-soft)] mb-4 line-clamp-2 leading-relaxed">
          {dataset.subtitle}
        </p>

        {/* KPI */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold sh-accent-text" style={{ color: dataset.accent, letterSpacing: "-0.5px" }}>
            {latest.value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{dataset.unit}
          </span>
          {prev && (
            <span
              className="text-xs font-bold"
              style={{ color: change >= 0 ? "#34d399" : "#f87171" }}
            >
              {change >= 0 ? "↑" : "↓"} {Math.abs(Number(changePct))}%
            </span>
          )}
        </div>

        {/* Mini chart */}
        <div
          className="rounded-xl p-2 mb-4 border overflow-hidden"
          style={{
            background: `linear-gradient(180deg, ${dataset.accent}06, transparent)`,
            borderColor: "var(--sh-line)",
            height: variant === "compact" ? 80 : 120,
          }}
        >
          <ChartCanvas
            dataset={dataset}
            height={variant === "compact" ? 64 : 104}
            interactive={false}
            showAnnotations={false}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-[var(--sh-ink-soft)]">
          <span className="truncate">{dataset.source}</span>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="flex items-center gap-1">
              <Eye size={11} />
              {(dataset.views / 1000).toFixed(1)}k
            </span>
            <span className="sh-chip !py-0.5 !px-2">{dataset.data.length} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
