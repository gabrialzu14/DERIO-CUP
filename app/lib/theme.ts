export type ThemePref = "system" | "light" | "dark";
export const THEME_KEY = "derio-cup-theme";
export const THEME_COLORS = { light: "#f3f5f9", dark: "#08121f" } as const;

/** Script que se ejecuta antes de pintar para evitar el parpadeo de tema. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;else if(t!=="system")document.documentElement.dataset.theme="light";}catch(e){document.documentElement.dataset.theme="light";}})();`;

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme; else root.dataset.theme = pref;
  try { localStorage.setItem(THEME_KEY, pref); } catch {}
  const color = THEME_COLORS[resolveTheme(pref)];
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute("content", color));
}
