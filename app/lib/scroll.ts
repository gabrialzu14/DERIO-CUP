/** La app no deja que se mueva la página: todo el scroll ocurre dentro de #scroller. */
export const scroller = () => (typeof document === "undefined" ? null : document.getElementById("scroller"));
export const scrollToTop = () => scroller()?.scrollTo({ top: 0, left: 0, behavior: "auto" });
/** Bloquea el scroll del fondo mientras hay un diálogo abierto. */
export function lockScroll(lock: boolean) { const s = scroller(); if (s) s.style.overflowY = lock ? "hidden" : ""; }
