"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { TOPICS } from "@/lib/stathub/topics";
import { COUNTRIES } from "@/lib/stathub/countries";

export function Footer() {
  const { navigate } = useStatHub();
  const { datasets: DATASETS } = useDatasets();

  return (
    <footer className="sh-footer">
      <div className="max-w-[1120px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="sh-nav-logo mb-3" onClick={() => navigate({ name: "home" })}>StatHub</div>
            <p className="text-sm text-[var(--sh-ink-soft)] leading-relaxed">
              A premium statistics library for evidence-driven decisions. Curated datasets, editorial insights, and interactive visualizations.
            </p>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--sh-ink-soft)] mb-3">Topics</div>
            <div className="flex flex-col gap-2">
              {TOPICS.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  className="text-sm text-[var(--sh-ink)] hover:text-[var(--sh-brand)] text-left transition-colors"
                  onClick={() => navigate({ name: "topic", id: t.id })}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--sh-ink-soft)] mb-3">Countries</div>
            <div className="flex flex-col gap-2">
              {COUNTRIES.slice(0, 6).map((c) => (
                <button
                  key={c.id}
                  className="text-sm text-[var(--sh-ink)] hover:text-[var(--sh-brand)] text-left transition-colors"
                  onClick={() => navigate({ name: "country", id: c.id })}
                >
                  {c.flag} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--sh-ink-soft)] mb-3">Explore</div>
            <div className="flex flex-col gap-2">
              <button className="text-sm text-[var(--sh-ink)] hover:text-[var(--sh-brand)] text-left transition-colors" onClick={() => navigate({ name: "board" })}>
                My Board
              </button>
              <button className="text-sm text-[var(--sh-ink)] hover:text-[var(--sh-brand)] text-left transition-colors" onClick={() => navigate({ name: "compare" })}>
                Compare Datasets
              </button>
              <button className="text-sm text-[var(--sh-ink)] hover:text-[var(--sh-brand)] text-left transition-colors" onClick={() => navigate({ name: "admin" })}>
                ⚙ Add Data (Admin)
              </button>
              <div className="text-sm text-[var(--sh-ink-soft)]">{DATASETS.length} datasets · {TOPICS.length} topics · {COUNTRIES.length} countries</div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--sh-line)] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-[var(--sh-ink-soft)]">
            © {new Date().getFullYear()} StatHub. Editorial statistics for the curious mind.
          </div>
          <div className="text-xs text-[var(--sh-ink-soft)]">
            Data sources: World Bank · IMF · OECD · WHO · UN · FRED
          </div>
        </div>
      </div>
    </footer>
  );
}
