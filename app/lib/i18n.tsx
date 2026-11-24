"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "es" | "eu";
export const LANG_KEY = "derio-cup-lang";
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: <T>(es: T, eu: T) => T; locale: string };
const LangContext = createContext<Ctx>({ lang: "es", setLang: () => {}, t: es => es, locale: "es-ES" });

/** Idioma elegido (castellano o euskera). Guarda la elección en el dispositivo. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>("es");
  useEffect(() => { try { const l = localStorage.getItem(LANG_KEY); if (l === "es" || l === "eu") set(l); } catch {} }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l: Lang) => { set(l); try { localStorage.setItem(LANG_KEY, l); } catch {} }, []);
  const t = useCallback(<T,>(es: T, eu: T) => (lang === "eu" ? eu : es), [lang]);
  return <LangContext.Provider value={{ lang, setLang, t, locale: lang === "eu" ? "eu" : "es-ES" }}>{children}</LangContext.Provider>;
}
export const useLang = () => useContext(LangContext);
export const hasChosenLang = () => { try { const l = localStorage.getItem(LANG_KEY); return l === "es" || l === "eu"; } catch { return false; } };
