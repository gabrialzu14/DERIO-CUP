"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useLang } from "../lib/i18n";
import { fieldName, phaseName } from "../lib/labels";
import { Icon } from "./icons";
import type { Proj, ZoneKey } from "../lib/venueScene";

const KEYS: ZoneKey[] = ["c1", "c2", "bar", "wc", "parking", "entrada"];
const ICON: Record<ZoneKey, string> = {
  c1: "<rect x='3' y='5.5' width='18' height='13' rx='2.5'/><path d='M12 5.5v13'/><circle cx='12' cy='12' r='2.6'/>",
  c2: "<rect x='3' y='5.5' width='18' height='13' rx='2.5'/><path d='M12 5.5v13'/><circle cx='12' cy='12' r='2.6'/>",
  bar: "<path d='M5 9.5h10.5v4.2a4.6 4.6 0 0 1-4.6 4.6h-1.3A4.6 4.6 0 0 1 5 13.7z'/><path d='M15.5 10.5h1.2a2.3 2.3 0 0 1 0 4.6h-1.4'/><path d='M8.5 3.8v2.2M12 3.8v2.2'/>",
  wc: "",
  parking: "<rect x='4' y='4' width='16' height='16' rx='4.5'/><path d='M9.5 16.5V7.5h3.4a2.7 2.7 0 0 1 0 5.4H9.5'/>",
  entrada: "<path d='M13.5 4.5h3.2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3.2'/><path d='M4.5 12h9.5M10.5 8.2l3.8 3.8-3.8 3.8'/>",
};
const Ico = ({ k, size = 14 }: { k: ZoneKey; size?: number }) => k === "wc" ? <b className="v3-wc" style={{ fontSize: size * .78 }}>WC</b> : <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICON[k] }} />;

/** Plano 3D interactivo de Ibaiondo. Si el móvil no admite WebGL, se muestra la foto aérea. */
type Box = { l: number; t: number; r: number; b: number };
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
/** Coloca la ficha de la zona junto a su pin donde menos tape: arriba, abajo, a la derecha o a la izquierda,
    evitando el resto de pines, los botones del plano y los bordes. */
function placePop(el: HTMLElement, p: Proj, cur: ZoneKey, host: HTMLElement): Box {
  const W = host.clientWidth, H = host.clientHeight, pw = el.offsetWidth || 140, ph = el.offsetHeight || 36, q = p[cur], s = q.s;
  const pinTop = q.y - (q.h + 46) * s, pinMid = q.y - (q.h + 19) * s, gap = 8;
  const obstacles: Box[] = [];
  for (const k of KEYS) { const o = p[k]; if (k === cur || !o.vis) continue; obstacles.push({ l: o.x - 29 * o.s, r: o.x + 29 * o.s, t: o.y - (o.h + 48) * o.s, b: o.y + 8 }); }
  host.querySelectorAll<HTMLElement>(".v3-btn").forEach(b => obstacles.push({ l: b.offsetLeft - 4, t: b.offsetTop - 4, r: b.offsetLeft + b.offsetWidth + 4, b: b.offsetTop + b.offsetHeight + 4 }));
  const cx = (x: number) => Math.max(6, Math.min(W - 6 - pw, x)), cy = (y: number) => Math.max(6, Math.min(H - 6 - ph, y));
  const cands: Box[] = [
    { l: cx(q.x - pw / 2), t: pinTop - gap - ph },            // arriba
    { l: q.x + 29 * s + gap, t: cy(pinMid - ph / 2) },        // derecha
    { l: q.x - 29 * s - gap - pw, t: cy(pinMid - ph / 2) },   // izquierda
    { l: cx(q.x - pw / 2), t: q.y + gap + 4 },                // abajo
    { l: q.x + 29 * s + gap, t: cy(pinTop) },                 // derecha, a la altura de la cabeza del pin
    { l: q.x + 29 * s + gap, t: cy(q.y - ph) },               // derecha, a ras de suelo
    { l: q.x - 29 * s - gap - pw, t: cy(pinTop) },
    { l: q.x - 29 * s - gap - pw, t: cy(q.y - ph) },
    { l: cx(q.x + 10), t: q.y + gap + 4 },                    // abajo, desplazada
    { l: cx(q.x - pw - 10), t: q.y + gap + 4 },
    { l: 8, t: 8 }, { l: 8, t: H - 8 - ph }, { l: (W - pw) / 2, t: H - 8 - ph }, { l: (W - pw) / 2, t: 8 }, // esquinas libres si junto al pin no hay hueco
  ].map(c => ({ ...c, r: c.l + pw, b: c.t + ph }));
  const self: Box = { l: q.x - 29 * s, r: q.x + 29 * s, t: pinTop, b: q.y + 8 };
  let best = cands[0], bs = Infinity;
  cands.forEach((c, i) => {
    const out = Math.max(0, -c.l) + Math.max(0, c.r - W) + Math.max(0, -c.t) + Math.max(0, c.b - H);
    const sc = out * 400 + obstacles.reduce((a, o) => a + overlap(c, o), 0) * 3 + overlap(c, self) * 4 + i * 30 + (i > 9 ? 900 : 0); // a igualdad, el orden de preferencia
    if (sc < bs) { bs = sc; best = c; }
  });
  const L = Math.round(Math.max(6, Math.min(W - 6 - pw, best.l))), T = Math.round(Math.max(6, Math.min(H - 6 - ph, best.t)));
  el.style.transform = `translate(${L}px,${T}px)`;
  return { l: L, t: T, r: L + pw, b: T + ph };
}

