"use client";
import { useState } from "react";
import { Crest, CupMark, KOGameRow, PhaseNote, TabPanel, TeamLink, Tabs } from "./ui";
import { useEngine } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { fieldName, koCode, koLabel, phaseName, roundName } from "../lib/labels";
import { byTime, koWinner, validKO, type KOGame, type KOKind, type Match, type ResultRow } from "../lib/tournament";

const ROUNDS = ["CF", "SF", "FINAL"] as const;

export function Fases({ kind, setKind, ms, koResults }: { kind: "oro" | "plata"; setKind: (k: "oro" | "plata") => void; ms: Match[]; koResults: Record<string, ResultRow> }) {
  const { T, knockout } = useEngine(), { t, lang } = useLang(), eu = lang === "eu";
  const K: KOKind = kind === "oro" ? "Oro" : "Plata";
  const games = knockout(K, ms, koResults), champ = koWinner(games.find(g => g.round === "FINAL")!);
  return (
    <div className="screen">
      <h1 className="screen-title">{t("Fases finales", "Azken faseak")}</h1>
      <Tabs label={t("Fase final", "Azken fasea")} idPrefix="fases" value={kind} onChange={setKind} items={[
        { key: "oro", label: <><i className="dot gold" aria-hidden="true" />{phaseName("Oro", eu)}</> }, { key: "plata", label: <><i className="dot silver" aria-hidden="true" />{phaseName("Plata", eu)}</> },
      ]} />
      <TabPanel idPrefix="fases" tab={kind}>
        <PhaseNote kind={K} />
        <p className="note">{kind === "oro" ? t("Pasan los dos primeros de cada grupo.", "Multzo bakoitzeko lehen bi taldeak pasatzen dira.") : t("Pasan el tercero y el cuarto de cada grupo.", "Multzo bakoitzeko hirugarrena eta laugarrena pasatzen dira.")}</p>
        {champ && <div className={"champion " + kind}><CupMark size={30} /><div><small>{eu ? `${phaseName(K, true)}ko txapeldun` : `Campeón Fase ${K}`}</small><b>{T(champ).name}</b></div><Crest id={champ} size={52} /></div>}
        <Bracket kind={K} games={games} />
      </TabPanel>
    </div>
  );
}

export function Bracket({ kind, games, compact = false }: { kind: KOKind; games: KOGame[]; compact?: boolean }) {
  const { t, lang } = useLang(), eu = lang === "eu";
  const [view, setView] = useState<"lista" | "cuadro">("lista");
  return (
    <div className="bracket-block">
      <Tabs variant="underline" label={t("Vista de la Fase ", "Ikuspegia: ") + phaseName(kind, eu)} idPrefix={"bk-" + kind + (compact ? "-c" : "")} value={view} onChange={setView} items={[{ key: "lista", label: t("Lista", "Zerrenda") }, { key: "cuadro", label: t("Cuadro", "Koadroa") }]} />
      <TabPanel idPrefix={"bk-" + kind + (compact ? "-c" : "")} tab={view}>
        {view === "lista"
          ? ROUNDS.map(r => { const gs = games.filter(g => g.round === r).sort(byTime); return (
              <section key={r} className="ko-round"><h3>{roundName(r, eu)}</h3><div className="ko-list">{gs.map(g => <KOGameRow key={g.id} g={g} />)}</div></section>); })
          : <div className="bk-scroll" tabIndex={0} role="region" aria-label={t("Cuadro de la Fase " + kind + ", desliza para ver todas las rondas", phaseName(kind, true) + "ren koadroa, irristatu txanda guztiak ikusteko")}>
              <div className="bk">
                {ROUNDS.map((r, ci) => (
                  <div key={r} className={"bk-head c" + (ci * 2 + 1)}><h3>{roundName(r, eu)}</h3></div>
                ))}
                {ROUNDS.map((r, ci) => (
                  <div key={r} className={"bk-games c" + (ci * 2 + 1)}>
                    {games.filter(g => g.round === r).sort((a, b) => (r === "CF" ? ["CF1", "CF3", "CF2", "CF4"].indexOf(a.code) - ["CF1", "CF3", "CF2", "CF4"].indexOf(b.code) : 0)).map(g => <BkGame key={g.id} g={g} />)}
                  </div>
                ))}
                {/* Conectores: cada pareja de partidos desemboca en el siguiente (coordenadas en % de la altura) */}
                <svg className="bk-conn c2" viewBox="0 0 28 100" preserveAspectRatio="none" aria-hidden="true"><path vectorEffect="non-scaling-stroke" d="M0 12.5H14V37.5H0M14 25H28M0 62.5H14V87.5H0M14 75H28" /></svg>
                <svg className="bk-conn c4" viewBox="0 0 28 100" preserveAspectRatio="none" aria-hidden="true"><path vectorEffect="non-scaling-stroke" d="M0 25H14V75H0M14 50H28" /></svg>
              </div>
            </div>}
      </TabPanel>
    </div>
  );
}

function BkGame({ g }: { g: KOGame }) {
  const { T } = useEngine(), { t: tr, lang } = useLang(), eu = lang === "eu";
  const valid = validKO(g), r = valid ? g.result : undefined, w = koWinner(g);
  const tie = !!r && r.home_score === r.away_score;
  const sides = [{ id: g.home, label: g.homeLabel, s: r?.home_score, p: r?.home_penalties }, { id: g.away, label: g.awayLabel, s: r?.away_score, p: r?.away_penalties }];
  return (
    <article className={"bk-game" + (g.round === "FINAL" ? " is-final " + (g.kind === "Oro" ? "gold" : "silver") : "")} aria-label={`${koCode(g.code, eu)}, ${g.time}, ${fieldName(g.field, eu)}`}>
      <header><b>{koCode(g.code, eu)}</b><span>{g.time} · {fieldName(g.field, eu)}</span></header>
      {sides.map((t, i) => {
        const state = w && t.id ? (w === t.id ? " win" : " out") : "";
        const inner = <>
          {t.id ? <Crest id={t.id} size={24} /> : <i className="crest-ph sm" />}
          <span className={t.id ? "" : "tbd"}>{t.id ? T(t.id).name : koLabel(t.label, eu)}</span>
          {state === " out" && <span className="sr-only">{tr("(eliminado)", "(kanporatua)")}</span>}
          <strong>{t.s ?? "–"}{tie && t.p != null && <span className="pen"> ({t.p})</span>}</strong>
        </>;
        return t.id ? <TeamLink key={i} id={t.id} className={"bk-team" + state}>{inner}</TeamLink> : <div key={i} className={"bk-team" + state}>{inner}</div>;
      })}
    </article>
  );
}
