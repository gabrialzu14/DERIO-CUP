"use client";
import { useLayoutEffect, useRef, type CSSProperties, type RefObject, type KeyboardEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { useEngine, useOpenTeam } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { fieldName, groupName, koCode, koLabel, phaseName, fieldInitial } from "../lib/labels";
import { crestFor, monoHue } from "../lib/crests";
import { BRAND, type KOGame, type Match } from "../lib/tournament";

const initials = (name: string) => { const w = name.split(/\s+/).filter(x => x && !/^\d+$/.test(x)); return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase(); };

/** Escudo del equipo; si aún no hay imagen se muestra un monograma con color propio. */
/** `onColor`: el escudo va sobre el recuadro de color del club (algunos clubes usan entonces su versión blanca). */
export function Crest({ id, size = 36, className = "", onColor = false }: { id: string; size?: number; className?: string; onColor?: boolean }) {
  const { T } = useEngine(), t = T(id), src = t ? crestFor(t.crest ?? t.name, onColor) : null;
  if (!src) return <span className={"crest mono " + className} style={{ "--s": size + "px", "--h": monoHue(id) } as CSSProperties} aria-hidden="true"><b>{initials(t?.name ?? id)}</b></span>;
  // Versión ligera (192 px, sin pérdida): se precarga al abrir la app para que salga antes de llegar a cada pestaña.
  return <img className={"crest " + className} src={src} width={size} height={size} alt="" decoding="async" draggable={false} />;
}

/** Trofeo de marca: se tiñe con el color del tema (el logo original es blanco). */
export function CupMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <span className={"cup-mark " + className} style={{ width: size, height: size * 1.1 }} role="img" aria-label={BRAND} />;
}

/** Nombre de marca con la tipografía de la Derio Cup: «Derio» en negrita y «Cup» en trazo fino. */
export function BrandName({ as: Tag = "span" }: { as?: "span" | "b" }) {
  return <Tag className="brand-name" aria-label={BRAND}><span className="d" aria-hidden="true">Derio</span><span className="c" aria-hidden="true">Cup</span></Tag>;
}

/** Contenido de un equipo que abre su perfil al pulsarlo. */
export function TeamLink({ id, className = "", children }: { id: string; className?: string; children: ReactNode }) {
  const open = useOpenTeam(), { T } = useEngine(), { t } = useLang();
  if (!open) return <div className={className}>{children}</div>;
  return <button type="button" className={className + " team-link"} onClick={() => open(id)} aria-label={t("Ver el perfil de ", "Ikusi profila: ", "Voir le profil de l’équipe ") + T(id).name}>{children}</button>;
}

export function SectionHead({ title, icon, cup, action }: { title: string; icon?: IconName; cup?: boolean; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="section-head">
      <h2>{cup && <CupMark size={22} className="sec-cup" />}{icon && <Icon name={icon} size={20} />}{title}</h2>
      {action && <button type="button" className="link-btn" onClick={action.onClick}>{action.label}<Icon name="chevron" size={16} /></button>}
    </div>
  );
}

/** Mide el elemento activo y deja su posición/ancho en --ix / --iw del contenedor: el indicador se desliza hasta él. */
export function useSlider(ref: RefObject<HTMLElement | null>, selector: string, dep: unknown) {
  useLayoutEffect(() => {
    const c = ref.current; if (!c) return;
    const apply = () => { const el = c.querySelector<HTMLElement>(selector); if (!el) return; c.style.setProperty("--ix", el.offsetLeft + "px"); c.style.setProperty("--iw", el.offsetWidth + "px"); };
    apply();
    let raf = 0, dead = false;
    // las animaciones se activan tras medir con la fuente ya cargada: el indicador no «viaja» al colocarse la primera vez
    (document.fonts?.ready ?? Promise.resolve()).then(() => { if (dead) return; apply(); raf = requestAnimationFrame(() => { c.dataset.ind = "1"; }); });
    const ro = new ResizeObserver(apply); ro.observe(c);
    return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); };
  }, [ref, selector, dep]);
}

/** Pestañas accesibles (role=tablist) con navegación por flechas. */
export function Tabs<K extends string>({ label, value, onChange, items, idPrefix, variant = "pill" }: { label: string; value: K; onChange: (k: K) => void; items: { key: K; label: ReactNode; ariaLabel?: string }[]; idPrefix: string; variant?: "pill" | "underline" }) {
  const ref = useRef<HTMLDivElement>(null);
  useSlider(ref, "[role=tab][aria-selected=true]", value);
  const onKey = (e: KeyboardEvent) => {
    const i = items.findIndex(x => x.key === value);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = items.length - 1;
    if (n < 0) return;
    e.preventDefault();
    onChange(items[n].key);
    ref.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[n]?.focus();
  };
  return (
    <div ref={ref} className={"tabs tabs-" + variant} role="tablist" aria-label={label} onKeyDown={onKey}>
      <span className="slide-ind" aria-hidden="true" />
      {items.map(it => (
        <button key={it.key} type="button" role="tab" id={idPrefix + "-tab-" + it.key} aria-controls={idPrefix + "-panel"} aria-selected={value === it.key} aria-label={it.ariaLabel} tabIndex={value === it.key ? 0 : -1} className="tab" onClick={() => onChange(it.key)}>{it.label}</button>
      ))}
    </div>
  );
}

