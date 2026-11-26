"use client";
import { Crest, MatchRow, TabPanel, TeamLink, Tabs } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { groupName } from "../lib/labels";
import { GROUPS, byTime, type G, type Match } from "../lib/tournament";

export function Clasificacion({ group, setGroup, ms, onRules }: { group: G; setGroup: (g: G) => void; ms: Match[]; onRules: () => void }) {
  const { T, complete, table, zoneFor } = useEngine(), { t, lang } = useLang(), eu = lang === "eu";
  const tb = table(group, ms), gm = ms.filter(m => m.group === group).sort(byTime);
  const rounds = [gm.slice(0, 2), gm.slice(2, 4), gm.slice(4, 6)];
  const done = complete(group, ms);
  return (
    <div className="screen">
      <div className="screen-title-row"><h1 className="screen-title">{t("Clasificaciones", "Sailkapenak")}</h1><button type="button" className="link-btn" onClick={onRules}><Icon name="sort" size={18} strokeWidth={2.6} className="icon sort-ico" />{t("Desempates", "Berdinketak")}</button></div>
      <Tabs label={t("Grupo", "Multzoa")} idPrefix="grupo" value={group} onChange={setGroup} items={GROUPS.map(g => ({ key: g, label: groupName(g, lang), ariaLabel: groupName(g, lang) }))} />
      <TabPanel idPrefix="grupo" tab={group}>
        <GroupTable group={group} ms={ms} />
        {rounds.map((round, i) => (
          <section key={i} className="slot"><h3 className="slot-time">{t(`Jornada ${i + 1}`, `${i + 1}. jardunaldia`)}<small>{round[0]?.time}</small></h3><div className="match-list">{round.map(m => <MatchRow key={m.id} m={m} />)}</div></section>
        ))}
      </TabPanel>
    </div>
  );
}

/** Tabla de un grupo (también en el perfil de equipo, con ese equipo destacado). */
export function GroupTable({ group, ms, highlight }: { group: G; ms: Match[]; highlight?: string }) {
  const { T, complete, table, zoneFor } = useEngine(), { t } = useLang();
  const tb = table(group, ms), done = complete(group, ms);
  return (
    <>
        <div className="table-card" role="table" aria-label={t("Clasificación del grupo ", "Sailkapena, multzoa: ") + group}>
        <div className="trow thead" role="row"><span role="columnheader" className="c-pos">#</span><span role="columnheader" className="c-team">{t("Equipo", "Taldea")}</span><span role="columnheader" title={t("Partidos jugados", "Jokatutako partidak")}>{t("PJ", "JP")}</span><span role="columnheader" title={t("Goles a favor", "Golak alde")}>{t("GF", "GA")}</span><span role="columnheader" title={t("Goles en contra", "Golak kontra")}>{t("GC", "GK")}</span><span role="columnheader" title={t("Diferencia de goles", "Gol-diferentzia")}>{t("DG", "GD")}</span><span role="columnheader" className="c-pts">{t("Pts", "Pun.")}</span></div>
        {tb.map((r, i) => { const z = zoneFor(r.id, group, ms); return (
          <div key={r.id} role="row" className={"trow " + (i < 2 ? "p-oro" : "p-plata") + (r.id === highlight ? " is-me" : "")}>
            <span role="cell" className="c-pos"><b>{i + 1}</b></span>
            <span role="cell" className="c-team"><TeamLink id={r.id} className="c-link"><Crest id={r.id} size={28} /><strong>{T(r.id).name}</strong>{z && !done && <em className={"badge " + z}>{z === "oro" ? t("Oro", "Urrea") : t("Plata", "Zilarra")}</em>}</TeamLink></span>
            <span role="cell">{r.pj}</span><span role="cell">{r.gf}</span><span role="cell">{r.gc}</span><span role="cell">{r.dg > 0 ? "+" + r.dg : r.dg}</span><span role="cell" className="c-pts"><b>{r.pts}</b></span>
          </div>); })}
      </div>
      <div className="legend"><span><i className="dot gold" />{t("Fase Oro", "Urrezko fasea")}</span><span><i className="dot silver" />{t("Fase Plata", "Zilarrezko fasea")}</span>{done && <span className="done"><Icon name="check" size={14} />{t("Grupo cerrado", "Multzoa itxita")}</span>}</div>
    </>
  );
}
