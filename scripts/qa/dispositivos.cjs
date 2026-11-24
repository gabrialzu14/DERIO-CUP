const {chromium,devices}=require('playwright');
let pass=0,fail=0;const fails=[];
const ok=(c,m)=>{if(c)pass++;else{fail++;fails.push(m);console.log('FAIL '+m)}};
const URL='http://localhost:3100/';
const profiles=[
 ['iPhone SE 1',{viewport:{width:320,height:568},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone SE'].userAgent}],
 ['iPhone SE 3',{...devices['iPhone SE']}],
 ['iPhone 12',{...devices['iPhone 12']}],
 ['iPhone 14 Pro Max',{...devices['iPhone 14 Pro Max']}],
 ['Pixel 5',{...devices['Pixel 5']}],
 ['Galaxy S8',{...devices['Galaxy S8']}],
 ['Galaxy Fold cerrado',{viewport:{width:280,height:653},deviceScaleFactor:3,isMobile:true,hasTouch:true,userAgent:devices['Galaxy S8'].userAgent}],
 ['Galaxy Tab',{viewport:{width:800,height:1280},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['Galaxy S8'].userAgent}],
 ['iPhone 12 apaisado',{...devices['iPhone 12 landscape']}],
 ['Pixel 5 apaisado',{...devices['Pixel 5 landscape']}],
];
const routes=['','#partidos','#clasificacion','#fases','#mas','#equipo/derio','#equipo/trapagaran'];
(async()=>{const b=await chromium.launch();
for(const [name,prof] of profiles){
 for(const scheme of ['light','dark']){
  const ctx=await b.newContext({...prof,colorScheme:scheme});const p=await ctx.newPage();await p.addInitScript(()=>localStorage.setItem('derio-cup-onboarded','1'));
  const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
  await p.route('**/derio_cup_fans*',r=>r.request().method()==='POST'?r.fulfill({status:201,body:''}):r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  const tag=`[${name}/${scheme}]`;
  // landing
  await p.goto(URL,{waitUntil:'networkidle'});await p.waitForTimeout(1300);
  const ov=await p.evaluate(()=>({sx:document.documentElement.scrollWidth-innerWidth,bx:document.body.scrollWidth-innerWidth}));
  ok(ov.sx<=0&&ov.bx<=0,`${tag} landing sin desborde horizontal (${JSON.stringify(ov)})`);
  ok(await p.locator('.tourney-card').isVisible(),`${tag} landing muestra el torneo`);
  const sponsors=await p.locator('.sponsors-list li').evaluateAll(els=>els.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth}));
  ok(sponsors,`${tag} patrocinadores dentro de pantalla`);
  // pick team and continue
  await p.locator('.tourney-card').click();await p.waitForTimeout(500);
  await p.locator('.team-pick',{hasText:'Derio'}).first().click();await p.waitForTimeout(500);
  const cbtn=p.locator('.continue-btn');ok(await cbtn.isVisible(),`${tag} botón Continuar visible`);
  const bb=await cbtn.boundingBox();const vp=p.viewportSize();
  ok(bb&&bb.y+bb.height<=vp.height&&bb.x>=0&&bb.x+bb.width<=vp.width,`${tag} Continuar dentro de la pantalla`);
  await cbtn.click();await p.waitForTimeout(900);
  ok(await p.locator('.tabbar').isVisible(),`${tag} entra al torneo`);
  for(const r of routes){
   await p.goto(URL+r,{waitUntil:'networkidle'});await p.waitForTimeout(500);
   const o=await p.evaluate(()=>({sx:document.documentElement.scrollWidth-innerWidth,bx:document.body.scrollWidth-innerWidth,sy:window.scrollY,dtop:document.documentElement.scrollTop,sc:document.getElementById('scroller').scrollWidth-document.getElementById('scroller').clientWidth}));
   ok(o.sx<=0&&o.bx<=0&&o.sc<=0,`${tag} ${r||'inicio'} sin desborde horizontal ${JSON.stringify(o)}`);
   // el documento no debe poder moverse
   await p.evaluate(()=>{window.scrollTo(0,500);document.documentElement.scrollTop=500;document.body.scrollTop=500});
   const moved=await p.evaluate(()=>({y:window.scrollY,d:document.documentElement.scrollTop,b:document.body.scrollTop}));
   ok(moved.y===0&&moved.d===0&&moved.b===0,`${tag} ${r||'inicio'} la página no se desplaza ${JSON.stringify(moved)}`);
   // tabbar: dentro y etiquetas sin recorte
   const tb=await p.evaluate(()=>{const bar=document.querySelector('.tabbar').getBoundingClientRect();const spans=[...document.querySelectorAll('.tabbar button span')];return {bottom:bar.bottom,vh:innerHeight,clipped:spans.filter(s=>s.scrollWidth>s.clientWidth+1||s.getBoundingClientRect().right>innerWidth).length}});
   ok(Math.abs(tb.bottom-tb.vh)<=1,`${tag} ${r||'inicio'} barra inferior pegada abajo (${tb.bottom} vs ${tb.vh})`);
   ok(tb.clipped===0,`${tag} ${r||'inicio'} etiquetas de pestañas sin recorte`);
   // textos recortados en contenido
   const clip=await p.evaluate(()=>[...document.querySelectorAll('.main *')].filter(e=>{if(!e.children.length&&e.textContent.trim()){const s=getComputedStyle(e);if(s.overflow==='hidden'&&s.textOverflow==='ellipsis')return false;const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left<-1)}return false}).map(e=>e.textContent.trim().slice(0,30)));
   ok(clip.length===0,`${tag} ${r||'inicio'} texto fuera de pantalla: ${clip.join('|')}`);
  }
  // scroll interno funciona y llega al final sin tapar contenido
  await p.goto(URL+'#partidos',{waitUntil:'networkidle'});await p.waitForTimeout(400);
  const sc=await p.evaluate(()=>{const s=document.getElementById('scroller');s.scrollTo(0,99999);return {top:s.scrollTop,max:s.scrollHeight-s.clientHeight}});
  ok(sc.max>50&&sc.top>=sc.max-2,`${tag} el scroller interno llega al final`);
  const lastVisible=await p.evaluate(()=>{const rows=[...document.querySelectorAll('.match-row,.ko-row')];const last=rows[rows.length-1].getBoundingClientRect();const bar=document.querySelector('.tabbar').getBoundingClientRect();return last.bottom<=bar.top+1});
  ok(lastVisible,`${tag} el último elemento no queda tapado por la barra`);
  ok(errs.length===0,`${tag} sin errores JS: ${errs.slice(0,2)}`);
  await ctx.close();
 }
}
await b.close();
console.log(`\nRESULT pass=${pass} fail=${fail}`);
})();
