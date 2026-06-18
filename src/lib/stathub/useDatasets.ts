"use client";

import { useState, useEffect, useCallback } from "react";
import { DATASETS as BUILTIN_DATASETS } from "./datasets";
import type { Dataset } from "./types";

const CUSTOM_KEY = "stathub-custom-datasets";

// Path to the JSON committed by the GitHub publish flow. Respects basePath
// (the site is served from /<repo>/ on GitHub Pages).
const PUBLISHED_URL =
  (process.env.NEXT_PUBLIC_BASE_PATH || "") + "/data/custom-datasets.json";

function loadCustom(): Dataset[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(CUSTOM_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCustom(datasets: Dataset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(datasets));
}

// Datasets published to the repo (fetched once on load).
let publishedDatasets: Dataset[] = [];

// Singleton state — shared across all hook instances
let allDatasets: Dataset[] = [...BUILTIN_DATASETS];
const listeners = new Set<() => void>();

function notifyAll() {
  for (const fn of listeners) fn();
}

/**
 * Merge precedence (later wins on id collision):
 *   built-in  <  published-to-repo  <  local unsaved edits
 * So you always see your in-progress local edits, the live site shows the
 * published set, and built-ins are the floor.
 */
function mergeById(...sources: Dataset[][]): Dataset[] {
  const map = new Map<string, Dataset>();
  for (const list of sources) {
    for (const ds of list) {
      if (ds && ds.id) map.set(ds.id, ds);
    }
  }
  return [...map.values()];
}

function refreshAll() {
  const custom = loadCustom();
  allDatasets = mergeById(BUILTIN_DATASETS, publishedDatasets, custom);
  notifyAll();
}

async function fetchPublished() {
  try {
    const res = await fetch(PUBLISHED_URL, { cache: "no-cache" });
    if (!res.ok) return; // file may not exist yet — that's fine
    const data = await res.json();
    if (Array.isArray(data)) {
      publishedDatasets = data as Dataset[];
      refreshAll();
    }
  } catch {
    // Offline or not yet published — built-ins + local still work.
  }
}

// Initialize on client
if (typeof window !== "undefined") {
  refreshAll();
  fetchPublished();
  // Keep tabs in sync: when another tab edits custom datasets, refresh here.
  window.addEventListener("storage", (e) => {
    if (e.key === CUSTOM_KEY || e.key === null) refreshAll();
  });
}

export function useDatasets() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addDataset = useCallback((ds: Dataset) => {
    const custom = loadCustom();
    // Ensure no duplicate IDs
    const id = ds.id || slugify(ds.title);
    const finalDs = { ...ds, id };
    const existingIdx = custom.findIndex((d) => d.id === id);
    if (existingIdx >= 0) {
      custom[existingIdx] = finalDs;
    } else {
      custom.push(finalDs);
    }
    saveCustom(custom);
    refreshAll();
  }, []);

  const updateDataset = useCallback((id: string, updates: Partial<Dataset>) => {
    const custom = loadCustom();
    const idx = custom.findIndex((d) => d.id === id);
    if (idx >= 0) {
      custom[idx] = { ...custom[idx], ...updates };
      saveCustom(custom);
      refreshAll();
    }
  }, []);

  const deleteDataset = useCallback((id: string) => {
    const custom = loadCustom().filter((d) => d.id !== id);
    saveCustom(custom);
    refreshAll();
  }, []);

  const isCustom = useCallback((id: string) => {
    return loadCustom().some((d) => d.id === id);
  }, []);

  const getDataset = useCallback((id: string): Dataset | undefined => {
    return allDatasets.find((d) => d.id === id);
  }, []);

  // The locally-authored datasets — this is exactly what gets committed
  // to the repo when publishing.
  const getCustomDatasets = useCallback((): Dataset[] => {
    return loadCustom();
  }, []);

  // The datasets currently published to the repo (as last fetched).
  const getPublishedDatasets = useCallback((): Dataset[] => {
    return publishedDatasets;
  }, []);

  // Compare a local dataset to what's published:
  //   "new"      — exists locally but not in the published file
  //   "modified" — exists in both but differs
  //   "synced"   — identical to the published version
  const syncStatus = useCallback(
    (id: string): "new" | "modified" | "synced" => {
      const local = loadCustom().find((d) => d.id === id);
      const pub = publishedDatasets.find((d) => d.id === id);
      if (!pub) return "new";
      if (!local) return "synced";
      return JSON.stringify(local) === JSON.stringify(pub) ? "synced" : "modified";
    },
    []
  );

  return {
    datasets: allDatasets,
    addDataset,
    updateDataset,
    deleteDataset,
    isCustom,
    getDataset,
    getCustomDatasets,
    getPublishedDatasets,
    syncStatus,
  };
}

function slugify(str: string): string {
  return (
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || Date.now().toString()
  );
}

// Re-export for convenience
export { BUILTIN_DATASETS };
