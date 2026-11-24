"use client";
import { CSSProperties } from "react";
import { Crest, EmptyState, KOGameRow, MatchRow } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { groupName } from "../lib/labels";
import { clubTone } from "../lib/crests";
import { byTime, validKO, type G, type Match, type ResultRow } from "../lib/tournament";

/** Perfil de un equipo: posición, resultados y próximos partidos (también el de «Mi equipo»). */
export function Team({ id, ms, koResults, back, isMine, goGroup }: { id: string; ms: Match[]; koResults: Record<string, ResultRow>; back: () => void; isMine: boolean; goGroup: (g: G) => void }) {
  const { T, knockout, table } = useEngine(), { t: tr, lang } = useLang(), eu = lang === "eu";
  const t = T(id), tone = clubTone(t.name, id);
  const own = ms.filter(m => m.home === id || m.away === id).sort(byTime);
  const kos = (["Oro", "Plata"] as const).flatMap(k => knockout(k, ms, koResults)).filter(g => g.home === id || g.away === id).sort(byTime);
  const tb = table(t.group, ms), row = tb.find(x => x.id === id)!, pos = tb.indexOf(row) + 1;
  const played = own.filter(m => m.hs !== null), pending = own.filter(m => m.hs === null);
  const koPending = kos.filter(g => !validKO(g)), koPlayed = kos.filter(validKO);
  const nextGroup = pending[0], nextKO = nextGroup ? undefined : koPending[0];
  const gamesPlayed = played.length + koPlayed.length;
  return (
    <div className="screen">
      <button type="button" className="back-btn" onClick={back}><Icon name="back" size={18} />{tr("Volver", "Atzera")}</button>

      <header className="profile-hero" style={{ "--tc-bg": tone.bg, "--tc-fg": tone.fg } as CSSProperties}>
        <Crest id={id} size={84} className="profile-crest" />
        <div className="profile-name">
          <small>{groupName(t.group, eu)}{isMine ? tr(" · Mi equipo", " · Nire taldea") : ""}</small>
          <h1>{t.name}</h1>
          <p>{row.pj ? (eu ? `${pos}. bere multzoan · ${row.pts} pun.` : `${pos}.º de su grupo · ${row.pts} pts`) : tr("Aún no ha jugado", "Oraindik ez du jokatu")}</p>
        </div>
      </header>

      <dl className="stats">
        <div><dt>{tr("Posición", "Postua")}</dt><dd>{row.pj ? pos + "º" : "–"}</dd></div>
        <div><dt>{tr("Puntos", "Puntuak")}</dt><dd>{row.pts}</dd></div>
        <div><dt>{tr("Jugados", "Jokatuak")}</dt><dd>{gamesPlayed}</dd></div>
        <div><dt>{tr("Dif. goles", "Gol-dif.")}</dt><dd>{row.dg > 0 ? "+" + row.dg : row.dg}</dd></div>
      </dl>

      <section>
        <h2 className="list-title">{tr("Próximo partido", "Hurrengo partida")}</h2>
        {nextGroup ? <div className="match-list"><MatchRow m={nextGroup} /></div>
          : nextKO ? <div className="ko-list"><KOGameRow g={nextKO} /></div>
          : <p className="note">{tr("No quedan partidos por jugar.", "Ez dago jokatzeko partidarik.")}</p>}
      </section>

      <section>
        <h2 className="list-title">{tr("Resultados", "Emaitzak")}</h2>
        {played.length || koPlayed.length
          ? <div className="match-list">{played.map(m => <MatchRow key={m.id} m={m} />)}{koPlayed.map(g => <div key={g.id} className="ko-wrap"><KOGameRow g={g} /></div>)}</div>
          : <p className="note">{tr("Todavía no hay resultados.", "Oraindik ez dago emaitzarik.")}</p>}
      </section>

      {(pending.length > 1 || koPending.length > (nextKO ? 1 : 0)) && (
        <section>
          <h2 className="list-title">{tr("Próximos partidos", "Hurrengo partidak")}</h2>
          <div className="match-list">
            {pending.slice(1).map(m => <MatchRow key={m.id} m={m} />)}
            {(nextGroup ? koPending : koPending.slice(1)).map(g => <div key={g.id} className="ko-wrap"><KOGameRow g={g} /></div>)}
          </div>
        </section>
      )}

      {!own.length && !kos.length && <EmptyState icon="ball" title={tr("Sin partidos", "Partidarik ez")} />}

      <button type="button" className="btn btn-ghost block" onClick={() => goGroup(t.group)}>{eu ? `Ikusi ${t.group} multzoaren sailkapena` : `Ver clasificación del Grupo ${t.group}`}<Icon name="chevron" size={18} /></button>
    </div>
  );
}
