"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { DatasetCard } from "./DatasetCard";
import { ArrowLeft } from "lucide-react";

export function AllDatasetsPage() {
  const { navigate } = useStatHub();
  const { datasets: DATASETS } = useDatasets();
  const published = DATASETS.filter((d) => d.published);

  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8">
      <button
        className="flex items-center gap-1.5 text-sm text-[var(--sh-ink-soft)] hover:text-[var(--sh-brand)] transition-colors mb-6 font-medium"
        onClick={() => navigate({ name: "home" })}
      >
        <ArrowLeft size={16} /> Back to home
      </button>

      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <div className="sh-eyebrow mb-1.5">The Library</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--sh-ink)]" style={{ letterSpacing: "-1px" }}>
            All datasets
          </h1>
        </div>
        <span className="text-sm text-[var(--sh-ink-soft)]">{published.length} total</span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {published.map((ds, i) => (
          <DatasetCard key={ds.id} dataset={ds} index={i} />
        ))}
      </div>
    </div>
  );
}
