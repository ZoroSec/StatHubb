// ── Core Data Types for StatHub ──────────────────────────────────────────────

export type ChartType =
  | "line"
  | "area"
  | "bar"
  | "stacked-bar"
  | "scatter"
  | "radar"
  | "choropleth";

export type TrendDir = "up" | "down" | "neutral";

export interface DataPoint {
  label: string;
  value: number;
}

export interface MultiSeriesPoint {
  label: string;
  values: Record<string, number>;
}

export interface KeyStat {
  label: string;
  value: string;
  year?: string;
  trendDir?: TrendDir;
  trend?: string;
}

export interface EventAnnotation {
  year: string;
  label: string;
  type: "crisis" | "policy" | "milestone" | "reform" | "outbreak";
}

export interface Methodology {
  source?: string;
  collectionMethod?: string;
  coverage?: string;
  lastUpdated?: string;
  caveats?: string;
  notes?: string;
}

export interface Dataset {
  id: string;
  title: string;
  subtitle: string;
  unit: string;
  source: string;
  category: string; // topic id
  chartType: ChartType;
  accent: string;
  data: DataPoint[];
  // Optional multi-series for stacked-bar / radar
  series?: { name: string; color: string }[];
  multiSeriesData?: MultiSeriesPoint[];
  keyStats: KeyStat[];
  report: string;
  insights: string[];
  // Editorial layer (P3)
  whyItMatters?: string;
  methodology?: Methodology;
  annotations?: EventAnnotation[];
  // Discovery (P4)
  country?: string;
  region?: string;
  tags?: string[];
  // Optional external notebook (GitHub / Colab / nbviewer) for deeper exploration
  notebookUrl?: string;
  views: number;
  editorsPick?: boolean;
  featured?: boolean;
  lastUpdated?: string;
  published: boolean;
}

export interface Topic {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  intro: string;
}

export interface CountryIndicator {
  label: string;
  value: string;
  unit?: string;
  trend?: TrendDir;
}

export interface Country {
  id: string;
  name: string;
  iso: string;
  flag: string;
  region: string;
  overview: string;
  indicators: CountryIndicator[];
}

// ── Routing ──────────────────────────────────────────────────────────────────

export type Route =
  | { name: "home" }
  | { name: "dataset"; id: string }
  | { name: "topic"; id: string }
  | { name: "country"; id: string }
  | { name: "board" }
  | { name: "compare"; a?: string; b?: string }
  | { name: "search"; q?: string }
  | { name: "all" }
  | { name: "admin" };

// ── Bookmarks (Personal Board) ───────────────────────────────────────────────

export interface Bookmark {
  datasetId: string;
  chartType?: ChartType;
  savedAt: number;
  note?: string;
}
