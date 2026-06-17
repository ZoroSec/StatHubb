"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { TOPICS } from "@/lib/stathub/topics";
import { Search, Bookmark, Moon, Sun, GitCompare, Settings } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { searchDatasets } from "@/lib/stathub/analytics";

export function Nav() {
  const { theme, toggleTheme, navigate, bookmarks } = useStatHub();
  const { datasets: DATASETS } = useDatasets();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (query.trim().length < 1) return [];
    return searchDatasets(DATASETS, { query }).slice(0, 6);
  }, [query, DATASETS]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="sh-nav">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <div
            className="sh-nav-logo flex-shrink-0"
            onClick={() => navigate({ name: "home" })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate({ name: "home" })}
          >
            StatHub
          </div>
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {TOPICS.slice(0, 6).map((t) => (
              <button
                key={t.id}
                className="sh-nav-link"
                onClick={() => navigate({ name: "topic", id: t.id })}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div ref={searchRef} className="relative hidden md:block">
            <button
              className="sh-btn !rounded-full !px-3"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
            >
              <Search size={16} />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] z-50">
                <div className="sh-card p-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sh-ink-soft)]" />
                    <input
                      autoFocus
                      className="sh-search-input !pl-10 !py-2.5 !text-sm"
                      placeholder="Search datasets, topics, countries..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  {results.length > 0 && (
                    <div className="mt-2 max-h-[300px] overflow-y-auto">
                      {results.map((r) => (
                        <div
                          key={r.ds.id}
                          className="sh-search-item"
                          onClick={() => {
                            navigate({ name: "dataset", id: r.ds.id });
                            setSearchOpen(false);
                            setQuery("");
                          }}
                        >
                          <span style={{ color: r.ds.accent }}>▦</span>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[var(--sh-ink)] truncate">{r.ds.title}</div>
                            <div className="text-xs text-[var(--sh-ink-soft)] truncate">{r.ds.subtitle}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="sh-btn !rounded-full !px-3 relative"
            onClick={() => navigate({ name: "board" })}
            aria-label="Personal Board"
            title="My Board"
          >
            <Bookmark size={16} />
            {bookmarks.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--sh-brand)] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {bookmarks.length}
              </span>
            )}
          </button>

          <button
            className="sh-btn !rounded-full !px-3 hidden sm:flex"
            onClick={() => navigate({ name: "compare" })}
            aria-label="Compare datasets"
            title="Compare"
          >
            <GitCompare size={16} />
          </button>

          <button
            className="sh-btn !rounded-full !px-3"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="sh-btn !rounded-full !px-3"
            onClick={() => navigate({ name: "admin" })}
            aria-label="Admin Panel"
            title="Add Data · Admin"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
