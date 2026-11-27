"use client";
import { useState, type CSSProperties } from "react";
import { Icon } from "./icons";
import { clubTone } from "../lib/crests";
import { BrandName, Crest, CupMark, KOGameRow, PhaseNote, TeamLink, LiveBadge, MatchRow, SectionHead, TabPanel, Tabs } from "./ui";
import { Bracket } from "./Fases";
import { useEngine } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { fieldName, followers, groupName, koCode, koLabel, phaseName } from "../lib/labels";
import { BRAND, GROUPS, byTime, koWinner, madridNow, tournamentTag, validKO, type G, type KOGame, type KOKind, type Match, type ResultRow } from "../lib/tournament";
import type { TabId } from "./TournamentApp";

type Props = { ms: Match[]; koResults: Record<string, ResultRow>; selected: string; fanCounts: Record<string, number>; loaded: boolean; go: (t: TabId, o?: { group?: G; phase?: "oro" | "plata"; team?: string }) => void };

export function Home({ ms, koResults, selected, fanCounts, loaded, go }: Props) {
  const { tn, complete, knockout, matchState, table, teamIds } = useEngine(), { t, lang } = useLang(), eu = lang === "eu";
  const neutral = selected === "neutral";
  const groupsDone = GROUPS.every(g => complete(g, ms));
  const oro = knockout("Oro", ms, koResults), plata = knockout("Plata", ms, koResults);
  const live = ms.filter(m => matchState(m.time, m.hs !== null) === "live");
  const pending = ms.filter(m => m.hs === null).sort(byTime);
  const oroFinal = oro.find(g => g.round === "FINAL")!, plataFinal = plata.find(g => g.round === "FINAL")!;
  const finished = !!koWinner(oroFinal) && !!koWinner(plataFinal);
  const nextKO = [...oro, ...plata].filter(g => g.home && g.away && !validKO(g)).sort(byTime)[0];
  // Eliminatorias que se están jugando ahora (también cuentan como «En juego»).
  const koLive = [...oro, ...plata].filter(g => g.home && g.away && !validKO(g) && matchState(g.time, false) === "live");
  const [phase, setPhase] = useState<"grupos" | "oro" | "plata">("grupos");
  // Fase final que se abre de entrada: la del equipo seleccionado (si no sigue a ninguno, la Fase Oro); el usuario puede cambiarla
  const [koPick, setKoPick] = useState<"oro" | "plata" | null>(null);
  const inKO = (gs: KOGame[]) => gs.some(g => g.home === selected || g.away === selected);
  const koPhase = koPick ?? (!neutral && !inKO(oro) && inKO(plata) ? "plata" : "oro");
  const played = ms.filter(m => m.hs !== null).length;
  // «Primer partido» / «En juego»: todos los que empiezan a la misma hora (uno por campo).
  const asGame = (m: Match): HeroGame => ({ id: m.id, home: m.home, away: m.away, time: m.time, field: m.field, where: "g:" + m.group });
  const koGame = (g: KOGame): HeroGame => ({ id: g.id, home: g.home!, away: g.away!, time: g.time, field: g.field, where: "k:" + g.kind + " · " + g.code });
  const heroGames: HeroGame[] = live.length ? live.map(asGame) : koLive.length ? koLive.map(koGame) : pending.length ? pending.filter(m => m.time === pending[0].time).map(asGame) : nextKO ? [...oro, ...plata].filter(g => g.home && g.away && !validKO(g) && g.time === nextKO.time).map(koGame) : [];

  return (
    <div className="screen home">
      {finished ? <Podium oro={oroFinal} plata={plataFinal} /> : <MatchHero games={heroGames} kind={live.length || koLive.length ? "live" : "next"} loaded={loaded} />}

      {!neutral && <TeamCard id={selected} ms={ms} koResults={koResults} onOpen={() => go("equipo", { team: selected })} />}

      {groupsDone ? <section aria-labelledby="home-ko">
        <SectionHead title={t("Fases finales", "Azken faseak", "Phases finales")} cup />
        <h2 id="home-ko" className="sr-only">{t("Fases finales", "Azken faseak", "Phases finales")}</h2>
        <Tabs label={t("Fase final", "Azken fasea", "Phase finale")} idPrefix="home-ko" value={koPhase} onChange={setKoPick} items={[
          { key: "oro", label: <><i className="dot gold" aria-hidden="true" />{phaseName("Oro", lang)}</> }, { key: "plata", label: <><i className="dot silver" aria-hidden="true" />{phaseName("Plata", lang)}</> },
        ]} />
        <TabPanel idPrefix="home-ko" tab={koPhase}>
          <PhaseNote kind={koPhase === "oro" ? "Oro" : "Plata"} />
          <Bracket key={koPhase} kind={koPhase === "oro" ? "Oro" : "Plata"} games={koPhase === "oro" ? oro : plata} compact />
        </TabPanel>
      </section> : <section aria-labelledby="home-phases">
        <SectionHead title={t("Torneo", "Txapelketa", "Tournoi")} cup />
        <h2 id="home-phases" className="sr-only">{t("Fases del torneo", "Txapelketaren faseak", "Phases du tournoi")}</h2>
        <Tabs label={t("Fase del torneo", "Txapelketaren fasea", "Phase du tournoi")} idPrefix="home-phase" value={phase} onChange={setPhase} items={[
          { key: "grupos", label: t("Grupos", "Multzoak", "Groupes") }, { key: "oro", label: <><i className="dot gold" aria-hidden="true" />{t("Oro", "Urrea", "Or")}</> }, { key: "plata", label: <><i className="dot silver" aria-hidden="true" />{t("Plata", "Zilarra", "Argent")}</> },
        ]} />
        <TabPanel idPrefix="home-phase" tab={phase}>
          {phase === "grupos" ? <>
            <div className="progress-row"><div className="progress" role="progressbar" aria-label={t("Partidos de grupos jugados", "Jokatutako multzo-partidak", "Matchs de groupe joués")} aria-valuemin={0} aria-valuemax={ms.length} aria-valuenow={played}><span style={{ width: (played / ms.length) * 100 + "%" }} /></div><small>{played}/{ms.length} {t("partidos", "partida", "matchs")}</small></div>
            <div className="group-grid">
              {GROUPS.map(g => (
                <button key={g} type="button" className="group-card" onClick={() => go("clasificacion", { group: g })} aria-label={t(`Ver clasificación del grupo ${g}`, `Ikusi ${g} multzoaren sailkapena`, `Voir le classement du groupe ${g}`)}>
                  <span className="group-card-head"><b>{groupName(g, lang)}</b>{complete(g, ms) && <span className="done">{t("Finalizado", "Amaituta", "Terminé")}</span>}</span>
                  <span className="group-crests">{(complete(g, ms) || ms.some(m => m.group === g && m.hs !== null) ? table(g, ms).map(r => r.id) : teamIds(g)).map(id => <Crest key={id} id={id} size={32} />)}</span>
                </button>
              ))}
            </div>
          </> : <>
            <PhaseNote kind={phase === "oro" ? "Oro" : "Plata"} />
            <p className="note">{phase === "oro" ? t("Pasan los dos primeros de cada grupo.", "Multzo bakoitzeko lehen bi taldeak sailkatzen dira.", "Les deux premiers de chaque groupe se qualifient.") : t("Pasan el tercero y el cuarto de cada grupo.", "Multzo bakoitzeko hirugarren eta laugarren taldeak sailkatzen dira.", "Le troisième et le quatrième de chaque groupe se qualifient.")}</p>
            <Bracket kind={phase === "oro" ? "Oro" : "Plata"} games={phase === "oro" ? oro : plata} compact />
          </>}
        </TabPanel>
      </section>}

      {!finished && pending.length > 0 && <section>
        <SectionHead icon="ball" title={live.length ? t("A continuación", "Jarraian", "À suivre") : t("Próximos partidos", "Hurrengo partidak", "Prochains matchs")} action={{ label: t("Calendario", "Egutegia", "Programme"), onClick: () => go("partidos") }} />
        <div className="match-list">{pending.filter(m => !live.includes(m)).slice(0, 4).map(m => <MatchRow key={m.id} m={m} groupAbove />)}</div>
      </section>}

      <FanRanking counts={fanCounts} />
    </div>
  );
}

