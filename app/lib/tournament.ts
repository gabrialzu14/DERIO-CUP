/* Tipos y utilidades comunes a todos los torneos.
   Los datos de cada edición viven en editions.tsx; la lógica de cálculo, en engine.ts. */

export type G = "A" | "B" | "C" | "D";
export type Team = { id: string; name: string; group: G; /** Nombre del club para buscar su escudo y color (si difiere de `name`). */ crest?: string; /** Nombre largo al elegir equipo. */ pick?: string };
export type Match = { id: string; group: G; home: string; away: string; time: string; field: 1 | 2; hs: number | null; as: number | null };
export type ResultRow = { match_id: string; home_score: number; away_score: number; home_penalties: number | null; away_penalties: number | null; home_team?: string | null; away_team?: string | null; phase?: string | null; round?: string | null; updated_at?: string | null };
export type KOKind = "Oro" | "Plata";
export type KOGame = { id: string; kind: KOKind; round: "CF" | "SF" | "FINAL"; code: string; time: string; field: 1 | 2; home: string | null; away: string | null; homeLabel: string; awayLabel: string; result?: ResultRow };
export type Row = { id: string; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; dg: number; pts: number };
export type MatchState = "final" | "live" | "awaiting" | "pending";

export type GroupMatchDef = { time: string; field: 1 | 2; group: G; home: string; away: string };

export type InfoSpec = {
  intro: string;
  /** Duración de cada partido en minutos. */
  minutes: number;
  penaltyRule: string;
  tiebreaks: string[];
  rules: string[];
  warning: string;
  meals?: { price: string; includes: string; contact?: string };
  bar: string;
  wc?: string;
  /** Imágenes del plano de la sede y de los aparcamientos (rutas en /public). */
  venueImage?: { src: string; alt: string };
  parking?: { src: string; title: string; alt: string }[];
};

export type Tournament = {
  /** Identificador estable (también prefija los resultados en Supabase). */
  id: string;
  name: string;
  /** Categoría que se muestra, p. ej. «2015» o «Benjamín 2017». */
  category: string;
  season: string;
  /** Fecha del torneo (YYYY-MM-DD, hora de Madrid). Pasado ese día se oculta de la lista. */
  date: string;
  venue: string;
  /** Nombre de la sede en euskera y en francés. */
  venueEu?: string;
  venueFr?: string;
  venueShort: string;
  mapsUrl: string;
  /** Minutos entre el inicio de un partido y el siguiente (20 de juego + cambio). */
  matchMinutes: number;
  /** Prefijo de los ids de resultados en Supabase. Vacío solo en la edición original. */
  idPrefix: string;
  teams: Team[];
  schedule: GroupMatchDef[];
  ko: { cf: string[]; sf: string[]; final: string };
  info: InfoSpec;
  /** Versión en euskera de los textos informativos. */
  infoEu?: InfoSpec;
  /** Versión en francés de los textos informativos. */
  infoFr?: InfoSpec;
};

export const GROUPS: G[] = ["A", "B", "C", "D"];
export const ROUND_LABEL = { CF: "Cuartos de final", SF: "Semifinales", FINAL: "Final" } as const;
export const BRAND = "Derio Cup";

export const byTime = (a: { time: string }, b: { time: string }) => a.time.localeCompare(b.time);
export const validKO = (g: KOGame) => !!(g.result && g.home && g.away && g.result.home_team === g.home && g.result.away_team === g.away);
export function koWinner(g: KOGame) {
  if (!validKO(g)) return null;
  const r = g.result!;
  if (r.home_score > r.away_score) return g.home;
  if (r.away_score > r.home_score) return g.away;
  if (r.home_penalties == null || r.away_penalties == null) return null;
  return r.home_penalties > r.away_penalties ? g.home : g.away;
}

/* ---------- Fechas (siempre en hora de Madrid) ---------- */
export function madridNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date()).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, mins: Number(parts.hour) * 60 + Number(parts.minute) };
}
const at = (iso: string) => new Date(iso + "T12:00:00");
const EU_MONTHS = ["urtarrila", "otsaila", "martxoa", "apirila", "maiatza", "ekaina", "uztaila", "abuztua", "iraila", "urria", "azaroa", "abendua"];
const EU_DAYS = ["Igandea", "Astelehena", "Asteartea", "Asteazkena", "Osteguna", "Ostirala", "Larunbata"];
export const dateParts = (iso: string, locale = "es-ES") => {
  const d = at(iso), eu = locale.startsWith("eu"), fr = locale.startsWith("fr"), f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString(locale, o);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1), month = eu ? EU_MONTHS[d.getMonth()] : f({ month: "long" });
  // francés: «8 décembre», «mardi 8 décembre» (mes en minúscula, como manda la norma francesa)
  if (fr) return { day: String(d.getDate()), monthShort: f({ month: "short" }).replace(".", ""), label: `${d.getDate()} ${month}`, tag: `${d.getDate()} ${month}`, short: `${d.getDate()} ${f({ month: "short" })}`, long: cap(f({ weekday: "long", day: "numeric", month: "long" })), monthYear: cap(f({ month: "long", year: "numeric" })) };
  return { day: String(d.getDate()), monthShort: eu ? EU_MONTHS[d.getMonth()].slice(0, 3) : f({ month: "short" }).replace(".", ""), label: eu ? `${month}ren ${d.getDate()}a` : `${d.getDate()} de ${month}`, tag: eu ? `${cap(month)}ren ${d.getDate()}a` : `${d.getDate()} de ${cap(month)}`, short: `${d.getDate()} ${f({ month: "short" }).replace(".", "")}`, long: eu ? `${EU_DAYS[d.getDay()]}, ${month}ren ${d.getDate()}a` : cap(f({ weekday: "long", day: "numeric", month: "long" }).replace(",", "")), monthYear: cap(f({ month: "long", year: "numeric" })) };
};
/** Etiqueta de cabecera: «2015 • 8 de Diciembre». */
export const tournamentTag = (t: Pick<Tournament, "category" | "date">, locale = "es-ES") => `${t.category} • ${dateParts(t.date, locale).tag}`;
export function daysUntil(iso: string) {
  const a = at(madridNow().date).getTime(), b = at(iso).getTime();
  return Math.round((b - a) / 86400000);
}
/** Textos informativos y sede en el idioma elegido (con el castellano como respaldo). */
export const infoFor = (t: Pick<Tournament, "info" | "infoEu" | "infoFr">, lang: string): InfoSpec => (lang === "eu" && t.infoEu) || (lang === "fr" && t.infoFr) || t.info;
export const venueFor = (t: Pick<Tournament, "venue" | "venueEu" | "venueFr">, lang: string) => (lang === "eu" && t.venueEu) || (lang === "fr" && t.venueFr) || t.venue;
export const isUpcoming = (t: Pick<Tournament, "date">) => t.date >= madridNow().date;

/* ---------- Supabase (lectura pública con clave publishable) ---------- */
export const SB_URL = "https://qxhphzesbxlojcqjmswm.supabase.co";
export const SB_KEY = "sb_publishable_yg4zkg0KBqPXxymmXD8y3w_5hHwcRzy";
export const sbHeaders = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY };
