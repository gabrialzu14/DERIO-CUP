/** El scroll es el del propio documento (como La Porra): evita el difuminado de borde de iOS sobre un contenedor interno. */
export const scroller = () => (typeof document === "undefined" ? null : document.getElementById("scroller"));
export const scrollToTop = () => { if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "auto" }); };
/** Bloquea el scroll del fondo mientras hay un diálogo abierto. */
export function lockScroll(lock: boolean) { if (typeof document !== "undefined") document.documentElement.style.overflow = lock ? "hidden" : ""; }
