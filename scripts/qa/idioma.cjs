const {chromium,devices}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL '+m)}};
const URL='http://localhost:3100/';
const SPANISH=/\b(el|la|los|las|de|del|para|con|por|una|un|que|sin|más|partidos?|equipos?|grupos?|campo|fase|resultados?|clasificaci[oó]n|jornada|torneo|volver|inicio|ver|todos|siguiente|atrás|continuar|elegir|ahora|juego|final(?!-)|cuartos|semifinales|oro|plata|aficion|afición|seguidores?|idioma|ajustes|apariencia|claro|oscuro|información|normas|comidas|aparcamiento|instalar|cambiar|acceso|responsables|guardar|eliminar|publicado)\b/i;
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({...devices['iPhone 14 Pro'],colorScheme:'light'});const p=await ctx.newPage();
await p.route('**/derio_cup_results*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{match_id:'2015-grupo-A-1015-c1',home_score:2,away_score:1},{match_id:'2015-grupo-A-1015-c2',home_score:1,away_score:1},{match_id:'2015-oro-cf1',home_score:3,away_score:3,home_penalties:4,away_penalties:3,home_team:'leioa',away_team:'ariznabarra'}])}));
await p.route('**/derio_cup_fans*',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
await p.goto(URL,{waitUntil:'networkidle'});await p.waitForTimeout(3000);
ok(await p.locator('.onb').count()===1&&(await p.locator('.onb-title').innerText()).includes('Bienvenido'),'va directo a la bienvenida');
ok(await p.locator('.lang-toggle').count()===1&&await p.locator('.flag').count()===0,'selector CAS | EUS sin banderas');
const bb=await p.locator('.lang-toggle').boundingBox();ok(bb.x+bb.width>340&&bb.y<80,'selector arriba a la derecha');
const x0=await p.locator('.lang-bar').evaluate(e=>e.getBoundingClientRect().x);
await p.locator('.lang-toggle button',{hasText:'EUS'}).tap();await p.waitForTimeout(500);
const x1=await p.locator('.lang-bar').evaluate(e=>e.getBoundingClientRect().x);
ok(x1>x0+20,'la barra azul se desliza ('+x0+'→'+x1+')');
ok((await p.locator('.onb-title').innerText()).includes('Ongi etorri'),'bienvenida en euskera');
await p.screenshot({path:'shots/i-welcome-eu.png'});
await p.locator('.btn').tap();await p.waitForTimeout(300);await p.locator('.onb-card').nth(0).tap();await p.waitForTimeout(500);
await p.screenshot({path:'shots/i-landing-eu.png'});
await p.locator('.tourney-card').tap();await p.waitForTimeout(400);await p.locator('.team-pick',{hasText:'Leioa'}).tap();await p.locator('.continue-btn').tap();await p.locator('.fairplay .btn').tap();await p.waitForTimeout(400);await p.waitForTimeout(900);
const leaks=new Map();
for(const h of ['','#partidos','#clasificacion','#fases','#mas','#equipo/leioa','#equipo/ariznabarra']){
 await p.goto(URL+h,{waitUntil:'networkidle'});await p.waitForTimeout(700);
 if(h==='#fases'){await p.locator('.tab',{hasText:/Koadroa/}).first().tap().catch(()=>{});await p.waitForTimeout(300);await p.screenshot({path:'shots/i-bracket-eu.png',fullPage:true});}
 const lines=await p.evaluate(()=>[...document.querySelectorAll('#scroller *, nav *')].filter(e=>!e.children.length&&e.textContent.trim()).map(e=>e.textContent.trim()).concat([...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label'))));
 for(const l of lines) if(SPANISH.test(l)&&!/^(Derio|Leioa|Cultural|Arrupe|Ermua|Gernika|Bermeo|Lagun|Etxebarri|Abadiño|Ariznabarra|Sestao|Portugalete|BGE)/.test(l)&&!/Derio Cup/.test(l)) leaks.set(l,(leaks.get(l)||0)+1);
 await p.screenshot({path:`shots/i-eu-${h.replace(/[#\/]/g,'_')||'inicio'}.png`});
}
console.log('textos con posible castellano en euskera:',[...leaks.keys()]);
ok(leaks.size===0,'toda la app traducida al euskera');
// info items
await p.goto(URL+'#mas',{waitUntil:'networkidle'});await p.waitForTimeout(500);
for(const k of ['Txapelketaren informazioa','Kokalekua','Txapelketaren formatua','Jokoaren arauak','Otorduak','Aparkalekua']){
 const it=p.locator('.menu-item',{hasText:k}).first();if(!(await it.count())){ok(false,'falta '+k);continue}
 await it.tap();await p.waitForTimeout(450);
 const txt=await p.locator('.dialog-body').innerText();
 const bad=txt.split('\n').filter(l=>SPANISH.test(l));
 ok(bad.length===0,'diálogo «'+k+'» en euskera'+(bad.length?': '+bad.slice(0,3).join(' | '):''));
 if(k==='Txapelketaren formatua')await p.screenshot({path:'shots/i-format-eu.png'});
 if(k==='Jokoaren arauak')await p.screenshot({path:'shots/i-rules-eu.png'});
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
}
await b.close();console.log(`RESULT pass=${pass} fail=${fail}`);})();
