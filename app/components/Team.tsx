"use client";
import { CSSProperties } from "react";
import { Crest, EmptyState, KOGameRow, MatchRow } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { clubTone } from "../lib/crests";
import { byTime, validKO, type G, type Match, type ResultRow } from "../lib/tournament";

/** Perfil de un equipo: posición, resultados y próximos partidos (también el de «Mi equipo»). */
export function Team({ id, ms, koResults, back, isMine, goGroup }: { id: string; ms: Match[]; koResults: Record<string, ResultRow>; back: () => void; isMine: boolean; goGroup: (g: G) => void }) {
  const { T, knockout, table } = useEngine();
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
      <button type="button" className="back-btn" onClick={back}><Icon name="back" size={18} />Volver</button>

      <header className="profile-hero" style={{ "--tc-bg": tone.bg, "--tc-fg": tone.fg } as CSSProperties}>
        <Crest id={id} size={84} className="profile-crest" />
        <div className="profile-name">
          <small>Grupo {t.group}{isMine ? " · Mi equipo" : ""}</small>
          <h1>{t.name}</h1>
          <p>{row.pj ? `${pos}.º de su grupo · ${row.pts} pts` : "Aún no ha jugado"}</p>
        </div>
      </header>

      <dl className="stats">
        <div><dt>Posición</dt><dd>{row.pj ? pos + "º" : "–"}</dd></div>
        <div><dt>Puntos</dt><dd>{row.pts}</dd></div>
        <div><dt>Jugados</dt><dd>{gamesPlayed}</dd></div>
        <div><dt>Dif. goles</dt><dd>{row.dg > 0 ? "+" + row.dg : row.dg}</dd></div>
      </dl>

      <section>
        <h2 className="list-title">Próximo partido</h2>
        {nextGroup ? <div className="match-list"><MatchRow m={nextGroup} /></div>
          : nextKO ? <div className="ko-list"><KOGameRow g={nextKO} /></div>
          : <p className="note">No quedan partidos por jugar.</p>}
      </section>

      <section>
        <h2 className="list-title">Resultados</h2>
        {played.length || koPlayed.length
          ? <div className="match-list">{played.map(m => <MatchRow key={m.id} m={m} />)}{koPlayed.map(g => <div key={g.id} className="ko-wrap"><KOGameRow g={g} /></div>)}</div>
          : <p className="note">Todavía no hay resultados.</p>}
      </section>

      {(pending.length > 1 || koPending.length > (nextKO ? 1 : 0)) && (
        <section>
          <h2 className="list-title">Próximos partidos</h2>
          <div className="match-list">
            {pending.slice(1).map(m => <MatchRow key={m.id} m={m} />)}
            {(nextGroup ? koPending : koPending.slice(1)).map(g => <div key={g.id} className="ko-wrap"><KOGameRow g={g} /></div>)}
          </div>
        </section>
      )}

      {!own.length && !kos.length && <EmptyState icon="ball" title="Sin partidos" />}

      <button type="button" className="btn btn-ghost block" onClick={() => goGroup(t.group)}>Ver clasificación del Grupo {t.group}<Icon name="chevron" size={18} /></button>
    </div>
  );
}
