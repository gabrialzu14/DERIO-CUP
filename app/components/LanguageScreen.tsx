"use client";
import { useLang } from "../lib/i18n";

/** Bandera de España abstracta (franjas rojo-amarillo-rojo) con bordes redondeados. */
export function FlagEs() {
  return <svg className="flag" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="fe"><rect width="60" height="40" rx="10" /></clipPath></defs><g clipPath="url(#fe)"><rect width="60" height="40" fill="#c8102e" /><rect y="10" width="60" height="20" fill="#f4c20d" /></g></svg>;
}
/** Ikurriña abstracta (fondo rojo, aspa verde y cruz blanca) con bordes redondeados. */
export function FlagEu() {
  return <svg className="flag" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="fb"><rect width="60" height="40" rx="10" /></clipPath></defs><g clipPath="url(#fb)"><rect width="60" height="40" fill="#d52b1e" /><path d="M0 0 60 40M60 0 0 40" stroke="#009b48" strokeWidth="5" /><path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="5" /></g></svg>;
}

/** Selector discreto «CAS | EUS» arriba a la derecha; la barra azul fina se desliza al cambiar. */
export function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang-toggle" data-pos={lang === "es" ? 0 : 1}>
      <small>{t("Idioma", "Hizkuntza")}</small>
      <div className="lang-toggle-row" role="radiogroup" aria-label={t("Idioma", "Hizkuntza")}>
        <button type="button" role="radio" aria-checked={lang === "es"} onClick={() => setLang("es")}>CAS</button>
        <button type="button" role="radio" aria-checked={lang === "eu"} onClick={() => setLang("eu")}>EUS</button>
        <span className="lang-bar" aria-hidden="true" />
      </div>
    </div>
  );
}
