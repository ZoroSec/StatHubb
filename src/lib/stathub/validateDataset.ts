import type { Dataset } from "./types";

const CHART_TYPES = [
  "line", "area", "bar", "stacked-bar", "scatter", "radar", "choropleth",
];

/**
 * Validate a Dataset before it is committed to the repo.
 *
 * This is the safety gate for GitHub publishing: malformed data that slips
 * into the repo could break the production build (which now fails on type
 * errors). We check structure and the fields the app actually relies on, and
 * return a list of human-readable problems. An empty array means "safe to
 * commit".
 */
export function validateDataset(ds: Partial<Dataset>): string[] {
  const errors: string[] = [];

  if (!ds.id || !ds.id.trim()) errors.push("Missing id.");
  if (!ds.title || !ds.title.trim()) errors.push("Missing title.");
  if (!ds.unit || !ds.unit.trim()) errors.push("Missing unit.");
  if (!ds.source || !ds.source.trim()) errors.push("Missing source.");
  if (!ds.category || !ds.category.trim()) errors.push("Missing category (topic).");

  if (!ds.chartType || !CHART_TYPES.includes(ds.chartType)) {
    errors.push(`Invalid chartType "${ds.chartType ?? ""}".`);
  }

  if (!Array.isArray(ds.data) || ds.data.length === 0) {
    errors.push("Dataset has no data points.");
  } else {
    ds.data.forEach((d, i) => {
      if (!d || typeof d.label !== "string" || !d.label.trim()) {
        errors.push(`Data point ${i + 1}: missing label.`);
      }
      if (!d || typeof d.value !== "number" || Number.isNaN(d.value)) {
        errors.push(`Data point ${i + 1}: value is not a number.`);
      }
    });
  }

  if (!Array.isArray(ds.keyStats)) {
    errors.push("keyStats must be an array.");
  }

  if (typeof ds.published !== "boolean") {
    errors.push("published must be true or false.");
  }

  return errors;
}

/** Validate a whole collection; returns a map of id → errors for any invalid ones. */
export function validateAll(datasets: Partial<Dataset>[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const seenIds = new Set<string>();

  datasets.forEach((ds, i) => {
    const key = ds.id || `#${i + 1}`;
    const errs = validateDataset(ds);
    if (ds.id) {
      if (seenIds.has(ds.id)) errs.push(`Duplicate id "${ds.id}".`);
      seenIds.add(ds.id);
    }
    if (errs.length) out[key] = errs;
  });

  return out;
}
