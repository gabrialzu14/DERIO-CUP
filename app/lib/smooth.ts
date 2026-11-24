import { flushSync } from "react-dom";

/** Cambia de pantalla con un fundido suave (View Transitions); sin soporte o con «reducir movimiento», cambia directamente. */
export function smooth(update: () => void) {
  const d = document as Document & { startViewTransition?: (cb: () => void) => { ready?: Promise<unknown>; finished?: Promise<unknown>; updateCallbackDone?: Promise<unknown> } };
  if (!d.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { update(); return; }
  const vt = d.startViewTransition(() => { flushSync(update); });
  // Si otra transición empieza antes de terminar (toques rápidos), se omite la anterior sin error.
  vt.ready?.catch(() => {}); vt.finished?.catch(() => {}); vt.updateCallbackDone?.catch(() => {});
}
