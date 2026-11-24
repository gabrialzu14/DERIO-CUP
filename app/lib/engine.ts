"use client";
import { createContext, useContext } from "react";
import { koWinner, madridNow, type G, type KOGame, type KOKind, type Match, type MatchState, type ResultRow, type Row, type Team, type Tournament } from "./tournament";

const GROUP_LIST: G[] = ["A", "B", "C", "D"];
const minutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

/** Cálculos (clasificación, cuadro, estado de partido) ligados a un torneo concreto. */
export function makeEngine(tn: Tournament) {
  const T = (id: string): Team => tn.teams.find(t => t.id === id)!;
  /** Empate total: se mantiene el orden del dossier (antes de jugar, la clasificación sigue el orden de la lista). */
  const order = (id: string) => tn.teams.findIndex(t => t.id === id);
  const teamIds = (g: G) => tn.teams.filter(t => t.group === g).map(t => t.id);
  const matches: Match[] = tn.schedule.map(m => ({ ...m, id: tn.idPrefix + "grupo-" + m.group + "-" + m.time.replace(":", "") + "-c" + m.field, hs: null, as: null }));

  /** ¿Este id de resultado pertenece a este torneo? (la edición original no lleva prefijo) */
  const owns = (id: string) => (tn.idPrefix ? id.startsWith(tn.idPrefix) : /^(grupo|oro|plata)-/.test(id));
  const isGroupId = (id: string) => id.slice(tn.idPrefix.length).startsWith("grupo-");

  const complete = (g: G, ms: Match[]) => ms.filter(m => m.group === g).every(m => m.hs !== null && m.as !== null);

  function table(g: G, ms: Match[]): Row[] {
    const r: Record<string, Row> = {};
    teamIds(g).forEach(id => (r[id] = { id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 }));
    const played = ms.filter(m => m.group === g && m.hs !== null && m.as !== null);
    played.forEach(m => {
      const a = r[m.home], b = r[m.away], h = m.hs!, v = m.as!;
      a.pj++; b.pj++; a.gf += h; a.gc += v; b.gf += v; b.gc += h;
      if (h > v) { a.pg++; a.pts += 3; b.pp++; } else if (v > h) { b.pg++; b.pts += 3; a.pp++; } else { a.pe++; b.pe++; a.pts++; b.pts++; }
    });
    Object.values(r).forEach(x => (x.dg = x.gf - x.gc));
    // Mini-liguilla entre empatados (partidos directos).
    const mini = (pool: Row[]) => {
      const s = new Set(pool.map(x => x.id)), z: Record<string, { p: number; dg: number; gf: number }> = {};
      pool.forEach(x => (z[x.id] = { p: 0, dg: 0, gf: 0 }));
      played.filter(m => s.has(m.home) && s.has(m.away)).forEach(m => {
        const a = z[m.home], b = z[m.away], h = m.hs!, v = m.as!;
        a.gf += h; a.dg += h - v; b.gf += v; b.dg += v - h;
        if (h > v) a.p += 3; else if (v > h) b.p += 3; else { a.p++; b.p++; }
      });
      return z;
    };
    const rows = Object.values(r);
    return rows.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      const h = mini(rows.filter(x => x.pts === a.pts));
      return h[b.id].p - h[a.id].p || h[b.id].dg - h[a.id].dg || h[b.id].gf - h[a.id].gf || b.dg - a.dg || b.gf - a.gf || order(a.id) - order(b.id);
    });
  }

  /** Si el grupo no ha terminado, indica si el equipo ya tiene Oro/Plata matemáticamente asegurado. */
  function zoneFor(id: string, g: G, ms: Match[]): "oro" | "plata" | null {
    const tb = table(g, ms), row = tb.find(x => x.id === id);
    if (!row) return null;
    if (complete(g, ms)) return tb.findIndex(x => x.id === id) < 2 ? "oro" : "plata";
    const others = tb.filter(x => x.id !== id), left = (x: Row) => 3 - x.pj, lo = row.pts, hi = row.pts + left(row) * 3;
    const definitelyAbove = others.filter(x => x.pts > hi).length, canReach = others.filter(x => x.pts + left(x) * 3 >= lo).length;
    if (canReach <= 1) return "oro";
    if (definitelyAbove >= 2) return "plata";
    return null;
  }

  function matchState(time: string, done: boolean): MatchState {
    if (done) return "final";
    const n = madridNow();
    if (n.date !== tn.date) return "pending";
    const t = minutes(time);
    return n.mins >= t && n.mins < t + tn.matchMinutes ? "live" : n.mins >= t + tn.matchMinutes ? "awaiting" : "pending";
  }

  function seed(code: string, ms: Match[]) {
    const g = code[0] as G, n = Number(code[1]);
    if (!complete(g, ms)) return null;
    return table(g, ms)[n - 1]?.id || null;
  }

  function knockout(kind: KOKind, ms: Match[], results: Record<string, ResultRow>): KOGame[] {
    const field = (kind === "Oro" ? 1 : 2) as 1 | 2, k = kind.toLowerCase(), p = tn.idPrefix;
    const qs = kind === "Oro" ? [["A1", "B2"], ["B1", "A2"], ["C1", "D2"], ["D1", "C2"]] : [["A3", "B4"], ["B3", "A4"], ["C3", "D4"], ["D3", "C4"]];
    const cf: KOGame[] = qs.map((q, i) => ({ id: p + k + "-cf" + (i + 1), kind, round: "CF", code: "CF" + (i + 1), time: tn.ko.cf[i], field, home: seed(q[0], ms), away: seed(q[1], ms), homeLabel: q[0], awayLabel: q[1], result: results[p + k + "-cf" + (i + 1)] }));
    const sf: KOGame[] = [
      { id: p + k + "-sf1", kind, round: "SF", code: "SF1", time: tn.ko.sf[0], field, home: koWinner(cf[0]), away: koWinner(cf[2]), homeLabel: "Ganador CF1", awayLabel: "Ganador CF3", result: results[p + k + "-sf1"] },
      { id: p + k + "-sf2", kind, round: "SF", code: "SF2", time: tn.ko.sf[1], field, home: koWinner(cf[1]), away: koWinner(cf[3]), homeLabel: "Ganador CF2", awayLabel: "Ganador CF4", result: results[p + k + "-sf2"] },
    ];
    const fin: KOGame = { id: p + k + "-final", kind, round: "FINAL", code: "FINAL", time: tn.ko.final, field, home: koWinner(sf[0]), away: koWinner(sf[1]), homeLabel: "Ganador SF1", awayLabel: "Ganador SF2", result: results[p + k + "-final"] };
    return [...cf, ...sf, fin];
  }

  /** Clave con la que se registra la afición de un equipo en este torneo. */
  const fanKey = (teamId: string) => (tn.idPrefix ? tn.idPrefix + teamId : teamId);
  const fanTeam = (key: string) => (tn.idPrefix ? (key.startsWith(tn.idPrefix) ? key.slice(tn.idPrefix.length) : null) : /^\d/.test(key) ? null : key);

  return { tn, groups: GROUP_LIST, T, teamIds, matches, owns, isGroupId, complete, table, zoneFor, matchState, knockout, fanKey, fanTeam };
}

export type Engine = ReturnType<typeof makeEngine>;
export const EngineContext = createContext<Engine | null>(null);
export function useEngine() {
  const e = useContext(EngineContext);
  if (!e) throw new Error("useEngine fuera de un torneo");
  return e;
}
