"use client";
import { CSSProperties } from "react";
import { Crest, EmptyState, KOGameRow, MatchRow } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { groupName, phaseName, roundName } from "../lib/labels";
import { GroupTable } from "./Clasificacion";
import { clubTone } from "../lib/crests";
import { byTime, validKO, type G, type Match, type ResultRow } from "../lib/tournament";

/** Perfil de un equipo: posición, resultados y próximos partidos (también el de «Mi equipo»). */
export function Team({ id, ms, koResults, back, isMine, goGroup }: { id: string; ms: Match[]; koResults: Record<string, ResultRow>; back: () => void; isMine: boolean; goGroup: (g: G) => void }) {
  const { T, knockout, table } = useEngine(), { t: tr, lang } = useLang(), eu = lang === "eu";
  const t = T(id), tone = clubTone(t.crest ?? t.name, id);
  const own = ms.filter(m => m.home === id || m.away === id).sort(byTime);
  const kos = (["Oro", "Plata"] as const).flatMap(k => knockout(k, ms, koResults)).filter(g => g.home === id || g.away === id).sort(byTime);
  const tb = table(t.group, ms), row = tb.find(x => x.id === id)!, pos = tb.indexOf(row) + 1;
  const played = own.filter(m => m.hs !== null), pending = own.filter(m => m.hs === null);
  const koPending = kos.filter(g => !validKO(g)), koPlayed = kos.filter(validKO);
  const nextGroup = pending[0], nextKO = nextGroup ? undefined : koPending[0];
  const gamesPlayed = played.length + koPlayed.length;
  return (
    <div className="screen">
      <button type="button" className="back-btn" onClick={back}><Icon name="back" size={18} />{tr("Volver", "Atzera", "Retour")}</button>

      <header className="profile-hero" style={{ "--tc-bg": tone.bg, "--tc-fg": tone.fg } as CSSProperties}>
        <Crest id={id} size={84} className="profile-crest" />
        <div className="profile-name">
          <small>{groupName(t.group, lang)}{isMine ? tr(" · Mi equipo", " · Nire taldea", " · Mon équipe") : ""}</small>
          <h1>{t.name}</h1>
          <p>{row.pj ? tr(`${pos}.º de su grupo · ${row.pts} pts`, `Multzoko ${pos}.a · ${row.pts} puntu`, `${pos}${pos === 1 ? "er" : "e"} de son groupe · ${row.pts} pts`) : tr("Aún no ha jugado", "Oraindik ez du jokatu", "N’a pas encore joué")}</p>
        </div>
      </header>

      <dl className="stats">
        <div><dt>{tr("Posición", "Postua", "Rang")}</dt><dd>{row.pj ? tr(pos + "º", pos + ".", pos + (pos === 1 ? "er" : "e")) : "–"}</dd></div>
        <div><dt>{tr("Puntos", "Puntuak", "Points")}</dt><dd>{row.pts}</dd></div>
        <div><dt>{tr("Jugados", "Jokatuak", "Joués")}</dt><dd>{gamesPlayed}</dd></div>
        <div><dt>{tr("Dif. goles", "Gol-dif.", "Diff. buts")}</dt><dd>{row.dg > 0 ? "+" + row.dg : row.dg}</dd></div>
      </dl>

      <section>
        <h2 className="list-title">{tr("Fase de grupos", "Multzo-fasea", "Phase de groupes")}</h2>
        {own.length ? <div className="match-list">{own.map(m => <MatchRow key={m.id} m={m} />)}</div> : <EmptyState icon="ball" title={tr("Sin partidos", "Partidarik ez", "Aucun match")} />}
      </section>

      {kos.map(g => (
        <section key={g.id}>
          <h2 className="list-title">{phaseName(g.kind, lang)} · {roundName(g.round, lang)}</h2>
          <div className="ko-list"><KOGameRow g={g} /></div>
        </section>
      ))}

      <section>
        <h2 className="list-title">{tr(`Clasificación · Grupo ${t.group}`, `${t.group} multzoaren sailkapena`, `Classement · Groupe ${t.group}`)}</h2>
        <GroupTable group={t.group} ms={ms} highlight={id} />
      </section>

    </div>
  );
}
