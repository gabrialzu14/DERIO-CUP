/* QA: estrella en «Acceso responsables» para ver las opiniones del torneo. */
const { chromium, devices } = require('playwright');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const URL = 'http://localhost:3100/';
const ROWS = [
  { rating: 5, comment: 'Muy buen ambiente, gracias.', lang: 'es', created_at: '2026-12-08T15:30:00+00:00' },
  { rating: 4, comment: 'Más sombra para las familias.', lang: 'es', created_at: '2026-12-08T14:10:00+00:00' },
  { rating: 5, comment: null, lang: 'eu', created_at: '2026-12-08T13:00:00+00:00' },
  { rating: 2, comment: '   ', lang: 'es', created_at: '2026-12-08T12:00:00+00:00' },
];
async function open(b, mode) {
  const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], colorScheme: 'light' }); await ctx.clock.setFixedTime(new Date('2026-12-08T17:00:00+01:00'));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('derio-cup-onboarded', '1'); localStorage.setItem('derio-cup-lang', 'es'); });
  await p.route('**/derio_cup_results*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await p.route('**/derio_cup_fans*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  let body = null;
  await p.route('**/functions/v1/derio-cup-feedback', r => { if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: 'ok' }); body = JSON.parse(r.request().postData()); if (mode === 'error') return r.fulfill({ status: 500, body: '{}' }); r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/json', body: JSON.stringify(mode === 'empty' ? [] : ROWS) }); });
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(3700);
  await p.locator('.tourney-card', { hasText: '2015' }).first().tap(); await p.waitForTimeout(500);
  await p.locator('.team-pick', { hasText: 'Leioa' }).first().tap(); await p.waitForTimeout(400); await p.locator('.continue-btn').tap(); await p.waitForTimeout(500);
  if (await p.locator('.fairplay .btn').count()) { await p.locator('.fairplay .btn').tap(); await p.waitForTimeout(1200); }
  await p.goto(URL + '#mas', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await p.locator('.menu-item', { hasText: 'Acceso responsables' }).tap(); await p.waitForTimeout(700);
  return { ctx, p, errs, get body() { return body; } };
}
(async () => {
  const b = await chromium.launch();
  {
    const s = await open(b, 'ok'), p = s.p;
    ok(await p.locator('.fb-open').count() === 0, 'sin código no se ve la estrella');
    await p.locator('input[type=password]').fill('1802'); await p.locator('.manager-login .btn-primary').tap(); await p.waitForTimeout(600);
    const star = p.locator('.dialog[open] .fb-open'); ok(await star.count() === 1, 'con código aparece la estrella arriba');
    const hb = await star.boundingBox(), cb = await p.locator('.dialog[open] .hd-btns .icon-btn').last().boundingBox();
    ok(hb && cb && hb.y < 200 && hb.x < cb.x, 'la estrella está en la cabecera, junto a cerrar');
    ok(await p.locator('.manager').isVisible(), 'por defecto se ven los resultados');
    await star.tap(); await p.waitForTimeout(900);
    ok(s.body && s.body.code === '1802' && s.body.tournament_id === '2015', 'pide las opiniones del torneo con el código ' + JSON.stringify(s.body));
    const t = await p.locator('.dialog[open]').innerText();
    ok(/Opiniones del torneo/.test(t), 'título «Opiniones del torneo»');
    ok(/4,0|4,0/.test(t) && /4 valoraciones/.test(t), 'media 4,0 y 4 valoraciones');
    ok(await p.locator('.fa-dist li').count() === 5, 'reparto 5→1');
    ok(await p.locator('.fa-list li').count() === 2 && /Muy buen ambiente/.test(t) && !/Sin comentarios/.test(t), 'solo comentarios con texto (2)');
    ok(!(await p.locator('.manager').count()), 'la vista de resultados se oculta');
    await p.screenshot({ path: 'shots/op-list.png' });
    await star.tap(); await p.waitForTimeout(600);
    ok(await p.locator('.manager').isVisible() && !(await p.locator('.fa').count()), 'la estrella otra vez vuelve a los resultados');
    ok(s.errs.length === 0, 'sin errores JS ' + s.errs.join('|')); await s.ctx.close();
  }
  for (const [mode, re, label] of [['empty', /Aún no hay opiniones/, 'sin opiniones'], ['error', /No se pudieron cargar/, 'error de carga']]) {
    const s = await open(b, mode), p = s.p;
    await p.locator('input[type=password]').fill('1802'); await p.locator('.manager-login .btn-primary').tap(); await p.waitForTimeout(600);
    await p.locator('.dialog[open] .fb-open').tap(); await p.waitForTimeout(900);
    ok(re.test(await p.locator('.dialog[open]').innerText()), label + ': mensaje correcto');
    await s.ctx.close();
  }
  console.log(`RESULT pass=${pass} fail=${fail}`); await b.close();
})();