type HeroGame = { id: string; home: string; away: string; time: string; field: number; where: string };

/** Tarjeta de «Primer partido» / «En juego»: los partidos simultáneos, uno por campo, separados por una línea fina. */
function MatchHero({ games, kind, loaded }: { games: HeroGame[]; kind: "live" | "next"; loaded?: boolean }) {
  const { tn, T } = useEngine(), { t, lang, locale } = useLang(), eu = lang === "eu";
  const today = madridNow().date === tn.date;
  if (!games.length) return <section className="hero"><div className="hero-top"><span className="eyebrow">{tournamentTag(tn, locale)}</span></div><p className="hero-title">{loaded ? t("Fase de grupos finalizada", "Multzo-fasea amaitu da", "Phase de groupes terminée") : t("Cargando resultados…", "Emaitzak kargatzen…", "Chargement des scores…")}</p></section>;
  const where = (w: string) => (w.startsWith("g:") ? groupName(w.slice(2), lang) : phaseName(w.slice(2).split(" · ")[0] as KOKind, lang) + " · " + koCode(w.split(" · ")[1], lang));
  const sorted = [...games].sort((a, b) => a.field - b.field);
  const common = new Set(sorted.map(g => g.where)).size === 1; // mismo grupo en todas las columnas: se indica una sola vez, arriba a la derecha
  return (
    <section className={"hero" + (kind === "live" ? " hero-live" : "")} aria-label={kind === "live" ? t("Partidos en juego", "Jokoan dauden partidak", "Matchs en cours") : t("Próximo partido", "Hurrengo partida", "Prochain match")}>
      <div className="hero-top">{kind === "live" ? <span className="eyebrow live">{t("Ahora mismo", "Orain bertan", "En ce moment")}</span> : <span className="eyebrow">{today ? t("Próximo partido", "Hurrengo partida", "Prochain match") : t("Primer partido", "Lehen partida", "Premier match")}</span>}{common && <small className="hero-where">{where(sorted[0].where)}</small>}</div>
      <div className={"hero-cols" + (sorted.length > 1 ? " two" : "")}>
        {sorted.map((g, i) => (
          <div key={g.id} className="hero-col-wrap">
            {i > 0 && <span className="hero-rule" aria-hidden="true" />}
            <div className="hero-col">
              {!common && <small className={"hero-where" + (g.where.startsWith("k:Oro") ? " oro" : g.where.startsWith("k:Plata") ? " plata" : "")}>{where(g.where)}</small>}
              <small className="hero-field">{fieldName(g.field, lang)}</small>
              <div className="hero-pair">
                <TeamLink id={g.home} className="hero-team"><Crest id={g.home} size={48} /><b>{T(g.home).name}</b></TeamLink>
                <span className="hero-mid">{kind === "live" ? <LiveBadge /> : <b>{g.time}</b>}</span>
                <TeamLink id={g.away} className="hero-team"><Crest id={g.away} size={48} /><b>{T(g.away).name}</b></TeamLink>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Podium({ oro, plata }: { oro: KOGame; plata: KOGame }) {
  const { T } = useEngine(), { t, lang } = useLang(), eu = lang === "eu";
  const ow = koWinner(oro)!, pw = koWinner(plata)!;
  const ru = (g: KOGame, w: string) => (g.home === w ? g.away : g.home);
  const score = (g: KOGame) => { const r = g.result!; return r.home_penalties != null ? `${r.home_score} (${r.home_penalties}) - (${r.away_penalties}) ${r.away_score}` : `${r.home_score} - ${r.away_score}`; };
  const Cell = ({ kind, id, role, champ }: { kind: "gold" | "silver"; id: string | null; role: string; champ?: boolean }) => (
    id ? <TeamLink id={id} className={"podium-cell " + kind + (champ ? " champ" : "")}><small>{role}</small><span className="pod-crest"><Crest id={id} size={champ ? 56 : 44} />{champ && <CupMark size={30} className={"pod-cup " + kind} />}</span><b>{T(id).name}</b></TeamLink> : <div className={"podium-cell " + kind}><small>{role}</small><i className="crest-ph" /><b>—</b></div>
  );
  const Col = ({ kind, g, w }: { kind: "gold" | "silver"; g: KOGame; w: string }) => (
    <div className={"pod-col " + kind}>
      <Cell kind={kind} id={w} champ role={kind === "gold" ? t("Campeón Oro", "Urrezko txapelduna", "Vainqueur Or") : t("Campeón Plata", "Zilarrezko txapelduna", "Vainqueur Argent")} />
      <Cell kind={kind} id={ru(g, w)} role={kind === "gold" ? t("Subcampeón Oro", "Urrezko txapeldunordea", "Finaliste Or") : t("Subcampeón Plata", "Zilarrezko txapeldunordea", "Finaliste Argent")} />
      <div className={"pod-score " + kind}><small>{kind === "gold" ? t("Final Oro", "Urrezko finala", "Finale Or") : t("Final Plata", "Zilarrezko finala", "Finale Argent")}</small><b>{score(g)}</b></div>
    </div>
  );
  return (
    <section className="hero hero-final" aria-label={t("Resultados finales", "Azken emaitzak", "Palmarès")}>
      <div className="hero-top"><span className="eyebrow"><BrandName /> · {t("Finalizada", "Amaituta", "Terminée")}</span><CupMark size={26} /></div>
      <p className="hero-title">{t("Resultados finales", "Azken emaitzak", "Palmarès")}</p>
      <div className="podium cols"><Col kind="gold" g={oro} w={ow} /><Col kind="silver" g={plata} w={pw} /></div>
    </section>
  );
}

function TeamCard({ id, ms, koResults, onOpen }: { id: string; ms: Match[]; koResults: Record<string, ResultRow>; onOpen: () => void }) {
  const { T, knockout, matchState } = useEngine(), { t: tr, lang } = useLang(), eu = lang === "eu";
  const t = T(id), tone = clubTone(t.crest ?? t.name, id);
  // Próximo partido del equipo: primero los de grupos; si ya acabaron, su próxima eliminatoria.
  const groupNext = ms.filter(m => (m.home === id || m.away === id) && m.hs === null).sort(byTime)[0];
  const koNext = groupNext ? undefined : (["Oro", "Plata"] as const).flatMap(k => knockout(k, ms, koResults)).filter(g => (g.home === id || g.away === id) && !validKO(g)).sort(byTime)[0];
  const next = groupNext
    ? { time: groupNext.time, field: groupNext.field, opp: groupNext.home === id ? groupNext.away : groupNext.home, oppLabel: "", where: groupName(groupNext.group, lang), live: matchState(groupNext.time, false) === "live" }
    : koNext ? { time: koNext.time, field: koNext.field, opp: koNext.home === id ? koNext.away : koNext.home, oppLabel: koNext.home === id ? koNext.awayLabel : koNext.homeLabel, where: phaseName(koNext.kind, lang) + " · " + koCode(koNext.code, lang), live: matchState(koNext.time, false) === "live" } : null;
  const oppName = next ? (next.opp ? T(next.opp).name : koLabel(next.oppLabel, lang)) : "";
  // Sin partidos pendientes: su último partido de fase final dice cómo ha terminado (tarjeta reducida)
  const playedKO = next ? [] : (["Oro", "Plata"] as const).flatMap(k => knockout(k, ms, koResults)).filter(g => (g.home === id || g.away === id) && validKO(g)).sort(byTime);
  const last = playedKO[playedKO.length - 1];
  if (!next && last) {
    const won = koWinner(last) === id, r = last.result!;
    const status = last.round === "FINAL"
      ? (won ? tr("¡Campeón!", "Txapelduna!", "Vainqueur !") : tr("Subcampeón", "Txapeldunordea", "Finaliste"))
      : last.round === "SF" ? tr("Eliminado en semifinales", "Finalerdietan kanporatua", "Éliminé en demi-finales")
      : tr("Eliminado en cuartos de final", "Final-laurdenetan kanporatua", "Éliminé en quarts de finale");
    const pens = r.home_penalties != null && r.away_penalties != null ? ` (${tr("pen.", "pen.", "t.a.b.")} ${r.home_penalties}–${r.away_penalties})` : "";
    const line = `${koCode(last.code, lang)} · ${T(last.home!).name} ${r.home_score}–${r.away_score} ${T(last.away!).name}${pens}`;
    return (
      <button type="button" className={"team-card is-done" + (won && last.round === "FINAL" ? " is-champ" : "")} onClick={onOpen} aria-label={`${tr("Mi equipo", "Nire taldea", "Mon équipe")}: ${t.name}. ${status}, ${phaseName(last.kind, lang)}. ${line}`} style={{ "--tc-bg": tone.bg, "--tc-fg": tone.fg } as CSSProperties}>
        <span className="team-card-label"><span>{tr("Mi equipo", "Nire taldea", "Mon équipe")}</span><span className="team-card-where">{phaseName(last.kind, lang)}</span></span>
        <span className="done-row">
          <Crest id={id} size={44} />
          <span className="done-txt"><b>{t.name}</b><strong>{status}</strong><small>{line}</small></span>
          {won && last.round === "FINAL" && <CupMark size={30} />}
        </span>
      </button>
    );
  }
  return (
    <button type="button" className="team-card" onClick={onOpen} aria-label={next ? `${tr("Mi equipo", "Nire taldea", "Mon équipe")}: ${t.name} ${tr("contra", "eta", "contre")} ${oppName}, ${next.time}` : `${tr("Mi equipo", "Nire taldea", "Mon équipe")}: ${t.name}`} style={{ "--tc-bg": tone.bg, "--tc-fg": tone.fg } as CSSProperties}>
      <span className="team-card-label">
        {next?.live ? <LiveBadge /> : <span>{tr("Próximo partido", "Hurrengo partida", "Prochain match")}</span>}
        {next && <span className="team-card-where">{next.where}</span>}
      </span>
      {next ? (
        <span className="duel">
          <span className="duel-side"><Crest id={id} size={56} className="duel-crest" /><b>{t.name}</b></span>
          <span className="duel-mid"><b>{next.time}</b><small>{fieldName(next.field, lang)}</small></span>
          <span className="duel-side">{next.opp ? <Crest id={next.opp} size={56} className="duel-crest" /> : <i className="duel-ph" />}<b>{oppName}</b></span>
        </span>
      ) : <span className="next-none">{tr("No quedan partidos por jugar", "Ez dago jokatzeko partidarik", "Plus aucun match à jouer")}</span>}
    </button>
  );
}

function FanRanking({ counts }: { counts: Record<string, number> }) {
  const { T } = useEngine(), { t, lang } = useLang(), eu = lang === "eu";
  const list = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).filter(([id, n]) => n > 0 && !!T(id));
  if (!list.length) return (
    <section>
      <SectionHead title={t("Afición", "Zaleak", "Supporters")} icon="fans" />
      <p className="note">{t("Todavía no hay afición en este torneo. Los equipos más seguidos aparecerán aquí.", "Oraindik ez dago zalerik txapelketa honetan. Jarraitzaile gehien dituzten taldeak hemen agertuko dira.", "Pas encore de supporters dans ce tournoi. Les équipes les plus suivies apparaîtront ici.")}</p>
    </section>
  );
  return (
    <section>
      <SectionHead title={t("Afición", "Zaleak", "Supporters")} icon="fans" />
      <ol className="fans">
        {list.map(([id, n], i) => <li key={id}><TeamLink id={id} className="fan-row"><b className="rank">{i + 1}</b><Crest id={id} size={30} /><span>{T(id).name}</span><small>{followers(n, lang)}</small></TeamLink></li>)}
      </ol>
    </section>
  );
}
