"use client";

import { useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotebookCell {
  cellType: "markdown" | "code" | "raw";
  source: string;
  outputs: NotebookOutput[];
  executionCount?: number;
}

export interface NotebookOutput {
  type: "stream" | "execute_result" | "display_data" | "error";
  text?: string;
  html?: string;
  imageBase64?: string;
  imageMime?: string;
  errorName?: string;
  errorValue?: string;
  traceback?: string[];
}

export interface JupyterNotebook {
  cells: NotebookCell[];
  language: string;
  title?: string;
  uploadedAt: number;
}

const NOTEBOOKS_KEY = "stathub-notebooks"; // Map<datasetId, JupyterNotebook>

// ── Parser ───────────────────────────────────────────────────────────────────

export function parseNotebook(json: string): JupyterNotebook | null {
  try {
    const nb = JSON.parse(json);
    if (!nb.cells || !Array.isArray(nb.cells)) return null;

    const cells: NotebookCell[] = nb.cells.map((cell: any) => {
      const cellType = cell.cell_type as "markdown" | "code" | "raw";
      const source = Array.isArray(cell.source)
        ? cell.source.join("")
        : String(cell.source || "");

      let outputs: NotebookOutput[] = [];
      if (cellType === "code" && Array.isArray(cell.outputs)) {
        outputs = cell.outputs.map(parseOutput).filter(Boolean) as NotebookOutput[];
      }

      return {
        cellType,
        source,
        outputs,
        executionCount: cell.execution_count,
      };
    });

    return {
      cells,
      language: nb.metadata?.kernelspec?.language || nb.metadata?.language_info?.name || "python",
      title: undefined,
      uploadedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

function parseOutput(out: any): NotebookOutput | null {
  if (!out || !out.output_type) return null;

  switch (out.output_type) {
    case "stream":
      return {
        type: "stream",
        text: Array.isArray(out.text) ? out.text.join("") : String(out.text || ""),
      };

    case "execute_result":
    case "display_data": {
      const data = out.data || {};
      // Image
      if (data["image/png"]) {
        return {
          type: "display_data",
          imageBase64: data["image/png"],
          imageMime: "image/png",
          text: data["text/plain"] ? (Array.isArray(data["text/plain"]) ? data["text/plain"].join("") : data["text/plain"]) : undefined,
        };
      }
      if (data["image/jpeg"]) {
        return {
          type: "display_data",
          imageBase64: data["image/jpeg"],
          imageMime: "image/jpeg",
          text: data["text/plain"] ? (Array.isArray(data["text/plain"]) ? data["text/plain"].join("") : data["text/plain"]) : undefined,
        };
      }
      // HTML
      if (data["text/html"]) {
        return {
          type: "display_data",
          html: Array.isArray(data["text/html"]) ? data["text/html"].join("") : data["text/html"],
        };
      }
      // Plain text
      if (data["text/plain"]) {
        return {
          type: "execute_result",
          text: Array.isArray(data["text/plain"]) ? data["text/plain"].join("") : data["text/plain"],
        };
      }
      return null;
    }

    case "error":
      return {
        type: "error",
        errorName: out.ename || "Error",
        errorValue: out.evalue || "",
        traceback: Array.isArray(out.traceback) ? out.traceback : [],
      };

    default:
      return null;
  }
}

// ── Storage ──────────────────────────────────────────────────────────────────

function loadAll(): Record<string, JupyterNotebook> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(NOTEBOOKS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveAll(notebooks: Record<string, JupyterNotebook>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NOTEBOOKS_KEY, JSON.stringify(notebooks));
}

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Record<string, JupyterNotebook>>(() => loadAll());
  const [, setTick] = useState(0);

  const refresh = useCallback(() => {
    setNotebooks(loadAll());
    setTick((t) => t + 1);
  }, []);

  const saveNotebook = useCallback((datasetId: string, nb: JupyterNotebook) => {
    const all = loadAll();
    all[datasetId] = nb;
    saveAll(all);
    refresh();
  }, [refresh]);

  const deleteNotebook = useCallback((datasetId: string) => {
    const all = loadAll();
    delete all[datasetId];
    saveAll(all);
    refresh();
  }, [refresh]);

  const getNotebook = useCallback((datasetId: string): JupyterNotebook | undefined => {
    return loadAll()[datasetId];
  }, []);

  return {
    notebooks,
    saveNotebook,
    deleteNotebook,
    getNotebook,
  };
}

// ── Markdown to HTML (minimal renderer) ─────────────────────────────────────

export function renderMarkdown(md: string): string {
  let html = md;

  // Code blocks (```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre class="sh-nb-codeblock"><code>${escapeHtml(code.trim())}</code></pre>`
  );

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3 class="sh-nb-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="sh-nb-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="sh-nb-h1">$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="sh-nb-inline-code">$1</code>');

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="sh-nb-link">$1</a>'
  );

  // Lists
  html = html.replace(/^(?:- |\* )(.+)$/gm, '<li class="sh-nb-li">$1</li>');
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/g, (match) => '<ul class="sh-nb-ul">' + match + "</ul>");

  // Paragraphs (split by double newline, skip if already wrapped)
  html = html
    .split(/\n\n+/)
    .map((block) => {
      if (block.startsWith("<")) return block;
      return `<p class="sh-nb-p">${block.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
