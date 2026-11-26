#!/usr/bin/env node
/* Extrae todos los textos de la app a docs/idiomas/textos.json para revisarlos y traducirlos (ver PROMPT.md).
   - llamadas t()/tr()/kind() con (castellano, euskera[, francés])
   - ternarios «eu ? euskera : castellano»
   - textos de cada torneo (InfoSpec) emparejados por clave: INFO_X ↔ INFO_X_EU ↔ INFO_X_FR */
const ts = require("typescript"), fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "../.."), APP = path.join(ROOT, "app");
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f) && !f.endsWith(".generated.ts")) files.push(p); } })(APP);
const out = []; let id = 0;
const lit = n => n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : n ? n.getText() : null;
for (const file of files) {
  const src = fs.readFileSync(file, "utf8"), sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rel = path.relative(ROOT, file), line = n => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
  const objs = {};
  const visit = n => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && ["t", "tr", "kind"].includes(n.expression.text) && n.arguments.length >= 2)
      out.push({ id: ++id, file: rel, line: line(n), es: lit(n.arguments[0]), eu: lit(n.arguments[1]), fr: lit(n.arguments[2]) });
    else if (ts.isConditionalExpression(n) && /^\(?\s*(eu|lang === "eu")\s*\)?$/.test(n.condition.getText()) && !ts.isObjectLiteralExpression(n.whenTrue))
      out.push({ id: ++id, file: rel, line: line(n), es: lit(n.whenFalse), eu: lit(n.whenTrue), fr: null, ternario: true });
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && /^INFO_\d+(_EU|_FR)?$/.test(n.name.text) && n.initializer && ts.isObjectLiteralExpression(n.initializer)) objs[n.name.text] = n.initializer;
    ts.forEachChild(n, visit);
  };
  visit(sf);
  // textos de torneo: se recorren las hojas de texto de INFO_X y se emparejan por ruta con _EU y _FR
  const leaves = (o, pre = "", acc = {}) => { for (const p of o.properties) { if (!ts.isPropertyAssignment(p)) continue; const k = pre + p.name.getText(), v = p.initializer;
    if (ts.isStringLiteral(v)) acc[k] = { text: v.text, line: line(v) };
    else if (ts.isArrayLiteralExpression(v)) v.elements.forEach((e, i) => { if (ts.isStringLiteral(e)) acc[k + "[" + i + "]"] = { text: e.text, line: line(e) }; else if (ts.isObjectLiteralExpression(e)) leaves(e, k + "[" + i + "].", acc); });
    else if (ts.isObjectLiteralExpression(v)) leaves(v, k + ".", acc); } return acc; };
  for (const name of Object.keys(objs).filter(n => !/_EU|_FR/.test(n))) {
    const es = leaves(objs[name]), eu = objs[name + "_EU"] ? leaves(objs[name + "_EU"]) : {}, fr = objs[name + "_FR"] ? leaves(objs[name + "_FR"]) : {};
    for (const k of Object.keys(es)) { if (/src$/.test(k) || /^(minutes|meals\.price)$/.test(k) || es[k].text.length < 2) continue;
      out.push({ id: ++id, file: rel, line: es[k].line, clave: name + "." + k, es: es[k].text, eu: eu[k]?.text ?? null, fr: fr[k]?.text ?? null }); }
  }
}
// las guías de instalación (Onboarding) son objetos por idioma (eu ? {...} : {...}): se emparejan por plataforma y paso
{ const file = path.join(APP, "components/Onboarding.tsx"), sf = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let cond = null; (function v(n) { if (!cond && ts.isConditionalExpression(n) && ts.isObjectLiteralExpression(n.whenTrue)) cond = n; else ts.forEachChild(n, v); })(sf);
  if (cond) { const steps = o => Object.fromEntries(o.properties.map(p => [p.name.getText(), p.initializer.elements.map(e => Object.fromEntries(e.properties.map(q => [q.name.getText(), q.initializer])))]));
    const eu = steps(cond.whenTrue), es = steps(cond.whenFalse), frObj = cond.whenFalse && ts.isConditionalExpression(cond.whenFalse) ? null : null;
    for (const plat of Object.keys(es)) es[plat].forEach((st, i) => ["title", "text"].forEach(k => out.push({ id: ++id, file: "app/components/Onboarding.tsx", line: sf.getLineAndCharacterOfPosition(st[k].getStart()).line + 1, clave: `guia.${plat}[${i}].${k}`, es: lit(st[k]), eu: lit(eu[plat][i][k]), fr: null }))); } }
fs.writeFileSync(path.join(__dirname, "textos.json"), JSON.stringify(out, null, 1));
console.log(out.length + " textos → docs/idiomas/textos.json");
