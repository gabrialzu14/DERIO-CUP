"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "es" | "eu" | "fr";
export const LANGS: Lang[] = ["es", "eu", "fr"];
export const LANG_KEY = "derio-cup-lang";
const LOCALES: Record<Lang, string> = { es: "es-ES", eu: "eu", fr: "fr-FR" };
const isLang = (l: unknown): l is Lang => l === "es" || l === "eu" || l === "fr";
/** t(castellano, euskera, francés): si falta el francés se usa el castellano (y el QA de idioma lo detecta). */
type T3 = <T>(es: T, eu: T, fr?: T) => T;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: T3; locale: string };
const LangContext = createContext<Ctx>({ lang: "es", setLang: () => {}, t: es => es, locale: "es-ES" });

/** Idioma elegido (castellano, euskera o francés). Guarda la elección en el dispositivo. */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, set] = useState<Lang>("es");
  useEffect(() => {
    try {
      const l = localStorage.getItem(LANG_KEY);
      if (isLang(l)) set(l);
      else { const n = navigator.language?.toLowerCase() ?? ""; if (n.startsWith("eu")) set("eu"); else if (n.startsWith("fr")) set("fr"); }
    } catch {}
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l: Lang) => { set(l); try { localStorage.setItem(LANG_KEY, l); } catch {} }, []);
  const t = useCallback(<T,>(es: T, eu: T, fr?: T) => (lang === "eu" ? eu : lang === "fr" ? (fr === undefined ? es : fr) : es), [lang]);
  return <LangContext.Provider value={{ lang, setLang, t, locale: LOCALES[lang] }}>{children}</LangContext.Provider>;
}
export const useLang = () => useContext(LangContext);
export const hasChosenLang = () => { try { return isLang(localStorage.getItem(LANG_KEY)); } catch { return false; } };
/** Elige entre tres valores según el idioma, fuera de componentes (helpers puros). */
export const pick = <T,>(lang: Lang, es: T, eu: T, fr: T): T => (lang === "eu" ? eu : lang === "fr" ? fr : es);
