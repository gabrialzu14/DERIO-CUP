"use client";
import { useState } from "react";
import { EmptyState, KOGameRow, MatchRow, TabPanel, Tabs } from "./ui";
import { useEngine } from "../lib/engine";
import { byTime, dateParts, type Match, type ResultRow } from "../lib/tournament";

type F = "todos" | "grupos" | "oro" | "plata";

export function Partidos({ ms, koResults }: { ms: Match[]; koResults: Record<string, ResultRow> }) {
  const { tn, knockout } = useEngine();
  const [f, setF] = useState<F>("todos");
  const slots = [...new Set(ms.map(m => m.time))].sort();
  const showGroups = f === "todos" || f === "grupos", showOro = f === "todos" || f === "oro", showPlata = f === "todos" || f === "plata";
  return (
    <div className="screen">
      <h1 className="screen-title">Partidos</h1>
      <p className="note">{dateParts(tn.date).long} · {tn.venueShort}</p>
      <Tabs label="Filtrar partidos" idPrefix="partidos" value={f} onChange={setF} items={[
        { key: "todos", label: "Todos" }, { key: "grupos", label: "Grupos" }, { key: "oro", label: <><i className="dot gold" aria-hidden="true" />Oro</> }, { key: "plata", label: <><i className="dot silver" aria-hidden="true" />Plata</> },
      ]} />
      <TabPanel idPrefix="partidos" tab={f}>
        {showGroups && <section><h2 className="list-title">Fase de grupos</h2>
          {slots.map(t => (
            <div key={t} className="slot"><h3 className="slot-time">{t}</h3><div className="match-list">{ms.filter(m => m.time === t).sort((a, b) => a.field - b.field).map(m => <MatchRow key={m.id} m={m} showGroup />)}</div></div>
          ))}</section>}
        {showOro && <section><h2 className="list-title"><i className="dot gold" aria-hidden="true" />Fase Oro</h2><div className="ko-list">{knockout("Oro", ms, koResults).sort(byTime).map(g => <KOGameRow key={g.id} g={g} />)}</div></section>}
        {showPlata && <section><h2 className="list-title"><i className="dot silver" aria-hidden="true" />Fase Plata</h2><div className="ko-list">{knockout("Plata", ms, koResults).sort(byTime).map(g => <KOGameRow key={g.id} g={g} />)}</div></section>}
        {!showGroups && !showOro && !showPlata && <EmptyState icon="ball" title="Sin partidos" />}
      </TabPanel>
    </div>
  );
}
