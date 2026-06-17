"use client";

import { useState, useEffect, useCallback } from "react";
import { DATASETS as BUILTIN_DATASETS } from "./datasets";
import type { Dataset } from "./types";

const CUSTOM_KEY = "stathub-custom-datasets";

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

// Singleton state — shared across all hook instances
let allDatasets: Dataset[] = [...BUILTIN_DATASETS];
const listeners = new Set<() => void>();

function notifyAll() {
  for (const fn of listeners) fn();
}

function refreshAll() {
  const custom = loadCustom();
  allDatasets = [...BUILTIN_DATASETS, ...custom];
  notifyAll();
}

// Initialize on client
if (typeof window !== "undefined") {
  refreshAll();
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

  return {
    datasets: allDatasets,
    addDataset,
    updateDataset,
    deleteDataset,
    isCustom,
    getDataset,
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
