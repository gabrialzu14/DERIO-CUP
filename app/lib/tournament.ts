/* Datos y lógica del torneo.
   Para la próxima edición basta con actualizar EVENT, TEAMS y SCHEDULE. */

export type G = "A" | "B" | "C" | "D";
export type Team = { id: string; name: string; group: G };
export type Match = { id: string; group: G; home: string; away: string; time: string; field: 1 | 2; hs: number | null; as: number | null };
export type ResultRow = { match_id: string; home_score: number; away_score: number; home_penalties: number | null; away_penalties: number | null; home_team?: string | null; away_team?: string | null; phase?: string | null; round?: string | null; updated_at?: string | null };
export type KOKind = "Oro" | "Plata";
export type KOGame = { id: string; kind: KOKind; round: "CF" | "SF" | "FINAL"; code: string; time: string; field: 1 | 2; home: string | null; away: string | null; homeLabel: string; awayLabel: string; result?: ResultRow };
export type Row = { id: string; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; dg: number; pts: number };
export type MatchState = "final" | "live" | "awaiting" | "pending";

export const EVENT = {
  name: "Derio Cup",
  category: "Benjamín 2017",
  date: "2026-09-20",
  dateLabel: "20 de septiembre",
  dateShort: "20 sept",
  dateLong: "Sábado 20 de septiembre",
  venue: "Instalaciones Deportivas de Ibaiondo",
  venueShort: "Ibaiondo",
  mapsUrl: "https://maps.app.goo.gl/q2zy9gfVQ1dPcaqS6",
  matchMinutes: 25,
  groupMatchCount: 24,
} as const;

export const GROUPS: G[] = ["A", "B", "C", "D"];

export const TEAMS: Team[] = [
  { id: "danok-a", name: "Danok Bat A", group: "A" }, { id: "portugalete", name: "Portugalete", group: "A" }, { id: "ermua", name: "Ermua Blues", group: "A" }, { id: "urduliz", name: "Urduliz", group: "A" },
  { id: "leioa", name: "Leioa", group: "B" }, { id: "indautxu", name: "Indautxu", group: "B" }, { id: "deusto", name: "Deusto", group: "B" }, { id: "etorkizuna", name: "Etorkizuna", group: "B" },
  { id: "santutxu", name: "Santutxu", group: "C" }, { id: "durango", name: "Cultural Durango", group: "C" }, { id: "arrupe", name: "Arrupe Chaminade", group: "C" }, { id: "derio", name: "Derio", group: "C" },
  { id: "danok-b", name: "Danok Bat B", group: "D" }, { id: "retuerto", name: "Retuerto", group: "D" }, { id: "ariznabarra", name: "Ariznabarra", group: "D" }, { id: "trapagaran", name: "Trapagaran", group: "D" },
];

const SCHEDULE: { time: string; field: 1 | 2; group: G; home: string; away: string }[] = [
  { time: "12:00", field: 1, group: "A", home: "danok-a", away: "portugalete" }, { time: "12:00", field: 2, group: "A", home: "ermua", away: "urduliz" },
  { time: "12:25", field: 1, group: "B", home: "leioa", away: "indautxu" }, { time: "12:25", field: 2, group: "B", home: "deusto", away: "etorkizuna" },
  { time: "12:50", field: 1, group: "C", home: "derio", away: "santutxu" }, { time: "12:50", field: 2, group: "C", home: "durango", away: "arrupe" },
  { time: "13:15", field: 1, group: "D", home: "trapagaran", away: "ariznabarra" }, { time: "13:15", field: 2, group: "D", home: "danok-b", away: "retuerto" },
  { time: "13:40", field: 1, group: "A", home: "danok-a", away: "ermua" }, { time: "13:40", field: 2, group: "A", home: "portugalete", away: "urduliz" },
  { time: "14:05", field: 1, group: "B", home: "leioa", away: "deusto" }, { time: "14:05", field: 2, group: "B", home: "indautxu", away: "etorkizuna" },
  { time: "14:30", field: 1, group: "C", home: "derio", away: "arrupe" }, { time: "14:30", field: 2, group: "C", home: "durango", away: "santutxu" },
  { time: "14:55", field: 1, group: "D", home: "retuerto", away: "ariznabarra" }, { time: "14:55", field: 2, group: "D", home: "danok-b", away: "trapagaran" },
  { time: "15:20", field: 1, group: "A", home: "ermua", away: "portugalete" }, { time: "15:20", field: 2, group: "A", home: "danok-a", away: "urduliz" },
  { time: "15:45", field: 1, group: "B", home: "leioa", away: "etorkizuna" }, { time: "15:45", field: 2, group: "B", home: "indautxu", away: "deusto" },
  { time: "16:10", field: 1, group: "C", home: "derio", away: "durango" }, { time: "16:10", field: 2, group: "C", home: "santutxu", away: "arrupe" },
  { time: "16:35", field: 1, group: "D", home: "retuerto", away: "trapagaran" }, { time: "16:35", field: 2, group: "D", home: "danok-b", away: "ariznabarra" },
];

// El id incluye hora y campo: es la clave con la que se guardan los resultados en Supabase.
export const MATCHES: Match[] = SCHEDULE.map(m => ({ ...m, id: "grupo-" + m.group + "-" + m.time.replace(":", "") + "-c" + m.field, hs: null, as: null }));

