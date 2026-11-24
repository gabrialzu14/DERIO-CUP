import { CRESTS } from "./crests.generated";

export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Escudo de un club por su nombre: se reutiliza en cualquier torneo con el mismo nombre.
    Si no hay uno exacto, un equipo «B»/«A» usa el escudo de su club. */
export function crestFor(name: string): string | null {
  const s = slugify(name);
  if (CRESTS.has(s)) return "/escudos/" + s + ".webp";
  const base = s.replace(/-[ab]$/, "");
  return base !== s && CRESTS.has(base) ? "/escudos/" + base + ".webp" : null;
}
