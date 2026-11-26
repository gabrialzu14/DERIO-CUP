"use client";
import { useId, type CSSProperties } from "react";
import { CupMark } from "./ui";
import { LangToggle } from "./LanguageScreen";
import { Icon } from "./icons";
import { SPONSORS, sponsorAsset } from "../lib/sponsors";
import { pick, useLang, type Lang } from "../lib/i18n";
import { BRAND, dateParts, daysUntil, tournamentTag, type Tournament } from "../lib/tournament";

const when = (iso: string, lang: Lang) => { const d = daysUntil(iso); return pick(lang, d <= 0 ? "Hoy" : d === 1 ? "Mañana" : `En ${d} días`, d <= 0 ? "Gaur" : d === 1 ? "Bihar" : `${d} egun barru`, d <= 0 ? "Aujourd'hui" : d === 1 ? "Demain" : `Dans ${d} jours`); };

/** Pantalla previa: logo grande y la lista de próximos torneos (uno por día). */
export function Landing({ tournaments, onSelect, themeButton }: { tournaments: Tournament[]; onSelect: (id: string) => void; themeButton: React.ReactNode }) {
  const uid = useId(), { t: tr, lang, locale } = useLang();
  return (
    <main className="landing">
      <div className="landing-theme"><LangToggle /></div>
      <header className="landing-head">
        <CupMark size={150} className="landing-cup brand-grad" />
        <h1 className="wordmark"><b>DERIO</b><span>CUP</span></h1>
        <p>{tr("Organizado por el CD Derio", "CD Derio-k antolatua")}</p>
      </header>

      <section aria-labelledby={uid + "-t"} className="landing-list">
        <h2 id={uid + "-t"} className="list-title">{tr("Próximos torneos", "Hurrengo txapelketak")}</h2>
        {tournaments.length === 0 && (
          <div className="empty"><Icon name="calendar" size={28} /><b>{tr("No hay torneos próximos", "Ez dago txapelketarik laster")}</b><p>{tr("Cuando se publique el siguiente aparecerá aquí.", "Hurrengoa argitaratzen denean hemen agertuko da.")}</p></div>
        )}
        {tournaments.map(t => {
          const p = dateParts(t.date, locale);
          return (
            <button key={t.id} type="button" className="tourney-card" onClick={() => onSelect(t.id)} aria-label={`${BRAND} ${tournamentTag(t, locale)}`}>
              <span className={"date-tile" + (lang === "eu" ? " month-first" : "")}><b>{p.day}</b><small>{p.monthShort}</small></span>
              <span className="tourney-text">
                <b>{t.category}</b>
                <span className="when-pill"><i aria-hidden="true" />{when(t.date, lang)}</span>
              </span>
              <Icon name="chevron" size={20} className="icon" />
            </button>
          );
        })}
      </section>
      <section className="sponsors" aria-labelledby={uid + "-s"}>
        <span className="sponsors-rule" aria-hidden="true" />
        <h2 id={uid + "-s"} className="sponsors-label">{tr("Patrocinadores", "Babesleak")}</h2>
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
    </main>
  );
}
