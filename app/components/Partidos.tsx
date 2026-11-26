"use client";
import { useState } from "react";
import { EmptyState, KOGameRow, MatchRow, TabPanel, Tabs } from "./ui";
import { useEngine } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { phaseName } from "../lib/labels";
import { byTime, dateParts, type Match, type ResultRow } from "../lib/tournament";

type F = "todos" | "grupos" | "oro" | "plata";

export function Partidos({ ms, koResults }: { ms: Match[]; koResults: Record<string, ResultRow> }) {
  const { tn, knockout } = useEngine(), { t: tr, lang, locale } = useLang(), eu = lang === "eu";
  const [f, setF] = useState<F>("todos");
  const slots = [...new Set(ms.map(m => m.time))].sort();
  const showGroups = f === "todos" || f === "grupos", showOro = f === "todos" || f === "oro", showPlata = f === "todos" || f === "plata";
  return (
    <div className="screen">
      <h1 className="screen-title">{tr("Partidos", "Partidak")}</h1>
      <p className="note">{dateParts(tn.date, locale).long} · {tn.venueShort}</p>
      <Tabs label={tr("Filtrar partidos", "Iragazi partidak")} idPrefix="partidos" value={f} onChange={setF} items={[
        { key: "todos", label: tr("Todos", "Guztiak") }, { key: "grupos", label: tr("Grupos", "Multzoak") }, { key: "oro", label: <><i className="dot gold" aria-hidden="true" />{tr("Oro", "Urrea")}</> }, { key: "plata", label: <><i className="dot silver" aria-hidden="true" />{tr("Plata", "Zilarra")}</> },
      ]} />
      <TabPanel idPrefix="partidos" tab={f}>
        {showGroups && <section><h2 className="list-title">{tr("Fase de grupos", "Multzo-fasea")}</h2>
          {slots.map(sl => (
            <div key={sl} className="slot"><h3 className="slot-time">{sl}</h3><div className="match-list">{ms.filter(m => m.time === sl).sort((a, b) => a.field - b.field).map(m => <MatchRow key={m.id} m={m} groupAbove />)}</div></div>
          ))}</section>}
        {showOro && <section><h2 className="list-title"><i className="dot gold" aria-hidden="true" />{phaseName("Oro", lang)}</h2><div className="ko-list">{knockout("Oro", ms, koResults).sort(byTime).map(g => <KOGameRow key={g.id} g={g} />)}</div></section>}
        {showPlata && <section><h2 className="list-title"><i className="dot silver" aria-hidden="true" />{phaseName("Plata", lang)}</h2><div className="ko-list">{knockout("Plata", ms, koResults).sort(byTime).map(g => <KOGameRow key={g.id} g={g} />)}</div></section>}
        {!showGroups && !showOro && !showPlata && <EmptyState icon="ball" title={tr("Sin partidos", "Partidarik ez")} />}
      </TabPanel>
    </div>
  );
}
