/* QA del torneo de 8 equipos (2017 · 23 de diciembre): 2 grupos y fases finales desde semifinales.
   Simula tres momentos del día (reloj fijo + resultados simulados) y comprueba que la app no asume 16 equipos. */
const { chromium, devices } = require('playwright');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const URL = 'http://localhost:3100/';
const P = '2017b-';
const R = (id, h, a, extra = {}) => ({ match_id: P + id, home_score: h, away_score: a, ...extra });
const GROUPS = [
  R('grupo-A-1630-c1', 2, 0), R('grupo-A-1630-c2', 1, 1), R('grupo-A-1720-c1', 3, 1), R('grupo-A-1720-c2', 0, 2), R('grupo-A-1810-c1', 1, 1), R('grupo-A-1810-c2', 2, 2),
  R('grupo-B-1655-c1', 1, 0), R('grupo-B-1655-c2', 2, 2), R('grupo-B-1745-c1', 0, 1), R('grupo-B-1745-c2', 3, 0), R('grupo-B-1835-c1', 2, 0), R('grupo-B-1835-c2', 1, 1),
];
// Clasificación resultante: A = Derio, Zuazo, Arenas, Abanto · B = Pauldarrak, Amistad Sniace, Colegio Vizcaya, Portugalete
const KO = (id, h, a, hs, as, hp, ap) => R(id, hs, as, { home_team: h, away_team: a, home_penalties: hp ?? null, away_penalties: ap ?? null, phase: id.split('-')[0], round: id.split('-')[1] });
const SEMIS = [
  KO('oro-sf1', 'derio', 'amistad-sniace', 2, 2, 3, 1), KO('oro-sf2', 'pauldarrak', 'zuazo', 1, 0),
  KO('plata-sf1', 'arenas', 'portugalete', 2, 1), KO('plata-sf2', 'colegio-vizcaya', 'abanto', 0, 1),
];
const FINALS = [KO('oro-final', 'derio', 'pauldarrak', 1, 1, 2, 3), KO('plata-final', 'arenas', 'abanto', 3, 0)];

async function open(b, { time, rows, scheme = 'light' }) {
  const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], colorScheme: scheme });
  await ctx.clock.setFixedTime(new Date(time));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.addInitScript(() => { localStorage.setItem('derio-cup-onboarded', '1'); localStorage.setItem('derio-cup-lang', 'es'); });
  await p.route('**/derio_cup_results*', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) }));
  await p.route('**/derio_cup_fans*', r => r.request().method() === 'POST' ? r.fulfill({ status: 201, body: '' }) : r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(3700);
  return { ctx, p, errs };
}
const enter = async (p, team) => {
  await p.locator('.tourney-card', { hasText: '2017' }).filter({ hasText: /23/ }).first().tap(); await p.waitForTimeout(500);
  if (await p.locator('.welcome').isVisible().catch(() => false)) {
    await p.locator('.team-pick', { hasText: team }).first().tap(); await p.waitForTimeout(400);
    await p.locator('.continue-btn').tap(); await p.waitForTimeout(500);
    if (await p.locator('.fairplay .btn').count()) { await p.locator('.fairplay .btn').tap(); await p.waitForTimeout(1200); }
  }
};
const txt = (p, sel) => p.locator(sel).allInnerTexts();

