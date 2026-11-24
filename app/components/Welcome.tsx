"use client";
import { Crest, CupMark } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { BRAND, GROUPS, tournamentTag } from "../lib/tournament";

export function Splash() {
  return (
    <div className="splash" role="status" aria-label="Cargando">
      <CupMark size={92} className="splash-cup" />
      <b>{BRAND}</b>
    </div>
  );
}

/** Elección de equipo dentro de un torneo. */
export function Welcome({ choosing, onPick, onNeutral, onBack }: { choosing: string | null; onPick: (id: string) => void; onNeutral: () => void; onBack: () => void }) {
  const { tn } = useEngine();
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
