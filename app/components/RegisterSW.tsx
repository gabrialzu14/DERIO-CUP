"use client";
import { useEffect } from "react";

/** Registra el service worker (solo en producción) para que la app abra sin conexión. */
export function RegisterSW() {
  useEffect(() => {
    // Guarda el aviso de instalación de Android para poder ofrecer «Instalar ahora» en el guion.
    const keep = (e: Event) => { e.preventDefault(); (window as Window & { __dcInstall?: Event }).__dcInstall = e; };
    window.addEventListener("beforeinstallprompt", keep);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      const reg = () => navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
      if (document.readyState === "complete") reg(); else window.addEventListener("load", reg, { once: true });
    }
    return () => window.removeEventListener("beforeinstallprompt", keep);
  }, []);
  return null;
}
