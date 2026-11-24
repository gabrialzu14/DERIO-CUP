"use client";
import { useId, useState } from "react";
import { CupMark } from "./ui";
import { Icon } from "./icons";
import { BRAND, dateParts, daysUntil, type Tournament } from "../lib/tournament";

const when = (iso: string) => { const d = daysUntil(iso); return d <= 0 ? "Hoy" : d === 1 ? "Mañana" : `En ${d} días`; };

/** Pantalla previa: logo grande y torneos agrupados por fecha, desplegables. */
export function Landing({ tournaments, onSelect, themeButton }: { tournaments: Tournament[]; onSelect: (id: string) => void; themeButton: React.ReactNode }) {
  const dates = [...new Set(tournaments.map(t => t.date))].sort();
  const [open, setOpen] = useState<string | null>(dates[0] ?? null);
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
        {dates.length === 0 && (
          <div className="empty"><Icon name="calendar" size={28} /><b>No hay torneos próximos</b><p>Cuando se publique el siguiente aparecerá aquí.</p></div>
        )}
        {dates.map(d => {
          const list = tournaments.filter(t => t.date === d), p = dateParts(d), isOpen = open === d, pid = uid + "-p-" + d;
          return (
            <div key={d} className={"date-acc" + (isOpen ? " is-open" : "")}>
              <button type="button" className="date-head" aria-expanded={isOpen} aria-controls={pid} onClick={() => setOpen(isOpen ? null : d)}>
                <span className="date-tile"><b>{p.day}</b><small>{p.monthShort}</small></span>
                <span className="date-text"><b>{p.long}</b><small>{list.length === 1 ? "1 torneo" : list.length + " torneos"} · <em>{when(d)}</em></small></span>
                <Icon name="chevron" size={20} className="icon date-chev" />
              </button>
              <div className="date-panel" id={pid} role="region" aria-label={"Torneos del " + p.label} inert={!isOpen}>
                <div className="date-panel-in"><div className="date-list">
                  {list.map(t => (
                    <button key={t.id} type="button" className="tourney" onClick={() => onSelect(t.id)}>
                      <span className="tourney-cat">{t.category}</span>
                      <span className="tourney-text"><b>{BRAND} {t.category}</b><small>Temporada {t.season} · {t.teams.length} equipos · {t.venueShort}</small></span>
                      <Icon name="chevron" size={18} className="icon" />
                    </button>
                  ))}
                </div></div>
              </div>
            </div>
          );
        })}
      </section>
      <footer className="landing-foot">Organiza CD Derio · {tournaments[0]?.venue ?? "Ibaiondo"}</footer>
    </main>
  );
}
