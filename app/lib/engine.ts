"use client";
import { createContext, useContext } from "react";
import { groupsOf, koWinner, madridNow, type G, type KOGame, type KOKind, type Match, type MatchState, type ResultRow, type Row, type Team, type Tournament } from "./tournament";

const minutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

/** Cálculos (clasificación, cuadro, estado de partido) ligados a un torneo concreto. */
export function makeEngine(tn: Tournament) {
  const GROUP_LIST: G[] = groupsOf(tn);
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

  /** Campo en el que se disputa toda una fase final. */
  const koField = (kind: KOKind) => (kind === "Oro" ? 1 : 2) as 1 | 2;

  function knockout(kind: KOKind, ms: Match[], results: Record<string, ResultRow>): KOGame[] {
    const field = koField(kind), k = kind.toLowerCase(), p = tn.idPrefix, oro = kind === "Oro";
    const game = (code: string, round: KOGame["round"], time: string, home: string | null, away: string | null, homeLabel: string, awayLabel: string): KOGame => {
      const id = p + k + "-" + code.toLowerCase();
      return { id, kind, round, code, time, field, home, away, homeLabel, awayLabel, result: results[id] };
    };
    // Torneos de 8 equipos (2 grupos): se empieza en semifinales, cruzando los grupos (A1–B2, B1–A2 / A3–B4, B3–A4).
    if (!tn.ko.cf) {
      const qs = oro ? [["A1", "B2"], ["B1", "A2"]] : [["A3", "B4"], ["B3", "A4"]];
      const sf = qs.map((q, i) => game("SF" + (i + 1), "SF", tn.ko.sf[i], seed(q[0], ms), seed(q[1], ms), q[0], q[1]));
      return [...sf, game("FINAL", "FINAL", tn.ko.final, koWinner(sf[0]), koWinner(sf[1]), "Ganador SF1", "Ganador SF2")];
    }
    const qs = oro ? [["A1", "B2"], ["B1", "A2"], ["C1", "D2"], ["D1", "C2"]] : [["A3", "B4"], ["B3", "A4"], ["C3", "D4"], ["D3", "C4"]];
    const cf = qs.map((q, i) => game("CF" + (i + 1), "CF", tn.ko.cf![i], seed(q[0], ms), seed(q[1], ms), q[0], q[1]));
    const sf = [
      game("SF1", "SF", tn.ko.sf[0], koWinner(cf[0]), koWinner(cf[2]), "Ganador CF1", "Ganador CF3"),
      game("SF2", "SF", tn.ko.sf[1], koWinner(cf[1]), koWinner(cf[3]), "Ganador CF2", "Ganador CF4"),
    ];
    return [...cf, ...sf, game("FINAL", "FINAL", tn.ko.final, koWinner(sf[0]), koWinner(sf[1]), "Ganador SF1", "Ganador SF2")];
  }

  /** Clave con la que se registra la afición de un equipo en este torneo. */
  const fanKey = (teamId: string) => (tn.idPrefix ? tn.idPrefix + teamId : teamId);
  const fanTeam = (key: string) => (tn.idPrefix ? (key.startsWith(tn.idPrefix) ? key.slice(tn.idPrefix.length) : null) : /^\d/.test(key) ? null : key);

  return { tn, groups: GROUP_LIST, T, teamIds, matches, owns, isGroupId, complete, table, zoneFor, matchState, knockout, koField, fanKey, fanTeam };
}

export type Engine = ReturnType<typeof makeEngine>;
export const EngineContext = createContext<Engine | null>(null);
export function useEngine() {
  const e = useContext(EngineContext);
  if (!e) throw new Error("useEngine fuera de un torneo");
  return e;
}

/** Abre el perfil de un equipo (lo provee TournamentApp; sin él los nombres no son pulsables). */
export const OpenTeamContext = createContext<((id: string) => void) | null>(null);
export const useOpenTeam = () => useContext(OpenTeamContext);
