"use client";

import { useState, useCallback } from "react";

/**
 * ⚠️ IMPORTANT — THIS IS NOT REAL AUTHENTICATION.
 *
 * StatHub is a fully static site (GitHub Pages, no backend). The "Admin"
 * panel only edits datasets in *this browser's* localStorage — it can never
 * change the published site or affect other visitors. There is no server to
 * authenticate against, so any client-side "password" is decorative: it lives
 * in the JS bundle and can be bypassed from DevTools.
 *
 * Because of that, this gate is intentionally a soft, single-device unlock
 * rather than a security control. We do NOT ship a hardcoded password, we do
 * NOT show fake "attempts remaining" lockouts, and we do NOT claim the area is
 * protected. The user sets a local PIN on first use (stored in localStorage),
 * purely so the editor isn't opened by accident on a shared machine. Treat
 * everything behind it as local-only and public-readable.
 */

const UNLOCK_KEY = "stathub-admin-unlocked"; // sessionStorage flag
const PIN_KEY = "stathub-admin-pin"; // localStorage, local convenience only

function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(UNLOCK_KEY) === "true";
}

function getPin(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PIN_KEY);
}

export function useAdminAuth() {
  const [authed, setAuthed] = useState(() => isUnlocked());
  const [hasPin, setHasPin] = useState(() => getPin() !== null);

  // Set a PIN for the first time (local convenience only).
  const setInitialPin = useCallback((pin: string): boolean => {
    if (pin.length < 4) return false;
    localStorage.setItem(PIN_KEY, pin);
    sessionStorage.setItem(UNLOCK_KEY, "true");
    setHasPin(true);
    setAuthed(true);
    return true;
  }, []);

  // Unlock with the local PIN. No lockout — this guards nothing of value.
  const login = useCallback((pin: string): boolean => {
    const stored = getPin();
    if (stored !== null && pin === stored) {
      sessionStorage.setItem(UNLOCK_KEY, "true");
      setAuthed(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(UNLOCK_KEY);
    setAuthed(false);
  }, []);

  const changePin = useCallback((oldPin: string, newPin: string): boolean => {
    const stored = getPin();
    if (stored !== null && oldPin !== stored) return false;
    if (newPin.length < 4) return false;
    localStorage.setItem(PIN_KEY, newPin);
    return true;
  }, []);

  return { authed, hasPin, login, logout, setInitialPin, changePin };
}
