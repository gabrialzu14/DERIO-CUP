"use client";
import Image from "next/image";
import { useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { useEngine } from "../lib/engine";
import { crestFor, monoHue } from "../lib/crests";
import { BRAND, type KOGame, type Match } from "../lib/tournament";

const initials = (name: string) => { const w = name.split(/\s+/).filter(x => x && !/^\d+$/.test(x)); return (w.length > 1 ? w[0][0] + w[1][0] : name.slice(0, 2)).toUpperCase(); };

/** Escudo del equipo; si aún no hay imagen se muestra un monograma con color propio. */
export function Crest({ id, size = 36, className = "" }: { id: string; size?: number; className?: string }) {
  const { T } = useEngine(), t = T(id), src = t ? crestFor(t.name) : null;
  if (!src) return <span className={"crest mono " + className} style={{ "--s": size + "px", "--h": monoHue(id) } as CSSProperties} aria-hidden="true"><b>{initials(t?.name ?? id)}</b></span>;
  // Los originales son de 1024 × 1024; next/image sirve el tamaño justo para la densidad de pantalla (hasta 3×), en WebP calidad 100.
  return <Image className={"crest " + className} src={src} width={size} height={size} sizes={size + "px"} quality={100} alt="" />;
}

/** Trofeo de marca: se tiñe con el color del tema (el logo original es blanco). */
export function CupMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <span className={"cup-mark " + className} style={{ width: size, height: size * 1.1 }} role="img" aria-label={BRAND} />;
}

export function SectionHead({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {action && <button type="button" className="link-btn" onClick={action.onClick}>{action.label}<Icon name="chevron" size={16} /></button>}
    </div>
  );
}

/** Pestañas accesibles (role=tablist) con navegación por flechas. */
export function Tabs<K extends string>({ label, value, onChange, items, idPrefix, variant = "pill" }: { label: string; value: K; onChange: (k: K) => void; items: { key: K; label: ReactNode; ariaLabel?: string }[]; idPrefix: string; variant?: "pill" | "underline" }) {
  const ref = useRef<HTMLDivElement>(null);
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
      {items.map(it => (
        <button key={it.key} type="button" role="tab" id={idPrefix + "-tab-" + it.key} aria-controls={idPrefix + "-panel"} aria-selected={value === it.key} aria-label={it.ariaLabel} tabIndex={value === it.key ? 0 : -1} className="tab" onClick={() => onChange(it.key)}>{it.label}</button>
      ))}
    </div>
  );
}

export function TabPanel({ idPrefix, tab, children }: { idPrefix: string; tab: string; children: ReactNode }) {
  return <div role="tabpanel" id={idPrefix + "-panel"} aria-labelledby={idPrefix + "-tab-" + tab} className="tab-panel" key={tab}>{children}</div>;
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
  return <span className="live-badge"><i aria-hidden="true" />En juego</span>;
}

/** showGroup: «Grupo X» en una fila debajo · groupAbove: «Grupo X» encima de la hora, en la columna central. */
export function MatchRow({ m, showGroup = false, groupAbove = false }: { m: Match; showGroup?: boolean; groupAbove?: boolean }) {
  const { T, matchState } = useEngine();
  const st = matchState(m.time, m.hs !== null);
  const home = T(m.home).name, away = T(m.away).name;
  const label = st === "final" ? `${home} ${m.hs}, ${away} ${m.as}. Final` : `${home} contra ${away}, ${m.time}, campo ${m.field}`;
  return (
    <div className={"match-row is-" + st} role="group" aria-label={label}>
      <div className="match-team home"><span>{home}</span><Crest id={m.home} size={32} /></div>
      <div className="match-mid">
        {groupAbove && <small className="mid-group">Grupo {m.group}</small>}
        {st === "final" ? <><b className="score">{m.hs}<i>–</i>{m.as}</b><small>Final</small></>
          : st === "live" ? <><LiveBadge /><small>Campo {m.field}</small></>
          : st === "awaiting" ? <><b className="time">{m.time}</b><small>Sin resultado</small></>
          : <><b className="time">{m.time}</b><small>Campo {m.field}</small></>}
      </div>
      <div className="match-team away"><Crest id={m.away} size={32} /><span>{away}</span></div>
      {showGroup && <span className="match-group">Grupo {m.group}</span>}
    </div>
  );
}

export function KOGameRow({ g }: { g: KOGame }) {
  const { T } = useEngine();
  const r = g.result, valid = !!r && r.home_team === g.home && r.away_team === g.away;
  const tie = valid && r!.home_score === r!.away_score;
  return (
    <div className="ko-row">
      <div className="ko-meta"><b>{g.time}</b><small>{g.code} · C{g.field}</small></div>
      <div className="ko-team">{g.home ? <Crest id={g.home} size={28} /> : <i className="crest-ph" />}<span className={g.home ? "" : "tbd"}>{g.home ? T(g.home).name : g.homeLabel}</span></div>
      <div className="ko-score">{valid ? <b>{r!.home_score}{tie && r!.home_penalties != null && <span className="pen"> ({r!.home_penalties})</span>}<i>-</i>{tie && r!.away_penalties != null && <span className="pen">({r!.away_penalties}) </span>}{r!.away_score}</b> : <b className="dash">vs</b>}</div>
      <div className="ko-team away"><span className={g.away ? "" : "tbd"}>{g.away ? T(g.away).name : g.awayLabel}</span>{g.away ? <Crest id={g.away} size={28} /> : <i className="crest-ph" />}</div>
    </div>
  );
}
