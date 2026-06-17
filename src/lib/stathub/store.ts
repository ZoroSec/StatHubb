"use client";

import { create } from "zustand";
import type { Route, Bookmark, ChartType } from "./types";

interface StatHubState {
  // Routing
  route: Route;
  navigate: (route: Route) => void;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;

  // Bookmarks (Personal Board)
  bookmarks: Bookmark[];
  addBookmark: (datasetId: string, chartType?: ChartType) => void;
  removeBookmark: (datasetId: string) => void;
  clearBookmarks: () => void;
  isBookmarked: (datasetId: string) => boolean;

  // Chart type preference per dataset (persists in session)
  chartTypeOverrides: Record<string, ChartType>;
  setChartType: (datasetId: string, type: ChartType) => void;

  // Forecast toggle
  forecastEnabled: Record<string, boolean>;
  toggleForecast: (datasetId: string) => void;

  // Search query (shared)
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const THEME_KEY = "stathub-theme";
const BOOKMARKS_KEY = "stathub-bookmarks";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Default to dark for editorial feel
  return "dark";
}

function getInitialBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
  } catch {
    return [];
  }
}

function parseHash(): Route {
  if (typeof window === "undefined") return { name: "home" };
  const hash = window.location.hash.replace(/^#\/?/, "");
  const parts = hash.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home" };
  switch (parts[0]) {
    case "dataset":
      return parts[1] ? { name: "dataset", id: parts[1] } : { name: "home" };
    case "topic":
      return parts[1] ? { name: "topic", id: parts[1] } : { name: "home" };
    case "country":
      return parts[1] ? { name: "country", id: parts[1] } : { name: "home" };
    case "board":
      return { name: "board" };
    case "compare":
      return { name: "compare", a: parts[1], b: parts[2] };
    case "search":
      return { name: "search", q: parts[1] ? decodeURIComponent(parts[1]) : undefined };
    case "admin":
      return { name: "admin" };
    default:
      return { name: "home" };
  }
}

function routeToHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "#/";
    case "dataset":
      return `#/dataset/${route.id}`;
    case "topic":
      return `#/topic/${route.id}`;
    case "country":
      return `#/country/${route.id}`;
    case "board":
      return `#/board`;
    case "compare":
      return `#/compare${route.a ? "/" + route.a : ""}${route.b ? "/" + route.b : ""}`;
    case "search":
      return `#/search${route.q ? "/" + encodeURIComponent(route.q) : ""}`;
    case "admin":
      return `#/admin`;
  }
}

export const useStatHub = create<StatHubState>((set, get) => ({
  route: parseHash(),
  navigate: (route) => {
    if (typeof window !== "undefined") {
      window.location.hash = routeToHash(route);
      window.scrollTo(0, 0);
    }
    set({ route });
  },

  theme: getInitialTheme(),
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    set({ theme: next });
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_KEY, next);
      document.documentElement.classList.toggle("dark", next === "dark");
    }
  },
  setTheme: (t) => {
    set({ theme: t });
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_KEY, t);
      document.documentElement.classList.toggle("dark", t === "dark");
    }
  },

  bookmarks: getInitialBookmarks(),
  addBookmark: (datasetId, chartType) => {
    const existing = get().bookmarks.find((b) => b.datasetId === datasetId);
    if (existing) return;
    const bookmark: Bookmark = { datasetId, chartType, savedAt: Date.now() };
    const next = [...get().bookmarks, bookmark];
    set({ bookmarks: next });
    if (typeof window !== "undefined") {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    }
  },
  removeBookmark: (datasetId) => {
    const next = get().bookmarks.filter((b) => b.datasetId !== datasetId);
    set({ bookmarks: next });
    if (typeof window !== "undefined") {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
    }
  },
  clearBookmarks: () => {
    set({ bookmarks: [] });
    if (typeof window !== "undefined") {
      localStorage.removeItem(BOOKMARKS_KEY);
    }
  },
  isBookmarked: (datasetId) =>
    get().bookmarks.some((b) => b.datasetId === datasetId),

  chartTypeOverrides: {},
  setChartType: (datasetId, type) =>
    set((s) => ({
      chartTypeOverrides: { ...s.chartTypeOverrides, [datasetId]: type },
    })),

  forecastEnabled: {},
  toggleForecast: (datasetId) =>
    set((s) => ({
      forecastEnabled: {
        ...s.forecastEnabled,
        [datasetId]: !s.forecastEnabled[datasetId],
      },
    })),

  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
}));

// Hash routing listener
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    useStatHub.getState().navigate(parseHash());
  });

  // Apply initial theme
  const theme = useStatHub.getState().theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}
