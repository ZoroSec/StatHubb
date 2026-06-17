"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { DatasetCard } from "./DatasetCard";
import { ChartCanvas } from "./ChartCanvas";
import { Bookmark, Trash2, ArrowRight, BookmarkX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BoardPage() {
  const { bookmarks, removeBookmark, clearBookmarks, navigate } = useStatHub();
  const { getDataset } = useDatasets();
  const [confirmClear, setConfirmClear] = useState(false);

  const savedDatasets = bookmarks
    .map((b) => {
      const ds = getDataset(b.datasetId);
      return ds ? { ds, bookmark: b } : null;
    })
    .filter(Boolean) as { ds: ReturnType<typeof getDataset>; bookmark: typeof bookmarks[0] }[];

  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8 sh-fade-up">
      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="sh-eyebrow mb-1.5">Your collection</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--sh-ink)] mb-2" style={{ letterSpacing: "-1px" }}>
            My Board
          </h1>
          <p className="text-sm text-[var(--sh-ink-soft)]">
            {bookmarks.length === 0
              ? "Save datasets to build your personal statistics collection."
              : `${bookmarks.length} dataset${bookmarks.length !== 1 ? "s" : ""} saved. Stored locally in your browser.`}
          </p>
        </div>

        {bookmarks.length > 0 && (
          <div className="flex gap-2">
            {confirmClear ? (
              <>
                <button
                  className="sh-btn"
                  style={{ borderColor: "#ef4444", color: "#ef4444" }}
                  onClick={() => {
                    clearBookmarks();
                    setConfirmClear(false);
                    toast.success("Board cleared");
                  }}
                >
                  Confirm Clear
                </button>
                <button className="sh-btn" onClick={() => setConfirmClear(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <button className="sh-btn" onClick={() => setConfirmClear(true)}>
                <Trash2 size={14} /> Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div className="sh-card p-12 sm:p-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--sh-surface-alt)" }}>
            <Bookmark size={28} className="text-[var(--sh-ink-soft)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--sh-ink)] mb-2">No saved datasets yet</h3>
          <p className="text-sm text-[var(--sh-ink-soft)] mb-6 max-w-md mx-auto">
            Click the bookmark icon on any dataset to save it here. Your board persists across sessions — no account needed.
          </p>
          <button className="sh-btn sh-btn-primary mx-auto" onClick={() => navigate({ name: "home" })}>
            Browse Datasets <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedDatasets.map(({ ds, bookmark }) => {
            if (!ds) return null;
            return (
              <div key={ds.id} className="sh-card p-5">
                <div className="grid lg:grid-cols-[1fr_300px] gap-5">
                  {/* Info */}
                  <div className="flex flex-col">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3
                          className="text-lg font-bold text-[var(--sh-ink)] cursor-pointer hover:text-[var(--sh-brand)] transition-colors"
                          onClick={() => navigate({ name: "dataset", id: ds.id })}
                        >
                          {ds.title}
                        </h3>
                        <p className="text-xs text-[var(--sh-ink-soft)] mt-1">{ds.subtitle}</p>
                      </div>
                      <button
                        className="p-2 rounded-lg hover:bg-[var(--sh-surface-alt)] transition-colors flex-shrink-0"
                        onClick={() => {
                          removeBookmark(ds.id);
                          toast.success("Removed from board");
                        }}
                        aria-label="Remove from board"
                      >
                        <BookmarkX size={16} className="text-[var(--sh-ink-soft)]" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="sh-chip" style={{ color: ds.accent, borderColor: ds.accent + "40" }}>
                        {ds.source}
                      </span>
                      <span className="sh-chip">{ds.data.length} data points</span>
                      <span className="sh-chip">Saved {new Date(bookmark.savedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <button
                        className="sh-btn sh-btn-primary"
                        onClick={() => navigate({ name: "dataset", id: ds.id })}
                      >
                        Open Dataset <ArrowRight size={14} />
                      </button>
                      <button
                        className="sh-btn"
                        onClick={() => navigate({ name: "compare", a: ds.id })}
                      >
                        Compare
                      </button>
                    </div>
                  </div>

                  {/* Mini chart */}
                  <div
                    className="rounded-xl p-3 border min-h-[140px]"
                    style={{ background: `linear-gradient(180deg, ${ds.accent}06, transparent)`, borderColor: "var(--sh-line)" }}
                  >
                    <ChartCanvas dataset={ds} height={140} interactive={false} showAnnotations={false} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
