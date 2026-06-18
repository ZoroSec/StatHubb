import type { Dataset, EventAnnotation } from "./types";

// ── Linear regression forecast ───────────────────────────────────────────────

export interface ForecastResult {
  points: { label: string; value: number; forecast: boolean }[];
  rSquared: number;
  slope: number;
  intercept: number;
  confidence: { upper: number; lower: number }[];
}

export function linearRegressionForecast(
  ds: Dataset,
  steps = 5
): ForecastResult | null {
  if (!ds.data || ds.data.length < 3) return null;
  const data = ds.data;
  const n = data.length;
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.value);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, _, i) => a + xs[i] * ys[i], 0);
  const sumX2 = xs.reduce((a, b) => a + b * b, 0);
  const meanY = sumY / n;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predicted = xs.map((x) => slope * x + intercept);
  const ssRes = ys.reduce((a, y, i) => a + Math.pow(y - predicted[i], 2), 0);
  const ssTot = ys.reduce((a, y) => a + Math.pow(y - meanY, 2), 0);
  const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  const residuals = ys.map((y, i) => y - predicted[i]);
  const stdErr = Math.sqrt(
    residuals.reduce((a, r) => a + r * r, 0) / (n - 2)
  );

  // Build forecast labels by extrapolating year-like labels
  const lastLabel = data[data.length - 1].label;
  const lastYear = parseInt(lastLabel);
  const isYearLabel = !isNaN(lastYear);

  const points: ForecastResult["points"] = data.map((d, i) => ({
    label: d.label,
    value: d.value,
    forecast: false,
  }));

  const confidence: ForecastResult["confidence"] = data.map((_, i) => {
    const pred = slope * i + intercept;
    return { upper: pred + stdErr, lower: pred - stdErr };
  });

  for (let i = 1; i <= steps; i++) {
    const xIdx = n - 1 + i;
    const pred = slope * xIdx + intercept;
    const margin = stdErr * (1 + i * 0.15);
    const label = isYearLabel ? String(lastYear + i) : `+${i}`;
    points.push({ label, value: pred, forecast: true });
    confidence.push({ upper: pred + margin, lower: pred - margin });
  }

  return { points, rSquared, slope, intercept, confidence };
}

export function rSquaredLabel(r2: number): { label: string; color: string } {
  if (r2 >= 0.85)
    return { label: "Excellent fit", color: "#10b981" };
  if (r2 >= 0.6) return { label: "Good fit", color: "#3b82f6" };
  if (r2 >= 0.3) return { label: "Moderate fit", color: "#f59e0b" };
  return { label: "Weak fit", color: "#ef4444" };
}

// ── Related dataset scoring ──────────────────────────────────────────────────

export function getRelatedDatasets(ds: Dataset, all: Dataset[], limit = 6): Dataset[] {
  const scored = all
    .filter((d) => d.id !== ds.id && d.published)
    .map((d) => {
      let score = 0;
      if (d.category === ds.category) score += 3;
      if (d.country === ds.country && ds.country) score += 2;
      if (d.region === ds.region && ds.region) score += 1;
      if (d.chartType === ds.chartType) score += 1;
      // tag overlap
      const sharedTags = (d.tags || []).filter((t) =>
        (ds.tags || []).includes(t)
      );
      score += sharedTags.length * 1.5;
      // title similarity (simple word overlap)
      const wordsA = new Set(ds.title.toLowerCase().split(/\s+/));
      const wordsB = d.title.toLowerCase().split(/\s+/);
      const sharedWords = wordsB.filter((w) => wordsA.has(w) && w.length > 3);
      score += sharedWords.length * 2;
      return { ds: d, score };
    })
    .sort((a, b) => b.score - a.score);

  const related = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.ds);

  // Fallback: recently added if not enough related
  if (related.length < 3) {
    const fallback = all
      .filter((d) => d.id !== ds.id && d.published && !related.includes(d))
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, limit - related.length);
    related.push(...fallback);
  }

  return related.slice(0, limit);
}

