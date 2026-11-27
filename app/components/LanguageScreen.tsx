"use client";
import type { CSSProperties } from "react";
import { VISIBLE_LANGS, useLang } from "../lib/i18n";

/** Bandera de España abstracta (franjas rojo-amarillo-rojo) con bordes redondeados. */
export function FlagEs() {
  return <svg className="flag" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="fe"><rect width="60" height="40" rx="10" /></clipPath></defs><g clipPath="url(#fe)"><rect width="60" height="40" fill="#c8102e" /><rect y="10" width="60" height="20" fill="#f4c20d" /></g></svg>;
}
/** Ikurriña abstracta (fondo rojo, aspa verde y cruz blanca) con bordes redondeados. */
export function FlagEu() {
  return <svg className="flag" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="fb"><rect width="60" height="40" rx="10" /></clipPath></defs><g clipPath="url(#fb)"><rect width="60" height="40" fill="#d52b1e" /><path d="M0 0 60 40M60 0 0 40" stroke="#009b48" strokeWidth="5" /><path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="5" /></g></svg>;
}

/** Bandera de Francia abstracta (azul-blanco-rojo) con bordes redondeados. */
export function FlagFr() {
  return <svg className="flag" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="ff"><rect width="60" height="40" rx="10" /></clipPath></defs><g clipPath="url(#ff)"><rect width="20" height="40" fill="#002654" /><rect x="20" width="20" height="40" fill="#ffffff" /><rect x="40" width="20" height="40" fill="#ce1126" /></g><rect width="60" height="40" rx="10" fill="none" stroke="rgb(0 0 0 / .12)" /></svg>;
}

/** Selector discreto «CAS | EUS» (y «FRA» cuando se active el francés) arriba a la derecha; la barra fina se desliza al cambiar. */
export function LangToggle({ bare = false }: { bare?: boolean }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-toggle" data-pos={Math.max(0, VISIBLE_LANGS.indexOf(lang))} style={{ "--n": VISIBLE_LANGS.length } as CSSProperties}>
      {!bare && <small>{t("Idioma", "Hizkuntza", "Langue")}</small>}
      <div className="lang-toggle-row" role="radiogroup" aria-label={t("Idioma", "Hizkuntza", "Langue")}>
        <button type="button" role="radio" aria-checked={lang === "es"} aria-label="Castellano" onClick={() => setLang("es")}>CAS</button>
        <button type="button" role="radio" aria-checked={lang === "eu"} aria-label="Euskara" onClick={() => setLang("eu")}>EUS</button>
        {VISIBLE_LANGS.includes("fr") && <button type="button" role="radio" aria-checked={lang === "fr"} aria-label="Français" onClick={() => setLang("fr")}>FRA</button>}
        <span className="lang-bar" aria-hidden="true" />
      </div>
    </div>
  );
}
