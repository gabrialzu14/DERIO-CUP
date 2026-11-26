#!/usr/bin/env node
/* Aplica en el código la revisión de euskera y la traducción al francés (ver PROMPT.md).
   Uso: node docs/idiomas/aplicar.cjs <textos.json> <eu-revision.json> <fr.json>
   - Llamadas t()/tr()/kind(): cambia el 2.º argumento (euskera) y pone/actualiza el 3.º (francés).
     Cada texto se localiza por archivo + texto castellano (no por línea).
   - Textos de torneo (INFO_X): corrige INFO_X_EU por clave y genera INFO_X_FR con la misma forma que INFO_X.
   - Guías de instalación: genera la versión francesa de Onboarding.
   Lo que no encuentra lo lista al final para revisarlo a mano. */
const ts = require("typescript"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const [textosP, euP, frP] = process.argv.slice(2);
const textos = JSON.parse(fs.readFileSync(textosP, "utf8")), byId = new Map(textos.map(x => [x.id, x]));
const EU = new Map((euP && fs.existsSync(euP) ? JSON.parse(fs.readFileSync(euP, "utf8")) : []).map(x => [x.id, x.eu]));
const FR = new Map((frP && fs.existsSync(frP) ? JSON.parse(fs.readFileSync(frP, "utf8")) : []).map(x => [x.id, x.fr]));
const lit = n => n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : n ? n.getText() : null;
// código fuente de un argumento nuevo con la misma «forma» que el original
const asSource = (orig, value) => {
  if (value == null) return null;
  if (ts.isStringLiteral(orig) || ts.isNoSubstitutionTemplateLiteral(orig)) {
    // si el traductor devolvió una plantilla con ${} se respeta; si no, cadena entre comillas dobles
    return /^`[\s\S]*`$/.test(value) ? value : JSON.stringify(value);
  }
  return value; // plantillas y JSX: el valor ya es código
};
const parse = f => ts.createSourceFile(f, fs.readFileSync(f, "utf8"), ts.ScriptTarget.Latest, true, f.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const edits = new Map(); const addEdit = (f, start, end, text) => { if (!edits.has(f)) edits.set(f, []); edits.get(f).push({ start, end, text }); };
const missing = [];

/* 1) llamadas t()/tr()/kind() */
const calls = new Map(); // file → [{es, node}]
const byFile = {}; for (const x of textos) if (!x.clave) (byFile[x.file] ||= []).push(x);
for (const rel of Object.keys(byFile)) {
  const f = path.join(ROOT, rel), sf = parse(f), list = [];
  (function v(n) { if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ["t", "tr", "kind"].includes(n.expression.text) && n.arguments.length >= 2) list.push(n); ts.forEachChild(n, v); })(sf);
  const used = new Set();
  for (const x of byFile[rel]) {
    const fr = FR.get(x.id), eu = EU.get(x.id); if (fr == null && eu == null) continue;
    const hit = list.find(n => !used.has(n) && lit(n.arguments[0]) === x.es) ?? list.find(n => lit(n.arguments[0]) === x.es);
    if (!hit) { missing.push(`#${x.id} ${rel}:${x.line} «${String(x.es).slice(0, 60)}»`); continue; }
    used.add(hit);
    const [a0, a1, a2] = hit.arguments;
    if (ts.isIdentifier(a0) || ts.isPropertyAccessExpression(a0)) continue; // variables (p. ej. t(es, e, fr)), no texto
    if (eu != null && eu !== x.eu) addEdit(f, a1.getStart(), a1.getEnd(), asSource(a1, eu));
    if (fr != null) { const src = asSource(a0, fr); if (a2) addEdit(f, a2.getStart(), a2.getEnd(), src); else addEdit(f, a1.getEnd(), a1.getEnd(), ", " + src); }
  }
}

/* 2) textos de torneo: INFO_X_EU (correcciones) e INFO_X_FR (nuevo) */
const edF = path.join(ROOT, "app/lib/editions.ts"), edSf = parse(edF), objs = {};
(function v(n) { if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && /^INFO_\d+(_EU|_FR)?$/.test(n.name.text)) objs[n.name.text] = n; ts.forEachChild(n, v); })(edSf);
const leaves = (o, pre = "", acc = {}) => { for (const p of o.properties) { if (!ts.isPropertyAssignment(p)) continue; const k = pre + p.name.getText(), v = p.initializer;
  if (ts.isStringLiteral(v)) acc[k] = v; else if (ts.isArrayLiteralExpression(v)) v.elements.forEach((e, i) => { if (ts.isStringLiteral(e)) acc[k + "[" + i + "]"] = e; else if (ts.isObjectLiteralExpression(e)) leaves(e, k + "[" + i + "].", acc); }); else if (ts.isObjectLiteralExpression(v)) leaves(v, k + ".", acc); } return acc; };
