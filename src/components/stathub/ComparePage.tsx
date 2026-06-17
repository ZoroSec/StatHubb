"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { ChartCanvas } from "./ChartCanvas";
import { pearsonCorrelation, correlationLabel } from "@/lib/stathub/analytics";
import { ArrowLeft, GitCompare, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface ComparePageProps {
  a?: string;
  b?: string;
}

export function ComparePage({ a, b }: ComparePageProps) {
  const { navigate } = useStatHub();
  const { datasets: DATASETS, getDataset } = useDatasets();
  // Local state allows the dropdowns to update the URL; the URL is the source of truth.
  const [localA, setLocalA] = useState(a || "");
  const [localB, setLocalB] = useState(b || "");

  const selA = a ?? localA;
  const selB = b ?? localB;

  const dsA = selA ? getDataset(selA) : undefined;
  const dsB = selB ? getDataset(selB) : undefined;

  // Align data by label for comparison
  const { alignedA, alignedB, sharedLabels } = useMemo(() => {
    if (!dsA || !dsB) return { alignedA: [], alignedB: [], sharedLabels: [] };
    const mapA = new Map(dsA.data.map((d) => [String(d.label), d.value]));
    const mapB = new Map(dsB.data.map((d) => [String(d.label), d.value]));
    const labels = [...new Set([...mapA.keys(), ...mapB.keys()])].sort();
    return {
      alignedA: labels.map((l) => ({ label: l, value: mapA.get(l) ?? NaN })),
      alignedB: labels.map((l) => ({ label: l, value: mapB.get(l) ?? NaN })),
      sharedLabels: labels,
    };
  }, [dsA, dsB]);

  const correlation = useMemo(() => {
    if (alignedA.length < 3) return 0;
    const validIdx = alignedA
      .map((d, i) => (!isNaN(d.value) && !isNaN(alignedB[i].value) ? i : -1))
      .filter((i) => i >= 0);
    if (validIdx.length < 3) return 0;
    return pearsonCorrelation(
      validIdx.map((i) => alignedA[i].value),
      validIdx.map((i) => alignedB[i].value)
    );
  }, [alignedA, alignedB]);

  const corrInfo = correlationLabel(correlation);

  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8 sh-fade-up">
      <button
        className="flex items-center gap-1.5 text-sm text-[var(--sh-ink-soft)] hover:text-[var(--sh-brand)] transition-colors mb-6 font-medium"
        onClick={() => navigate({ name: "home" })}
      >
        <ArrowLeft size={16} /> Back to library
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <GitCompare size={18} className="text-[var(--sh-brand)]" />
          <span className="sh-eyebrow">Side by side</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--sh-ink)] mb-2" style={{ letterSpacing: "-1px" }}>
          Smart Dataset Comparison
        </h1>
        <p className="text-sm text-[var(--sh-ink-soft)] max-w-2xl">
          Compare two datasets on a shared timeline with independent Y-axes. See correlation, trends, and relative trajectories at a glance.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-center mb-6">
        <DatasetSelector
          value={selA}
          onChange={(v) => {
            setLocalA(v);
            navigate({ name: "compare", a: v, b: selB });
          }}
          exclude={selB}
          label="Dataset A"
        />
        <div className="text-center text-[var(--sh-ink-soft)] font-bold text-sm hidden sm:block">VS</div>
        <DatasetSelector
          value={selB}
          onChange={(v) => {
            setLocalB(v);
            navigate({ name: "compare", a: selA, b: v });
          }}
          exclude={selA}
          label="Dataset B"
        />
      </div>

      {dsA && dsB ? (
        <>
          {/* Correlation Score */}
          <div className="sh-card p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: corrInfo.color + "18", color: corrInfo.color }}
                >
                  {correlation >= 0 ? "+" : ""}{correlation.toFixed(2)}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold">Pearson Correlation</div>
                  <div className="text-base font-bold" style={{ color: corrInfo.color }}>{corrInfo.label}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="sh-chip">{sharedLabels.length} shared periods</span>
                <button
                  className="sh-btn"
                  onClick={() => {
                    setLocalA("");
                    setLocalB("");
                    navigate({ name: "compare" });
                  }}
                >
                  <X size={14} /> Clear
                </button>
              </div>
            </div>
          </div>

          {/* Split Chart View */}
          <div className="sh-card p-5 sm:p-6 mb-6">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-0.5">Left Y-axis</div>
                    <h3 className="text-sm font-bold text-[var(--sh-ink)]" style={{ color: dsA.accent }}>{dsA.title}</h3>
                  </div>
                  <span className="sh-chip" style={{ color: dsA.accent, borderColor: dsA.accent + "40" }}>{dsA.unit}</span>
                </div>
                <div
                  className="rounded-xl p-3 border min-h-[260px]"
                  style={{ background: `linear-gradient(180deg, ${dsA.accent}06, transparent)`, borderColor: "var(--sh-line)" }}
                >
                  <ChartCanvas dataset={dsA} height={260} interactive showAnnotations={false} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-0.5">Right Y-axis</div>
                    <h3 className="text-sm font-bold text-[var(--sh-ink)]" style={{ color: dsB.accent }}>{dsB.title}</h3>
                  </div>
                  <span className="sh-chip" style={{ color: dsB.accent, borderColor: dsB.accent + "40" }}>{dsB.unit}</span>
                </div>
                <div
                  className="rounded-xl p-3 border min-h-[260px]"
                  style={{ background: `linear-gradient(180deg, ${dsB.accent}06, transparent)`, borderColor: "var(--sh-line)" }}
                >
                  <ChartCanvas dataset={dsB} height={260} interactive showAnnotations={false} />
                </div>
              </div>
            </div>

            {/* Shared timeline note */}
            <div className="mt-4 pt-4 border-t border-[var(--sh-line)] text-xs text-[var(--sh-ink-soft)] flex items-center gap-2 flex-wrap">
              <span className="font-semibold">Shared X-axis:</span>
              <span>{sharedLabels[0]} → {sharedLabels[sharedLabels.length - 1]}</span>
              <span>·</span>
              <span>{sharedLabels.length} periods compared</span>
            </div>
          </div>

          {/* Data comparison table */}
          <div className="sh-card p-5 sm:p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--sh-ink-soft)] mb-4">Data Side by Side</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--sh-line)]">
                    <th className="text-left py-2 px-3 text-xs uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold">Period</th>
                    <th className="text-right py-2 px-3 text-xs uppercase tracking-wider font-bold" style={{ color: dsA.accent }}>
                      {dsA.title.slice(0, 25)}{dsA.title.length > 25 ? "…" : ""}
                    </th>
                    <th className="text-right py-2 px-3 text-xs uppercase tracking-wider font-bold" style={{ color: dsB.accent }}>
                      {dsB.title.slice(0, 25)}{dsB.title.length > 25 ? "…" : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sharedLabels.map((label, i) => (
                    <tr key={label} className="border-b border-[var(--sh-line)] last:border-0">
                      <td className="py-2 px-3 font-semibold text-[var(--sh-ink)]">{label}</td>
                      <td className="py-2 px-3 text-right font-mono" style={{ color: isNaN(alignedA[i].value) ? "var(--sh-ink-soft)" : dsA.accent }}>
                        {isNaN(alignedA[i].value) ? "—" : alignedA[i].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono" style={{ color: isNaN(alignedB[i].value) ? "var(--sh-ink-soft)" : dsB.accent }}>
                        {isNaN(alignedB[i].value) ? "—" : alignedB[i].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="sh-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--sh-surface-alt)" }}>
            <GitCompare size={28} className="text-[var(--sh-ink-soft)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--sh-ink)] mb-2">Select two datasets to compare</h3>
          <p className="text-sm text-[var(--sh-ink-soft)] mb-6 max-w-md mx-auto">
            Choose datasets above to see them side by side with correlation analysis, shared timeline, and independent Y-axes.
          </p>
          {(!selA || !selB) && (
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
              {DATASETS.slice(0, 6).map((ds) => (
                <button
                  key={ds.id}
                  className="sh-chip cursor-pointer hover:border-[var(--sh-brand)]"
                  onClick={() => {
                    if (!selA) {
                      setLocalA(ds.id);
                      navigate({ name: "compare", a: ds.id, b: selB });
                    } else if (!selB) {
                      setLocalB(ds.id);
                      navigate({ name: "compare", a: selA, b: ds.id });
                    }
                  }}
                >
                  {ds.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DatasetSelector({
  value,
  onChange,
  exclude,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  exclude?: string;
  label: string;
}) {
  return (
    <div className="sh-card p-4">
      <div className="text-[10px] uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-2">{label}</div>
      <select
        className="w-full bg-[var(--sh-surface)] border border-[var(--sh-line)] rounded-lg px-3 py-2.5 text-sm text-[var(--sh-ink)] outline-none focus:border-[var(--sh-brand)] cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Select a dataset —</option>
        {DATASETS.filter((d) => d.published && d.id !== exclude).map((d) => (
          <option key={d.id} value={d.id}>
            {d.title}
          </option>
        ))}
      </select>
    </div>
  );
}
