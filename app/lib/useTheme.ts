"use client";
import { useEffect, useState } from "react";
import { applyTheme, resolveTheme, THEME_KEY, type ThemePref } from "./theme";

/** Preferencia de tema (sistema / claro / oscuro) con persistencia. */
export function useTheme() {
  const [theme, setThemeState] = useState<ThemePref>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  useEffect(() => {
    let pref: string | null = null;
    try { pref = localStorage.getItem(THEME_KEY); } catch {}
    const p: ThemePref = pref === "dark" || pref === "system" ? pref : "light"; // por defecto, modo claro
    setThemeState(p); applyTheme(p);
  }, []);
  useEffect(() => {
    const sync = () => setResolved(resolveTheme(theme));
    sync();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [theme]);
  const setTheme = (t: ThemePref) => { setThemeState(t); applyTheme(t); };
  return { theme, resolved, setTheme, toggle: () => setTheme(resolved === "dark" ? "light" : "dark") };
}