// ── Correlation between two datasets ─────────────────────────────────────────

export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const meanA = a.slice(0, n).reduce((x, y) => x + y, 0) / n;
  const meanB = b.slice(0, n).reduce((x, y) => x + y, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const dA = a[i] - meanA;
    const dB = b[i] - meanB;
    num += dA * dB;
    denA += dA * dA;
    denB += dB * dB;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

export function correlationLabel(r: number): { label: string; color: string } {
  const abs = Math.abs(r);
  if (abs >= 0.7)
    return { label: r > 0 ? "Strong positive" : "Strong negative", color: "#10b981" };
  if (abs >= 0.4)
    return { label: r > 0 ? "Moderate positive" : "Moderate negative", color: "#3b82f6" };
  if (abs >= 0.2)
    return { label: r > 0 ? "Weak positive" : "Weak negative", color: "#f59e0b" };
  return { label: "Negligible", color: "#94a3b8" };
}

// ── Search & filtering ───────────────────────────────────────────────────────

export interface SearchFilters {
  query?: string;
  topic?: string;
  country?: string;
  region?: string;
  yearFrom?: number;
  yearTo?: number;
}

export interface SearchResult {
  ds: Dataset;
  score: number;
  matchedFields: string[];
}

export function searchDatasets(
  all: Dataset[],
  filters: SearchFilters
): SearchResult[] {
  const q = (filters.query || "").toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const ds of all) {
    if (!ds.published) continue;
    let score = 0;
    const matched: string[] = [];

    // Text matching
    if (q) {
      if (ds.title.toLowerCase().includes(q)) {
        score += 10;
        matched.push("title");
      }
      if ((ds.subtitle || "").toLowerCase().includes(q)) {
        score += 5;
        matched.push("subtitle");
      }
      if ((ds.source || "").toLowerCase().includes(q)) {
        score += 3;
        matched.push("source");
      }
      if ((ds.tags || []).some((t) => t.toLowerCase().includes(q))) {
        score += 4;
        matched.push("tags");
      }
      if ((ds.report || "").toLowerCase().includes(q)) {
        score += 2;
        matched.push("report");
      }
      if (ds.country && ds.country.toLowerCase().includes(q)) {
        score += 3;
        matched.push("country");
      }
    } else {
      score = 1; // include all if no query
    }

    // Filter facets
    if (filters.topic && ds.category !== filters.topic) continue;
    if (filters.country && ds.country !== filters.country) continue;
    if (filters.region && ds.region !== filters.region) continue;

    // Year filtering
    if (filters.yearFrom || filters.yearTo) {
      const years = ds.data
        .map((d) => parseInt(d.label))
        .filter((y) => !isNaN(y));
      if (years.length === 0) continue;
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      if (filters.yearFrom && maxYear < filters.yearFrom) continue;
      if (filters.yearTo && minYear > filters.yearTo) continue;
    }

    if (score > 0) {
      results.push({ ds, score, matchedFields: matched });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

// ── Trending ─────────────────────────────────────────────────────────────────

export function getTrending(all: Dataset[], limit = 8): Dataset[] {
  return [...all]
    .filter((d) => d.published)
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
}

export function getRecentlyAdded(all: Dataset[], limit = 8): Dataset[] {
  return [...all]
    .filter((d) => d.published && d.lastUpdated)
    .sort((a, b) => (b.lastUpdated || "").localeCompare(a.lastUpdated || ""))
    .slice(0, limit);
}

// ── Annotation helpers ───────────────────────────────────────────────────────

export const ANNOTATION_TYPE_COLORS: Record<EventAnnotation["type"], string> = {
  crisis: "#ef4444",
  policy: "#3b82f6",
  milestone: "#10b981",
  reform: "#8b5cf6",
  outbreak: "#f97316",
};

export const ANNOTATION_TYPE_LABELS: Record<EventAnnotation["type"], string> = {
  crisis: "Crisis",
  policy: "Policy Change",
  milestone: "Milestone",
  reform: "Reform",
  outbreak: "Outbreak",
};
