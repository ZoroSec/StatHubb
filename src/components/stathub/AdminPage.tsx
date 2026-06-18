"use client";

import { useStatHub } from "@/lib/stathub/store";
import { useDatasets } from "@/lib/stathub/useDatasets";
import { useAdminAuth } from "@/lib/stathub/useAdminAuth";
import { useNotebooks, parseNotebook } from "@/lib/stathub/notebook";
import { TOPICS } from "@/lib/stathub/topics";
import { COUNTRIES } from "@/lib/stathub/countries";
import { ChartCanvas } from "./ChartCanvas";
import { PublishPanel } from "./PublishPanel";
import { validateDataset } from "@/lib/stathub/validateDataset";
import type { Dataset, ChartType, EventAnnotation } from "@/lib/stathub/types";
import {
  ArrowLeft, Plus, Edit3, Trash2, Save, X, Database, Eye, EyeOff,
  ChevronDown, ChevronUp, Sparkles, Lock, LogOut, Upload, FileCode2, Github,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

const ACCENTS = ["#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#f97316", "#84cc16", "#f43f5e", "#a78bfa"];
const CHART_TYPES: { type: ChartType; label: string }[] = [
  { type: "line", label: "Line" },
  { type: "area", label: "Area" },
  { type: "bar", label: "Bar" },
  { type: "stacked-bar", label: "Stacked Bar" },
  { type: "scatter", label: "Scatter" },
  { type: "radar", label: "Radar" },
  { type: "choropleth", label: "Heatmap" },
];

interface FormData {
  title: string;
  subtitle: string;
  unit: string;
  source: string;
  category: string;
  chartType: ChartType;
  accent: string;
  country: string;
  region: string;
  tags: string;
  notebookUrl: string;
  lastUpdated: string;
  report: string;
  whyItMatters: string;
  insights: string;
  keyStatsLabel1: string; keyStatsValue1: string; keyStatsYear1: string;
  keyStatsLabel2: string; keyStatsValue2: string; keyStatsYear2: string;
  keyStatsLabel3: string; keyStatsValue3: string; keyStatsYear3: string;
  dataPoints: string;
  annotations: string;
  methodologySource: string;
  methodologyCollection: string;
  methodologyCoverage: string;
  methodologyCaveats: string;
  featured: boolean;
  editorsPick: boolean;
}

const EMPTY_FORM: FormData = {
  title: "", subtitle: "", unit: "", source: "",
  category: "economy", chartType: "bar", accent: "#6366f1",
  country: "", region: "", tags: "", notebookUrl: "", lastUpdated: new Date().toISOString().slice(0, 10),
  report: "", whyItMatters: "", insights: "",
  keyStatsLabel1: "", keyStatsValue1: "", keyStatsYear1: "",
  keyStatsLabel2: "", keyStatsValue2: "", keyStatsYear2: "",
  keyStatsLabel3: "", keyStatsValue3: "", keyStatsYear3: "",
  dataPoints: "", annotations: "",
  methodologySource: "", methodologyCollection: "", methodologyCoverage: "", methodologyCaveats: "",
  featured: false, editorsPick: false,
};

export function AdminPage() {
  const { navigate } = useStatHub();
  const { authed, login, logout } = useAdminAuth();

  if (!authed) {
    return (
      <PasswordGate
        onLogin={login}
        onBack={() => navigate({ name: "home" })}
      />
    );
  }

  return <AdminContent onLogout={logout} />;
}

// ── Password Gate ────────────────────────────────────────────────────────────

function PasswordGate({
  onLogin, onBack,
}: {
  onLogin: (password: string) => Promise<boolean>;
  onBack: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const ok = await onLogin(password);
    setBusy(false);
    if (!ok) {
      setError("Incorrect password.");
      setPassword("");
    }
  }

  return (
    <div className="sh-pw-gate">
      <div className="sh-pw-box">
        <div className="sh-pw-icon">
          <Lock size={28} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--sh-ink)] mb-2" style={{ letterSpacing: "-0.5px" }}>
          Admin Access
        </h1>
        <p className="text-sm text-[var(--sh-ink-soft)] mb-5">
          Enter the owner password to manage datasets.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            className="sh-input text-center"
            placeholder="Owner password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            autoFocus
          />
          {error && <p className="text-xs text-[#ef4444]">{error}</p>}
          <button
            type="submit"
            className="sh-btn sh-btn-primary w-full justify-center"
            disabled={busy || !password}
          >
            <Lock size={14} /> {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
        <button
          className="sh-btn w-full justify-center mt-3"
          onClick={onBack}
        >
          <ArrowLeft size={14} /> Back to site
        </button>
      </div>
    </div>
  );
}

