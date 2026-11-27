#!/usr/bin/env node
/* Dossier para los responsables de mesa: hoja de ruta imprimible (A4) con todos los partidos por orden de hora,
   casillas para apuntar goles y resultado, penaltis en las fases finales y tablas de clasificación para rellenar.
   Los datos salen de app/lib/editions.ts, así que el dossier siempre coincide con la app.
   Uso:  node scripts/dossier-mesa.cjs [carpeta-de-salida] [id-de-torneo …]
         (sin ids: todos los torneos que aún no se han jugado) */
const ts = require("typescript"), fs = require("fs"), path = require("path"), os = require("os");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(process.argv[2] || path.join(ROOT, "dossier-mesa"));
const ONLY = process.argv.slice(3);

/* ---- cargar los datos del torneo (TypeScript → CommonJS temporal) ---- */
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dossier-"));
for (const f of ["editions.ts", "tournament.ts", "crests.ts", "crests.generated.ts", "i18n.tsx", "platform.ts"]) {
  const src = path.join(ROOT, "app/lib", f);
  if (!fs.existsSync(src)) continue;
  const js = ts.transpileModule(fs.readFileSync(src, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true } }).outputText;
  fs.writeFileSync(path.join(tmp, f.replace(/\.tsx?$/, ".js")), js);
}
const { TOURNAMENTS } = require(path.join(tmp, "editions.js"));
const { crestFor } = require(path.join(tmp, "crests.js"));

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
const list = TOURNAMENTS.filter(t => (ONLY.length ? ONLY.includes(t.id) : t.date >= today));
if (!list.length && require.main === module) { console.log("No hay torneos que generar."); process.exit(0); }

const QRDATA = JSON.parse(fs.readFileSync(path.join(__dirname, "qr-app.json"), "utf8")); // QR de la app (python segno, corrección H)
const fileUrl = p => "file://" + path.join(ROOT, "public", p);
const LOGO = fileUrl("/logo-derio-cup.webp"), CDDERIO = fileUrl("/escudos/m/derio.webp");
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const longDate = iso => { const d = new Date(iso + "T12:00:00"); const s = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); return s.charAt(0).toUpperCase() + s.slice(1); };

/** Inserta html justo antes del último </section> (el cierre de la página, no el de una franja horaria). */
const insertEnd = (page, html) => { const i = page.lastIndexOf("</section>"); return page.slice(0, i) + html + page.slice(i); };

/** QR de la app con los módulos en el degradado oficial y la copa blanca sobre una placa degradada en el centro. */
function qrSvg() {
  const M = QRDATA.matrix.map(r => [...r].map(c => c === "1")), N = M.length, q = 4, size = N + 2 * q, c = N >> 1, r = 4, cx = q + N / 2;
  const mods = M.flatMap((row, y) => row.map((v, x) => (v && !(Math.abs(x - c) <= r && Math.abs(y - c) <= r) ? `<rect x="${x + q}" y="${y + q}" width="1.03" height="1.03"/>` : ""))).join("");
  return `<svg class="qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="QR ${QRDATA.url}"><defs>
    <linearGradient id="qb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a5cc2"/><stop offset=".52" stop-color="#7a2a9a"/><stop offset="1" stop-color="#cf1738"/></linearGradient></defs>
    <rect width="${size}" height="${size}" fill="#fff"/><g fill="#000">${mods}</g>
    <rect x="${cx - 4.1}" y="${cx - 4.1}" width="8.2" height="8.2" rx="2.1" fill="url(#qb)"/><image href="${LOGO}" x="${cx - 2.9}" y="${cx - 3.15}" width="5.8" height="6.3" preserveAspectRatio="xMidYMid meet"/></svg>`;
}
const appBlock = () => `
  <aside class="appqr">
    <div class="qrbox">${qrSvg()}</div>
    <div class="aptxt">
      <h2>Instala la app<br>del torneo</h2>
      <ol>
        <li><span>1</span><div><b>Escanea el QR</b><small>Con la cámara del móvil.</small></div></li>
        <li><span>2</span><div><b>Instala la APP</b><small><strong>iPhone (Safari):</strong> Compartir → «Añadir a pantalla de inicio».<br><strong>Android (Chrome):</strong> menú ⋮ → «Instalar aplicación».</small></div></li>
        <li><span>3</span><div><b>Sigue el torneo</b><small>Elige tu equipo y recibe sus partidos y resultados.</small></div></li>
      </ol>
    </div>
  </aside>`;

