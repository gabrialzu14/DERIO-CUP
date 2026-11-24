"use client";
import { useState, type CSSProperties } from "react";
import { Icon } from "./icons";
import { clubTone } from "../lib/crests";
import { Crest, CupMark, KOGameRow, PhaseNote, TeamLink, LiveBadge, MatchRow, SectionHead, TabPanel, Tabs } from "./ui";
import { Bracket } from "./Fases";
import { useEngine } from "../lib/engine";
import { BRAND, GROUPS, byTime, koWinner, madridNow, tournamentTag, validKO, type G, type KOGame, type Match, type ResultRow } from "../lib/tournament";
import type { TabId } from "./TournamentApp";

type Props = { ms: Match[]; koResults: Record<string, ResultRow>; selected: string; fanCounts: Record<string, number>; loaded: boolean; go: (t: TabId, o?: { group?: G; phase?: "oro" | "plata"; team?: string }) => void };

export function Home({ ms, koResults, selected, fanCounts, loaded, go }: Props) {
  const { tn, complete, knockout, matchState, table, teamIds } = useEngine();
  const neutral = selected === "neutral";
  const oro = knockout("Oro", ms, koResults), plata = knockout("Plata", ms, koResults);
  const live = ms.filter(m => matchState(m.time, m.hs !== null) === "live");
  const pending = ms.filter(m => m.hs === null).sort(byTime);
  const oroFinal = oro.find(g => g.round === "FINAL")!, plataFinal = plata.find(g => g.round === "FINAL")!;
  const finished = !!koWinner(oroFinal) && !!koWinner(plataFinal);
  const nextKO = [...oro, ...plata].filter(g => g.home && g.away && !validKO(g)).sort(byTime)[0];
  const [phase, setPhase] = useState<"grupos" | "oro" | "plata">("grupos");
  const played = ms.filter(m => m.hs !== null).length;
  // Partidos en juego (uno por campo): el de mi equipo va en su tarjeta, los demás en tarjetas blancas.
  const mine = (m: { home: string | null; away: string | null }) => !neutral && (m.home === selected || m.away === selected);
  const mineLive = live.find(mine), liveOthers = live.filter(m => m !== mineLive);
  const heroMatch = pending[0], heroKO = pending.length ? undefined : nextKO;
  const heroIsMine = !!(heroMatch ?? heroKO) && mine((heroMatch ?? heroKO)!); // si es el de mi equipo, ya sale en su tarjeta

  return (
    <div className="screen home">
      {finished ? <Podium oro={oroFinal} plata={plataFinal} /> : <>
        {liveOthers.map(m => <MatchHero key={m.id} match={m} kind="live" />)}
        {!live.length && !heroIsMine && <MatchHero match={heroMatch} ko={heroKO} kind="next" loaded={loaded} />}
      </>}

      {!neutral && <TeamCard id={selected} ms={ms} koResults={koResults} onOpen={() => go("equipo", { team: selected })} />}

      <section aria-labelledby="home-phases">
        <SectionHead title="Torneo" />
        <h2 id="home-phases" className="sr-only">Fases del torneo</h2>
        <Tabs label="Fase del torneo" idPrefix="home-phase" value={phase} onChange={setPhase} items={[
          { key: "grupos", label: "Grupos" }, { key: "oro", label: <><i className="dot gold" aria-hidden="true" />Oro</> }, { key: "plata", label: <><i className="dot silver" aria-hidden="true" />Plata</> },
        ]} />
        <TabPanel idPrefix="home-phase" tab={phase}>
          {phase === "grupos" ? <>
            <div className="progress-row"><div className="progress" role="progressbar" aria-label="Partidos de grupos jugados" aria-valuemin={0} aria-valuemax={ms.length} aria-valuenow={played}><span style={{ width: (played / ms.length) * 100 + "%" }} /></div><small>{played}/{ms.length} partidos</small></div>
            <div className="group-grid">
              {GROUPS.map(g => (
                <button key={g} type="button" className="group-card" onClick={() => go("clasificacion", { group: g })} aria-label={"Ver clasificación del grupo " + g}>
                  <span className="group-card-head"><b>Grupo {g}</b>{complete(g, ms) && <span className="done"><Icon name="check" size={14} />Cerrado</span>}</span>
                  <span className="group-crests">{(complete(g, ms) || ms.some(m => m.group === g && m.hs !== null) ? table(g, ms).map(r => r.id) : teamIds(g)).map(id => <Crest key={id} id={id} size={32} />)}</span>
                </button>
              ))}
            </div>
          </> : <>
            <PhaseNote kind={phase === "oro" ? "Oro" : "Plata"} />
            <p className="note">{phase === "oro" ? "Pasan los dos primeros de cada grupo." : "Pasan el tercero y el cuarto de cada grupo."}</p>
            <Bracket kind={phase === "oro" ? "Oro" : "Plata"} games={phase === "oro" ? oro : plata} compact />
            <button type="button" className="btn btn-ghost block" onClick={() => go("fases", { phase })}>Ver fase {phase === "oro" ? "Oro" : "Plata"} completa<Icon name="chevron" size={18} /></button>
          </>}
        </TabPanel>
      </section>

      {!finished && pending.length > 0 && <section>
        <SectionHead title={live.length ? "A continuación" : "Próximos partidos"} action={{ label: "Calendario", onClick: () => go("partidos") }} />
        <div className="match-list">{pending.filter(m => !live.includes(m)).slice(0, 4).map(m => <MatchRow key={m.id} m={m} groupAbove />)}</div>
      </section>}

      <FanRanking counts={fanCounts} />
    </div>
  );
}

