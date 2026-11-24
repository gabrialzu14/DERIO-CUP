"use client";
import { useState } from "react";
import { Icon } from "./icons";
import { Crest, CupMark, KOGameRow, LiveBadge, MatchRow, SectionHead, TabPanel, Tabs } from "./ui";
import { Bracket } from "./Fases";
import { EVENT, GROUPS, T, byTime, complete, knockout, koWinner, matchState, table, teamIds, tournamentNow, validKO, type G, type KOGame, type Match, type ResultRow } from "../lib/tournament";
import type { TabId } from "../page";

type Props = { ms: Match[]; koResults: Record<string, ResultRow>; selected: string; fanCounts: Record<string, number>; loaded: boolean; go: (t: TabId, o?: { group?: G; phase?: "oro" | "plata" }) => void };

export function Home({ ms, koResults, selected, fanCounts, loaded, go }: Props) {
  const neutral = selected === "neutral";
  const oro = knockout("Oro", ms, koResults), plata = knockout("Plata", ms, koResults);
  const live = ms.filter(m => matchState(m.time, m.hs !== null) === "live");
  const pending = ms.filter(m => m.hs === null).sort(byTime);
  const oroFinal = oro.find(g => g.round === "FINAL")!, plataFinal = plata.find(g => g.round === "FINAL")!;
  const finished = !!koWinner(oroFinal) && !!koWinner(plataFinal);
  const nextKO = [...oro, ...plata].filter(g => g.home && g.away && !validKO(g)).sort(byTime)[0];
  const [phase, setPhase] = useState<"grupos" | "oro" | "plata">("grupos");
  const played = ms.filter(m => m.hs !== null).length;

  return (
    <div className="screen home">
      {finished ? <Podium oro={oroFinal} plata={plataFinal} />
        : live.length ? <section className="hero hero-live" aria-label="Partidos en juego"><div className="hero-top"><LiveBadge /><span>{live.length === 1 ? "1 partido" : live.length + " partidos"}</span></div><div className="match-list flush">{live.map(m => <MatchRow key={m.id} m={m} showGroup />)}</div></section>
        : <NextHero match={pending[0]} ko={pending.length ? undefined : nextKO} loaded={loaded} />}

      {!neutral && <TeamCard id={selected} ms={ms} onOpen={() => go("mi")} />}

      <section aria-labelledby="home-phases">
        <SectionHead title="Torneo" />
        <h2 id="home-phases" className="sr-only">Fases del torneo</h2>
        <Tabs label="Fase del torneo" idPrefix="home-phase" value={phase} onChange={setPhase} items={[
          { key: "grupos", label: "Grupos" }, { key: "oro", label: <><i className="dot gold" aria-hidden="true" />Oro</> }, { key: "plata", label: <><i className="dot silver" aria-hidden="true" />Plata</> },
        ]} />
        <TabPanel idPrefix="home-phase" tab={phase}>
          {phase === "grupos" ? <>
            <div className="progress-row"><div className="progress" role="progressbar" aria-label="Partidos de grupos jugados" aria-valuemin={0} aria-valuemax={EVENT.groupMatchCount} aria-valuenow={played}><span style={{ width: (played / EVENT.groupMatchCount) * 100 + "%" }} /></div><small>{played}/{EVENT.groupMatchCount} partidos</small></div>
            <div className="group-grid">
              {GROUPS.map(g => (
                <button key={g} type="button" className="group-card" onClick={() => go("clasificacion", { group: g })} aria-label={"Ver clasificación del grupo " + g}>
                  <span className="group-card-head"><b>Grupo {g}</b>{complete(g, ms) && <span className="done"><Icon name="check" size={14} />Cerrado</span>}</span>
                  <span className="group-crests">{(complete(g, ms) || ms.some(m => m.group === g && m.hs !== null) ? table(g, ms).map(r => r.id) : teamIds(g)).map(id => <Crest key={id} id={id} size={32} />)}</span>
                </button>
              ))}
            </div>
          </> : <>
            <p className="note">{phase === "oro" ? "Pasan los dos primeros de cada grupo." : "Pasan el tercero y el cuarto de cada grupo."}</p>
            <Bracket kind={phase === "oro" ? "Oro" : "Plata"} games={phase === "oro" ? oro : plata} compact />
            <button type="button" className="btn btn-ghost block" onClick={() => go("fases", { phase })}>Ver fase {phase === "oro" ? "Oro" : "Plata"} completa<Icon name="chevron" size={18} /></button>
          </>}
        </TabPanel>
      </section>

      {!finished && pending.length > 0 && <section>
        <SectionHead title={live.length ? "A continuación" : "Próximos partidos"} action={{ label: "Calendario", onClick: () => go("partidos") }} />
        <div className="match-list">{pending.filter(m => !live.includes(m)).slice(0, 4).map(m => <MatchRow key={m.id} m={m} showGroup />)}</div>
      </section>}

      <FanRanking counts={fanCounts} />
    </div>
  );
}

