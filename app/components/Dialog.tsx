"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";
import { useLang } from "../lib/i18n";
import { lockScroll } from "../lib/scroll";

/** Hoja modal basada en <dialog>: foco atrapado, Escape y cierre por fondo nativos. */
export function Dialog({ title, onClose, children, wide = false, compact = false, centered = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; compact?: boolean; centered?: boolean }) {
  const { t } = useLang();
  const ref = useRef<HTMLDialogElement>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);
  const byBack = useRef(false), pushed = useRef(false);
  useEffect(() => {
    const el = ref.current, previous = document.activeElement as HTMLElement | null;
    lockScroll(true);
    el?.showModal();
    // El foco va al propio diálogo, no al primer botón (así «Entendido» no aparece ya marcado).
    el?.focus();
    // Un paso de historial por diálogo: el botón Atrás del móvil lo cierra en lugar de salir de la pantalla.
    history.pushState({ ...(history.state ?? {}), dcDialog: true }, "");
    pushed.current = true; byBack.current = false;
    const onPop = () => { byBack.current = true; pushed.current = false; closeRef.current(); };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      if (timer.current) clearTimeout(timer.current);
      el?.close(); lockScroll(false);
      if (pushed.current && !byBack.current && history.state?.dcDialog) history.back();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const closeRef = useRef<() => void>(() => {});
  const close = () => {
    if (timer.current) return;
    setClosing(true);
    timer.current = setTimeout(onClose, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
  };
  closeRef.current = close;
  return (
    <dialog ref={ref} tabIndex={-1} className={"dialog" + (wide ? " wide" : "") + (compact ? " compact" : "") + (closing ? " is-closing" : "")} aria-labelledby="dialog-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="dialog-panel">
        <header className={centered ? "centered" : undefined}><h2 id="dialog-title">{title}</h2>{!centered && <button type="button" className="icon-btn" aria-label={t("Cerrar", "Itxi")} onClick={close}><Icon name="close" /></button>}</header>
        <div className="dialog-body">{children}</div>
      </div>
    </dialog>
  );
}