export function TabPanel({ idPrefix, tab, children }: { idPrefix: string; tab: string; children: ReactNode }) {
  return <div role="tabpanel" id={idPrefix + "-panel"} aria-labelledby={idPrefix + "-tab-" + tab} className="tab-panel" key={tab}>{children}</div>;
}

/** «Toda la Fase Oro se disputa en el C1»: las fases finales usan un único campo. */
export function PhaseNote({ kind }: { kind: "Oro" | "Plata" }) {
  const { koField } = useEngine(), { t } = useLang();
  return <p className={"phase-note " + (kind === "Oro" ? "oro" : "plata")}><Icon name="pin" size={16} />{t(<span>Toda la Fase {kind} se disputa en el <b>C{koField(kind)}</b>.</span>, <span>{phaseName(kind, "eu")} osorik <b>Z{koField(kind)} zelaian</b> jokatzen da.</span>, <span>Toute la {phaseName(kind, "fr")} se joue sur le <b>T{koField(kind)}</b>.</span>)}</p>;
}

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <div className="empty">
      <Icon name={icon} size={28} />
      <b>{title}</b>
      {text && <p>{text}</p>}
    </div>
  );
}

export function LiveBadge() {
  const { t } = useLang();
  return <span className="live-badge"><i aria-hidden="true" />{t("En juego", "Jokoan", "En cours")}</span>;
}

/** showGroup: «Grupo X» en una fila debajo · groupAbove: «Grupo X» encima de la hora, en la columna central. */
export function MatchRow({ m, showGroup = false, groupAbove = false }: { m: Match; showGroup?: boolean; groupAbove?: boolean }) {
  const { T, matchState } = useEngine(), { t, lang } = useLang(), eu = lang === "eu";
  const st = matchState(m.time, m.hs !== null);
  const home = T(m.home).name, away = T(m.away).name;
  const label = st === "final" ? `${home} ${m.hs}, ${away} ${m.as}. ${t("Final", "Amaituta", "Terminé")}` : `${home} ${t("contra", "eta", "contre")} ${away}, ${m.time}, ${fieldName(m.field, lang)}`;
  return (
    <div className={"match-row is-" + st} role="group" aria-label={label}>
      <TeamLink id={m.home} className="match-team home"><span>{home}</span><Crest id={m.home} size={32} /></TeamLink>
      <div className="match-mid">
        {groupAbove && <small className="mid-group">{groupName(m.group, lang)}</small>}
        {st === "final" ? <><b className="score">{m.hs}<i>–</i>{m.as}</b><small>{t("Final", "Amaituta", "Terminé")}</small></>
          : st === "live" ? <><LiveBadge /><small>{fieldName(m.field, lang)}</small></>
          : st === "awaiting" ? <><b className="time">{m.time}</b><small>{t("Sin resultado", "Emaitzarik ez", "En attente")}</small></>
          : <><b className="time">{m.time}</b><small>{fieldName(m.field, lang)}</small></>}
      </div>
      <TeamLink id={m.away} className="match-team away"><Crest id={m.away} size={32} /><span>{away}</span></TeamLink>
      {showGroup && <span className="match-group">{groupName(m.group, lang)}</span>}
    </div>
  );
}

export function KOGameRow({ g }: { g: KOGame }) {
  const { T, matchState } = useEngine(), { lang } = useLang(), eu = lang === "eu";
  const r = g.result, valid = !!r && r.home_team === g.home && r.away_team === g.away;
  const tie = valid && r!.home_score === r!.away_score;
  return (
    <div className={"ko-row" + (g.round === "FINAL" ? " ko-final ko-" + (g.kind === "Oro" ? "gold" : "silver") : "")}>
      <div className="ko-meta"><b>{g.time}</b><small>{koCode(g.code, lang)} · {fieldInitial(lang)}{g.field}</small></div>
      {g.home ? <TeamLink id={g.home} className="ko-team"><Crest id={g.home} size={28} /><span>{T(g.home).name}</span></TeamLink> : <div className="ko-team"><i className="crest-ph" /><span className="tbd">{koLabel(g.homeLabel, lang)}</span></div>}
      <div className="ko-score">{g.round === "FINAL" && <CupMark size={20} className={"final-cup " + (g.kind === "Oro" ? "gold" : "silver")} />}{valid ? <b>{r!.home_score}{tie && r!.home_penalties != null && <span className="pen"> ({r!.home_penalties})</span>}<i>-</i>{tie && r!.away_penalties != null && <span className="pen">({r!.away_penalties}) </span>}{r!.away_score}</b> : g.home && g.away && matchState(g.time, false) === "live" ? <LiveBadge /> : <b className="dash">vs</b>}</div>
      {g.away ? <TeamLink id={g.away} className="ko-team away"><span>{T(g.away).name}</span><Crest id={g.away} size={28} /></TeamLink> : <div className="ko-team away"><span className="tbd">{koLabel(g.awayLabel, lang)}</span><i className="crest-ph" /></div>}
    </div>
  );
}
