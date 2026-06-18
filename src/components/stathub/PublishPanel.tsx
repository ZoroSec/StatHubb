"use client";

import { useState } from "react";
import {
  Github, Loader2, CheckCircle2, AlertCircle, ExternalLink, ShieldAlert, X,
} from "lucide-react";
import { toast } from "sonner";
import type { Dataset } from "@/lib/stathub/types";
import {
  verifyToken, publishDatasets, DEFAULT_TARGET, type RepoTarget,
} from "@/lib/stathub/githubPublish";

/**
 * Publish UI for Option 2. The token is held in local component state only
 * (in memory) and is never persisted anywhere. Closing or refreshing clears it.
 */
export function PublishPanel({
  getCustomDatasets,
  onClose,
}: {
  getCustomDatasets: () => Dataset[];
  onClose: () => void;
}) {
  const [token, setToken] = useState("");
  const [target, setTarget] = useState<RepoTarget>(DEFAULT_TARGET);
  const [commitMsg, setCommitMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState<null | boolean>(null);
  const [status, setStatus] = useState("");
  const [commitUrl, setCommitUrl] = useState<string | undefined>();

  const count = getCustomDatasets().length;

  async function handleVerify() {
    setBusy(true);
    setStatus("");
    const res = await verifyToken(token, target);
    setVerified(res.ok);
    setStatus(res.message);
    setBusy(false);
  }

  async function handlePublish() {
    setBusy(true);
    setStatus("");
    setCommitUrl(undefined);
    const res = await publishDatasets(
      token,
      getCustomDatasets(),
      target,
      commitMsg.trim() || undefined
    );
    setStatus(res.message);
    setCommitUrl(res.commitUrl);
    if (res.ok) {
      toast.success("Published to GitHub");
    } else {
      toast.error("Publish failed");
    }
    setBusy(false);
  }

  return (
    <div className="sh-card p-5 mb-6 sh-fade-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--sh-ink-soft)] flex items-center gap-2">
          <Github size={15} /> Publish to GitHub
        </h3>
        <button className="sh-btn !p-1.5" onClick={onClose} aria-label="Close publish panel">
          <X size={14} />
        </button>
      </div>

      {/* Security disclosure */}
      <div
        className="text-[11px] leading-relaxed mb-4 p-3 rounded-md flex items-start gap-2"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.30)" }}
      >
        <ShieldAlert size={14} style={{ marginTop: 1, flexShrink: 0, color: "#ef4444" }} />
        <span className="text-[var(--sh-ink-soft)]">
          Your token is kept in memory only — never saved to this browser, never
          committed, gone on refresh. Use a{" "}
          <strong>fine-grained Personal Access Token</strong> scoped to{" "}
          <code className="sh-chip !py-0.5 !px-1.5">{target.owner}/{target.repo}</code>{" "}
          with <strong>Contents: Read and write</strong> and nothing else.
        </span>
      </div>

      {/* Repo target */}
      <div className="grid sm:grid-cols-4 gap-3 mb-3">
        <input className="sh-input" placeholder="owner" value={target.owner}
          onChange={(e) => { setTarget({ ...target, owner: e.target.value }); setVerified(null); }} />
        <input className="sh-input" placeholder="repo" value={target.repo}
          onChange={(e) => { setTarget({ ...target, repo: e.target.value }); setVerified(null); }} />
        <input className="sh-input" placeholder="branch" value={target.branch}
          onChange={(e) => { setTarget({ ...target, branch: e.target.value }); setVerified(null); }} />
        <input className="sh-input" placeholder="path" value={target.path}
          onChange={(e) => { setTarget({ ...target, path: e.target.value }); setVerified(null); }} />
      </div>

      {/* Token */}
      <input
        type="password"
        className="sh-input mb-3"
        placeholder="github_pat_… (fine-grained token, this repo only)"
        value={token}
        autoComplete="off"
        onChange={(e) => { setToken(e.target.value); setVerified(null); }}
      />

      {/* Commit message (optional) */}
      <input
        type="text"
        className="sh-input mb-3"
        placeholder="Commit message (optional) — e.g. Add 2024 India GDP figures"
        value={commitMsg}
        onChange={(e) => setCommitMsg(e.target.value)}
      />

      {/* Status line */}
      {status && (
        <div
          className="text-xs mb-3 flex items-start gap-2"
          style={{ color: verified === false ? "#ef4444" : verified ? "#10b981" : "var(--sh-ink-soft)" }}
        >
          {verified === false ? <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            : verified ? <CheckCircle2 size={14} style={{ marginTop: 1, flexShrink: 0 }} />
            : null}
          <span>{status}</span>
          {commitUrl && (
            <a href={commitUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 underline" style={{ color: "var(--sh-brand)" }}>
              view commit <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button className="sh-btn" onClick={handleVerify} disabled={busy || !token.trim()}>
          {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Verify token
        </button>
        <button
          className="sh-btn sh-btn-primary"
          onClick={handlePublish}
          disabled={busy || !token.trim() || count === 0}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
          Publish {count} dataset{count === 1 ? "" : "s"} to {target.branch}
        </button>
        {count === 0 && (
          <span className="text-[11px] text-[var(--sh-ink-soft)]">
            No local datasets to publish yet — add one first.
          </span>
        )}
      </div>

      <p className="text-[11px] text-[var(--sh-ink-soft)] mt-4 leading-relaxed">
        Publishing commits your locally-authored datasets as JSON to{" "}
        <code className="sh-chip !py-0.5 !px-1.5">{target.path}</code>. GitHub
        Actions then rebuilds and redeploys automatically. Built-in datasets are
        unaffected.
      </p>
    </div>
  );
}
