"use client";
import { useId, type CSSProperties } from "react";
import { CupMark } from "./ui";
import { Icon } from "./icons";
import { SPONSORS, sponsorAsset } from "../lib/sponsors";
import { BRAND, dateParts, daysUntil, tournamentTag, type Tournament } from "../lib/tournament";

const when = (iso: string) => { const d = daysUntil(iso); return d <= 0 ? "Hoy" : d === 1 ? "Mañana" : `En ${d} días`; };

/** Pantalla previa: logo grande y la lista de próximos torneos (uno por día). */
export function Landing({ tournaments, onSelect, themeButton }: { tournaments: Tournament[]; onSelect: (id: string) => void; themeButton: React.ReactNode }) {
  const uid = useId();
  return (
    <main className="landing">
      <div className="landing-theme">{themeButton}</div>
      <header className="landing-head">
        <CupMark size={150} className="landing-cup" />
        <h1 className="wordmark"><b>DERIO</b><span>CUP</span></h1>
        <p>Torneos de fútbol base · CD Derio</p>
      </header>

      <section aria-labelledby={uid + "-t"} className="landing-list">
        <h2 id={uid + "-t"} className="list-title">Próximos torneos</h2>
        {tournaments.length === 0 && (
          <div className="empty"><Icon name="calendar" size={28} /><b>No hay torneos próximos</b><p>Cuando se publique el siguiente aparecerá aquí.</p></div>
        )}
        {tournaments.map(t => {
          const p = dateParts(t.date);
          return (
            <button key={t.id} type="button" className="tourney-card" onClick={() => onSelect(t.id)} aria-label={`${BRAND} ${tournamentTag(t)}`}>
              <span className="date-tile"><b>{p.day}</b><small>{p.monthShort}</small></span>
              <span className="tourney-text">
                <b>{tournamentTag(t)}</b>
                <small>{p.long.split(" ")[0]} · {t.venue}</small>
                <small><em>{when(t.date)}</em> · {t.teams.length} equipos</small>
              </span>
              <Icon name="chevron" size={20} className="icon" />
            </button>
          );
        })}
      </section>
      <section className="sponsors" aria-labelledby={uid + "-s"}>
        <span className="sponsors-rule" aria-hidden="true" />
        <h2 id={uid + "-s"} className="sponsors-label">Patrocinadores</h2>
        <ul className="sponsors-list">
          {SPONSORS.map(s => {
            const asset = sponsorAsset(s.id);
            return (
              <li key={s.id}>
                {s.text || !asset
                  ? <span className="sponsor-text" style={{ "--h": s.height + "px" } as CSSProperties}>{s.text?.small && <small>{s.text.small}</small>}<b>{s.text?.main ?? s.name}</b></span>
                  : <span className="sponsor-logo" role="img" aria-label={s.name} style={{ "--h": s.height + "px", "--ar": asset.w / asset.h, "--src": `url(/patrocinadores/${s.id}.webp)` } as CSSProperties} />}
              </li>
            );
          })}
        </ul>
      </section>
      <footer className="landing-foot">Organiza CD Derio · {tournaments[0]?.venue ?? "Ibaiondo"}</footer>
    </main>
  );
}
