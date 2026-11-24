"use client";
import { useState } from "react";
import { CupMark } from "./ui";
import { Icon } from "./icons";
import { useLang, type Lang } from "../lib/i18n";

/** Bandera de España abstracta (franjas rojo-amarillo-rojo) con bordes redondeados. */
export function FlagEs() {
  return <svg className="flag" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="fe"><rect width="60" height="40" rx="10" /></clipPath></defs><g clipPath="url(#fe)"><rect width="60" height="40" fill="#c8102e" /><rect y="10" width="60" height="20" fill="#f4c20d" /></g></svg>;
}
/** Ikurriña abstracta (fondo rojo, aspa verde y cruz blanca) con bordes redondeados. */
export function FlagEu() {
  return <svg className="flag" viewBox="0 0 60 40" aria-hidden="true"><defs><clipPath id="fb"><rect width="60" height="40" rx="10" /></clipPath></defs><g clipPath="url(#fb)"><rect width="60" height="40" fill="#d52b1e" /><path d="M0 0 60 40M60 0 0 40" stroke="#009b48" strokeWidth="5" /><path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="5" /></g></svg>;
}

/** Primera pantalla: elegir idioma con un selector de dos opciones cuyo fondo se desliza. */
export function LanguageScreen({ onDone }: { onDone: () => void }) {
  const { lang, setLang, t } = useLang();
  const [chosen, setChosen] = useState<Lang>(lang);
  const pick = (l: Lang) => { setChosen(l); setLang(l); };
  return (
    <main className="onb lang-screen">
      <div className="onb-body">
        <CupMark size={96} className="landing-cup" />
        <h1 className="wordmark"><b>DERIO</b><span>CUP</span></h1>
        <h2 className="onb-title">{t("Elige tu idioma", "Aukeratu zure hizkuntza")}</h2>
        <p className="onb-text sm">{t("Hizkuntza aukeratu", "Elige el idioma")}</p>
        <div className="lang-switch" role="radiogroup" aria-label="Idioma / Hizkuntza" data-pos={chosen === "es" ? 0 : 1}>
          <span className="lang-thumb" aria-hidden="true" />
          <button type="button" role="radio" aria-checked={chosen === "es"} className="lang-opt" onClick={() => pick("es")}><FlagEs /><b>Castellano</b></button>
          <button type="button" role="radio" aria-checked={chosen === "eu"} className="lang-opt" onClick={() => pick("eu")}><FlagEu /><b>Euskara</b></button>
        </div>
      </div>
      <div className="onb-actions">
        <button type="button" className="btn btn-primary block" onClick={onDone}>{t("Continuar", "Jarraitu")}<Icon name="chevron" size={18} /></button>
      </div>
    </main>
  );
}
