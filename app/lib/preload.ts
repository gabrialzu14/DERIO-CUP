import { crestFor } from "./crests";
import { SPONSORS } from "./sponsors";
import { isInstalled } from "./platform";
import type { Tournament } from "./tournament";

type Priority = "high" | "auto" | "low";
const seen = new Set<string>();
const keep: HTMLImageElement[] = []; // se conservan para que el navegador no descarte la imagen ya decodificada

/** Descarga y decodifica una imagen (así aparece de golpe, sin parpadeos). Nunca falla: si no carga, se sigue. */
const load = (src: string, priority: Priority = "auto") =>
  new Promise<void>(done => {
    if (typeof window === "undefined" || seen.has(src)) return done();
    seen.add(src);
    const img = new Image();
    img.decoding = "async";
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = priority;
    img.src = src;
    keep.push(img);
    if (img.decode) img.decode().then(() => done(), () => done());
    else { img.onload = img.onerror = () => done(); }
  });

/** Descarga una lista con un máximo de peticiones a la vez, para no competir con lo que se está viendo. */
const pool = async (srcs: string[], limit: number, priority: Priority) => {
  const queue = [...new Set(srcs)];
  await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, async () => { for (let s = queue.shift(); s; s = queue.shift()) await load(s, priority); }));
};

const idle = (fn: () => void) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 2000 }); else setTimeout(fn, 250);
};

const crests = (list: Tournament[]) => [...new Set(list.flatMap(tn => tn.teams.flatMap(t => [crestFor(t.crest ?? t.name), crestFor(t.crest ?? t.name, true)])).filter((s): s is string => !!s))];

/**
 * Precarga las imágenes de la app mientras se muestra la pantalla de carga, por niveles:
 *  1) lo primero que se ve: logo, patrocinadores y escudos del torneo recordado (prioridad alta);
 *  2) lo que se usa justo después: logos de instalación (solo si la app no está instalada) y escudos del resto de torneos;
 * Con «ahorro de datos» o una conexión 2G solo se carga el primer nivel.
 */
export function preloadImages(tournaments: Tournament[], rememberedId?: string | null): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const light = !!conn && (conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType ?? ""));
  const first = tournaments.find(t => t.id === rememberedId) ?? tournaments[0];
  const rest = tournaments.filter(t => t !== first);

  // el logo lo precarga el <link rel="preload"> del layout (con crossorigin, igual que la máscara CSS que lo usa): aquí se descargaría dos veces
  const tier1 = [...SPONSORS.map(s => "/patrocinadores/" + s.id + ".webp"), ...(first ? crests([first]) : [])];
  const tier2 = ["/animo-cuerpo.webp", "/animo-brazo-izq.webp", "/animo-brazo-der.webp", ...(isInstalled() ? [] : ["/plataformas/ios.webp", "/plataformas/android.webp", "/plataformas/safari.webp", "/plataformas/chrome.webp"]), ...crests(rest)];

  const firstDone = pool(tier1, 6, "high");
  void firstDone.then(() => {
    if (light) return;
    void pool(tier2, 4, "auto").then(() => idle(() => void 0));
  });
  return firstDone; // la pantalla de carga espera a este nivel (con un tope) para que el menú aparezca ya con sus imágenes
}
