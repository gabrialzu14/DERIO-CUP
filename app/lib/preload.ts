import { crestFor } from "./crests";
import { SPONSORS } from "./sponsors";
import type { Tournament } from "./tournament";

const seen = new Set<string>();
const load = (src: string) => { if (typeof window === "undefined" || seen.has(src)) return; seen.add(src); const i = new Image(); i.decoding = "async"; i.src = src; };

/** Precarga escudos, patrocinadores y logos para que ya estén listos cuando se llegue a cada pantalla. */
export function preloadImages(tournaments: Tournament[]) {
  // Primero lo que se ve antes (instalación, torneos y patrocinadores); después los escudos y planos.
  const run = () => {
    load("/plataformas/ios.webp"); load("/plataformas/android.webp"); load("/logo-derio-cup.webp");
    for (const s of SPONSORS) load("/patrocinadores/" + s.id + ".webp");
    for (const tn of tournaments) for (const t of tn.teams) { const s = crestFor(t.crest ?? t.name); if (s) load(s); }
    load("/ibaiondo-campo.jpg"); load("/aparcamiento-1.jpg"); load("/aparcamiento-2.jpg");
  };
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
  void w; setTimeout(run, 0);
}
