"use client";
import { useState, type CSSProperties } from "react";
import { LOGO_PATHS, LOGO_VIEWBOX } from "../lib/logoPaths";
import { Crest, CupMark } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { clubTone } from "../lib/crests";
import { useLang } from "../lib/i18n";
import { BRAND, GROUPS, tournamentTag } from "../lib/tournament";

/** Pantalla de carga: el logo se dibuja trazo a trazo y se rellena mientras carga la app. */
export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Cargando">
      <svg className="splash-logo" viewBox={LOGO_VIEWBOX} aria-hidden="true">
        <path d={LOGO_PATHS.join("")} fillRule="evenodd" className="splash-fill" />
        {LOGO_PATHS.map((d, i) => <path key={i} d={d} pathLength={1} className="splash-path" style={{ "--i": i } as CSSProperties} />)}
      </svg>
      <b className="splash-name">DERIO<span>CUP</span></b>
      <span className="splash-bar" aria-hidden="true" />
    </div>
  );
}

/** Elección de equipo: se marca (con el color del club) y solo se entra al pulsar «Continuar». */
export function Welcome({ choosing, onPick, onNeutral, onBack }: { choosing: string | null; onPick: (id: string) => void; onNeutral: () => void; onBack: () => void }) {
  const { tn, T } = useEngine(), { t: tr, locale } = useLang();
  const [picked, setPicked] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null); // conserva el color del botón mientras se oculta
  const toggle = (id: string) => {
    if (choosing) return;
    const next = picked === id ? null : id;
    if (next) { navigator.vibrate?.(10); setLast(next); }
    setPicked(next);
  };
  const colors = (id: string) => { const tone = clubTone(T(id).crest ?? T(id).name, id); return { "--pk-bg": tone.bg, "--pk-fg": tone.fg } as CSSProperties; };
  return (
    <main className="welcome">
      <button type="button" className="back-btn" onClick={onBack} disabled={!!choosing}><Icon name="back" size={18} />{tr("Torneos", "Txapelketak")}</button>
      <header className="welcome-head">
        <CupMark size={64} />
        <h1>{BRAND}</h1>
        <p>{tournamentTag(tn, locale)}</p>
        <h2>{tr("¿Con quién vas?", "Zeinekin zoaz?")}</h2>
        <small>{tr("Elige tu equipo para seguirlo de cerca. Puedes cambiarlo cuando quieras.", "Aukeratu zure taldea gertutik jarraitzeko. Nahi duzunean alda dezakezu.")}</small>
      </header>
      {GROUPS.map(g => (
        <section key={g} aria-labelledby={"wg-" + g}>
          <h3 id={"wg-" + g} className="welcome-group">{tr(`Grupo ${g}`, `${g} multzoa`)}</h3>
          <div className="team-grid">
            {tn.teams.filter(t => t.group === g).map(t => (
              <button key={t.id} type="button" aria-pressed={picked === t.id} className={"team-pick" + (picked === t.id ? " is-picked" : "") + (choosing && picked !== t.id ? " is-dim" : "")} style={colors(t.id)} disabled={!!choosing} onClick={() => toggle(t.id)}>
                {picked === t.id && <span className="pick-ring" aria-hidden="true" />}
                <Crest id={t.id} size={56} />
                <b>{t.pick ?? t.name}</b>
                {picked === t.id && <span className="chosen-mark"><Icon name="check" size={16} /></span>}
              </button>
            ))}
          </div>
        </section>
      ))}
      <button type="button" className="btn btn-ghost block" disabled={!!choosing} onClick={onNeutral}>{tr("No tengo equipo", "Ez dut talderik")}</button>

      <div className="continue-bar" data-show={picked ? "true" : "false"} aria-hidden={!picked}>
        <button type="button" className="continue-btn" style={last ? colors(last) : undefined} tabIndex={picked ? 0 : -1} disabled={!picked || !!choosing} onClick={() => picked && onPick(picked)}>
          {tr("Continuar", "Jarraitu")}<Icon name="chevron" size={20} />
        </button>
      </div>
    </main>
  );
}
