"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { useNotebooks } from "@/lib/stathub/notebook";
import { TOPIC_MAP } from "@/lib/stathub/topics";
import { COUNTRY_MAP } from "@/lib/stathub/countries";
import { ChartCanvas } from "./ChartCanvas";
import { DatasetCard } from "./DatasetCard";
import { NotebookViewer } from "./NotebookViewer";
import { getRelatedDatasets, linearRegressionForecast, rSquaredLabel, ANNOTATION_TYPE_COLORS, ANNOTATION_TYPE_LABELS } from "@/lib/stathub/analytics";
import { exportPNG, exportCSV, exportXLSX, exportJSON, getShareLink, copyToClipboard } from "@/lib/stathub/exporters";
import type { ChartType } from "@/lib/stathub/types";
import {
  ArrowLeft, Bookmark, Share2, Download, FileImage, FileText, FileSpreadsheet, FileJson,
  TrendingUp, ChevronDown, Info, Lightbulb, AlertCircle, BookmarkCheck, GitCompare, NotebookPen, ExternalLink,
} from "lucide-react";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";

const CHART_TYPES: { type: ChartType; label: string; icon: string }[] = [
  { type: "line", label: "Line", icon: "📈" },
  { type: "area", label: "Area", icon: "🏔" },
  { type: "bar", label: "Bar", icon: "📊" },
  { type: "stacked-bar", label: "Stacked", icon: "🎺" },
  { type: "scatter", label: "Scatter", icon: "💫" },
  { type: "radar", label: "Radar", icon: "🎯" },
  { type: "choropleth", label: "Heatmap", icon: "🗺" },
];

interface DatasetPageProps {
  id: string;
}