function MatchHero({ match, ko, kind, loaded }: { match?: Match; ko?: KOGame; kind: "live" | "next"; loaded?: boolean }) {
  const { tn, T } = useEngine();
  const today = madridNow().date === tn.date;
  if (!match && !ko) return <section className="hero"><div className="hero-top"><span className="eyebrow">{tournamentTag(tn)}</span></div><p className="hero-title">{loaded ? "Fase de grupos finalizada" : "Cargando resultados…"}</p></section>;
  const home = match ? match.home : ko!.home, away = match ? match.away : ko!.away, time = match ? match.time : ko!.time, field = match ? match.field : ko!.field;
  const where = match ? "Grupo " + match.group : "Fase " + ko!.kind + " · " + ko!.code;
  return (
    <section className={"hero" + (kind === "live" ? " hero-live" : "")} aria-label={kind === "live" ? "Partido en juego" : "Próximo partido"}>
      <div className="hero-top">{kind === "live" ? <LiveBadge /> : <span className="eyebrow">{today ? "Próximo partido" : "Primer partido"}</span>}</div>
      <div className="hero-vs">
        <TeamLink id={home!} className="hero-team"><Crest id={home!} size={64} /><b>{T(home!).name}</b></TeamLink>
        <span className="hero-mid"><small>{where}</small><b className="hero-time">{time}</b><small>Campo {field}</small></span>
        <TeamLink id={away!} className="hero-team"><Crest id={away!} size={64} /><b>{T(away!).name}</b></TeamLink>
      </div>
    </section>
  );
}

function Podium({ oro, plata }: { oro: KOGame; plata: KOGame }) {
  const { T } = useEngine();
  const ow = koWinner(oro)!, pw = koWinner(plata)!;
  const ru = (g: KOGame, w: string) => (g.home === w ? g.away : g.home);
  const score = (g: KOGame) => { const r = g.result!; return r.home_penalties != null ? `${r.home_score} (${r.home_penalties}) - (${r.away_penalties}) ${r.away_score}` : `${r.home_score} - ${r.away_score}`; };
  const Cell = ({ kind, id, role }: { kind: "gold" | "silver"; id: string | null; role: string }) => (
    id ? <TeamLink id={id} className={"podium-cell " + kind}><small>{role}</small><Crest id={id} size={52} /><b>{T(id).name}</b></TeamLink> : <div className={"podium-cell " + kind}><small>{role}</small><i className="crest-ph" /><b>—</b></div>
  );
  return (
    <section className="hero hero-final" aria-label="Resultados finales">
      <div className="hero-top"><span className="eyebrow">{BRAND} · Finalizada</span><CupMark size={26} /></div>
      <p className="hero-title">Resultados finales</p>
      <div className="podium">
        <Cell kind="gold" id={ow} role="Campeón Oro" /><Cell kind="gold" id={ru(oro, ow)} role="Subcampeón Oro" />
        <Cell kind="silver" id={pw} role="Campeón Plata" /><Cell kind="silver" id={ru(plata, pw)} role="Subcampeón Plata" />
      </div>
      <dl className="finals"><div><dt>Final Oro</dt><dd>{score(oro)}</dd></div><div><dt>Final Plata</dt><dd>{score(plata)}</dd></div></dl>
    </section>
  );
}