export const logo = (id: string) => "/" + id + ".png";
export const T = (id: string) => TEAMS.find(t => t.id === id)!;
export const teamIds = (g: G) => TEAMS.filter(t => t.group === g).map(t => t.id);
export const byTime = (a: { time: string }, b: { time: string }) => a.time.localeCompare(b.time);

export function table(g: G, ms: Match[]): Row[] {
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
    return h[b.id].p - h[a.id].p || h[b.id].dg - h[a.id].dg || h[b.id].gf - h[a.id].gf || b.dg - a.dg || b.gf - a.gf || T(a.id).name.localeCompare(T(b.id).name);
  });
}

export const complete = (g: G, ms: Match[]) => ms.filter(m => m.group === g).every(m => m.hs !== null && m.as !== null);
const minutes = (time: string) => { const [h, m] = time.split(":").map(Number); return h * 60 + m; };

export function tournamentNow() {
  const d = new Date();
  return { date: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"), mins: d.getHours() * 60 + d.getMinutes() };
}
export function matchState(time: string, done: boolean): MatchState {
  if (done) return "final";
  const n = tournamentNow();
  if (n.date !== EVENT.date) return "pending";
  const t = minutes(time);
  return n.mins >= t && n.mins < t + EVENT.matchMinutes ? "live" : n.mins >= t + EVENT.matchMinutes ? "awaiting" : "pending";
}

/** Si el grupo no ha terminado, indica si el equipo ya tiene Oro/Plata matemáticamente asegurado. */
export function zoneFor(id: string, g: G, ms: Match[]): "oro" | "plata" | null {
  const tb = table(g, ms), row = tb.find(x => x.id === id);
  if (!row) return null;
  if (complete(g, ms)) return tb.findIndex(x => x.id === id) < 2 ? "oro" : "plata";
  const others = tb.filter(x => x.id !== id), left = (x: Row) => 3 - x.pj, lo = row.pts, hi = row.pts + left(row) * 3;
  const definitelyAbove = others.filter(x => x.pts > hi).length, canReach = others.filter(x => x.pts + left(x) * 3 >= lo).length;
  if (canReach <= 1) return "oro";
  if (definitelyAbove >= 2) return "plata";
  return null;
}

export const validKO = (g: KOGame) => !!(g.result && g.home && g.away && g.result.home_team === g.home && g.result.away_team === g.away);
export function koWinner(g: KOGame) {
  if (!validKO(g)) return null;
  const r = g.result!;
  if (r.home_score > r.away_score) return g.home;
  if (r.away_score > r.home_score) return g.away;
  if (r.home_penalties == null || r.away_penalties == null) return null;
  return r.home_penalties > r.away_penalties ? g.home : g.away;
}
function seed(code: string, ms: Match[]) {
  const g = code[0] as G, n = Number(code[1]);
  if (!complete(g, ms)) return null;
  return table(g, ms)[n - 1]?.id || null;
}
export function knockout(kind: KOKind, ms: Match[], results: Record<string, ResultRow>): KOGame[] {
  const field = (kind === "Oro" ? 1 : 2) as 1 | 2, k = kind.toLowerCase();
  const qs = kind === "Oro" ? [["A1", "B2"], ["B1", "A2"], ["C1", "D2"], ["D1", "C2"]] : [["A3", "B4"], ["B3", "A4"], ["C3", "D4"], ["D3", "C4"]];
  const times = ["17:00", "17:25", "17:50", "18:15"];
  const cf: KOGame[] = qs.map((q, i) => ({ id: k + "-cf" + (i + 1), kind, round: "CF", code: "CF" + (i + 1), time: times[i], field, home: seed(q[0], ms), away: seed(q[1], ms), homeLabel: q[0], awayLabel: q[1], result: results[k + "-cf" + (i + 1)] }));
  const sf: KOGame[] = [
    { id: k + "-sf1", kind, round: "SF", code: "SF1", time: "18:40", field, home: koWinner(cf[0]), away: koWinner(cf[2]), homeLabel: "Ganador CF1", awayLabel: "Ganador CF3", result: results[k + "-sf1"] },
    { id: k + "-sf2", kind, round: "SF", code: "SF2", time: "19:05", field, home: koWinner(cf[1]), away: koWinner(cf[3]), homeLabel: "Ganador CF2", awayLabel: "Ganador CF4", result: results[k + "-sf2"] },
  ];
  const fin: KOGame = { id: k + "-final", kind, round: "FINAL", code: "FINAL", time: "19:30", field, home: koWinner(sf[0]), away: koWinner(sf[1]), homeLabel: "Ganador SF1", awayLabel: "Ganador SF2", result: results[k + "-final"] };
  return [...cf, ...sf, fin];
}

export const ROUND_LABEL = { CF: "Cuartos de final", SF: "Semifinales", FINAL: "Final" } as const;

/* ---------- Supabase (solo lectura pública con clave publishable) ---------- */
export const SB_URL = "https://qxhphzesbxlojcqjmswm.supabase.co";
export const SB_KEY = "sb_publishable_yg4zkg0KBqPXxymmXD8y3w_5hHwcRzy";
export const sbHeaders = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY };
