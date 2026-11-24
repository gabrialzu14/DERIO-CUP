"use client";
import { Crest, CupMark } from "./ui";
import { Icon } from "./icons";
import { EVENT, GROUPS, TEAMS } from "../lib/tournament";

export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Cargando">
      <CupMark size={92} className="splash-cup" />
      <b>{EVENT.name}</b>
    </div>
  );
}

export function Welcome({ choosing, onPick, onNeutral }: { choosing: string | null; onPick: (id: string) => void; onNeutral: () => void }) {
  return (
    <main className="welcome">
      <header className="welcome-head">
        <CupMark size={64} />
        <h1>{EVENT.name}</h1>
        <p>{EVENT.category} · {EVENT.dateLabel}</p>
        <h2>¿Con quién vas?</h2>
        <small>Elige tu equipo para seguirlo de cerca. Puedes cambiarlo cuando quieras.</small>
      </header>
      {GROUPS.map(g => (
        <section key={g} aria-labelledby={"wg-" + g}>
          <h3 id={"wg-" + g} className="welcome-group">Grupo {g}</h3>
          <div className="team-grid">
            {TEAMS.filter(t => t.group === g).map(t => (
              <button key={t.id} type="button" className={"team-pick" + (choosing === t.id ? " is-chosen" : "") + (choosing && choosing !== t.id ? " is-dim" : "")} disabled={!!choosing} onClick={() => onPick(t.id)}>
                <Crest id={t.id} size={56} /><b>{t.name}</b>
                {choosing === t.id && <span className="chosen-mark"><Icon name="check" size={16} /></span>}
              </button>
            ))}
          </div>
        </section>
      ))}
      <button type="button" className="btn btn-ghost block" disabled={!!choosing} onClick={onNeutral}>Sin equipo · ver el torneo completo</button>
    </main>
  );
}
