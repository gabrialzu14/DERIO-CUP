"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useLang } from "../lib/i18n";
import { fieldName, phaseName } from "../lib/labels";
import { Icon } from "./icons";
import type { Proj, ZoneKey } from "../lib/venueScene";

const KEYS: ZoneKey[] = ["c1", "c2", "bar", "wc", "parking", "entrada"];
const ICON: Record<ZoneKey, string> = {
  c1: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5l3.8 2.8-1.5 4.4H9.7L8.2 10.3z'/>",
  c2: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5l3.8 2.8-1.5 4.4H9.7L8.2 10.3z'/>",
  bar: "<path d='M5 9h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z'/><path d='M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4v2M11 4v2M14 4v2'/>",
  wc: "<circle cx='8' cy='5' r='1.6'/><circle cx='16' cy='5' r='1.6'/><path d='M8 8v12M6 9h4l.5 6M16 8l-3 7h6zM16 15v5'/>",
  parking: "<path d='M8 20V4h5a4 4 0 0 1 0 8H8'/>",
  entrada: "<path d='M4 12h15M13 6l6 6-6 6'/>",
};
const Ico = ({ k, size = 14 }: { k: ZoneKey; size?: number }) => <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON[k] }} />;

/** Plano 3D interactivo de Ibaiondo. Si el móvil no admite WebGL, se muestra la foto aérea. */
export function VenueMap3D({ fallback }: { fallback?: { src: string; alt: string } }) {
  const { t, lang } = useLang(), eu = lang === "eu";
  const host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), pop = useRef<HTMLDivElement>(null);
  const labs = useRef<Partial<Record<ZoneKey, HTMLButtonElement | null>>>({});
  const api = useRef<{ select: (k: ZoneKey | null) => void; setNight: (n: boolean) => void; resetView: () => void; dispose: () => void } | null>(null);
  const [sel, setSel] = useState<ZoneKey | null>(null), [full, setFull] = useState(false), [failed, setFailed] = useState(false), [ready, setReady] = useState(false);
  const selRef = useRef<ZoneKey | null>(null); selRef.current = sel;

  const name: Record<ZoneKey, string> = { c1: fieldName(1, eu), c2: fieldName(2, eu), bar: t("Bar", "Taberna"), wc: t("WC", "Komunak"), parking: t("Aparcamiento", "Aparkalekua"), entrada: t("Entrada", "Sarrera") };
  const desc: Partial<Record<ZoneKey, string>> = {
    bar: t("Pintxos y bocadillos", "Pintxoak eta ogitartekoak"),
    wc: t("Acceso por la parte de atrás de la grada", "Harmailaren atzeko aldetik sartzen da"),
    entrada: t("3 € por persona", "3 € pertsonako"),
  };
  const phase = (k: ZoneKey) => (k === "c1" ? phaseName("Oro", eu) : k === "c2" ? phaseName("Plata", eu) : null);

  const pick = useCallback((k: ZoneKey | null) => { setSel(prev => { const n = k && prev === k ? null : k; api.current?.select(n); return n; }); }, []);

  useEffect(() => {
    let dead = false, mo: MutationObserver | null = null;
    const night = () => { const d = document.documentElement.dataset.theme; return d === "dark" || (d !== "light" && matchMedia("(prefers-color-scheme: dark)").matches); };
    (async () => {
      try {
        const test = document.createElement("canvas");
        if (!(test.getContext("webgl2") || test.getContext("webgl"))) throw new Error("sin WebGL");
        const { createVenueScene } = await import("../lib/venueScene");
        if (dead || !canvas.current || !host.current) return;
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const place = (p: Proj) => {
          const popEl = pop.current, w = host.current!.clientWidth;
          host.current!.classList.toggle("far", p.far);
          for (const k of KEYS) { const el = labs.current[k]; if (!el) continue; const q = p[k]; el.style.opacity = q.vis ? "1" : "0"; el.style.pointerEvents = q.vis ? "auto" : "none"; el.style.transform = `translate(${q.x}px,${q.y}px) translate(-50%,-50%)`; }
          const cur = selRef.current;
          if (popEl && cur) { const q = p[cur], pw = popEl.offsetWidth || 150, px = Math.max(8 + pw / 2, Math.min(w - 8 - pw / 2, q.x)); popEl.style.transform = `translate(${px}px,${Math.max(8, q.y - 30)}px) translate(-50%,-100%)`; }
        };
        const a = createVenueScene(canvas.current, host.current, { onPick: k => pick(k), onFrame: place, reduceMotion: reduce });
        api.current = a; a.setNight(night()); setReady(true);
        mo = new MutationObserver(() => a.setNight(night())); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
      } catch { if (!dead) setFailed(true); }
    })();
    return () => { dead = true; mo?.disconnect(); api.current?.dispose(); api.current = null; };
  }, [pick]);

  if (failed) return fallback ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="venue-img" src={fallback.src} alt={fallback.alt} loading="lazy" /> : null;
  const cur = sel;
  return (
    <div className="v3">
      <div ref={host} className={"v3-map" + (full ? " full" : "") + (ready ? " ready" : "")} aria-label={t("Plano 3D de las instalaciones de Ibaiondo", "Ibaiondoko instalazioen 3D planoa")}>
        <canvas ref={canvas} />
        {KEYS.map(k => (
          <button key={k} ref={el => { labs.current[k] = el; }} type="button" className={"v3-lab" + (k === "c1" || k === "c2" ? " big" : "") + (cur === k ? " on" : "")} onClick={() => pick(k)} aria-pressed={cur === k} style={{ opacity: 0 } as CSSProperties}>
            {k === "c1" || k === "c2" ? <span className="t">{name[k]}</span> : <><i><Ico k={k} size={13} /></i><span className="t">{name[k]}</span></>}
          </button>
        ))}
        <div ref={pop} className="v3-pop" hidden={!cur}>{cur && <Card k={cur} name={name[cur]} phase={phase(cur)} desc={desc[cur]} />}</div>
        <button type="button" className="v3-btn top" onClick={() => api.current?.resetView()}>{t("Vista general", "Ikuspegi orokorra")}</button>
        <button type="button" className="v3-btn fs" aria-label={full ? t("Salir de pantalla completa", "Irten pantaila osotik") : t("Pantalla completa", "Pantaila osoa")} onClick={() => setFull(f => !f)}><Icon name={full ? "close" : "chevron"} size={16} className={full ? "" : "v3-expand"} /></button>
        {!ready && <span className="v3-load">{t("Cargando plano…", "Planoa kargatzen…")}</span>}
        <span className="v3-hint">{t("1 dedo: mover · 2 dedos: girar y zoom", "Hatz bat: mugitu · bi hatz: biratu eta zoom")}</span>
      </div>
      <div className="v3-chips" role="group" aria-label={t("Zonas del plano", "Planoaren guneak")}>
        {KEYS.map(k => <button key={k} type="button" className="v3-chip" aria-pressed={cur === k} onClick={() => pick(k)}><Ico k={k} size={15} />{name[k]}</button>)}
      </div>
      <div className="v3-card" aria-live="polite">{cur ? <Card k={cur} name={name[cur]} phase={phase(cur)} desc={desc[cur]} /> : <b>{t("Toca una zona del plano", "Ukitu planoaren gune bat")}</b>}</div>
    </div>
  );
}

function Card({ name, phase, desc }: { k: ZoneKey; name: string; phase: string | null; desc?: string }) {
  return <><b>{name}{phase && <span className={"v3-ph " + (phase.toLowerCase().startsWith("urrezko") || phase.endsWith("Oro") ? "oro" : "plata")}>{phase}</span>}</b>{desc && <p>{desc}</p>}</>;
}