const infoIds = textos.filter(x => x.clave && x.clave.startsWith("INFO_"));
const frBlocks = [];
for (const name of Object.keys(objs).filter(n => /^INFO_\d+$/.test(n))) {
  const esObj = objs[name].initializer, esLeaves = leaves(esObj), euObj = objs[name + "_EU"]?.initializer, euLeaves = euObj ? leaves(euObj) : {};
  const mine = infoIds.filter(x => x.clave.startsWith(name + "."));
  // correcciones de euskera
  for (const x of mine) { const k = x.clave.slice(name.length + 1), eu = EU.get(x.id); if (eu != null && eu !== x.eu) { if (euLeaves[k]) addEdit(edF, euLeaves[k].getStart(), euLeaves[k].getEnd(), JSON.stringify(eu)); else missing.push(`#${x.id} ${x.clave} (euskera fuera de ${name}_EU)`); } }
  // francés: copia de INFO_X con cada texto sustituido
  if (objs[name + "_FR"]) continue;
  const reps = [];
  for (const x of mine) { const k = x.clave.slice(name.length + 1), fr = FR.get(x.id), node = esLeaves[k]; if (!node) continue; if (fr == null) { missing.push(`#${x.id} ${x.clave} (sin francés)`); continue; } reps.push({ s: node.getStart() - esObj.getStart(), e: node.getEnd() - esObj.getStart(), t: JSON.stringify(fr) }); }
  let body = esObj.getText(); reps.sort((a, b) => b.s - a.s).forEach(r => { body = body.slice(0, r.s) + r.t + body.slice(r.e); });
  frBlocks.push(`const ${name}_FR: InfoSpec = ${body};`);
}
if (frBlocks.length) { const anchor = edSf.statements.find(s => ts.isVariableStatement(s) && s.declarationList.declarations.some(d => d.name.getText() === "INFO_2017_EU")); addEdit(edF, anchor.getEnd(), anchor.getEnd(), "\n\n/* ------------------------------------------------------------------ textos en francés */\n" + frBlocks.join("\n")); }

/* 3) guías de instalación en francés */
const obF = path.join(ROOT, "app/components/Onboarding.tsx"), obSf = parse(obF);
let cond = null; (function v(n) { if (!cond && ts.isConditionalExpression(n) && ts.isObjectLiteralExpression(n.whenTrue)) cond = n; else ts.forEachChild(n, v); })(obSf);
const guideIds = textos.filter(x => x.clave && x.clave.startsWith("guia."));
if (cond && ts.isObjectLiteralExpression(cond.whenFalse) && guideIds.every(x => FR.has(x.id))) {
  const esObj = cond.whenFalse, base = esObj.getStart(), reps = [];
  const steps = Object.fromEntries(esObj.properties.map(p => [p.name.getText(), p.initializer.elements.map(e => Object.fromEntries(e.properties.map(q => [q.name.getText(), q.initializer])))]));
  for (const x of guideIds) { const m = x.clave.match(/^guia\.(\w+)\[(\d+)\]\.(\w+)$/), node = steps[m[1]][+m[2]][m[3]], fr = FR.get(x.id); reps.push({ s: node.getStart() - base, e: node.getEnd() - base, t: ts.isStringLiteral(node) ? JSON.stringify(fr) : fr }); }
  let body = esObj.getText(); reps.sort((a, b) => b.s - a.s).forEach(r => { body = body.slice(0, r.s) + r.t + body.slice(r.e); });
  addEdit(obF, esObj.getStart(), esObj.getStart(), `lang === "fr" ? ${body} : `);
} else if (guideIds.length) missing.push("guías de instalación en francés (faltan textos)");

/* escribir */
for (const [f, list] of edits) { let s = fs.readFileSync(f, "utf8"); list.sort((a, b) => b.start - a.start || b.end - a.end).forEach(e => { s = s.slice(0, e.start) + e.text + s.slice(e.end); }); fs.writeFileSync(f, s); console.log("✓", path.relative(ROOT, f), list.length, "cambios"); }
if (missing.length) { console.log("\nSin aplicar (revisar a mano):"); missing.forEach(m => console.log("  " + m)); }
