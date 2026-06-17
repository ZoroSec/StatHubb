"use client";

import type { JupyterNotebook, NotebookCell } from "@/lib/stathub/notebook";
import { renderMarkdown } from "@/lib/stathub/notebook";
import { useState } from "react";
import { ChevronDown, ChevronUp, FileCode2, Trash2 } from "lucide-react";

interface NotebookViewerProps {
  notebook: JupyterNotebook;
  onDelete?: () => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function NotebookViewer({ notebook, onDelete, collapsible = true, defaultOpen = false }: NotebookViewerProps) {
  const [open, setOpen] = useState(!collapsible || defaultOpen);
  const [cellFilter, setCellFilter] = useState<"all" | "code" | "markdown">("all");

  const cells = notebook.cells.filter((c) => {
    if (cellFilter === "all") return true;
    return c.cellType === cellFilter;
  });

  const codeCells = notebook.cells.filter((c) => c.cellType === "code").length;
  const mdCells = notebook.cells.filter((c) => c.cellType === "markdown").length;

  return (
    <div className="sh-card overflow-hidden">
      {/* Header */}
      <button
        className="w-full p-5 flex items-center justify-between text-left"
        onClick={() => collapsible && setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--sh-brand)" + "18" }}>
            <FileCode2 size={18} className="text-[var(--sh-brand)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sh-ink)] flex items-center gap-2">
              Data Process · Jupyter Notebook
            </h2>
            <p className="text-xs text-[var(--sh-ink-soft)] mt-0.5">
              {notebook.cells.length} cells · {codeCells} code · {mdCells} markdown · {notebook.language}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              className="sh-btn !py-1.5 !px-3 !text-xs"
              style={{ borderColor: "#ef4444", color: "#ef4444" }}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this notebook?")) onDelete();
              }}
            >
              <Trash2 size={12} /> Remove
            </button>
          )}
          {collapsible && (
            <div className="text-[var(--sh-ink-soft)]">
              {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          )}
        </div>
      </button>

      {open && (
        <div className="sh-fade-in">
          {/* Filter bar */}
          <div className="px-5 pb-3 flex items-center gap-2 border-b border-[var(--sh-line)]">
            <span className="text-xs text-[var(--sh-ink-soft)] font-semibold mr-2">Show:</span>
            {(["all", "code", "markdown"] as const).map((f) => (
              <button
                key={f}
                className={`sh-chart-tab !py-1 !px-3 !text-xs ${cellFilter === f ? "active" : ""}`}
                onClick={() => setCellFilter(f)}
              >
                {f === "all" ? "All cells" : f === "code" ? "Code only" : "Text only"}
              </button>
            ))}
          </div>

          {/* Cells */}
          <div className="p-5 max-h-[700px] overflow-y-auto space-y-3">
            {cells.map((cell, i) => (
              <CellRenderer key={i} cell={cell} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CellRenderer({ cell, index }: { cell: NotebookCell; index: number }) {
  if (cell.cellType === "markdown") {
    return (
      <div
        className="sh-nb-markdown"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(cell.source) }}
      />
    );
  }

  if (cell.cellType === "code") {
    return (
      <div className="sh-nb-cell-code">
        <div className="sh-nb-cell-header">
          <span className="sh-nb-cell-badge">In [{cell.executionCount ?? " "}]</span>
          <span className="sh-nb-cell-lang">{cell.cellType}</span>
        </div>
        <pre className="sh-nb-pre">
          <code>{cell.source}</code>
        </pre>
        {cell.outputs.map((out, i) => (
          <OutputRenderer key={i} output={out} />
        ))}
      </div>
    );
  }

  // raw
  return (
    <pre className="sh-nb-pre sh-nb-raw">
      <code>{cell.source}</code>
    </pre>
  );
}

function OutputRenderer({ output }: { output: NonNullable<ReturnType<typeof Object>> }) {
  const o = output as import("@/lib/stathub/notebook").NotebookOutput;

  if (o.type === "stream") {
    return (
      <div className="sh-nb-output sh-nb-output-stream">
        <div className="sh-nb-cell-header">
          <span className="sh-nb-cell-badge sh-nb-badge-out">Output</span>
        </div>
        <pre className="sh-nb-pre sh-nb-pre-output">{o.text}</pre>
      </div>
    );
  }

  if (o.type === "error") {
    return (
      <div className="sh-nb-output sh-nb-output-error">
        <div className="sh-nb-cell-header">
          <span className="sh-nb-cell-badge" style={{ background: "#ef444418", color: "#ef4444" }}>Error</span>
        </div>
        <pre className="sh-nb-pre sh-nb-pre-error">
          <span style={{ color: "#f87171" }}>{o.errorName}: {o.errorValue}</span>
          {o.traceback && o.traceback.length > 0 && (
            "\n\n" + o.traceback.join("\n").replace(/\x1b\[[0-9;]*m/g, "")
          )}
        </pre>
      </div>
    );
  }

  if (o.type === "display_data" || o.type === "execute_result") {
    // Image output
    if (o.imageBase64) {
      return (
        <div className="sh-nb-output sh-nb-output-image">
          <div className="sh-nb-cell-header">
            <span className="sh-nb-cell-badge sh-nb-badge-out">Figure</span>
          </div>
          <div className="sh-nb-image-wrap">
            <img
              src={`data:${o.imageMime};base64,${o.imageBase64}`}
              alt="Notebook output figure"
              className="sh-nb-img"
            />
          </div>
          {o.text && (
            <details className="sh-nb-text-fallback">
              <summary className="text-xs text-[var(--sh-ink-soft)] cursor-pointer">Text representation</summary>
              <pre className="sh-nb-pre sh-nb-pre-output">{o.text}</pre>
            </details>
          )}
        </div>
      );
    }

    // HTML output
    if (o.html) {
      return (
        <div className="sh-nb-output sh-nb-output-html">
          <div className="sh-nb-cell-header">
            <span className="sh-nb-cell-badge sh-nb-badge-out">HTML Output</span>
          </div>
          <div className="sh-nb-html-output" dangerouslySetInnerHTML={{ __html: o.html }} />
        </div>
      );
    }

    // Text output
    return (
      <div className="sh-nb-output sh-nb-output-text">
        <div className="sh-nb-cell-header">
          <span className="sh-nb-cell-badge sh-nb-badge-out">Result</span>
        </div>
        <pre className="sh-nb-pre sh-nb-pre-output">{o.text}</pre>
      </div>
    );
  }

  return null;
}
