"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

/** Hoja modal basada en <dialog>: foco atrapado, Escape y cierre por fondo nativos. */
export function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    const el = ref.current, previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    el?.showModal();
    return () => { if (timer.current) clearTimeout(timer.current); el?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  const close = () => {
    if (timer.current) return;
    setClosing(true);
    timer.current = setTimeout(onClose, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
  };
  return (
    <dialog ref={ref} className={"dialog" + (wide ? " wide" : "") + (closing ? " is-closing" : "")} aria-labelledby="dialog-title" onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="dialog-panel">
        <header><h2 id="dialog-title">{title}</h2><button type="button" className="icon-btn" aria-label="Cerrar" onClick={close}><Icon name="close" /></button></header>
        <div className="dialog-body">{children}</div>
      </div>
    </dialog>
  );
}