function TeamCard({ id, ms, koResults, onOpen }: { id: string; ms: Match[]; koResults: Record<string, ResultRow>; onOpen: () => void }) {
  const { T, knockout, matchState } = useEngine();
  const t = T(id), tone = clubTone(t.name, id);
  // Próximo partido del equipo: primero los de grupos; si ya acabaron, su próxima eliminatoria.
  const groupNext = ms.filter(m => (m.home === id || m.away === id) && m.hs === null).sort(byTime)[0];
  const koNext = groupNext ? undefined : (["Oro", "Plata"] as const).flatMap(k => knockout(k, ms, koResults)).filter(g => (g.home === id || g.away === id) && !validKO(g)).sort(byTime)[0];
  const next = groupNext
    ? { time: groupNext.time, field: groupNext.field, opp: groupNext.home === id ? groupNext.away : groupNext.home, oppLabel: "", where: "Grupo " + groupNext.group, live: matchState(groupNext.time, false) === "live" }
    : koNext ? { time: koNext.time, field: koNext.field, opp: koNext.home === id ? koNext.away : koNext.home, oppLabel: koNext.home === id ? koNext.awayLabel : koNext.homeLabel, where: "Fase " + koNext.kind + " · " + koNext.code, live: false } : null;
  const oppName = next ? (next.opp ? T(next.opp).name : next.oppLabel) : "";
  return (
    <button type="button" className="team-card" onClick={onOpen} aria-label={next ? `Mi equipo: ${t.name} contra ${oppName}, ${next.time}` : "Mi equipo: " + t.name} style={{ "--tc-bg": tone.bg, "--tc-fg": tone.fg } as CSSProperties}>
      <span className="team-card-label">
        {next?.live ? <LiveBadge /> : <span>Próximo partido</span>}
        <Icon name="chevron" size={18} className="icon" />
      </span>
      {next ? (
        <span className="duel">
          <span className="duel-side"><Crest id={id} size={56} className="duel-crest" /><b>{t.name}</b></span>
          <span className="duel-mid"><small>{next.where}</small><b>{next.time}</b><small>Campo {next.field}</small></span>
          <span className="duel-side">{next.opp ? <Crest id={next.opp} size={56} className="duel-crest" /> : <i className="duel-ph" />}<b>{oppName}</b></span>
        </span>
      ) : <span className="next-none">No quedan partidos por jugar</span>}
    </button>
  );
}

function FanRanking({ counts }: { counts: Record<string, number> }) {
  const { T } = useEngine();
  const list = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).filter(([id, n]) => n > 0 && !!T(id));
  if (!list.length) return (
    <section>
      <SectionHead title="Afición" icon="fans" />
      <p className="note">Todavía no hay afición en este torneo. Los equipos más seguidos aparecerán aquí.</p>
    </section>
  );
  return (
    <section>
      <SectionHead title="Afición" icon="fans" />
      <ol className="fans">
        {list.map(([id, n], i) => <li key={id}><TeamLink id={id} className="fan-row"><b className="rank">{i + 1}</b><Crest id={id} size={30} /><span>{T(id).name}</span><small>{n} {n === 1 ? "seguidor" : "seguidores"}</small></TeamLink></li>)}
      </ol>
    </section>
  );
}
