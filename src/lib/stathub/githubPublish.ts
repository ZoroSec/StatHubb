"use client";

import type { Dataset } from "./types";
import { validateAll } from "./validateDataset";

/**
 * GitHub publishing client (Option 2).
 *
 * Commits the custom-datasets JSON file straight to the repo via the GitHub
 * Contents API. Your existing GitHub Actions workflow then rebuilds and
 * redeploys, so authored data goes live without any manual git step.
 *
 * ── SECURITY MODEL ──────────────────────────────────────────────────────────
 * This is a STATIC site with no backend, so there is nowhere safe to store a
 * server-side secret. The token is therefore supplied by YOU at runtime and is
 * held in React state in memory ONLY:
 *   • never written to localStorage / sessionStorage
 *   • never committed to the repo or baked into the JS bundle
 *   • gone the moment you refresh or close the tab
 * Use a FINE-GRAINED Personal Access Token scoped to this one repository with
 * "Contents: Read and write" permission and nothing else. If it ever leaks, the
 * blast radius is limited to this single repo's files.
 *
 * Anyone self-hosting a fork must understand: do not hardcode a token here. If
 * you want unattended/multi-user publishing, move this behind a serverless
 * function that holds the token as a secret instead.
 */

export interface RepoTarget {
  owner: string;
  repo: string;
  branch: string;
  path: string; // e.g. "public/data/custom-datasets.json"
}

export const DEFAULT_TARGET: RepoTarget = {
  owner: "ZoroSec",
  repo: "StatHubb",
  branch: "main",
  path: "public/data/custom-datasets.json",
};

export interface PublishResult {
  ok: boolean;
  message: string;
  commitUrl?: string;
}

const API = "https://api.github.com";

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Browser-safe UTF-8 → base64 (the Contents API wants base64 content).
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

/** Verify the token can see the repo and (best-effort) has write access. */
export async function verifyToken(
  token: string,
  target: RepoTarget
): Promise<PublishResult> {
  if (!token.trim()) return { ok: false, message: "No token provided." };
  try {
    const res = await fetch(`${API}/repos/${target.owner}/${target.repo}`, {
      headers: authHeaders(token),
    });
    if (res.status === 401) {
      return { ok: false, message: "Token rejected (401). It may be invalid or expired." };
    }
    if (res.status === 404) {
      return {
        ok: false,
        message: "Repo not found (404). Check owner/repo, and that the token is scoped to this repository.",
      };
    }
    if (!res.ok) {
      return { ok: false, message: `GitHub error ${res.status}.` };
    }
    const data = await res.json();
    const canWrite = data?.permissions?.push === true;
    if (!canWrite) {
      return {
        ok: false,
        message: "Token can read this repo but lacks write (push) access. Grant 'Contents: Read and write'.",
      };
    }
    return { ok: true, message: `Connected to ${data.full_name}. Write access confirmed.` };
  } catch {
    return { ok: false, message: "Network error contacting GitHub." };
  }
}

/** Fetch the current file SHA (needed to update an existing file). null = file doesn't exist yet. */
async function getFileSha(token: string, target: RepoTarget): Promise<string | null> {
  const url = `${API}/repos/${target.owner}/${target.repo}/contents/${target.path}?ref=${target.branch}`;
  const res = await fetch(url, { headers: authHeaders(token) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not read existing file (${res.status}).`);
  const data = await res.json();
  return data.sha as string;
}

/**
 * Validate, then commit the dataset collection as JSON to the repo.
 * Aborts before any network write if validation fails.
 */
export async function publishDatasets(
  token: string,
  datasets: Dataset[],
  target: RepoTarget,
  commitMessage?: string
): Promise<PublishResult> {
  if (!token.trim()) return { ok: false, message: "No token provided." };

  // Safety gate: never commit malformed data into a build that fails on errors.
  const problems = validateAll(datasets);
  const bad = Object.keys(problems);
  if (bad.length) {
    const first = problems[bad[0]][0];
    return {
      ok: false,
      message: `Validation failed for ${bad.length} dataset(s). First issue (${bad[0]}): ${first}`,
    };
  }

  const json = JSON.stringify(datasets, null, 2) + "\n";
  const content = toBase64(json);

  try {
    let sha: string | null;
    try {
      sha = await getFileSha(token, target);
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Failed to read existing file." };
    }

    const body: Record<string, unknown> = {
      message: commitMessage || `chore(data): update datasets (${datasets.length} entries)`,
      content,
      branch: target.branch,
    };
    if (sha) body.sha = sha; // update vs. create

    const res = await fetch(
      `${API}/repos/${target.owner}/${target.repo}/contents/${target.path}`,
      { method: "PUT", headers: authHeaders(token), body: JSON.stringify(body) }
    );

    if (res.status === 401) return { ok: false, message: "Token rejected (401)." };
    if (res.status === 403) return { ok: false, message: "Forbidden (403). Token lacks write permission, or rate-limited." };
    if (res.status === 409) return { ok: false, message: "Conflict (409). The file changed on the server — reload and retry." };
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json())?.message || ""; } catch { /* ignore */ }
      return { ok: false, message: `GitHub error ${res.status}. ${detail}` };
    }

    const data = await res.json();
    return {
      ok: true,
      message: "Published. GitHub Actions will redeploy the site shortly.",
      commitUrl: data?.commit?.html_url,
    };
  } catch {
    return { ok: false, message: "Network error during publish." };
  }
}
