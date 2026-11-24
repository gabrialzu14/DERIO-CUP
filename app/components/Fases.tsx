"use client";
import { useState } from "react";
import { Crest, CupMark, KOGameRow, TabPanel, Tabs } from "./ui";
import { useEngine } from "../lib/engine";
import { ROUND_LABEL, byTime, koWinner, validKO, type KOGame, type KOKind, type Match, type ResultRow } from "../lib/tournament";

const ROUNDS = ["CF", "SF", "FINAL"] as const;

export function Fases({ kind, setKind, ms, koResults }: { kind: "oro" | "plata"; setKind: (k: "oro" | "plata") => void; ms: Match[]; koResults: Record<string, ResultRow> }) {
  const { T, knockout } = useEngine();
  const K: KOKind = kind === "oro" ? "Oro" : "Plata";
  const games = knockout(K, ms, koResults), champ = koWinner(games.find(g => g.round === "FINAL")!);
  return (
    <div className="screen">
      <h1 className="screen-title">Fases finales</h1>
      <Tabs label="Fase final" idPrefix="fases" value={kind} onChange={setKind} items={[
        { key: "oro", label: <><i className="dot gold" aria-hidden="true" />Fase Oro</> }, { key: "plata", label: <><i className="dot silver" aria-hidden="true" />Fase Plata</> },
      ]} />
      <TabPanel idPrefix="fases" tab={kind}>
        <p className="note">{kind === "oro" ? "Cuartos, semifinales y final en el Campo 1. Pasan los dos primeros de cada grupo." : "Cuartos, semifinales y final en el Campo 2. Pasan el tercero y el cuarto de cada grupo."}</p>
        {champ && <div className={"champion " + kind}><CupMark size={30} /><div><small>Campeón Fase {K}</small><b>{T(champ).name}</b></div><Crest id={champ} size={52} /></div>}
        <Bracket kind={K} games={games} />
      </TabPanel>
    </div>
  );
}

export function Bracket({ kind, games, compact = false }: { kind: KOKind; games: KOGame[]; compact?: boolean }) {
  const [view, setView] = useState<"lista" | "cuadro">("lista");
  return (
    <div className="bracket-block">
      <Tabs variant="underline" label={"Vista de la Fase " + kind} idPrefix={"bk-" + kind + (compact ? "-c" : "")} value={view} onChange={setView} items={[{ key: "lista", label: "Lista" }, { key: "cuadro", label: "Cuadro" }]} />
      <TabPanel idPrefix={"bk-" + kind + (compact ? "-c" : "")} tab={view}>
        {view === "lista"
          ? ROUNDS.map(r => { const gs = games.filter(g => g.round === r).sort(byTime); return (
              <section key={r} className="ko-round"><h3>{ROUND_LABEL[r]}</h3><div className="ko-list">{gs.map(g => <KOGameRow key={g.id} g={g} />)}</div></section>); })
          : <div className="bk-scroll" tabIndex={0} role="region" aria-label={"Cuadro de la Fase " + kind + ", desliza para ver todas las rondas"}>
              <div className="bk">
                {ROUNDS.map(r => (
                  <div key={r} className={"bk-col bk-" + r.toLowerCase()}>
                    <h3>{ROUND_LABEL[r]}</h3>
                    <div className="bk-games">
                      {games.filter(g => g.round === r).sort((a, b) => (r === "CF" ? ["CF1", "CF3", "CF2", "CF4"].indexOf(a.code) - ["CF1", "CF3", "CF2", "CF4"].indexOf(b.code) : 0)).map(g => <BkGame key={g.id} g={g} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>}
      </TabPanel>
    </div>
  );
}

function BkGame({ g }: { g: KOGame }) {
  const { T } = useEngine();
  const valid = validKO(g), r = valid ? g.result : undefined, w = koWinner(g);
  const tie = !!r && r.home_score === r.away_score;
  const sides = [{ id: g.home, label: g.homeLabel, s: r?.home_score, p: r?.home_penalties }, { id: g.away, label: g.awayLabel, s: r?.away_score, p: r?.away_penalties }];
  return (
    <article className={"bk-game" + (g.round === "FINAL" ? " is-final" : "")} aria-label={`${g.code}, ${g.time}, campo ${g.field}`}>
      <header><b>{g.code}</b><span>{g.time} · Campo {g.field}</span></header>
      {sides.map((t, i) => {
        const state = w && t.id ? (w === t.id ? " win" : " out") : "";
        return (
          <div key={i} className={"bk-team" + state}>
            {t.id ? <Crest id={t.id} size={24} /> : <i className="crest-ph sm" />}
            <span className={t.id ? "" : "tbd"}>{t.id ? T(t.id).name : t.label}</span>
            {state === " out" && <span className="sr-only">(eliminado)</span>}
            <strong>{t.s ?? "–"}{tie && t.p != null && <span className="pen"> ({t.p})</span>}</strong>
          </div>
        );
      })}
    </article>
  );
}