// ── Admin Content (authenticated) ────────────────────────────────────────────

function AdminContent({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const { navigate } = useStatHub();
  const { datasets, addDataset, deleteDataset, isCustom, getCustomDatasets, syncStatus } = useDatasets();
  const { notebooks, saveNotebook, deleteNotebook } = useNotebooks();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showPublish, setShowPublish] = useState(false);

  const customCount = datasets.filter((d) => isCustom(d.id)).length;

  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Import one or more full datasets from a JSON file.
  // Accepts either a single Dataset object or an array of them.
  // Each is validated against the Dataset shape before being added.
  function handleImportJSON(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result || ""));
      } catch {
        toast.error("Couldn't parse that file — is it valid JSON?");
        return;
      }
      const items = Array.isArray(parsed) ? parsed : [parsed];
      let imported = 0;
      const failures: string[] = [];
      for (const item of items) {
        const ds = item as Partial<Dataset>;
        // Backfill fields the editor expects but a hand-authored file might omit.
        const candidate: Partial<Dataset> = {
          views: 0,
          published: true,
          keyStats: [],
          insights: [],
          report: "",
          ...ds,
          id: ds.id || (ds.title ? slugify(ds.title) : ""),
        };
        const errors = validateDataset(candidate);
        if (errors.length) {
          failures.push(`${candidate.title || candidate.id || "untitled"}: ${errors[0]}`);
          continue;
        }
        addDataset(candidate as Dataset);
        imported++;
      }
      if (imported > 0) {
        toast.success(`Imported ${imported} dataset${imported === 1 ? "" : "s"}`);
      }
      if (failures.length > 0) {
        toast.error(`${failures.length} skipped. First: ${failures[0]}`);
      }
    };
    reader.readAsText(file);
  }

  function startAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(ds: Dataset) {
    setForm({
      title: ds.title,
      subtitle: ds.subtitle,
      unit: ds.unit,
      source: ds.source,
      category: ds.category,
      chartType: ds.chartType,
      accent: ds.accent,
      country: ds.country || "",
      region: ds.region || "",
      tags: (ds.tags || []).join(", "),
      notebookUrl: ds.notebookUrl || "",
      lastUpdated: ds.lastUpdated || new Date().toISOString().slice(0, 10),
      report: ds.report || "",
      whyItMatters: ds.whyItMatters || "",
      insights: (ds.insights || []).join("\n"),
      keyStatsLabel1: ds.keyStats[0]?.label || "",
      keyStatsValue1: ds.keyStats[0]?.value || "",
      keyStatsYear1: ds.keyStats[0]?.year || "",
      keyStatsLabel2: ds.keyStats[1]?.label || "",
      keyStatsValue2: ds.keyStats[1]?.value || "",
      keyStatsYear2: ds.keyStats[1]?.year || "",
      keyStatsLabel3: ds.keyStats[2]?.label || "",
      keyStatsValue3: ds.keyStats[2]?.value || "",
      keyStatsYear3: ds.keyStats[2]?.year || "",
      dataPoints: ds.data.map((d) => `${d.label}, ${d.value}`).join("\n"),
      annotations: (ds.annotations || []).map((a) => `${a.year}, ${a.label}, ${a.type}`).join("\n"),
      methodologySource: ds.methodology?.source || "",
      methodologyCollection: ds.methodology?.collectionMethod || "",
      methodologyCoverage: ds.methodology?.coverage || "",
      methodologyCaveats: ds.methodology?.caveats || "",
      featured: ds.featured || false,
      editorsPick: ds.editorsPick || false,
    });
    setEditId(ds.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function parseDataPoints(text: string): { label: string; value: number }[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Accept comma, tab, semicolon, or run-of-spaces as the separator,
        // so pasting two columns straight from Excel/Google Sheets works.
        const parts = line.split(/\s*[,;\t]\s*|\s{2,}/).map((s) => s.trim());
        const rawValue = (parts[1] ?? "").replace(/[, ]/g, ""); // strip thousands separators
        return { label: parts[0], value: parseFloat(rawValue) || 0 };
      })
      .filter((d) => d.label);
  }

  function parseAnnotations(text: string): EventAnnotation[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",").map((s) => s.trim());
        return {
          year: parts[0] || "",
          label: parts[1] || "",
          type: (parts[2] as EventAnnotation["type"]) || "milestone",
        };
      })
      .filter((a) => a.year && a.label);
  }

  function buildDataset(): Dataset {
    const id = editId || slugify(form.title);
    const data = parseDataPoints(form.dataPoints);
    return {
      id,
      title: form.title,
      subtitle: form.subtitle,
      unit: form.unit,
      source: form.source,
      category: form.category,
      chartType: form.chartType,
      accent: form.accent,
      data,
      keyStats: [
        form.keyStatsLabel1 ? { label: form.keyStatsLabel1, value: form.keyStatsValue1, year: form.keyStatsYear1 } : null,
        form.keyStatsLabel2 ? { label: form.keyStatsLabel2, value: form.keyStatsValue2, year: form.keyStatsYear2 } : null,
        form.keyStatsLabel3 ? { label: form.keyStatsLabel3, value: form.keyStatsValue3, year: form.keyStatsYear3 } : null,
      ].filter(Boolean) as { label: string; value: string; year?: string }[],
      report: form.report,
      insights: form.insights.split("\n").map((s) => s.trim()).filter(Boolean),
      whyItMatters: form.whyItMatters || undefined,
      methodology: form.methodologySource || form.methodologyCollection || form.methodologyCoverage || form.methodologyCaveats
        ? {
            source: form.methodologySource || undefined,
            collectionMethod: form.methodologyCollection || undefined,
            coverage: form.methodologyCoverage || undefined,
            caveats: form.methodologyCaveats || undefined,
          }
        : undefined,
      annotations: parseAnnotations(form.annotations),
      country: form.country || undefined,
      region: form.region || undefined,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      notebookUrl: form.notebookUrl.trim() || undefined,
      views: 0,
      featured: form.featured,
      editorsPick: form.editorsPick,
      lastUpdated: form.lastUpdated,
      published: true,
    };
  }

  function handleSave() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (parseDataPoints(form.dataPoints).length === 0) {
      toast.error("At least one data point is required");
      return;
    }
    const ds = buildDataset();
    addDataset(ds);
    toast.success(editId ? "Dataset updated!" : "Dataset added!");
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  function handleDelete(id: string, title: string) {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteDataset(id);
      toast.success("Dataset deleted");
    }
  }

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Live preview dataset
  const previewDs: Dataset | null = form.title && parseDataPoints(form.dataPoints).length > 0 ? buildDataset() : null;

  const set = (field: keyof FormData, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="max-w-[1120px] mx-auto px-5 sm:px-6 py-8 sh-fade-up">
      <div
        className="mb-6 p-3 rounded-md text-[12px] leading-relaxed text-[var(--sh-ink-soft)] flex items-start gap-2"
        style={{ background: "var(--sh-surface-2, rgba(245,158,11,0.10))", border: "1px solid rgba(245,158,11,0.30)" }}
      >
        <Database size={14} style={{ marginTop: 2, flexShrink: 0 }} />
        <span>
          <strong>Changes are saved to this browser only.</strong> Datasets you
          add or edit here live in this device&rsquo;s local storage — they are
          not published and won&rsquo;t appear for other visitors. To ship data
          to the live site, edit{" "}
          <code className="sh-chip !py-0.5 !px-1.5">src/lib/stathub/datasets.ts</code>{" "}
          and redeploy. Export your local edits as JSON below to hand off.
        </span>
      </div>
      <button
        className="flex items-center gap-1.5 text-sm text-[var(--sh-ink-soft)] hover:text-[var(--sh-brand)] transition-colors mb-6 font-medium"
        onClick={() => navigate({ name: "home" })}
      >
        <ArrowLeft size={16} /> Back to site
      </button>

      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="sh-eyebrow mb-1.5 flex items-center gap-1.5">
            <Database size={12} /> Data Management · Local browser only
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--sh-ink)] mb-2" style={{ letterSpacing: "-1px" }}>
            Local Editor
          </h1>
          <p className="text-sm text-[var(--sh-ink-soft)]">
            {datasets.length} total datasets · {customCount} custom · {datasets.length - customCount} built-in · {Object.keys(notebooks).length} notebooks
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!showForm && (
            <button className="sh-btn sh-btn-primary" onClick={startAdd}>
              <Plus size={16} /> Add Dataset
            </button>
          )}
          {!showForm && (
            <>
              <button className="sh-btn" onClick={() => jsonInputRef.current?.click()}>
                <Upload size={14} /> Import JSON
              </button>
              <input
                ref={jsonInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportJSON(file);
                  e.target.value = ""; // allow re-importing the same file
                }}
              />
            </>
          )}
          <button className="sh-btn" onClick={() => setShowPublish(!showPublish)}>
            <Github size={14} /> Publish to GitHub
          </button>
          <button className="sh-btn" onClick={onLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Publish to GitHub */}
      {showPublish && (
        <PublishPanel
          getCustomDatasets={getCustomDatasets}
          onClose={() => setShowPublish(false)}
        />
      )}

      {/* Form */}
      {showForm && (
        <div className="sh-card p-6 sm:p-8 mb-8 sh-fade-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--sh-ink)]">
              {editId ? "Edit Dataset" : "Add New Dataset"}
            </h2>
            <button
              className="sh-btn"
              onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
            >
              <X size={14} /> Cancel
            </button>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            {/* Form fields */}
            <div className="space-y-5">
              {/* Basic info */}
              <FormSection title="Basic Information">
                <Field label="Title *">
                  <input className="sh-input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. India GDP Growth Rate" />
                </Field>
                <Field label="Subtitle">
                  <input className="sh-input" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="e.g. Annual % change — 2015 to 2024" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Unit">
                    <input className="sh-input" value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="%, $B, M" />
                  </Field>
                  <Field label="Source">
                    <input className="sh-input" value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="World Bank, 2024" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Topic">
                    <select className="sh-input" value={form.category} onChange={(e) => set("category", e.target.value)}>
                      {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Last Updated">
                    <input type="date" className="sh-input" value={form.lastUpdated} onChange={(e) => set("lastUpdated", e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Country (optional)">
                    <select className="sh-input" value={form.country} onChange={(e) => set("country", e.target.value)}>
                      <option value="">— Global / None —</option>
                      {COUNTRIES.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Region (optional)">
                    <input className="sh-input" value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="e.g. South Asia" />
                  </Field>
                </div>
                <Field label="Tags (comma-separated)">
                  <input className="sh-input" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="gdp, india, growth" />
                </Field>
                <Field
                  label="Notebook URL (optional)"
                  hint="Link to a Jupyter notebook on GitHub, Colab, or nbviewer for deeper exploration."
                >
                  <input
                    className="sh-input"
                    value={form.notebookUrl}
                    onChange={(e) => set("notebookUrl", e.target.value)}
                    placeholder="https://github.com/you/repo/blob/main/analysis.ipynb"
                  />
                </Field>
              </FormSection>

              {/* Chart config */}
              <FormSection title="Chart Configuration">
                <Field label="Chart Type">
                  <div className="flex flex-wrap gap-2">
                    {CHART_TYPES.map((ct) => (
                      <button
                        key={ct.type}
                        type="button"
                        className={`sh-chart-tab ${form.chartType === ct.type ? "active" : ""}`}
                        onClick={() => set("chartType", ct.type)}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Accent Color">
                  <div className="flex flex-wrap gap-2">
                    {ACCENTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ background: c, borderColor: form.accent === c ? "#fff" : "transparent", boxShadow: form.accent === c ? `0 0 0 2px ${c}` : "none" }}
                        onClick={() => set("accent", c)}
                        aria-label={`Select color ${c}`}
                      />
                    ))}
                  </div>
                </Field>
              </FormSection>

              {/* Data points */}
              <FormSection title="Data Points *">
                <Field
                  label="Data (one per line: label, value)"
                  hint="Paste two columns straight from Excel/Sheets, or upload a CSV. Comma, tab, or semicolon all work."
                >
                  <textarea
                    className="sh-input font-mono text-xs"
                    rows={8}
                    value={form.dataPoints}
                    onChange={(e) => set("dataPoints", e.target.value)}
                    onPaste={(e) => {
                      // Normalize spreadsheet paste (tabs → comma) so it lands clean.
                      const text = e.clipboardData.getData("text");
                      if (text && /\t/.test(text)) {
                        e.preventDefault();
                        const normalized = text
                          .split(/\r?\n/)
                          .map((l) => l.split("\t").map((c) => c.trim()).join(", "))
                          .join("\n");
                        set("dataPoints", normalized.trim());
                      }
                    }}
                    placeholder={"2020, -3.1\n2021, 6.0\n2022, 3.5\n2023, 3.1\n2024, 3.2"}
                  />
                  <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                    <label className="sh-btn !py-1.5 !px-3 !text-xs cursor-pointer">
                      <Upload size={12} /> Import CSV
                      <input
                        type="file"
                        accept=".csv,text/csv,text/plain"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const raw = String(reader.result || "");
                            // Drop a header row if the second column isn't numeric.
                            const lines = raw.split(/\r?\n/).filter((l) => l.trim());
                            if (lines.length) {
                              const first = lines[0].split(/[,;\t]/);
                              if (first[1] && isNaN(parseFloat(first[1]))) lines.shift();
                            }
                            const normalized = lines
                              .map((l) => l.split(/[,;\t]/).map((c) => c.trim()).slice(0, 2).join(", "))
                              .join("\n");
                            set("dataPoints", normalized);
                            toast.success(`Imported ${parseDataPoints(normalized).length} rows`);
                          };
                          reader.readAsText(file);
                          e.target.value = ""; // allow re-importing the same file
                        }}
                      />
                    </label>
                    <span className="text-[11px] text-[var(--sh-ink-soft)]">
                      {parseDataPoints(form.dataPoints).length} valid row(s) parsed
                    </span>
                  </div>
                </Field>
              </FormSection>

              {/* Key stats */}
              <FormSection title="Key Stats (up to 3)">
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="grid grid-cols-[2fr_1fr_1fr] gap-2">
                      <input className="sh-input !text-sm" value={(form as any)[`keyStatsLabel${n}`]} onChange={(e) => set(`keyStatsLabel${n}` as keyof FormData, e.target.value)} placeholder={`Stat ${n} label`} />
                      <input className="sh-input !text-sm" value={(form as any)[`keyStatsValue${n}`]} onChange={(e) => set(`keyStatsValue${n}` as keyof FormData, e.target.value)} placeholder="Value" />
                      <input className="sh-input !text-sm" value={(form as any)[`keyStatsYear${n}`]} onChange={(e) => set(`keyStatsYear${n}` as keyof FormData, e.target.value)} placeholder="Year" />
                    </div>
                  ))}
                </div>
              </FormSection>

              {/* Editorial */}
              <FormSection title="Editorial Content">
                <Field label="Report / Analysis">
                  <textarea className="sh-input" rows={4} value={form.report} onChange={(e) => set("report", e.target.value)} placeholder="Write your analysis paragraph..." />
                </Field>
                <Field label="Insights (one per line)">
                  <textarea className="sh-input" rows={4} value={form.insights} onChange={(e) => set("insights", e.target.value)} placeholder={"First key insight\nSecond key insight"} />
                </Field>
                <Field label="Why This Matters">
                  <textarea className="sh-input" rows={3} value={form.whyItMatters} onChange={(e) => set("whyItMatters", e.target.value)} placeholder="Explain the significance of this data..." />
                </Field>
              </FormSection>

              {/* Annotations */}
              <FormSection title="Event Annotations (optional)">
                <Field
                  label="Annotations (one per line: year, label, type)"
                  hint="Types: crisis, policy, milestone, reform, outbreak"
                >
                  <textarea
                    className="sh-input font-mono text-xs"
                    rows={3}
                    value={form.annotations}
                    onChange={(e) => set("annotations", e.target.value)}
                    placeholder={"2020, COVID-19 Pandemic, outbreak\n2021, Stimulus Rebound, policy"}
                  />
                </Field>
              </FormSection>

              {/* Methodology */}
              <FormSection title="Methodology (optional)">
                <Field label="Source (detailed)">
                  <input className="sh-input" value={form.methodologySource} onChange={(e) => set("methodologySource", e.target.value)} placeholder="e.g. World Bank World Development Indicators" />
                </Field>
                <Field label="Collection Method">
                  <input className="sh-input" value={form.methodologyCollection} onChange={(e) => set("methodologyCollection", e.target.value)} placeholder="e.g. National accounts aggregation" />
                </Field>
                <Field label="Coverage">
                  <input className="sh-input" value={form.methodologyCoverage} onChange={(e) => set("methodologyCoverage", e.target.value)} placeholder="e.g. 2015–2024, global" />
                </Field>
                <Field label="Caveats">
                  <input className="sh-input" value={form.methodologyCaveats} onChange={(e) => set("methodologyCaveats", e.target.value)} placeholder="e.g. Figures are preliminary" />
                </Field>
              </FormSection>

              {/* Flags */}
              <FormSection title="Display Options">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 accent-[var(--sh-brand)]" />
                    <span className="text-sm text-[var(--sh-ink)]">Featured (rotates on homepage hero)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.editorsPick} onChange={(e) => set("editorsPick", e.target.checked)} className="w-4 h-4 accent-[var(--sh-brand)]" />
                    <span className="text-sm text-[var(--sh-ink)]">Editor's Pick</span>
                  </label>
                </div>
              </FormSection>
            </div>

            {/* Live preview */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="text-xs uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-3 flex items-center gap-1.5">
                <Eye size={12} /> Live Preview
              </div>
              {previewDs ? (
                <div className="sh-card p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: form.accent }}>
                    {TOPICS.find((t) => t.id === form.category)?.icon} {TOPICS.find((t) => t.id === form.category)?.label}
                  </div>
                  <h3 className="text-base font-bold text-[var(--sh-ink)] mb-1">{form.title || "Dataset title"}</h3>
                  <p className="text-xs text-[var(--sh-ink-soft)] mb-3 line-clamp-2">{form.subtitle}</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold sh-accent-text" style={{ color: form.accent }}>
                      {previewDs.data[previewDs.data.length - 1]?.value.toLocaleString()}{form.unit}
                    </span>
                  </div>
                  <div
                    className="rounded-xl p-2 border mb-3"
                    style={{ background: `linear-gradient(180deg, ${form.accent}06, transparent)`, borderColor: "var(--sh-line)", height: 140 }}
                  >
                    <ChartCanvas dataset={previewDs} height={140} interactive={false} showAnnotations={false} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="sh-chip">{previewDs.data.length} pts</span>
                    <span className="sh-chip">{form.chartType}</span>
                    {form.featured && <span className="sh-chip" style={{ background: "#f59e0b18", color: "#f59e0b" }}>★ Featured</span>}
                  </div>
                </div>
              ) : (
                <div className="sh-card p-8 text-center">
                  <p className="text-sm text-[var(--sh-ink-soft)]">
                    Enter a title and data points to see a live preview.
                  </p>
                </div>
              )}

              <button className="sh-btn sh-btn-primary w-full mt-4 justify-center" onClick={handleSave}>
                <Save size={16} /> {editId ? "Update Dataset" : "Save Dataset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset list */}
      <div className="sh-card overflow-hidden">
        <div className="p-5 border-b border-[var(--sh-line)] flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--sh-ink-soft)]">All Datasets</h2>
          <span className="text-xs text-[var(--sh-ink-soft)]">{datasets.length} total</span>
        </div>
        <div className="divide-y divide-[var(--sh-line)] max-h-[600px] overflow-y-auto">
          {datasets.map((ds) => {
            const topic = TOPICS.find((t) => t.id === ds.category);
            const custom = isCustom(ds.id);
            const expanded = expandedRows.has(ds.id);
            return (
              <div key={ds.id} className="p-4 hover:bg-[var(--sh-surface-alt)] transition-colors">
                <div className="flex items-center gap-3">
                  <button
                    className="p-1 rounded hover:bg-[var(--sh-surface)] transition-colors flex-shrink-0"
                    onClick={() => toggleRow(ds.id)}
                    aria-label="Expand"
                  >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--sh-ink)] truncate">{ds.title}</span>
                      {custom ? (
                        <span className="sh-chip !py-0.5 !px-2 !text-[10px]" style={{ background: "#10b98118", color: "#10b981" }}>Custom</span>
                      ) : (
                        <span className="sh-chip !py-0.5 !px-2 !text-[10px]" style={{ background: "#64748b18", color: "#64748b" }}>Built-in</span>
                      )}
                      {custom && (() => {
                        const st = syncStatus(ds.id);
                        const cfg = st === "synced"
                          ? { label: "Published", bg: "#10b98118", fg: "#10b981" }
                          : st === "modified"
                          ? { label: "Modified", bg: "#f59e0b18", fg: "#f59e0b" }
                          : { label: "Not published", bg: "#64748b18", fg: "#94a3b8" };
                        return (
                          <span
                            className="sh-chip !py-0.5 !px-2 !text-[10px]"
                            style={{ background: cfg.bg, color: cfg.fg }}
                            title={
                              st === "synced" ? "Matches the version published to GitHub"
                              : st === "modified" ? "Changed locally since last publish — publish to update the live site"
                              : "Exists only in this browser — not yet published"
                            }
                          >
                            {cfg.label}
                          </span>
                        );
                      })()}
                      {ds.featured && <span className="sh-chip !py-0.5 !px-2 !text-[10px]" style={{ background: "#f59e0b18", color: "#f59e0b" }}>★</span>}
                    </div>
                    <div className="text-xs text-[var(--sh-ink-soft)] mt-0.5">
                      {topic?.icon} {topic?.label} · {ds.data.length} pts · {ds.source}
                    </div>
                  </div>
                  <button
                    className="sh-btn !py-1.5 !px-3 !text-xs"
                    onClick={() => navigate({ name: "dataset", id: ds.id })}
                  >
                    <Eye size={12} /> View
                  </button>
                  <button
                    className="sh-btn !py-1.5 !px-3 !text-xs"
                    onClick={() => startEdit(ds)}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  {custom && (
                    <button
                      className="sh-btn !py-1.5 !px-3 !text-xs"
                      style={{ borderColor: "#ef4444", color: "#ef4444" }}
                      onClick={() => handleDelete(ds.id, ds.title)}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
                {expanded && (
                  <div className="mt-3 pt-3 border-t border-[var(--sh-line)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-[var(--sh-ink-soft)] uppercase font-bold mb-1">Unit</div>
                      <div className="text-[var(--sh-ink)]">{ds.unit || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[var(--sh-ink-soft)] uppercase font-bold mb-1">Chart Type</div>
                      <div className="text-[var(--sh-ink)]">{ds.chartType}</div>
                    </div>
                    <div>
                      <div className="text-[var(--sh-ink-soft)] uppercase font-bold mb-1">Latest Value</div>
                      <div className="text-[var(--sh-ink)] sh-accent-text" style={{ color: ds.accent }}>
                        {ds.data[ds.data.length - 1]?.value}{ds.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-[var(--sh-ink-soft)] uppercase font-bold mb-1">Views</div>
                      <div className="text-[var(--sh-ink)]">{ds.views.toLocaleString()}</div>
                    </div>
                    {ds.tags && ds.tags.length > 0 && (
                      <div className="col-span-2 sm:col-span-4">
                        <div className="text-[var(--sh-ink-soft)] uppercase font-bold mb-1">Tags</div>
                        <div className="flex flex-wrap gap-1">
                          {ds.tags.map((t) => <span key={t} className="sh-chip !py-0.5 !px-2 !text-[10px]">#{t}</span>)}
                        </div>
                      </div>
                    )}
                    {/* Notebook upload */}
                    <div className="col-span-2 sm:col-span-4 pt-3 border-t border-[var(--sh-line)]">
                      <div className="text-[var(--sh-ink-soft)] uppercase font-bold mb-2 flex items-center gap-1.5">
                        <FileCode2 size={11} /> Jupyter Notebook (.ipynb)
                      </div>
                      <NotebookUploadRow
                        datasetId={ds.id}
                        hasNotebook={!!notebooks[ds.id]}
                        onSave={saveNotebook}
                        onDelete={deleteNotebook}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Help note */}
      <div className="sh-card p-5 mt-6" style={{ background: "var(--sh-surface-alt)" }}>
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="text-[var(--sh-brand)] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--sh-ink-soft)] leading-relaxed">
            <strong className="text-[var(--sh-ink)]">How data storage works:</strong> Custom datasets are saved to your browser's localStorage — they persist across sessions on this device. Built-in datasets (from <code className="text-xs bg-[var(--sh-surface)] px-1.5 py-0.5 rounded">datasets.ts</code>) can be edited in the form but not deleted. To share datasets across devices, export them as JSON from any dataset page and import on another device.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form helpers ─────────────────────────────────────────────────────────────

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider text-[var(--sh-ink-soft)] font-bold mb-3 pb-2 border-b border-[var(--sh-line)]">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--sh-ink)] mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[var(--sh-ink-soft)] mt-1">{hint}</p>}
    </div>
  );
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || Date.now().toString();
}

// ── Notebook Upload Row ──────────────────────────────────────────────────────

function NotebookUploadRow({
  datasetId,
  hasNotebook,
  onSave,
  onDelete,
}: {
  datasetId: string;
  hasNotebook: boolean;
  onSave: (id: string, nb: import("@/lib/stathub/notebook").JupyterNotebook) => void;
  onDelete: (id: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".ipynb")) {
      toast.error("Please upload a .ipynb file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const nb = parseNotebook(text);
      if (!nb) {
        toast.error("Invalid notebook format");
        return;
      }
      onSave(datasetId, nb);
      toast.success(`Notebook uploaded — ${nb.cells.length} cells parsed`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={fileRef}
        type="file"
        accept=".ipynb"
        onChange={handleFile}
        className="hidden"
      />
      {hasNotebook ? (
        <>
          <span className="sh-chip flex items-center gap-1" style={{ background: "#10b98118", color: "#10b981", borderColor: "#10b98140" }}>
            <FileCode2 size={11} /> Notebook attached
          </span>
          <button
            className="sh-btn !py-1 !px-2.5 !text-xs"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={11} /> Replace
          </button>
          <button
            className="sh-btn !py-1 !px-2.5 !text-xs"
            style={{ borderColor: "#ef4444", color: "#ef4444" }}
            onClick={() => {
              if (confirm("Remove this notebook?")) {
                onDelete(datasetId);
                toast.success("Notebook removed");
              }
            }}
          >
            <Trash2 size={11} /> Remove
          </button>
        </>
      ) : (
        <button
          className="sh-btn !py-1 !px-2.5 !text-xs"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={11} /> Upload .ipynb
        </button>
      )}
      <span className="text-[11px] text-[var(--sh-ink-soft)]">
        Shows the data extraction process on the dataset page
      </span>
    </div>
  );
}
