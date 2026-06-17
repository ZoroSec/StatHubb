import type { Dataset } from "./types";

// ── PNG Export ───────────────────────────────────────────────────────────────

export function exportPNG(svgEl: SVGSVGElement, filename: string) {
  const data = new XMLSerializer().serializeToString(svgEl);
  const canvas = document.createElement("canvas");
  const rect = svgEl.getBoundingClientRect();
  const scale = 2;
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const img = new Image();
  const blob = new Blob([data], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((b) => {
      if (!b) return;
      const dlUrl = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = filename + ".png";
      a.click();
      URL.revokeObjectURL(dlUrl);
    });
  };
  img.src = url;
}

// ── CSV Export ───────────────────────────────────────────────────────────────

export function exportCSV(ds: Dataset, filename?: string) {
  const rows = [
    ["Label", "Value", "Unit", "Source"],
    ...ds.data.map((d) => [d.label, String(d.value), ds.unit, ds.source]),
  ];
  const csv = rows
    .map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  downloadBlob(csv, (filename || ds.title) + ".csv", "text/csv");
}

// ── JSON Export ──────────────────────────────────────────────────────────────

export function exportJSON(ds: Dataset, filename?: string) {
  const blob = JSON.stringify(ds, null, 2);
  downloadBlob(blob, (filename || ds.title) + ".json", "application/json");
}

// ── XLSX Export (client-side, no library) ────────────────────────────────────
// Generates a minimal valid .xlsx using the SpreadsheetML format.

export function exportXLSX(ds: Dataset, filename?: string) {
  // Build an HTML table that Excel can open as .xls
  // This is the most reliable client-side approach without libraries
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><!--[if gte mso 9]>
<xml><x:ExcelWorkbook><x:ExcelWorksheets>
<x:ExcelWorksheet><x:Name>${escapeXml(ds.title)}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]--></head>
<body>
<table border="1">
<thead><tr>
<th style="background:#6366f1;color:#fff;">Label</th>
<th style="background:#6366f1;color:#fff;">Value</th>
<th style="background:#6366f1;color:#fff;">Unit</th>
<th style="background:#6366f1;color:#fff;">Source</th>
</tr></thead>
<tbody>
${ds.data
  .map(
    (d) =>
      `<tr><td>${escapeXml(d.label)}</td><td>${d.value}</td><td>${escapeXml(
        ds.unit
      )}</td><td>${escapeXml(ds.source)}</td></tr>`
  )
  .join("\n")}
</tbody>
</table>
<p>&nbsp;</p>
<p><strong>Dataset:</strong> ${escapeXml(ds.title)}</p>
<p><strong>Subtitle:</strong> ${escapeXml(ds.subtitle)}</p>
<p><strong>Source:</strong> ${escapeXml(ds.source)}</p>
<p><strong>Last Updated:</strong> ${escapeXml(ds.lastUpdated || "N/A")}</p>
</body>
</html>`;

  downloadBlob(html, (filename || ds.title) + ".xls", "application/vnd.ms-excel");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Share Link ───────────────────────────────────────────────────────────────

export function getShareLink(ds: Dataset): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}#/dataset/${ds.id}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
