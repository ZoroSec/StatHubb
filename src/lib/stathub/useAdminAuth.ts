"use client";

import { useState, useEffect, useCallback } from "react";

const AUTH_KEY = "stathub-admin-auth";
const PASSWORD_KEY = "stathub-admin-password";
const DEFAULT_PASSWORD = "stathub2024";

function getStoredPassword(): string {
  if (typeof window === "undefined") return DEFAULT_PASSWORD;
  return localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
}

function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function useAdminAuth() {
  const [authed, setAuthed] = useState(() => isAuthed());
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  // Lockout countdown
  useEffect(() => {
    if (locked && lockTimer > 0) {
      const interval = setInterval(() => {
        setLockTimer((t) => {
          if (t <= 1) {
            setLocked(false);
            setAttempts(0);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [locked, lockTimer]);

  const login = useCallback((password: string): boolean => {
    if (locked) return false;
    const stored = getStoredPassword();
    if (password === stored) {
      sessionStorage.setItem(AUTH_KEY, "true");
      setAuthed(true);
      setAttempts(0);
      return true;
    }
    const next = attempts + 1;
    setAttempts(next);
    if (next >= 3) {
      setLocked(true);
      setLockTimer(30);
    }
    return false;
  }, [attempts, locked]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    setAuthed(false);
  }, []);

  const changePassword = useCallback((oldPw: string, newPw: string): boolean => {
    const stored = getStoredPassword();
    if (oldPw !== stored) return false;
    if (newPw.length < 4) return false;
    localStorage.setItem(PASSWORD_KEY, newPw);
    return true;
  }, []);

  return { authed, login, logout, changePassword, attempts, locked, lockTimer };
}