function build(tn) {
  const team = id => tn.teams.find(t => t.id === id);
  const crest = id => { const t = team(id); const u = t && crestFor(t.crest ?? t.name); return u ? `<img class="cr" src="${fileUrl(u)}" alt="">` : `<span class="cr ph"></span>`; };
  const perRound = tn.teams.length / 2; // partidos por jornada
  const matches = tn.schedule.map((m, i) => ({ ...m, round: Math.floor(i / perRound) + 1 }));
  const times = [...new Set(matches.map(m => m.time))].sort();
  const seedName = s => `${s[1]}º Grupo ${s[0]}`; // «A1» → «1º Grupo A»
  const QS = { Oro: [["A1", "B2"], ["B1", "A2"], ["C1", "D2"], ["D1", "C2"]], Plata: [["A3", "B4"], ["B3", "A4"], ["C3", "D4"], ["D3", "C4"]] };
  const FIELD = { Oro: 1, Plata: 2 };
  const ko = [];
  for (const kind of ["Oro", "Plata"]) {
    QS[kind].forEach((q, i) => ko.push({ kind, code: "CF" + (i + 1), round: "Cuartos de final", time: tn.ko.cf[i], field: FIELD[kind], home: seedName(q[0]), away: seedName(q[1]) }));
    ko.push({ kind, code: "SF1", round: "Semifinal", time: tn.ko.sf[0], field: FIELD[kind], home: "Ganador CF1", away: "Ganador CF3" });
    ko.push({ kind, code: "SF2", round: "Semifinal", time: tn.ko.sf[1], field: FIELD[kind], home: "Ganador CF2", away: "Ganador CF4" });
    ko.push({ kind, code: "FINAL", round: "Final", time: tn.ko.final, field: FIELD[kind], home: "Ganador SF1", away: "Ganador SF2" });
  }
  const koTimes = [...new Set(ko.map(g => g.time))].sort();
  const info = tn.info;

  const boxes = (n, cls = "") => `<span class="boxes ${cls}">${"<i></i>".repeat(n)}</span>`;
  const check = label => `<span class="chk"><i></i>${label}</span>`;

  /* tarjeta de partido de grupos */
  const groupCard = m => `
    <article class="card">
      <header><b class="fld">C${m.field}</b><span>Grupo ${m.group} · Jornada ${m.round}</span>${check("Publicado")}</header>
      ${[m.home, m.away].map(id => `
      <div class="row">${crest(id)}<span class="nm">${esc(team(id).name)}</span>${boxes(9)}<span class="score"></span></div>`).join("")}
      <footer><small>Goles: marca una casilla por gol · resultado final en el recuadro</small></footer>
    </article>`;
  /* tarjeta de partido de fase final (con penaltis) */
  const koCard = g => `
    <article class="card ko ${g.kind === "Oro" ? "oro" : "plata"}" data-code="${g.code === "FINAL" ? "FINAL" : g.code}" data-kind="${g.kind}">
      <header><b class="fld">C${g.field}</b><span>Fase ${g.kind} · ${g.code === "FINAL" ? "Final" : g.code}</span>${check("Publicado")}</header>
      ${[g.home, g.away].map(lbl => `
      <div class="row"><span class="cr ph"></span><span class="nm blank"><small>${esc(lbl)}</small></span>${boxes(9)}<span class="score"></span></div>`).join("")}
      <div class="pens">
        <div class="pens-h"><b>Penaltis</b><small>solo si hay empate · ✓ gol · ✗ fallo</small></div>
        ${["Local", "Visitante"].map(side => `<div class="pen-row"><span>${side}</span>${boxes(3, "round")}<span class="sd">${boxes(4, "round sm")}</span><span class="score sm"></span></div>`).join("")}
        <div class="pen-foot"><small>3 por equipo</small><small class="sd-l">muerte súbita</small><small>total</small></div>
      </div>
    </article>`;
  const slot = (time, cards, sub) => `
    <section class="slot"><div class="time"><b>${time}</b>${sub ? `<small>${sub}</small>` : ""}</div><div class="cards">${cards}</div></section>`;
  const pageHead = (title, sub) => `<div class="phead"><img src="${LOGO}" alt=""><span class="wm"><b>DERIO</b>CUP</span><span class="pt">${title}</span><span class="ps">${sub}</span></div>`;
  const page = (inner, cls = "") => `<section class="page ${cls}">${inner}</section>`;

  /* ---- páginas ---- */
  const pages = [];
  // 1 · portada e instrucciones
  pages.push(page(`
    <div class="cover">
      <img class="cv-logo" src="${LOGO}" alt="">
      <div class="cv-word"><b>DERIO</b>CUP</div>
      <div class="cv-cat">Categoría ${esc(tn.category)}</div>
      <div class="cv-title">Hoja de mesa</div>
      <div class="cv-date">${longDate(tn.date)}</div>
    </div>
    <div class="fill">
      <div><small>Responsable de mesa</small><span class="line"></span></div>
      <div><small>Campo</small><span class="opts">${check("C1")}${check("C2")}${check("Ambos")}</span></div>
      <div><small>Teléfono de la organización</small><span class="line"></span></div>
    </div>
    <h2 class="h">Cómo rellenar la hoja</h2>
    <ol class="how">
      <li><span>1</span><div><b>Gol</b><small>Marca una casilla en la fila del equipo.</small></div></li>
      <li><span>2</span><div><b>Final del partido</b><small>Escribe el resultado en el recuadro grande.</small></div></li>
      <li><span>3</span><div><b>Empate en fase final</b><small>Penaltis: ✓ gol · ✗ fallo. Tiran 3 por equipo; si siguen empatados, de uno en uno.</small></div></li>
      <li><span>4</span><div><b>Publícalo</b><small>App → Info → Acceso responsables. Después marca «Publicado».</small></div></li>
    </ol>
    <div class="facts">
      <div><b>${info.minutes}'</b><small>por partido</small></div>
      <div><b>${tn.teams.length}</b><small>equipos</small></div>
      <div><b>${new Set(tn.teams.map(t => t.group)).size}</b><small>grupos</small></div>
    </div>`, "p-cover"));
  // 2 · horario del día (vista rápida)
  const rowsG = times.map(t => { const ms = matches.filter(m => m.time === t).sort((a, b) => a.field - b.field); return `<tr><td class="t">${t}</td>${[1, 2].map(f => { const m = ms.find(x => x.field === f); return `<td>${m ? `<small>Grupo ${m.group}</small>${esc(team(m.home).name)} – ${esc(team(m.away).name)}` : ""}</td>`; }).join("")}<td class="ok"><i></i></td></tr>`; }).join("");
  const rowsK = koTimes.map(t => { const gs = ko.filter(g => g.time === t); return `<tr class="kor"><td class="t">${t}</td>${[1, 2].map(f => { const g = gs.find(x => x.field === f); return `<td class="${g ? (g.kind === "Oro" ? "oro" : "plata") : ""}">${g ? `<small>Fase ${g.kind} · ${g.code === "FINAL" ? "Final" : g.code}</small>${esc(g.home)} – ${esc(g.away)}` : ""}</td>`; }).join("")}<td class="ok"><i></i></td></tr>`; }).join("");
  pages.push(page(`${pageHead("Horario del día", "Todos los partidos por orden de hora")}
    <table class="sched"><thead><tr><th>Hora</th><th>Campo 1 (C1)</th><th>Campo 2 (C2)</th><th>Hecho</th></tr></thead>
    <tbody><tr class="sep"><td colspan="4">Fase de grupos</td></tr>${rowsG}<tr class="sep"><td colspan="4">Fases finales</td></tr>${rowsK}</tbody></table>`));
  // 3 · fase de grupos: 4 franjas por página
  for (let i = 0; i < times.length; i += 4) {
    const chunk = times.slice(i, i + 4).map(t => { const ms = matches.filter(m => m.time === t).sort((a, b) => a.field - b.field); return slot(t, ms.map(groupCard).join(""), "Jornada " + ms[0].round); }).join("");
    pages.push(page(`${pageHead("Fase de grupos", `Partidos de ${times[i]} a ${times[Math.min(i + 3, times.length - 1)]}`)}${chunk}`));
  }
  // 4 · clasificaciones para rellenar y cruces
  const groups = [...new Set(tn.teams.map(t => t.group))];
  const gTable = g => `<div class="gt"><h3>Grupo ${g}</h3><table><thead><tr><th class="l">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th>PTS</th><th>Pos.</th></tr></thead><tbody>${tn.teams.filter(t => t.group === g).map(t => `<tr><td class="l">${crest(t.id)}${esc(t.name)}</td>${"<td></td>".repeat(8)}<td class="pos"></td></tr>`).join("")}</tbody></table></div>`;
  const cross = kind => `<div class="cross ${kind === "Oro" ? "oro" : "plata"}"><h3>Fase ${kind} · C${FIELD[kind]}</h3>${QS[kind].map((q, i) => `<div><b>CF${i + 1}</b><span>${tn.ko.cf[i]}</span>${seedName(q[0])} – ${seedName(q[1])}</div>`).join("")}<div><b>SF1</b><span>${tn.ko.sf[0]}</span>Ganador CF1 – Ganador CF3</div><div><b>SF2</b><span>${tn.ko.sf[1]}</span>Ganador CF2 – Ganador CF4</div><div><b>Final</b><span>${tn.ko.final}</span>Ganador SF1 – Ganador SF2</div></div>`;
  pages.push(page(`${pageHead("Clasificaciones", "Victoria 3 · Empate 1 · Derrota 0")}
    <div class="gts">${groups.map(gTable).join("")}</div>
    <div class="tb"><b>Desempates</b><ol>${info.tiebreaks.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>
    <div class="crosses">${cross("Oro")}${cross("Plata")}</div>`));
  // 5 · fases finales: 3 franjas por página
  for (let i = 0; i < koTimes.length; i += 3) {
    const chunk = koTimes.slice(i, i + 3).map(t => slot(t, ko.filter(g => g.time === t).sort((a, b) => a.field - b.field).map(koCard).join(""), ko.find(g => g.time === t).round)).join("");
    pages.push(page(`${pageHead("Fases finales", "Fase Oro en C1 · Fase Plata en C2")}${chunk}`));
  }
  { const lastKO = pages[pages.length - 1], slotsLast = (lastKO.match(/class="slot"/g) || []).length;
    if (slotsLast <= 1) pages[pages.length - 1] = insertEnd(lastKO, appBlock());
    else pages.push(page(`${pageHead("Instala la app", "Para quien pregunte dónde se instala")}${appBlock()}`)); }
  const total = pages.length;
  const numbered = pages.map((p, i) => insertEnd(p, `<div class="pn"><span class="pl"><img src="${CDDERIO}" alt="">CD Derio · Derio Cup ${esc(tn.category)}</span><span class="pr"><b>${i + 1}</b><i></i></span></div>`));
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Hoja de mesa · Derio Cup ${esc(tn.category)}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>${CSS}</style></head><body>${numbered.join("")}</body></html>`;
}

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
:root { --b1: #0a5cc2; --b2: #7a2a9a; --b3: #cf1738; --ink: #0b1b33; --t2: #51607a; --line: #c9d2de; --soft: #f2f5f9; --gold: #c99a06; --gold-s: #fff6d6; --silver: #6b7a8f; --silver-s: #eef1f5; --grad: linear-gradient(135deg, var(--b1), var(--b2) 52%, var(--b3)); }
body { font-family: Montserrat, system-ui, sans-serif; color: var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { position: relative; width: 210mm; height: 297mm; padding: 12mm 11mm 14mm; overflow: hidden; page-break-after: always; break-after: page; display: flex; flex-direction: column; gap: 4mm; }
.pn { position: absolute; left: 11mm; right: 11mm; bottom: 5.5mm; display: flex; align-items: flex-end; justify-content: space-between; font-size: 2.6mm; color: var(--t2); font-weight: 600; }
.pn .pl { display: flex; align-items: center; gap: 2mm; } .pn img { height: 4.5mm; }
.pn .pr { display: grid; justify-items: end; color: var(--ink); }
.pn .pr b { font-size: 5mm; font-weight: 900; letter-spacing: -.02em; line-height: 1; }
.pn .pr i { margin-top: 1mm; width: 9mm; height: 1.3mm; border-radius: 99px; background: var(--grad); }
.phead { display: grid; grid-template-columns: auto auto 1fr; grid-template-rows: auto auto; column-gap: 3mm; align-items: center; padding: 3.5mm 5mm; border-radius: 4mm; background: var(--grad); color: #fff; }
.phead img { grid-row: 1 / 3; height: 11mm; }
.phead .wm { grid-row: 1 / 3; font-size: 5mm; font-weight: 300; letter-spacing: -.03em; padding-right: 3mm; border-right: .3mm solid rgba(255,255,255,.5); }
.phead .wm b { font-weight: 900; }
.phead .pt { font-size: 5.6mm; font-weight: 900; letter-spacing: -.02em; }
.phead .ps { font-size: 3mm; font-weight: 600; opacity: .9; }
/* portada */
.p-cover { gap: 6mm; }
.cover { border-radius: 6mm; background: var(--grad); color: #fff; padding: 12mm 10mm 10mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
.cv-logo { height: 26mm; }
.cv-word { margin-top: 3mm; font-size: 12mm; font-weight: 300; letter-spacing: -.04em; line-height: 1; } .cv-word b { font-weight: 900; }
.cv-cat { margin-top: 2mm; font-size: 4.2mm; font-weight: 700; opacity: .9; }
.cv-title { margin-top: 6mm; font-size: 15mm; font-weight: 900; letter-spacing: -.035em; line-height: 1; text-transform: uppercase; }
.cv-date { margin-top: 3mm; font-size: 4mm; font-weight: 600; }
.fill { display: grid; grid-template-columns: 1.3fr 1fr 1.1fr; gap: 5mm; }
.fill small { display: block; font-size: 2.8mm; font-weight: 700; color: var(--t2); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2mm; }
.line { display: block; height: 7mm; border-bottom: .4mm solid var(--ink); }
.opts { display: flex; gap: 4mm; height: 7mm; align-items: center; }
.chk { display: inline-flex; align-items: center; gap: 1.5mm; font-size: 3mm; font-weight: 700; white-space: nowrap; }
.chk i { width: 4mm; height: 4mm; border: .4mm solid var(--ink); border-radius: 1mm; display: inline-block; }
.h { font-size: 6mm; font-weight: 900; letter-spacing: -.02em; }
.how { list-style: none; display: grid; grid-template-columns: 1fr; gap: 3mm; }
.how li { display: flex; align-items: center; gap: 4mm; padding: 4mm 5mm; border-radius: 3.5mm; background: var(--soft); }
.how li > span { flex: none; width: 10mm; height: 10mm; border-radius: 50%; background: var(--grad); color: #fff; font-weight: 900; font-size: 5mm; display: grid; place-items: center; }
.how b { display: block; font-size: 4.6mm; font-weight: 900; letter-spacing: -.01em; } .how small { display: block; margin-top: .6mm; font-size: 3.6mm; line-height: 1.35; color: var(--t2); font-weight: 600; }
.facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; margin-top: auto; }
.facts div { border: .3mm solid var(--line); border-radius: 3mm; padding: 3mm; text-align: center; } .facts b { display: block; font-size: 6mm; font-weight: 900; } .facts small { font-size: 2.8mm; color: var(--t2); font-weight: 600; }
/* horario */
.sched { width: 100%; border-collapse: collapse; font-size: 3.1mm; }
.sched th { text-align: left; font-size: 2.6mm; text-transform: uppercase; letter-spacing: .06em; color: var(--t2); padding: 1.5mm 2mm; border-bottom: .4mm solid var(--ink); }
.sched td { padding: 1.6mm 2mm; border-bottom: .25mm solid var(--line); vertical-align: middle; font-weight: 600; }
.sched td small { display: block; font-size: 2.3mm; color: var(--t2); font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
.sched .t { font-weight: 900; font-size: 4mm; width: 16mm; }
.sched .ok { width: 12mm; text-align: center; } .sched .ok i { display: inline-block; width: 4.5mm; height: 4.5mm; border: .4mm solid var(--ink); border-radius: 1mm; }
.sched .sep td { background: var(--soft); font-weight: 900; font-size: 3mm; text-transform: uppercase; letter-spacing: .08em; padding: 1.4mm 2mm; }
.sched td.oro { box-shadow: inset 1mm 0 0 var(--gold); } .sched td.plata { box-shadow: inset 1mm 0 0 var(--silver); }
/* franjas horarias y tarjetas */
.slot { display: grid; grid-template-columns: 17mm 1fr; gap: 3mm; }
.page > .slot + .slot { margin-top: 1mm; }
.time { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 1mm; border-right: .5mm solid transparent; border-image: var(--grad) 1; }
.time b { font-size: 5.4mm; font-weight: 900; letter-spacing: -.02em; } .time small { font-size: 2.4mm; font-weight: 700; color: var(--t2); text-align: center; }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
.card { border: .35mm solid var(--line); border-radius: 3.5mm; padding: 2.8mm 3.2mm 2.2mm; display: grid; gap: 1.8mm; align-content: start; }
.card header { display: flex; align-items: center; gap: 2mm; font-size: 2.7mm; font-weight: 700; color: var(--t2); text-transform: uppercase; letter-spacing: .04em; }
.card header .chk { margin-left: auto; text-transform: none; letter-spacing: 0; font-size: 2.6mm; color: var(--ink); }
.fld { padding: .6mm 2mm; border-radius: 99px; background: var(--ink); color: #fff; font-size: 2.8mm; letter-spacing: .04em; }
.row { display: grid; grid-template-columns: 8mm 1fr 14mm; grid-template-areas: "cr nm sc" "cr bx sc"; align-items: center; column-gap: 2.5mm; row-gap: 1.2mm; padding: 1mm 0; }
.row > .cr { grid-area: cr; } .row > .nm { grid-area: nm; } .row > .boxes { grid-area: bx; } .row > .score { grid-area: sc; }
.row + .row { border-top: .25mm dashed var(--line); padding-top: 2mm; }
.cr { width: 8mm; height: 8mm; object-fit: contain; } .cr.ph { display: inline-block; border: .3mm dashed var(--line); border-radius: 50%; }
.nm { font-size: 3.8mm; font-weight: 800; line-height: 1.1; min-width: 0; white-space: nowrap; }
.nm.blank { border-bottom: .3mm solid var(--ink); height: 6.5mm; display: flex; align-items: flex-start; white-space: normal; }
.nm.blank small { font-size: 2.3mm; color: var(--t2); font-weight: 700; }
.boxes { display: inline-flex; gap: 1.1mm; } .boxes i { width: 4.6mm; height: 4.6mm; border: .3mm solid #8d99ab; border-radius: .8mm; display: inline-block; }
.boxes.round i { border-radius: 50%; width: 4.2mm; height: 4.2mm; } .boxes.sm i { width: 3.4mm; height: 3.4mm; border-style: dashed; }
.score { width: 14mm; height: 12mm; border: .55mm solid var(--ink); border-radius: 2.2mm; display: inline-block; } .score.sm { width: 10mm; height: 6.5mm; border-width: .4mm; }
.card footer small { font-size: 2.2mm; color: var(--t2); font-weight: 500; }
/* Fases finales: diseño minimal — borde fino, línea de color bajo la cabecera, código grande y tenue de fondo y penaltis punteados */
.card { position: relative; min-width: 0; } .cards { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.card.ko.oro { --c: #b8860b; --cs: #fff6d6; } .card.ko.plata { --c: #5f6f85; --cs: #eef1f5; }
.card.ko { border: .3mm solid #cfd7e2; overflow: hidden; }
.card.ko::before { content: attr(data-code); position: absolute; right: 20mm; top: 8mm; font-size: 16mm; font-weight: 900; letter-spacing: -.05em; color: var(--c); opacity: .1; pointer-events: none; }
.card.ko header { padding-bottom: 1.8mm; border-bottom: .6mm solid var(--c); }
.card.ko .fld { background: #fff; color: var(--c); border: .4mm solid var(--c); }
.pens { margin-top: 1mm; padding: 2mm 2.5mm; border-radius: 2.5mm; background: var(--soft); display: grid; gap: 1.4mm; }
.card.ko .pens { background: transparent; border: .45mm dashed var(--c); }
.pens-h { display: flex; align-items: baseline; gap: 2mm; } .pens-h b { font-size: 3mm; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; } .pens-h small { font-size: 2.3mm; color: var(--t2); font-weight: 600; }
.pen-row { display: grid; grid-template-columns: 16mm auto 1fr 10mm; align-items: center; gap: 2mm; font-size: 2.8mm; font-weight: 700; }
.pen-row .sd { padding-left: 2mm; border-left: .3mm dashed #8d99ab; }
.pen-foot { display: grid; grid-template-columns: 16mm 15mm 1fr 10mm; gap: 2mm; } .pen-foot small { font-size: 2.1mm; color: var(--t2); font-weight: 600; } .pen-foot small:first-child { grid-column: 2; } .pen-foot .sd-l { padding-left: 2mm; }
/* bloque «Instala la app» (última hoja) */
.appqr { margin-top: auto; margin-bottom: 9mm; border-radius: 5mm; padding: 7mm; display: grid; grid-template-columns: 66mm 1fr; gap: 8mm; align-items: center; background: linear-gradient(135deg, #eef4ff, #f5ecfb 55%, #ffecef); border: .4mm solid #d8cfe6; }
.qrbox { background: #fff; border-radius: 4mm; padding: 3mm; border: .4mm solid #cdbfe0; }
.qrbox .qr { display: block; width: 100%; height: auto; shape-rendering: crispEdges; }
.aptxt h2 { font-size: 8.4mm; font-weight: 900; letter-spacing: -.03em; line-height: 1.03; color: var(--ink); }
.aptxt h2::after { content: ""; display: block; width: 16mm; height: 1.6mm; margin-top: 2.5mm; border-radius: 99px; background: var(--grad); }
.aptxt p { margin-top: 2.5mm; font-size: 3.5mm; line-height: 1.4; color: var(--t2); font-weight: 600; }
.aptxt ol { list-style: none; margin-top: 5mm; display: grid; gap: 3mm; }
.aptxt li { display: flex; gap: 3mm; align-items: flex-start; }
.aptxt li > span { flex: none; width: 7.5mm; height: 7.5mm; border-radius: 50%; background: var(--grad); color: #fff; font-weight: 900; font-size: 3.8mm; display: grid; place-items: center; }
.aptxt li b { display: block; font-size: 4.2mm; font-weight: 900; letter-spacing: -.01em; } .aptxt li small { display: block; margin-top: .6mm; font-size: 3mm; line-height: 1.4; color: var(--t2); font-weight: 600; } .aptxt li small strong { color: var(--ink); font-weight: 800; }
/* clasificaciones */
.gts { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.gt h3, .cross h3, .tb b { font-size: 3.6mm; font-weight: 900; margin-bottom: 1.5mm; }
.gt table { width: 100%; border-collapse: collapse; font-size: 2.8mm; }
.gt th { font-size: 2.3mm; color: var(--t2); font-weight: 700; padding: 1mm .5mm; border-bottom: .35mm solid var(--ink); }
.gt td { border-bottom: .25mm solid var(--line); border-left: .25mm solid var(--line); height: 8mm; text-align: center; }
.gt td.l, .gt th.l { text-align: left; border-left: 0; font-weight: 700; white-space: nowrap; }
.gt td.l .cr { width: 5mm; height: 5mm; vertical-align: middle; margin-right: 1.5mm; }
.gt td.pos { background: var(--soft); }
.tb { border: .3mm solid var(--line); border-radius: 3mm; padding: 3mm 4mm; } .tb ol { padding-left: 5mm; columns: 2; column-gap: 8mm; font-size: 2.8mm; line-height: 1.6; font-weight: 500; }
.crosses { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
.cross { border-radius: 3mm; padding: 3mm 4mm; font-size: 2.9mm; display: grid; gap: 1.2mm; }
.cross.oro { background: var(--gold-s); box-shadow: inset 1mm 0 0 var(--gold); } .cross.plata { background: var(--silver-s); box-shadow: inset 1mm 0 0 var(--silver); }
.cross div { display: grid; grid-template-columns: 11mm 11mm 1fr; font-weight: 600; } .cross div b { font-weight: 900; } .cross div span { color: var(--t2); font-weight: 700; }
`;

module.exports = { build, CSS, TOURNAMENTS, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const tn of list) {
    const html = build(tn), htmlPath = path.join(OUT, `hoja-de-mesa-${tn.id}.html`);
    fs.writeFileSync(htmlPath, html);
    await p.goto("file://" + htmlPath, { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    const pdf = path.join(OUT, `hoja-de-mesa-derio-cup-${tn.id}.pdf`);
    await p.pdf({ path: pdf, format: "A4", printBackground: true, preferCSSPageSize: true });
    console.log("✓", path.relative(process.cwd(), pdf));
  }
  await b.close();
  fs.rmSync(tmp, { recursive: true, force: true });
})();
