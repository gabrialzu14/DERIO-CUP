export type Platform = "ios" | "android" | "other";

/** ¿La app está abierta como app instalada (sin barra del navegador)? */
export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || window.matchMedia("(display-mode: fullscreen)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "other";
}

export const ONBOARDED_KEY = "derio-cup-onboarded";
