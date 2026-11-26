import type { KOKind } from "./tournament";
import { pick, type Lang } from "./i18n";

/* Textos del torneo que se generan en castellano (fases, rondas, etiquetas de cuadro) y su versión en euskera y francés. */
export const kindName = (k: KOKind, l: Lang) => pick(l, k, k === "Oro" ? "Urrea" : "Zilarra", k === "Oro" ? "Or" : "Argent");
export const phaseName = (k: KOKind, l: Lang) => pick(l, "Fase " + k, k === "Oro" ? "Urrezko fasea" : "Zilarrezko fasea", k === "Oro" ? "Phase Or" : "Phase Argent");
export const roundName = (r: "CF" | "SF" | "FINAL", l: Lang) => pick(l, { CF: "Cuartos de final", SF: "Semifinales", FINAL: "Final" }, { CF: "Final-laurdenak", SF: "Finalerdiak", FINAL: "Finala" }, { CF: "Quarts de finale", SF: "Demi-finales", FINAL: "Finale" })[r];
export const roundShort = (r: "CF" | "SF" | "FINAL", l: Lang) => pick(l, { CF: "Cuartos", SF: "Semifinal", FINAL: "Final" }, { CF: "Laurdenak", SF: "Erdiak", FINAL: "Finala" }, { CF: "Quarts", SF: "Demies", FINAL: "Finale" })[r];
export const groupName = (g: string, l: Lang) => pick(l, `Grupo ${g}`, `${g} multzoa`, `Groupe ${g}`);
export const fieldName = (n: number, l: Lang) => pick(l, `Campo ${n}`, `${n}. zelaia`, `Terrain ${n}`);
/** Inicial de «campo» para etiquetas muy cortas (C1 / Z1 / T1). */
export const fieldInitial = (l: Lang) => pick(l, "C", "Z", "T");
/** Código de partido de fase final: CF1, SF2, FINAL (en francés QF1, DF2, FINALE). */
export const koCode = (code: string, l: Lang) => pick(l, code, code === "FINAL" ? "FINALA" : code, code === "FINAL" ? "FINALE" : code.replace(/^CF/, "QF").replace(/^SF/, "DF"));
/** «Ganador CF1» → «CF1 irabazlea» / «Vainqueur QF1». Las etiquetas A1, B2… no cambian. */
export const koLabel = (label: string, l: Lang) => pick(l, label, label.replace(/^Ganador (.+)$/, "$1 irabazlea"), label.replace(/^Ganador (.+)$/, (_, c: string) => "Vainqueur " + koCode(c, "fr")));
export const followers = (n: number, l: Lang) => pick(l, `${n} ${n === 1 ? "seguidor" : "seguidores"}`, `${n} jarraitzaile`, `${n} ${n > 1 ? "supporters" : "supporter"}`);
