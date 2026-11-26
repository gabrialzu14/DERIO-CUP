/* QA del francés: recorre todas las pantallas y diálogos en francés y busca texto que se haya quedado en castellano o euskera. */
const {chromium,devices}=require('playwright');const fs=require('fs');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL '+m)}};
const URL='http://localhost:3100/';fs.mkdirSync('shots',{recursive:true});
// palabras que no existen en francés (castellano y euskera frecuentes en la app)
const ES=/\b(el|los|las|del|para|con|por|una|partidos?|equipos?|grupos?|campo|jornada|torneo|volver|inicio|todos|siguiente|atrás|continuar|elegir|ahora|cuartos|semifinales|oro|plata|afición|seguidores?|idioma|ajustes|apariencia|claro|oscuro|información|normas|comidas|aparcamiento|instalar|cambiar|acceso|guardar|publicado|pulsa|abre|cómo|llegar|entrada|grada|baños|desempates?|clasificaci[oó]n|resultados?|hoy|mañana|días)\b/i;
const EU=/\b(eta|edo|ez|da|dira|zure|multzoa?|zelaia|partidak|txapelketa|sailkapena|urrezko|zilarrezko|aparkalekua|sarrera|komunak|taberna|hasiera|faseak|jardunaldia|irabazlea|jarraitzaile)\b/i;
const NAMES=/^(Derio|Leioa|Cultural|Arrupe|Ermua|Gernika|Bermeo|Lagun|Etxebarri|Abadiño|Ariznabarra|Sestao|Portugalete|BGE|Sanse|Santutxu|Baskauri|Danok|Romo|Athletic|Ibaiondo|Calle Errekalde|Camino Untzaga|Seminario)/;
(async()=>{const b=await chromium.launch();
const ctx=await b.newContext({...devices['iPhone 14 Pro'],colorScheme:'light'});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await ctx.addInitScript(()=>{localStorage.setItem('derio-cup-onboarded','1');localStorage.setItem('derio-cup-lang','fr');localStorage.setItem('derio-cup-tournament','2015');localStorage.setItem('derio-cup-team:2015','leioa');sessionStorage.setItem('derio-cup-splash','1')});
await p.route('**/derio_cup_results*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{match_id:'2015-grupo-A-1015-c1',home_score:2,away_score:1}])}));
await p.route('**/derio_cup_fans*',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
const leaks=new Map();const scan=async(where)=>{const lines=await p.evaluate(()=>[...document.querySelectorAll('#scroller *, nav *, dialog *')].filter(e=>!e.children.length&&e.textContent.trim()&&e.offsetParent!==null).map(e=>e.textContent.trim()).concat([...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label'))));
 for(const l of lines){const s=l.replace(/Derio Cup/g,'');if((ES.test(s)||EU.test(s))&&!NAMES.test(l)) leaks.set(l,where)}};
for(const h of ['','#partidos','#clasificacion','#fases','#mas','#equipo/leioa','#equipo/ariznabarra']){
 await p.goto(URL+h,{waitUntil:'networkidle'});await p.waitForTimeout(700);
 if(!h){const fp=p.locator('.fairplay .btn');if(await fp.count()){await scan('fair-play');await fp.tap();await p.waitForTimeout(300)}}
 await scan(h||'inicio');await p.screenshot({path:`shots/fr${h.replace(/[#\/]/g,'_')||'_inicio'}.png`});
}
await p.goto(URL+'#mas',{waitUntil:'networkidle'});await p.waitForTimeout(500);
const items=await p.locator('.menu-item').count();
for(let i=0;i<items;i++){const it=p.locator('.menu-item').nth(i);const name=(await it.innerText()).split('\n')[0];
 await it.tap().catch(()=>{});await p.waitForTimeout(600);
 if(await p.locator('dialog[open]').count()){await scan('Infos › '+name);await p.screenshot({path:'shots/fr-info-'+i+'.png'});await p.keyboard.press('Escape');await p.waitForTimeout(400)}
}
// pantalla de torneos y bienvenida
await p.evaluate(()=>{localStorage.removeItem('derio-cup-tournament')});await p.goto(URL,{waitUntil:'networkidle'});await p.waitForTimeout(800);await scan('torneos');await p.screenshot({path:'shots/fr-torneos.png'});
console.log('textos sin traducir en francés:',[...leaks].map(([l,w])=>w+': '+l));
ok(leaks.size===0,'toda la app en francés');ok(errs.length===0,'sin errores '+errs.slice(0,2).join(' | '));
await b.close();console.log(`RESULT pass=${pass} fail=${fail}`);})();
