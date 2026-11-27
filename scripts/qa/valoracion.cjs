/* QA: recuadro de valoración del torneo (Info) y color de las etiquetas del inicio. */
const { chromium, devices } = require('playwright');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL ' + m); } };
const URL = 'http://localhost:3100/';
(async () => {
  const b = await chromium.launch();
  for (const lang of ['es', 'eu', 'fr']) {
    const ctx = await b.newContext({ ...devices['iPhone 14 Pro'], colorScheme: 'light' }); await ctx.clock.setFixedTime(new Date('2026-12-08T09:00:00+01:00'));
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(l => { localStorage.setItem('derio-cup-onboarded', '1'); localStorage.setItem('derio-cup-lang', l); }, lang);
    await p.route('**/derio_cup_results*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await p.route('**/derio_cup_fans*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    let posted = null, fail503 = lang === 'eu';
    await p.route('**/derio_cup_feedback*', async r => { const req = r.request(); if (req.method() !== 'POST') return r.fulfill({ status: 405, body: '' }); if (fail503) { fail503 = false; return r.fulfill({ status: 503, body: '' }); } posted = JSON.parse(req.postData()); r.fulfill({ status: 201, body: '' }); });
    await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(3700);
    await p.locator('.tourney-card', { hasText: '2015' }).first().tap(); await p.waitForTimeout(500);
    await p.locator('.team-pick', { hasText: 'Leioa' }).first().tap(); await p.waitForTimeout(400); await p.locator('.continue-btn').tap(); await p.waitForTimeout(500);
    if (await p.locator('.fairplay .btn').count()) { await p.locator('.fairplay .btn').tap(); await p.waitForTimeout(1200); }
    if (lang === 'es') {
      // color de «Próximo partido» y C1/C2 = color de «Torneo»
      const col = await p.evaluate(() => { const c = s => getComputedStyle(document.querySelector(s)).color; return { torneo: c('.section-head h2'), eyebrow: c('.hero .eyebrow'), field: c('.hero-field') }; });
      ok(col.eyebrow === col.torneo && col.field === col.torneo, 'etiquetas del hero = color de «Torneo» ' + JSON.stringify(col));
    }
    await p.goto(URL + '#mas', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const fb = p.locator('.feedback'); await fb.scrollIntoViewIfNeeded();
    ok(await fb.count() === 1, lang + ': recuadro de valoración presente');
    const order = await p.evaluate(() => { const f = document.querySelector('.feedback').getBoundingClientRect().top, m = [...document.querySelectorAll('.menu-card')].map(e => e.getBoundingClientRect().bottom); return m.every(x => x < f); });
    ok(order, lang + ': debajo de todos los menús de Info');
    const send = fb.locator('.btn-primary'); ok(await send.isDisabled(), lang + ': enviar desactivado sin estrellas');
    ok(/mejorar|hobetzen|améliorer/.test(await fb.innerText()), lang + ': indica que sirve para mejorar próximas ediciones');
    await fb.locator('[role=radio]').nth(3).tap(); ok(await fb.locator('[role=radio][aria-checked=true]').count() === 1 && await fb.locator('.fb-stars .on').count() === 4, lang + ': 4 estrellas marcadas');
    ok(!(await send.isDisabled()), lang + ': enviar activo con valoración');
    await fb.locator('textarea').fill('Muy buen ambiente, más sombra para las familias.');
    await p.screenshot({ path: `shots/fb-${lang}-form.png` });
    await send.tap(); await p.waitForTimeout(700);
    if (lang === 'eu') {
      ok(await fb.locator('.form-error').count() === 1 && !(await send.isDisabled()), 'eu: si falla el envío se avisa y se puede reintentar');
      await send.tap(); await p.waitForTimeout(700);
    }
    ok(posted && posted.rating === 4 && posted.tournament_id === '2015' && posted.lang === lang && /ambiente/.test(posted.comment), lang + ': se envía rating, torneo, idioma y comentario ' + JSON.stringify(posted));
    ok(await fb.locator('.fb-thanks').count() === 1 && await fb.locator('textarea').count() === 0, lang + ': agradecimiento y formulario oculto');
    await p.screenshot({ path: `shots/fb-${lang}-thanks.png` });
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(900);
    ok(await p.locator('.feedback .fb-thanks').count() === 1, lang + ': recuerda que ya valoró tras recargar');
    ok(errs.length === 0, lang + ': sin errores JS ' + errs.join('|'));
    await ctx.close();
  }
  console.log(`RESULT pass=${pass} fail=${fail}`); await b.close();
})();
