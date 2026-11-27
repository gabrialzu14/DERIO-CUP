import { CRESTS } from "./crests.generated";

export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Slug del escudo de un club: se reutiliza en cualquier torneo con el mismo nombre.
    Si no hay uno exacto, un equipo «B»/«A» usa el de su club. */
function crestSlug(name: string): string | null {
  const s = slugify(name);
  if (s in CRESTS) return s;
  const base = s.replace(/-[ab]$/, "");
  return base !== s && base in CRESTS ? base : null;
}

export function crestFor(name: string): string | null {
  const s = crestSlug(name);
  return s ? "/escudos/m/" + s + ".webp" : null;
}

/** Tono del monograma (equipos sin escudo) a partir de su id. */
export const monoHue = (id: string) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

function hslToHex(h: number, s: number, l: number) {
  const a = s * Math.min(l, 1 - l), f = (n: number) => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, "0"); };
  return "#" + f(0) + f(8) + f(4);
}

/** Color de un club a mano cuando el dominante del escudo no es el «color del club».
    Un texto vale para los dos modos; con {light, dark} cambia según el tema. */
const COLOR_OVERRIDES: Record<string, string | { light: string; dark: string }> = {
  etxebarri: "#da2422",                          // rojo del escudo
  "cultural-durango": "#2d3e84",                // azul del escudo
  gernika: { light: "#0f0f10", dark: "#ffffff" }, // negro en claro, blanco en oscuro
  "colegio-vizcaya": "#2f6fd1",                  // azul medio: el logo es azul marino y no se vería sobre su propio color
  "athletic-academy": "#c8102e",                 // rojo del Athletic (el escudo es un círculo blanco)
};

/** Color del club: el dominante de su escudo (o el del monograma si aún no hay escudo). */
export function clubColor(name: string, id: string): string {
  const s = crestSlug(name), o = s && COLOR_OVERRIDES[s];
  if (typeof o === "string") return o;
  if (o) return o.light;
  return s ? CRESTS[s] : hslToHex(monoHue(id), 0.48, 0.36);
}

const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
export const luminance = (hex: string) => { const n = parseInt(hex.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };

/** Texto sobre un fondo del club: blanco, o gris oscuro si el color es claro (mejor contraste de los dos). */
export function readableOn(hex: string): "#ffffff" | "#1f2937" {
  const L = luminance(hex);
  return 1.05 / (L + 0.05) >= (L + 0.05) / (luminance("#1f2937") + 0.05) ? "#ffffff" : "#1f2937";
}

/** Fondo y texto (valores CSS) del color de un club, ya adaptados al tema si hace falta. */
export function clubTone(name: string, id: string): { bg: string; fg: string } {
  const s = crestSlug(name), o = s && COLOR_OVERRIDES[s];
  if (o && typeof o === "object") return { bg: `light-dark(${o.light}, ${o.dark})`, fg: `light-dark(${readableOn(o.light)}, ${readableOn(o.dark)})` };
  let bg = clubColor(name, id);
  // Si el texto va en blanco y el contraste no llega a 4.5:1, se oscurece un poco el color del club.
  if (readableOn(bg) === "#ffffff") for (let i = 0; i < 12 && 1.05 / (luminance(bg) + 0.05) < 4.5; i++) bg = "#" + [16, 8, 0].map(s => Math.round(((parseInt(bg.slice(1), 16) >> s) & 255) * 0.94).toString(16).padStart(2, "0")).join("");
  return { bg, fg: readableOn(bg) };
}
