import type { KOKind } from "./tournament";

/* Textos del torneo que se generan en castellano (fases, rondas, etiquetas de cuadro) y su versión en euskera. */
export const kindName = (k: KOKind, eu: boolean) => (eu ? (k === "Oro" ? "Urrea" : "Zilarra") : k);
export const phaseName = (k: KOKind, eu: boolean) => (eu ? (k === "Oro" ? "Urrezko fasea" : "Zilarrezko fasea") : "Fase " + k);
export const roundName = (r: "CF" | "SF" | "FINAL", eu: boolean) => (eu ? { CF: "Final-laurdenak", SF: "Finalerdiak", FINAL: "Finala" }[r] : { CF: "Cuartos de final", SF: "Semifinales", FINAL: "Final" }[r]);
export const roundShort = (r: "CF" | "SF" | "FINAL", eu: boolean) => (eu ? { CF: "Laurdenak", SF: "Erdiak", FINAL: "Finala" }[r] : { CF: "Cuartos", SF: "Semifinal", FINAL: "Final" }[r]);
export const groupName = (g: string, eu: boolean) => (eu ? `${g} multzoa` : `Grupo ${g}`);
export const fieldName = (n: number, eu: boolean) => (eu ? `Z${n}` : `Campo ${n}`);
/** «Ganador CF1» → «CF1 irabazlea». Las etiquetas A1, B2… no cambian. */
export const koLabel = (label: string, eu: boolean) => (eu ? label.replace(/^Ganador (.+)$/, "$1 irabazlea") : label);
export const followers = (n: number, eu: boolean) => (eu ? `${n} jarraitzaile` : `${n} ${n === 1 ? "seguidor" : "seguidores"}`);
export const koCode = (code: string, eu: boolean) => (eu && code === "FINAL" ? "FINALA" : code);