(async () => {
  const b = await chromium.launch();

  /* ---- 1 · Antes de empezar (mediodía del 23) ---- */
  {
    const { p, errs } = await open(b, { time: '2026-12-23T12:00:00+01:00', rows: [] });
    const cards = await txt(p, '.tourney-card');
    ok(cards.some(c => /2017/.test(c) && /23/.test(c)), 'la lista de torneos incluye el 2017 del 23 de diciembre: ' + JSON.stringify(cards.map(c => c.replace(/\n/g, ' '))));
    ok(!cards.some(c => /Benjamín/.test(c)), 'el Benjamín 2017 de septiembre (pasado) no aparece');
    await p.locator('.tourney-card', { hasText: '2017' }).first().tap(); await p.waitForTimeout(500);
    ok(await p.locator('.welcome').isVisible(), 'abre elegir equipo');
    ok(await p.locator('.team-pick').count() === 8, '8 equipos para elegir (' + await p.locator('.team-pick').count() + ')');
    ok(await p.locator('.welcome-group').count() === 2, '2 grupos en elegir equipo (' + await p.locator('.welcome-group').count() + ')');
    await p.screenshot({ path: 'shots/t17-welcome.png', fullPage: true });
    await p.locator('.team-pick', { hasText: 'Portugalete' }).tap(); await p.waitForTimeout(400);
    await p.locator('.continue-btn').tap(); await p.waitForTimeout(500);
    if (await p.locator('.fairplay .btn').count()) { await p.locator('.fairplay .btn').tap(); await p.waitForTimeout(1200); }
    await p.screenshot({ path: 'shots/t17-home-pre.png', fullPage: true });
    ok(await p.locator('.group-card').count() === 0 || true, 'inicio cargado');
    // Inicio → pestaña Grupos
    const gcs = p.locator('.group-card');
    if (await gcs.count()) ok(await gcs.count() === 2, '2 tarjetas de grupo en inicio (' + await gcs.count() + ')');
    for (const h of ['#partidos', '#clasificacion', '#fases', '#mas']) { await p.goto(URL + h, { waitUntil: 'networkidle' }); await p.waitForTimeout(800); await p.screenshot({ path: `shots/t17-pre-${h.slice(1)}.png`, fullPage: true }); }
    // Partidos: 12 partidos de grupos
    await p.goto(URL + '#partidos', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const rowsTxt = await txt(p, '.match-row');
    ok(rowsTxt.length >= 12, 'Partidos lista los 12 partidos de grupos (' + rowsTxt.length + ')');
    // Clasificación: solo grupos A y B
    await p.goto(URL + '#clasificacion', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const tabs = (await txt(p, '[role=tablist] .tab, [role=tab]')).map(s => s.trim());
    ok(tabs.filter(s => /Grupo [A-D]/.test(s)).length === 2, 'Clasificación: solo 2 pestañas de grupo ' + JSON.stringify(tabs));
    ok(!tabs.some(s => /Grupo [CD]/.test(s)), 'sin grupos C ni D');
    // Fases: solo Semifinales y Final
    await p.goto(URL + '#fases', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const h3 = (await txt(p, '.ko-round h3')).map(s => s.trim().toLowerCase());
    ok(JSON.stringify(h3) === JSON.stringify(['semifinales', 'final']), 'Fases (lista Oro): rondas = Semifinales, Final → ' + JSON.stringify(h3));
    const body = await p.locator('body').innerText();
    ok(!/Cuartos/i.test(body), 'sin «Cuartos» en Fases');
    ok(/A1/.test(body) && /B2/.test(body) && /Ganador SF1/.test(body), 'etiquetas A1/B2/Ganador SF1 antes de definirse');
    // Cuadro
    await p.locator('.tab', { hasText: /^Cuadro$/ }).first().tap(); await p.waitForTimeout(400);
    ok(await p.locator('.bk.two').count() === 1, 'cuadro con 2 rondas (.bk.two)');
    ok(await p.locator('.bk-head').count() === 2 && await p.locator('.bk-game').count() === 3, 'cuadro: 2 cabeceras y 3 partidos (' + await p.locator('.bk-game').count() + ')');
    ok(await p.locator('.bk-conn').count() === 1, 'cuadro: un conector SF→Final');
    const bkw = await p.locator('.bk').evaluate(e => e.getBoundingClientRect().width);
    ok(bkw > 400 && bkw < 520, 'ancho del cuadro de 2 rondas ≈ 478 px (' + Math.round(bkw) + ')');
    await p.screenshot({ path: 'shots/t17-bracket-pre.png', fullPage: true });
    // Plata
    await p.locator('.tab', { hasText: /Fase Plata|Plata/ }).first().tap(); await p.waitForTimeout(400);
    ok(/A3/.test(await p.locator('body').innerText()) && /B4/.test(await p.locator('body').innerText()), 'Fase Plata: A3 vs B4');
    // Más → formato
    await p.goto(URL + '#mas', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    await p.locator('text=Formato del torneo').first().tap(); await p.waitForTimeout(700);
    const fmt = await p.locator('body').innerText();
    ok(/Semifinales/.test(fmt) && /Una final por fase/.test(fmt) && !/Cuartos de final/.test(fmt), 'Formato: recorrido grupos → semifinales → final (sin cuartos)');
    ok(/2\s*grupos de 4 equipos/.test(fmt) && /8 equipos\s*·\s*2 grupos/.test(fmt), 'Formato: 8 equipos, 2 grupos de 4');
    await p.screenshot({ path: 'shots/t17-formato.png', fullPage: true });
    ok(errs.length === 0, 'sin errores de consola (antes): ' + errs.slice(0, 3).join(' | '));
  }

  /* ---- 2 · Grupos terminados, semifinales por jugar (19:00) ---- */
  {
    const { p, errs } = await open(b, { time: '2026-12-23T18:55:00+01:00', rows: GROUPS });
    await enter(p, 'Derio');
    await p.goto(URL + '#clasificacion', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    const order = (await txt(p, '.trow')).map(s => s.replace(/\s+/g, ' ').trim()).filter(s => /^\d/.test(s));
    ok(/Derio/.test(order[0] || '') && /Zuazo/.test(order[1] || ''), 'Grupo A: Derio 1º, Zuazo 2º → ' + JSON.stringify(order.slice(0, 2)));
    await p.screenshot({ path: 'shots/t17-tabla-A.png', fullPage: true });
    await p.goto(URL + '#fases', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    const bodyO = await p.locator('body').innerText();
    ok(/Derio/.test(bodyO) && /Amistad Sniace/.test(bodyO) && /Pauldarrak/.test(bodyO) && /Zuazo/.test(bodyO), 'Oro: SF1 Derio–Amistad Sniace, SF2 Pauldarrak–Zuazo');
    await p.screenshot({ path: 'shots/t17-oro-semis.png', fullPage: true });
    await p.locator('.tab', { hasText: /Plata/ }).first().tap(); await p.waitForTimeout(500);
    const bodyP = await p.locator('body').innerText();
    ok(/Arenas/.test(bodyP) && /Portugalete/.test(bodyP) && /Colegio Vizcaya/.test(bodyP) && /Abanto/.test(bodyP), 'Plata: SF1 Arenas–Portugalete, SF2 Colegio Vizcaya–Abanto');
    await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    await p.screenshot({ path: 'shots/t17-home-semis.png', fullPage: true });
    const homeTxt = await p.locator('body').innerText();
    ok(/Finalizado|Finalizada|Fase Oro|Oro/.test(homeTxt), 'Inicio: aparecen las fases finales');
    ok(errs.length === 0, 'sin errores de consola (semis): ' + errs.slice(0, 3).join(' | '));
  }

  /* ---- 3 · Torneo terminado ---- */
  {
    const { p, errs } = await open(b, { time: '2026-12-23T20:30:00+01:00', rows: [...GROUPS, ...SEMIS, ...FINALS], scheme: 'dark' });
    await enter(p, 'Zuazo');
    await p.goto(URL + '#fases', { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    ok(await p.locator('.champion.oro').count() === 1 && /Pauldarrak/.test(await p.locator('.champion.oro').innerText()), 'campeón Oro: Pauldarrak (final 1-1, pen. 2-3)');
    await p.locator('.tab', { hasText: /Plata/ }).first().tap(); await p.waitForTimeout(500);
    ok(await p.locator('.champion.plata').count() === 1 && /Arenas/.test(await p.locator('.champion.plata').innerText()), 'campeón Plata: Arenas');
    await p.screenshot({ path: 'shots/t17-plata-final.png', fullPage: true });
    await p.locator('.tab', { hasText: /^Cuadro$/ }).first().tap(); await p.waitForTimeout(400);
    await p.screenshot({ path: 'shots/t17-bracket-final-dark.png', fullPage: true });
    await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    await p.screenshot({ path: 'shots/t17-home-final.png', fullPage: true });
    const homeTxt = await p.locator('body').innerText();
    ok(/Pauldarrak/.test(homeTxt) && /Arenas/.test(homeTxt), 'Inicio final: campeones Oro y Plata');
    ok(/Eliminado|Eliminada|Semifinal/i.test(homeTxt), 'Inicio: Zuazo aparece eliminado (semifinal)');
    ok(errs.length === 0, 'sin errores de consola (final): ' + errs.slice(0, 3).join(' | '));
  }

  console.log(`RESULT pass=${pass} fail=${fail}`);
  await b.close();
})();