export function VenueMap3D({ fallback }: { fallback?: { src: string; alt: string } }) {
  const { t, lang } = useLang(), eu = lang === "eu";
  const host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), pop = useRef<HTMLDivElement>(null);
  const labs = useRef<Partial<Record<ZoneKey, HTMLDivElement | null>>>({});
  const api = useRef<{ select: (k: ZoneKey | null) => void; setNight: (n: boolean) => void; resetView: () => void; dispose: () => void } | null>(null);
  const [sel, setSel] = useState<ZoneKey | null>(null), [full, setFull] = useState(false), [failed, setFailed] = useState(false), [ready, setReady] = useState(false);
  const selRef = useRef<ZoneKey | null>(null); selRef.current = sel;

  const name: Record<ZoneKey, string> = { c1: fieldName(1, lang), c2: fieldName(2, lang), bar: t("Bar", "Taberna"), wc: t("WC", "Komunak"), parking: t("Aparcamiento", "Aparkalekua"), entrada: t("Entrada", "Sarrera") };
  const desc: Partial<Record<ZoneKey, string>> = {
    bar: t("Pintxos y bocadillos", "Pintxoak eta ogitartekoak"),
    wc: t("Acceso por detrás de la grada", "Harmailaren atzetik sartzen da"),
    entrada: t("3 € por persona", "3 € pertsonako"),
    c1: t("Fase de grupos y fase oro", "Multzo-fasea eta urrezko fasea"),
    c2: t("Fase de grupos y fase plata", "Multzo-fasea eta zilarrezko fasea"),
  };
  const phase = (k: ZoneKey) => (k === "c1" ? phaseName("Oro", lang) : k === "c2" ? phaseName("Plata", lang) : null);

  const pick = useCallback((k: ZoneKey | null) => { setSel(prev => { const n = k && prev === k ? null : k; api.current?.select(n); return n; }); }, []);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const test = document.createElement("canvas");
        if (!(test.getContext("webgl2") || test.getContext("webgl"))) throw new Error("sin WebGL");
        const { createVenueScene } = await import("../lib/venueScene");
        if (dead || !canvas.current || !host.current) return;
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const place = (p: Proj) => {
          if (!host.current) return;
          const popEl = pop.current, w = host.current.clientWidth;
          host.current.classList.toggle("far", p.far);
          for (const k of KEYS) { const el = labs.current[k]; if (!el) continue; const q = p[k]; el.style.opacity = q.vis ? "1" : "0"; el.style.setProperty("--h", q.h + "px"); el.style.transform = `translate(${q.x}px,${q.y}px) scale(${q.s})`; }
          const cur = selRef.current;
          const box = popEl && cur ? placePop(popEl, p, cur, host.current) : null;
          // si en pantallas pequeñas no queda hueco, el pin que quede debajo de la ficha se atenúa (no compite con ella)
          for (const k of KEYS) { const el = labs.current[k], o = p[k]; if (!el) continue; el.classList.toggle("under", !!box && k !== cur && o.vis && overlap(box, { l: o.x - 22 * o.s, r: o.x + 22 * o.s, t: o.y - (o.h + 44) * o.s, b: o.y + 6 }) > 0); }
        };
        const a = createVenueScene(canvas.current, host.current, { onPick: k => pick(k), onFrame: place, reduceMotion: reduce });
        api.current = a; a.setNight(false); setReady(true);
      } catch { if (!dead) setFailed(true); }
    })();
    return () => { dead = true; api.current?.dispose(); api.current = null; };
  }, [pick]);

  if (failed) return fallback ? /* eslint-disable-next-line @next/next/no-img-element */ <img className="venue-img" src={fallback.src} alt={fallback.alt} loading="lazy" /> : null;
  const cur = sel;
  return (
    <div className="v3">
      <div ref={host} className={"v3-map" + (full ? " full" : "") + (ready ? " ready" : "") + (cur ? " has-sel" : "")} aria-label={t("Plano 3D de las instalaciones de Ibaiondo", "Ibaiondoko instalazioen 3D planoa")}>
        <canvas ref={canvas} />
        {KEYS.map(k => (
          <div key={k} ref={el => { labs.current[k] = el; }} aria-hidden="true" className={"v3-mk k-" + k + (cur === k ? " on" : "")} style={{ opacity: 0 } as CSSProperties}>
            <span className="stem" /><span className="ground" />
            <span className="body"><span className="pin"><Ico k={k} size={19} /></span><span className="lbl">{name[k]}</span></span>
          </div>
        ))}
        <div ref={pop} className="v3-pop" hidden={!cur} aria-live="polite">{cur && <Card k={cur} name={name[cur]} phase={null} desc={desc[cur]} />}</div>
        <button type="button" className="v3-btn top" onClick={() => api.current?.resetView()}>{t("Vista general", "Ikuspegi orokorra")}</button>
        <button type="button" className="v3-btn fs" aria-label={full ? t("Salir de pantalla completa", "Irten pantaila osotik") : t("Pantalla completa", "Pantaila osoa")} onClick={() => setFull(f => !f)}><Icon name={full ? "close" : "chevron"} size={16} className={full ? "" : "v3-expand"} /></button>
        {!ready && <span className="v3-load">{t("Cargando plano…", "Planoa kargatzen…")}</span>}
      </div>
      <div className="v3-chips" role="group" aria-label={t("Zonas del plano", "Planoaren guneak")}>
        {KEYS.map(k => <button key={k} type="button" className="v3-chip" aria-pressed={cur === k} onClick={() => pick(k)}>{k === "wc" ? <b className="v3-wc" style={{ fontSize: 13 }}>WC</b> : <><Ico k={k} size={15} />{name[k]}</>}</button>)}
      </div>
    </div>
  );
}

function Card({ name, phase, desc }: { k: ZoneKey; name: string; phase: string | null; desc?: string }) {
  return <><b>{name}{phase && <span className={"v3-ph " + (phase.toLowerCase().startsWith("urrezko") || phase.endsWith("Oro") ? "oro" : "plata")}>{phase}</span>}</b>{desc && <p>{desc}</p>}</>;
}
