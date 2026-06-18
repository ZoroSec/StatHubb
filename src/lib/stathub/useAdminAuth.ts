"use client";

import { useState, useCallback } from "react";

/**
 * Admin gate — single OWNER password (casual protection).
 *
 * This is a casual deterrent, NOT real security. StatHub is a static site
 * with no backend, so this check runs in the visitor's browser and a determined
 * person could bypass it via DevTools or brute-force the hash. That is an
 * accepted, understood limitation.
 *
 * What it DOES provide:
 *   - A single fixed owner password (set by you, below) — visitors cannot
 *     "set their own" password and let themselves in.
 *   - The password is not stored in plain text in the bundle; only a salted
 *     SHA-256 hash is shipped, so a casual source-reader won't see it.
 *
 * What actually protects the live site (the real wall): publishing requires
 * your GitHub token, which is never in the code. Someone who bypasses this
 * gate can only edit their OWN browser's local copy — they cannot change the
 * deployed site or what other users see.
 *
 * ── TO CHANGE THE PASSWORD ───────────────────────────────────────────────────
 * Generate a new hash (keep the same SALT) and paste it into OWNER_PASSWORD_HASH:
 *
 *   Node:   node -e "const c=require('crypto');console.log(c.createHash('sha256').update('stathub-v1-salt'+'YOUR_PASSWORD').digest('hex'))"
 *   Python: python3 -c "import hashlib;print(hashlib.sha256(('stathub-v1-salt'+'YOUR_PASSWORD').encode()).hexdigest())"
 *
 * Default password (CHANGE THIS): stathub-admin
 */

const SALT = "stathub-v1-salt";
const OWNER_PASSWORD_HASH =
  "cf92b23d403e39cc7aa5a730c140fb2a6248a1755c5f31a55949313419ee1112";

const UNLOCK_KEY = "stathub-admin-unlocked"; // sessionStorage flag (per tab session)

function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(UNLOCK_KEY) === "true";
}

async function hashPassword(pw: string): Promise<string> {
  const bytes = new TextEncoder().encode(SALT + pw);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function useAdminAuth() {
  const [authed, setAuthed] = useState(() => isUnlocked());

  // Verify against the owner password hash. Returns true on success.
  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const h = await hashPassword(password);
      if (h === OWNER_PASSWORD_HASH) {
        sessionStorage.setItem(UNLOCK_KEY, "true");
        setAuthed(true);
        return true;
      }
    } catch {
      /* crypto unavailable — fail closed */
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(UNLOCK_KEY);
    setAuthed(false);
  }, []);

  return { authed, login, logout };
}
