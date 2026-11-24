"use client";
import { Crest, MatchRow, TabPanel, TeamLink, Tabs } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { GROUPS, byTime, type G, type Match } from "../lib/tournament";

export function Clasificacion({ group, setGroup, ms, onRules }: { group: G; setGroup: (g: G) => void; ms: Match[]; onRules: () => void }) {
  const { T, complete, table, zoneFor } = useEngine();
  const tb = table(group, ms), gm = ms.filter(m => m.group === group).sort(byTime);
  const rounds = [gm.slice(0, 2), gm.slice(2, 4), gm.slice(4, 6)];
  const done = complete(group, ms);
  return (
    <div className="screen">
      <div className="screen-title-row"><h1 className="screen-title">Clasificación</h1><button type="button" className="link-btn" onClick={onRules}><Icon name="rules" size={18} />Desempates</button></div>
      <Tabs label="Grupo" idPrefix="grupo" value={group} onChange={setGroup} items={GROUPS.map(g => ({ key: g, label: "Grupo " + g, ariaLabel: "Grupo " + g }))} />
      <TabPanel idPrefix="grupo" tab={group}>
        <div className="table-card" role="table" aria-label={"Clasificación del grupo " + group}>
          <div className="trow thead" role="row"><span role="columnheader" className="c-pos">#</span><span role="columnheader" className="c-team">Equipo</span><span role="columnheader" title="Partidos jugados">PJ</span><span role="columnheader" title="Goles a favor">GF</span><span role="columnheader" title="Goles en contra">GC</span><span role="columnheader" title="Diferencia de goles">DG</span><span role="columnheader" className="c-pts">Pts</span></div>
          {tb.map((r, i) => { const z = zoneFor(r.id, group, ms); return (
            <div key={r.id} role="row" className={"trow z-" + (done ? (i < 2 ? "oro" : "plata") : z ?? "none")}>
              <span role="cell" className="c-pos"><b>{i + 1}</b></span>
              <span role="cell" className="c-team"><TeamLink id={r.id} className="c-link"><Crest id={r.id} size={28} /><strong>{T(r.id).name}</strong>{z && !done && <em className={"badge " + z}>{z === "oro" ? "Oro" : "Plata"}</em>}</TeamLink></span>
              <span role="cell">{r.pj}</span><span role="cell">{r.gf}</span><span role="cell">{r.gc}</span><span role="cell">{r.dg > 0 ? "+" + r.dg : r.dg}</span><span role="cell" className="c-pts"><b>{r.pts}</b></span>
            </div>); })}
        </div>
        <div className="legend"><span><i className="dot gold" />Fase Oro (1.º y 2.º)</span><span><i className="dot silver" />Fase Plata (3.º y 4.º)</span>{done && <span className="done"><Icon name="check" size={14} />Grupo cerrado</span>}</div>
        {rounds.map((round, i) => (
          <section key={i} className="slot"><h3 className="slot-time">Jornada {i + 1}<small>{round[0]?.time}</small></h3><div className="match-list">{round.map(m => <MatchRow key={m.id} m={m} />)}</div></section>
        ))}
      </TabPanel>
    </div>
  );
}