function NextHero({ match, ko, loaded }: { match?: Match; ko?: KOGame; loaded: boolean }) {
  const n = tournamentNow();
  const today = n.date === EVENT.date;
  if (!match && !ko) return <section className="hero"><div className="hero-top"><span className="eyebrow">{EVENT.category}</span></div><p className="hero-title">{loaded ? "Fase de grupos finalizada" : "Cargando resultados…"}</p></section>;
  const home = match ? match.home : ko!.home, away = match ? match.away : ko!.away, time = match ? match.time : ko!.time, field = match ? match.field : ko!.field;
  return (
    <section className="hero" aria-label="Próximo partido">
      <div className="hero-top"><span className="eyebrow">{today ? "Próximo partido" : "Primer partido"}</span><span className="hero-when">{EVENT.dateShort} · {time}</span></div>
      <div className="hero-vs">
        <div><Crest id={home!} size={64} /><b>{T(home!).name}</b></div>
        <span className="hero-time">{time}</span>
        <div><Crest id={away!} size={64} /><b>{T(away!).name}</b></div>
      </div>
      <p className="hero-foot">{match ? "Grupo " + match.group : ko!.kind === "Oro" ? "Fase Oro · " + ko!.code : "Fase Plata · " + ko!.code} · Campo {field} · {EVENT.venueShort}</p>
    </section>
  );
}

function Podium({ oro, plata }: { oro: KOGame; plata: KOGame }) {
  const ow = koWinner(oro)!, pw = koWinner(plata)!;
  const ru = (g: KOGame, w: string) => (g.home === w ? g.away : g.home);
  const score = (g: KOGame) => { const r = g.result!; return r.home_penalties != null ? `${r.home_score} (${r.home_penalties}) - ${r.away_score} (${r.away_penalties})` : `${r.home_score} - ${r.away_score}`; };
  const Cell = ({ kind, id, role }: { kind: "gold" | "silver"; id: string | null; role: string }) => (
    <div className={"podium-cell " + kind}><small>{role}</small>{id ? <Crest id={id} size={52} /> : <i className="crest-ph" />}<b>{id ? T(id).name : "—"}</b></div>
  );
  return (
    <section className="hero hero-final" aria-label="Resultados finales">
      <div className="hero-top"><span className="eyebrow">{EVENT.name} · Finalizada</span><CupMark size={26} /></div>
      <p className="hero-title">Resultados finales</p>
      <div className="podium">
        <Cell kind="gold" id={ow} role="Campeón Oro" /><Cell kind="gold" id={ru(oro, ow)} role="Subcampeón Oro" />
        <Cell kind="silver" id={pw} role="Campeón Plata" /><Cell kind="silver" id={ru(plata, pw)} role="Subcampeón Plata" />
      </div>
      <dl className="finals"><div><dt>Final Oro</dt><dd>{score(oro)}</dd></div><div><dt>Final Plata</dt><dd>{score(plata)}</dd></div></dl>
    </section>
  );
}

function TeamCard({ id, ms, onOpen }: { id: string; ms: Match[]; onOpen: () => void }) {
  const t = T(id), own = ms.filter(m => m.home === id || m.away === id).sort(byTime);
  const last = [...own].reverse().find(m => m.hs !== null), next = own.find(m => m.hs === null);
  const tb = table(t.group, ms), pos = tb.findIndex(x => x.id === id) + 1, pts = tb.find(x => x.id === id)?.pts ?? 0;
  const res = (m: Match) => (m.home === id ? `${m.hs}–${m.as}` : `${m.as}–${m.hs}`) + " vs " + T(m.home === id ? m.away : m.home).name;
  return (
    <button type="button" className="team-card" onClick={onOpen} aria-label={"Mi equipo: " + t.name}>
      <Crest id={id} size={52} />
      <span className="team-card-main">
        <small>Mi equipo · Grupo {t.group}</small>
        <b>{t.name}</b>
        <span className="team-card-meta">
          <span><em>Último</em>{last ? res(last) : "—"}</span>
          <span><em>Próximo</em>{next ? next.time + " vs " + T(next.home === id ? next.away : next.home).name : "—"}</span>
        </span>
      </span>
      <span className="team-card-pos"><b>{pos}º</b><small>{pts} pts</small></span>
    </button>
  );
}

function FanRanking({ counts }: { counts: Record<string, number> }) {
  const list = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).filter(([id, n]) => n > 0 && !!T(id));
  if (!list.length) return null;
  return (
    <section>
      <SectionHead title="Afición" />
      <ol className="fans">
        {list.map(([id, n], i) => <li key={id}><b className="rank">{i + 1}</b><Crest id={id} size={30} /><span>{T(id).name}</span><small>{n} {n === 1 ? "seguidor" : "seguidores"}</small></li>)}
      </ol>
    </section>
  );
}
