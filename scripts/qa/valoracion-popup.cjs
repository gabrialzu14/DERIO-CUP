/* QA: al entrar con el torneo terminado se pide la opinión en una ventana emergente. */
const { chromium, devices } = require('playwright');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const URL = 'http://localhost:3100/', P = '2017b-';
const R = (id, h, a, extra = {}) => ({ match_id: P + id, home_score: h, away_score: a, ...extra });
const GROUPS = [R('grupo-A-1630-c1', 2, 0), R('grupo-A-1630-c2', 1, 1), R('grupo-A-1720-c1', 3, 1), R('grupo-A-1720-c2', 0, 2), R('grupo-A-1810-c1', 1, 1), R('grupo-A-1810-c2', 2, 2), R('grupo-B-1655-c1', 1, 0), R('grupo-B-1655-c2', 2, 2), R('grupo-B-1745-c1', 0, 1), R('grupo-B-1745-c2', 3, 0), R('grupo-B-1835-c1', 2, 0), R('grupo-B-1835-c2', 1, 1)];
const KO = (id, h, a, hs, as, hp, ap) => R(id, hs, as, { home_team: h, away_team: a, home_penalties: hp ?? null, away_penalties: ap ?? null, phase: id.split('-')[0], round: id.split('-')[1] });
const SEMIS = [KO('oro-sf1', 'derio', 'amistad-sniace', 2, 2, 3, 1), KO('oro-sf2', 'pauldarrak', 'zuazo', 1, 0), KO('plata-sf1', 'arenas', 'portugalete', 2, 1), KO('plata-sf2', 'colegio-vizcaya', 'abanto', 0, 1)];
const FIN_ORO = KO('oro-final', 'derio', 'pauldarrak', 1, 1, 2, 3), FIN_PLATA = KO('plata-final', 'arenas', 'abanto', 3, 0);
async function open(b, rows, { rated = false, lang = 'es' } = {}) {
  const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], colorScheme: 'light' }); await ctx.clock.setFixedTime(new Date('2026-12-23T20:30:00+01:00'));
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(([r, l]) => { localStorage.setItem('derio-cup-onboarded', '1'); localStorage.setItem('derio-cup-lang', l); localStorage.setItem('derio-cup-team:2017b', 'zuazo'); if (r) localStorage.setItem('derio-cup-feedback-2017b', '5'); }, [rated, lang]);
  await p.route('**/derio_cup_results*', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) }));
  await p.route('**/derio_cup_fans*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const sent = []; await p.route('**/derio_cup_feedback*', r => { if (r.request().method() === 'POST') sent.push(JSON.parse(r.request().postData())); r.fulfill({ status: 201, body: '' }); });
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(3700);
  await p.locator('.tourney-card', { hasText: '23' }).first().tap(); await p.waitForTimeout(2600);
  return { ctx, p, errs, sent };
}
(async () => {
  const b = await chromium.launch(); const ALL = [...GROUPS, ...SEMIS, FIN_ORO, FIN_PLATA];
  {
    const s = await open(b, ALL), p = s.p, d = p.locator('.dialog[open]');
    ok(await d.count() === 1, 'torneo terminado: aparece la ventana al entrar');
    ok(/Tu opinión nos importa/.test(await d.locator('h2').innerText()), 'título «Tu opinión nos importa»');
    ok(await d.locator('[role=radio]').count() === 5 && !(await d.locator('textarea').isVisible()), 'solo las 5 estrellas al principio');
    await p.screenshot({ path: 'shots/vp-1.png' });
    await d.locator('[role=radio]').nth(4).tap(); await p.waitForTimeout(900);
    ok(await d.locator('textarea').isVisible(), 'al puntuar se despliega el comentario');
    await d.locator('textarea').fill('Gran torneo, repetiremos.'); await p.screenshot({ path: 'shots/vp-2.png' });
    await d.locator('.btn-primary').tap(); await p.waitForTimeout(700);
    ok(s.sent.length === 1 && s.sent[0].rating === 5 && s.sent[0].tournament_id === '2017b', 'se envía la valoración ' + JSON.stringify(s.sent));
    ok(await d.locator('.fb-thanks').count() === 1, 'agradecimiento tras enviar');
    await p.waitForTimeout(2600); ok(await p.locator('.dialog[open]').count() === 0, 'la ventana se cierra sola tras el agradecimiento');
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(3500);
    ok(await p.locator('.dialog[open]').count() === 0, 'ya valorado: no vuelve a salir');
    ok(s.errs.length === 0, 'sin errores JS ' + s.errs.join('|')); await s.ctx.close();
  }
  { const s = await open(b, [...GROUPS, ...SEMIS, FIN_ORO]); ok(await s.p.locator('.dialog[open]').count() === 0, 'torneo sin terminar (falta la final de Plata): no sale'); await s.ctx.close(); }
  { const s = await open(b, ALL, { rated: true }); ok(await s.p.locator('.dialog[open]').count() === 0, 'ya valoró en este dispositivo: no sale'); await s.ctx.close(); }
  {
    const s = await open(b, ALL), p = s.p;
    await p.locator('.dialog[open] .fb-later').tap(); await p.waitForTimeout(700);
    ok(await p.locator('.dialog[open]').count() === 0, '«Ahora no» cierra la ventana');
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(3500);
    ok(await p.locator('.dialog[open]').count() === 0, 'tras «Ahora no» no vuelve a salir en la misma sesión');
    await s.ctx.close();
  }
  for (const lang of ['eu', 'fr']) { const s = await open(b, ALL, { lang }); ok(/importa|garrantzitsua|compte pour nous/.test(await s.p.locator('.dialog[open] h2').innerText()) && !/Ahora no/.test(await s.p.locator('.dialog[open]').innerText()), lang + ': ventana traducida'); await s.ctx.close(); }
  console.log(`RESULT pass=${pass} fail=${fail}`); await b.close();
})();