export function DatasetPage({ id }: DatasetPageProps) {
  const { navigate, isBookmarked, addBookmark, removeBookmark, chartTypeOverrides, setChartType, forecastEnabled, toggleForecast } = useStatHub();
  const { datasets: DATASETS, getDataset } = useDatasets();
  const { getNotebook } = useNotebooks();
  const [methodOpen, setMethodOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const ds = getDataset(id);
  const notebook = getNotebook(id);

  const chartType = chartTypeOverrides[id] || ds?.chartType || "line";
  const showForecast = forecastEnabled[id] || false;
  const forecast = useMemo(
    () => (showForecast && ds ? linearRegressionForecast(ds, 5) : null),
    [showForecast, ds]
  );
  const r2Info = forecast ? rSquaredLabel(forecast.rSquared) : null;

  if (!ds) {
    return (
      <div className="max-w-[1120px] mx-auto px-5 py-20 text-center">
        <p className="text-[var(--sh-ink-soft)]">Dataset not found.</p>
        <button className="sh-btn mt-4" onClick={() => navigate({ name: "home" })}>← Back home</button>
      </div>
    );
  }

  const topic = TOPIC_MAP[ds.category];
  const country = ds.country ? COUNTRY_MAP[ds.country] : null;
  const bookmarked = isBookmarked(ds.id);
  const related = getRelatedDatasets(ds, DATASETS, 6);

  const latest = ds.data[ds.data.length - 1];
  const prev = ds.data[ds.data.length - 2];
  const change = prev ? latest.value - prev.value : 0;
  const vals = ds.data.map((d) => d.value);
  const max = Math.max(...vals);
  const min = Math.min(...vals);

  const handleExport = (type: "png" | "csv" | "xlsx" | "json") => {
    const svg = chartRef.current?.querySelector("svg") as SVGSVGElement;
    switch (type) {
      case "png":
        if (svg) exportPNG(svg, ds.title);
        toast.success("PNG exported");
        break;
      case "csv":
        exportCSV(ds);
        toast.success("CSV exported");
        break;
      case "xlsx":
        exportXLSX(ds);
        toast.success("Excel exported");
        break;
      case "json":
        exportJSON(ds);
        toast.success("JSON exported");
        break;
    }
    setExportOpen(false);
  };

  const handleShare = async () => {
    const link = getShareLink(ds);
    const ok = await copyToClipboard(link);
    toast.success(ok ? "Share link copied!" : "Link ready to copy");
  };

  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8 sh-fade-up">
      {/* Breadcrumb / Back */}
      <button
        className="flex items-center gap-1.5 text-sm text-[var(--sh-ink-soft)] hover:text-[var(--sh-brand)] transition-colors mb-6 font-medium"
        onClick={() => navigate({ name: "home" })}
      >
        <ArrowLeft size={16} /> Back to library
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button
            className="sh-chip cursor-pointer hover:border-[var(--sh-brand)]"
            onClick={() => navigate({ name: "topic", id: topic.id })}
            style={{ color: topic.color, borderColor: topic.color + "40" }}
          >
            {topic.icon} {topic.label}
          </button>
          {country && (
            <button
              className="sh-chip cursor-pointer hover:border-[var(--sh-brand)]"
              onClick={() => navigate({ name: "country", id: country.id })}
            >
              {country.flag} {country.name}
            </button>
          )}
          {ds.editorsPick && (
            <span className="sh-chip" style={{ background: "#f59e0b18", color: "#f59e0b", borderColor: "#f59e0b40" }}>
              ★ Editor's Pick
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--sh-ink)] mb-2 leading-tight" style={{ letterSpacing: "-1px" }}>
          {ds.title}
        </h1>
        <p className="text-base text-[var(--sh-ink-soft)] leading-relaxed max-w-2xl mb-4">{ds.subtitle}</p>

        <div className="flex items-center gap-4 text-xs text-[var(--sh-ink-soft)] flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: ds.accent }} />
            <strong className="text-[var(--sh-ink)]">{ds.source}</strong>
          </span>
          <span>Updated {ds.lastUpdated}</span>
          <span>{ds.data.length} data points</span>
          <span>{ds.views.toLocaleString()} views</span>
        </div>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="sh-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-1">Latest</div>
          <div className="text-xl font-bold sh-accent-text" style={{ color: ds.accent }}>{latest.value}{ds.unit}</div>
          <div className="text-xs text-[var(--sh-ink-soft)] mt-0.5">{latest.label}</div>
        </div>
        <div className="sh-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-1">Change</div>
          <div className="text-xl font-bold" style={{ color: change >= 0 ? "#34d399" : "#f87171" }}>
            {change >= 0 ? "+" : ""}{change.toFixed(1)}{ds.unit}
          </div>
          <div className="text-xs text-[var(--sh-ink-soft)] mt-0.5">vs {prev?.label}</div>
        </div>
        <div className="sh-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-1">Max</div>
          <div className="text-xl font-bold text-[var(--sh-ink)]">{max}{ds.unit}</div>
          <div className="text-xs text-[var(--sh-ink-soft)] mt-0.5">{ds.data.find((d) => d.value === max)?.label}</div>
        </div>
        <div className="sh-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-1">Min</div>
          <div className="text-xl font-bold text-[var(--sh-ink)]">{min}{ds.unit}</div>
          <div className="text-xs text-[var(--sh-ink-soft)] mt-0.5">{ds.data.find((d) => d.value === min)?.label}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          className={`sh-btn ${bookmarked ? "!border-[var(--sh-brand)] !text-[var(--sh-brand)]" : ""}`}
          onClick={() => bookmarked ? removeBookmark(ds.id) : addBookmark(ds.id, chartType)}
        >
          {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {bookmarked ? "Saved" : "Save to Board"}
        </button>
        <button className="sh-btn" onClick={handleShare}>
          <Share2 size={14} /> Share
        </button>
        <button
          className="sh-btn"
          onClick={() => navigate({ name: "compare", a: ds.id })}
        >
          <GitCompare size={14} /> Compare
        </button>

        {/* Export Center */}
        <div className="relative">
          <button className="sh-btn sh-btn-primary" onClick={() => setExportOpen((v) => !v)}>
            <Download size={14} /> Export
            <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
              <div className="absolute top-full mt-2 right-0 z-50 sh-card p-2 min-w-[180px]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold px-2 py-1.5">Export Center</div>
                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[var(--sh-surface-alt)] text-sm text-[var(--sh-ink)] text-left transition-colors" onClick={() => handleExport("png")}>
                  <FileImage size={15} className="text-[#6366f1]" /> PNG Image
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[var(--sh-surface-alt)] text-sm text-[var(--sh-ink)] text-left transition-colors" onClick={() => handleExport("csv")}>
                  <FileText size={15} className="text-[#10b981]" /> CSV Data
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[var(--sh-surface-alt)] text-sm text-[var(--sh-ink)] text-left transition-colors" onClick={() => handleExport("xlsx")}>
                  <FileSpreadsheet size={15} className="text-[#3b82f6]" /> Excel (XLSX)
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[var(--sh-surface-alt)] text-sm text-[var(--sh-ink)] text-left transition-colors" onClick={() => handleExport("json")}>
                  <FileJson size={15} className="text-[#f59e0b]" /> JSON Full
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart Card */}
      <div className="sh-card p-5 sm:p-7 mb-6" ref={chartRef}>
        {/* Chart Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.type}
                className={`sh-chart-tab ${chartType === ct.type ? "active" : ""}`}
                onClick={() => setChartType(ds.id, ct.type)}
                title={ct.label}
              >
                <span className="sh-chart-tab-icon">{ct.icon}</span>
                <span className="hidden sm:inline">{ct.label}</span>
              </button>
            ))}
          </div>

          {/* Forecast Toggle */}
          {ds.data.length >= 5 && (chartType === "line" || chartType === "area" || chartType === "bar") && (
            <button
              className={`sh-chart-tab ${showForecast ? "active" : ""}`}
              onClick={() => toggleForecast(ds.id)}
              style={showForecast ? { background: "#f59e0b", borderColor: "#f59e0b" } : {}}
            >
              <TrendingUp size={13} /> Forecast
            </button>
          )}
        </div>

        {/* Chart */}
        <div
          className="sh-chart-stage rounded-xl p-3 border overflow-x-auto"
          style={{ background: `linear-gradient(180deg, ${ds.accent}06, transparent)`, borderColor: "var(--sh-line)" }}
        >
          <div className="sh-chart-scroll min-h-[380px]">
            <ChartCanvas
              dataset={ds}
              chartType={chartType}
              height={380}
              interactive
              showForecast={showForecast}
              showAnnotations
            />
          </div>
        </div>

        {/* Forecast Info */}
        {showForecast && forecast && r2Info && (
          <div className="flex items-center gap-3 mt-3 px-1 flex-wrap">
            <span className="sh-chip flex items-center gap-1.5" style={{ background: "#f59e0b15", color: "#f59e0b", borderColor: "#f59e0b40" }}>
              <TrendingUp size={12} /> 5-year linear forecast
            </span>
            <span className="sh-chip flex items-center gap-1.5" style={{ background: r2Info.color + "15", color: r2Info.color, borderColor: r2Info.color + "40" }}>
              R² = {forecast.rSquared.toFixed(3)} · {r2Info.label}
            </span>
            <span className="text-xs text-[var(--sh-ink-soft)]">
              Slope: {forecast.slope >= 0 ? "+" : ""}{forecast.slope.toFixed(2)}{ds.unit}/period
            </span>
            <span className="text-[11px] text-[var(--sh-ink-soft)] basis-full">
              Simple linear trend extrapolation. The shaded band is an
              illustrative range (±standard error), not a statistical prediction
              interval — treat projected points as indicative only.
            </span>
          </div>
        )}

        {/* Annotation Legend */}
        {ds.annotations && ds.annotations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--sh-line)]">
            <div className="text-[10px] uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-2">Event Annotations</div>
            <div className="flex flex-wrap gap-2">
              {ds.annotations.map((ann, i) => (
                <span key={i} className="sh-chip flex items-center gap-1.5">
                  <span className="sh-ann-legend-dot" style={{ background: ANNOTATION_TYPE_COLORS[ann.type] }} />
                  <strong>{ann.year}</strong> · {ann.label}
                  <span className="text-[var(--sh-ink-soft)] ml-1">({ANNOTATION_TYPE_LABELS[ann.type]})</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editorial Content */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Key Insights */}
        {ds.insights.length > 0 && (
          <div className="sh-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ds.accent + "18" }}>
                <Lightbulb size={16} className="sh-accent-text" style={{ color: ds.accent }} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sh-ink-soft)]">Key Insights</h2>
            </div>
            <ul className="space-y-3">
              {ds.insights.map((ins, i) => (
                <li key={i} className="flex gap-3 sh-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
                  <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold sh-accent-text" style={{ background: ds.accent + "18", color: ds.accent }}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-[var(--sh-ink)] leading-relaxed">{ins}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Why This Matters */}
        {ds.whyItMatters && (
          <div className="sh-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#f59e0b18" }}>
                <AlertCircle size={16} className="text-[#f59e0b]" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sh-ink-soft)]">Why This Matters</h2>
            </div>
            <p className="text-sm text-[var(--sh-ink)] leading-relaxed">{ds.whyItMatters}</p>
          </div>
        )}
      </div>

      {/* Report */}
      {ds.report && (
        <div className="sh-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ds.accent + "18" }}>
              <Info size={16} className="sh-accent-text" style={{ color: ds.accent }} />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sh-ink-soft)]">Analysis</h2>
          </div>
          <p className="text-[15px] text-[var(--sh-ink)] leading-[1.8]">{ds.report}</p>
        </div>
      )}

      {/* About This Data (collapsible methodology) */}
      {ds.methodology && (
        <div className="sh-card mb-6 overflow-hidden">
          <button
            className="w-full p-6 flex items-center justify-between text-left"
            onClick={() => setMethodOpen((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#3b82f618" }}>
                <Info size={16} className="text-[#3b82f6]" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sh-ink-soft)]">About This Data</h2>
            </div>
            <ChevronDown
              size={18}
              className="text-[var(--sh-ink-soft)] transition-transform"
              style={{ transform: methodOpen ? "rotate(180deg)" : "none" }}
            />
          </button>
          {methodOpen && (
            <div className="px-6 pb-6 sh-fade-in">
              <div className="pt-2">
                {ds.methodology.source && (
                  <div className="sh-method-row">
                    <div className="sh-method-label">Source</div>
                    <div className="sh-method-value">{ds.methodology.source}</div>
                  </div>
                )}
                {ds.methodology.collectionMethod && (
                  <div className="sh-method-row">
                    <div className="sh-method-label">Collection Method</div>
                    <div className="sh-method-value">{ds.methodology.collectionMethod}</div>
                  </div>
                )}
                {ds.methodology.coverage && (
                  <div className="sh-method-row">
                    <div className="sh-method-label">Coverage</div>
                    <div className="sh-method-value">{ds.methodology.coverage}</div>
                  </div>
                )}
                {ds.methodology.lastUpdated && (
                  <div className="sh-method-row">
                    <div className="sh-method-label">Last Updated</div>
                    <div className="sh-method-value">{ds.methodology.lastUpdated}</div>
                  </div>
                )}
                {ds.methodology.caveats && (
                  <div className="sh-method-row">
                    <div className="sh-method-label">Caveats</div>
                    <div className="sh-method-value" style={{ color: "#f59e0b" }}>{ds.methodology.caveats}</div>
                  </div>
                )}
                {ds.methodology.notes && (
                  <div className="sh-method-row">
                    <div className="sh-method-label">Notes</div>
                    <div className="sh-method-value italic text-[var(--sh-ink-soft)]">{ds.methodology.notes}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explore notebook */}
      {ds.notebookUrl && (
        <a
          href={ds.notebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sh-card flex items-center gap-3 p-4 mb-8 hover:border-[var(--sh-brand)] transition-colors group"
          style={{ textDecoration: "none" }}
        >
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{ width: 40, height: 40, background: "var(--sh-brand)", color: "#fff" }}
          >
            <NotebookPen size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-[var(--sh-ink)]">Explore the analysis notebook</div>
            <div className="text-xs text-[var(--sh-ink-soft)] truncate">
              Open the Jupyter notebook behind this dataset for methodology, code, and deeper analysis.
            </div>
          </div>
          <ExternalLink size={16} className="text-[var(--sh-ink-soft)] group-hover:text-[var(--sh-brand)] flex-shrink-0" />
        </a>
      )}
      {ds.tags && ds.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <span className="text-xs text-[var(--sh-ink-soft)] font-semibold">Tags:</span>
          {ds.tags.map((tag) => (
            <span key={tag} className="sh-chip">#{tag}</span>
          ))}
        </div>
      )}

      {/* Data Process — Jupyter Notebook */}
      {notebook && (
        <div className="mb-8">
          <NotebookViewer notebook={notebook} defaultOpen={false} />
        </div>
      )}

      {/* Related Datasets */}
      {related.length > 0 && (
        <div className="mb-12">
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="sh-eyebrow mb-1.5">Continue exploring</div>
              <h2 className="sh-section-title">Related datasets</h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((r, i) => (
              <DatasetCard key={r.id} dataset={r} index={i} variant="compact" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
