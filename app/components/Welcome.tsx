"use client";
import { useState, type CSSProperties } from "react";
import { Crest, CupMark } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { clubColor, readableOn } from "../lib/crests";
import { BRAND, GROUPS, tournamentTag } from "../lib/tournament";

export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Cargando">
      <CupMark size={92} className="splash-cup" />
      <b>{BRAND}</b>
    </div>
  );
}

/** Elección de equipo: se marca (con el color del club) y solo se entra al pulsar «Continuar». */
export function Welcome({ choosing, onPick, onNeutral, onBack }: { choosing: string | null; onPick: (id: string) => void; onNeutral: () => void; onBack: () => void }) {
  const { tn, T } = useEngine();
  const [picked, setPicked] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null); // conserva el color del botón mientras se oculta
  const toggle = (id: string) => {
    if (choosing) return;
    const next = picked === id ? null : id;
    if (next) { navigator.vibrate?.(10); setLast(next); }
    setPicked(next);
  };
  const colors = (id: string) => { const bg = clubColor(T(id).name, id); return { "--pk-bg": bg, "--pk-fg": readableOn(bg) } as CSSProperties; };
  return (
    <main className="welcome">
      <button type="button" className="back-btn" onClick={onBack} disabled={!!choosing}><Icon name="back" size={18} />Torneos</button>
      <header className="welcome-head">
        <CupMark size={64} />
        <h1>{BRAND}</h1>
        <p>{tournamentTag(tn)}</p>
        <h2>¿Con quién vas?</h2>
        <small>Elige tu equipo para seguirlo de cerca. Puedes cambiarlo cuando quieras.</small>
      </header>
      {GROUPS.map(g => (
        <section key={g} aria-labelledby={"wg-" + g}>
          <h3 id={"wg-" + g} className="welcome-group">Grupo {g}</h3>
          <div className="team-grid">
            {tn.teams.filter(t => t.group === g).map(t => (
              <button key={t.id} type="button" aria-pressed={picked === t.id} className={"team-pick" + (picked === t.id ? " is-picked" : "") + (choosing && picked !== t.id ? " is-dim" : "")} style={colors(t.id)} disabled={!!choosing} onClick={() => toggle(t.id)}>
                {picked === t.id && <span className="pick-ring" aria-hidden="true" />}
                <Crest id={t.id} size={56} />
                <b>{t.name}</b>
                {picked === t.id && <span className="chosen-mark"><Icon name="check" size={16} /></span>}
              </button>
            ))}
          </div>
        </section>
      ))}
      <button type="button" className="btn btn-ghost block" disabled={!!choosing} onClick={onNeutral}>No tengo equipo</button>

      <div className="continue-bar" data-show={picked ? "true" : "false"} aria-hidden={!picked}>
        <button type="button" className="continue-btn" style={last ? colors(last) : undefined} tabIndex={picked ? 0 : -1} disabled={!picked || !!choosing} onClick={() => picked && onPick(picked)}>
          Continuar<Icon name="chevron" size={20} />
        </button>
      </div>
    </main>
  );
}
