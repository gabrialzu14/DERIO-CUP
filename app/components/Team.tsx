"use client";
import { Crest, KOGameRow, MatchRow } from "./ui";
import { EVENT, T, byTime, knockout, table, validKO, type Match, type ResultRow } from "../lib/tournament";

export function Team({ id, ms, koResults, back }: { id: string; ms: Match[]; koResults: Record<string, ResultRow>; back: () => void }) {
  const t = T(id), own = ms.filter(m => m.home === id || m.away === id).sort(byTime);
  const kos = (["Oro", "Plata"] as const).flatMap(k => knockout(k, ms, koResults)).filter(g => g.home === id || g.away === id).sort(byTime);
  const tb = table(t.group, ms), row = tb.find(x => x.id === id)!, pos = tb.indexOf(row) + 1;
  const played = own.filter(m => m.hs !== null).length + kos.filter(validKO).length;
  return (
    <div className="screen">
      <button type="button" className="back-btn" onClick={back}>‹ Inicio</button>
      <header className="team-hero">
        <Crest id={id} size={88} />
        <h1>{t.name}</h1>
        <p>{EVENT.category} · Grupo {t.group}</p>
      </header>
      <dl className="stats">
        <div><dt>Posición</dt><dd>{pos}º</dd></div>
        <div><dt>Puntos</dt><dd>{row.pts}</dd></div>
        <div><dt>Jugados</dt><dd>{played}</dd></div>
        <div><dt>Goles</dt><dd>{row.gf}<span>/{row.gc}</span></dd></div>
      </dl>
      <h2 className="list-title">Fase de grupos</h2>
      <div className="match-list">{own.map(m => <MatchRow key={m.id} m={m} />)}</div>
      {kos.length > 0 && <><h2 className="list-title">Fase final</h2><div className="ko-list">{kos.map(g => <KOGameRow key={g.id} g={g} />)}</div></>}
    </div>
  );
}
