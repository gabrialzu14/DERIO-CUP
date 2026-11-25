/** Aparición escalonada «en dominó» al hacer scroll: cada recuadro y cada partido entra con un fundido suave de arriba abajo,
    a medida que llega a la pantalla. Un solo observador para toda la app; respeta «reducir movimiento». */
const TARGETS = [
  ".hero", ".team-card", ".podium", ".stats", ".champion", ".phase-note", ".note", ".empty",
  ".section-head", ".list-title", ".tabs", ".progress", ".group-card", ".table-card", ".trow:not(.thead)", ".legend",
  ".match-row", ".ko-row", ".ko-wrap", ".bk-game", ".bk-games", ".slot-time", ".fans li", ".menu-card > *", ".more-brand", ".profile-hero", ".finals", ".v3",
].join(",");

export function startReveal(root: HTMLElement): () => void {
  if (typeof window === "undefined" || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const queue = new Set<HTMLElement>();
  let raf = 0;
  const flush = () => {
    raf = 0;
    const list = [...queue].sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    queue.clear();
    // retardo creciente y acotado (como mucho ~0,4 s para todo un lote)
    list.forEach((el, i) => { el.style.setProperty("--rv-d", Math.min(i, 8) * 55 + "ms"); el.classList.add("rv-in"); io.unobserve(el); });
  };
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) queue.add(e.target as HTMLElement);
    if (queue.size && !raf) raf = requestAnimationFrame(flush);
  }, { rootMargin: "0px 0px -4% 0px", threshold: 0.04 });
  const prep = (el: Element) => {
    if (!(el instanceof HTMLElement) || el.dataset.rv || el.closest("dialog, .tabbar, .app-header")) return;
    el.dataset.rv = "1"; io.observe(el);
  };
  const scan = (n: ParentNode) => { if (n instanceof Element && n.matches(TARGETS)) prep(n); n.querySelectorAll?.(TARGETS).forEach(prep); };
  scan(root);
  const mo = new MutationObserver(ms => { for (const m of ms) m.addedNodes.forEach(n => { if (n instanceof Element) scan(n); }); });
  mo.observe(root, { childList: true, subtree: true });
  return () => { mo.disconnect(); io.disconnect(); cancelAnimationFrame(raf); };
}
