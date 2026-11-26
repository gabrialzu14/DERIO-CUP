const {chromium,devices}=require('playwright');const fs=require('fs');const S='/tmp/qa-map/';
const crypto=require('crypto');
const URL='http://localhost:3100/#mas';let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL',m)}};
const hash=async(loc)=>crypto.createHash('md5').update(await loc.screenshot()).digest('hex');
async function touch(cdp,type,pts){await cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map((p,i)=>({x:p[0],y:p[1],id:i}))})}
async function drag(cdp,from,to,steps=14){await touch(cdp,'touchStart',[from]);for(let i=1;i<=steps;i++)await touch(cdp,'touchMove',[[from[0]+(to[0]-from[0])*i/steps,from[1]+(to[1]-from[1])*i/steps]]);await touch(cdp,'touchEnd',[])}
async function pinch(cdp,c,r0,r1,rot=0,steps=14){const pts=(r,a)=>[[c[0]-r*Math.cos(a),c[1]-r*Math.sin(a)],[c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)]];await touch(cdp,'touchStart',pts(r0,0));for(let i=1;i<=steps;i++){const f=i/steps;await touch(cdp,'touchMove',pts(r0+(r1-r0)*f,rot*f))}await touch(cdp,'touchEnd',[])}
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
// Por defecto, una pasada rápida (3 dispositivos); QA_ALL=1 recorre los 9 (tarda más de 5 min con WebGL por software).
const ALL=[['iPhone SE'],['iPhone 12'],['iPhone 15 Pro Max'],['Pixel 5'],['Galaxy S8'],['Pixel 7'],['Galaxy Tab S4'],['iPhone 12 landscape'],['Pixel 5 landscape']];
const list=process.env.QA_ALL?ALL:[['iPhone SE'],['iPhone 12'],['Pixel 5 landscape']];
for(const [name] of list){try{const T=`[${name}]`;const d=devices[name];if(!d){console.log('sin dispositivo',name);continue}
 for(const [lg,th] of (name==='iPhone 12'||name==='Pixel 5'?[['es','light'],['eu','dark']]:[['es','light']])){
 const tag=`${T}[${lg}/${th}]`;
 const ctx=await b.newContext({...d,deviceScaleFactor:1,colorScheme:th});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
 await p.addInitScript(([lg,th])=>{localStorage.setItem('derio-cup-onboarded','1');localStorage.setItem('derio-cup-lang',lg);localStorage.setItem('derio-cup-theme',th);localStorage.setItem('derio-cup-tournament','2015');localStorage.setItem('derio-cup-team:2015','leioa');sessionStorage.setItem('derio-cup-splash','1')},[lg,th]);
 await p.route('**/derio_cup_*',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await p.goto(URL,{waitUntil:'networkidle'});await p.waitForTimeout(600);
 await p.locator('.menu-item',{hasText:/Ubicaci|Kokaleku/}).first().tap();await p.waitForTimeout(3500);
 const map=p.locator('.v3-map');const cv=p.locator('.v3-map canvas');
 ok(await p.locator('.v3-map.ready').count()===1,tag+' el plano 3D carga');
 await map.scrollIntoViewIfNeeded();await p.waitForTimeout(300);
 const box=await map.boundingBox();ok(box&&box.width>200&&box.height>150,tag+' tamaño razonable '+JSON.stringify(box&&[Math.round(box.width),Math.round(box.height)]));
 const cdp=await ctx.newCDPSession(p);
 const C=async()=>{await map.scrollIntoViewIfNeeded();const q=await map.boundingBox();return [q.x+q.width/2,q.y+q.height/2,q]};
 const h0=await hash(map);
 // 1) tocar una opción: no mueve la cámara y sale descripción
 await p.locator('.v3-chip').nth(2).evaluate(e=>e.click());await p.waitForTimeout(600);
 const popTxt=await p.locator('.v3-pop').innerText();ok(popTxt.trim().length>3&&await p.locator('.v3-pop').isVisible(),tag+' sale la descripción: '+popTxt.replace(/\n/g,' / '));
 await p.locator('.v3-chip').nth(2).evaluate(e=>e.click());await p.waitForTimeout(400);
 ok(await p.locator('.v3-pop').isHidden(),tag+' al volver a pulsar se cierra');
 // la ficha de cada zona queda dentro del plano y no tapa otros pines ni los botones
 for(let i=0;i<6;i++){await p.locator('.v3-chip').nth(i).evaluate(e=>e.click());await p.waitForTimeout(1300);
  const r=await p.evaluate(()=>{const h=document.querySelector('.v3-map').getBoundingClientRect(),pp=document.querySelector('.v3-pop').getBoundingClientRect();const hit=[...document.querySelectorAll('.v3-btn,.v3-mk:not(.on) .pin')].filter(x=>{const b=x.getBoundingClientRect();return getComputedStyle(x.closest('.v3-mk')||x).opacity!=='0'&&b.left<pp.right-2&&b.right>pp.left+2&&b.top<pp.bottom-2&&b.bottom>pp.top+2}).length;return {inside:pp.left>=h.left-1&&pp.right<=h.right+1&&pp.top>=h.top-1&&pp.bottom<=h.bottom+1,hit,h:pp.height}});
  ok(r.inside&&r.hit===0&&r.h<=60,tag+' ficha '+i+' dentro, sin choques y compacta '+JSON.stringify(r));}
 await p.locator('.v3-chip[aria-pressed=true]').evaluate(e=>e.click());await p.waitForTimeout(1300);
 const h1=await hash(map);
 // 2) un dedo mueve el mapa y no desplaza la ventana
 const dlg=p.locator('.dialog-body');const st0=await dlg.evaluate(e=>e.scrollTop);
 let [cx,cy]=await C();await drag(cdp,[cx,cy],[cx-70,cy-50]);await p.waitForTimeout(900);
 const h2=await hash(map);ok(h2!==h1,tag+' un dedo mueve el mapa');
 ok(await dlg.evaluate(e=>e.scrollTop)===st0,tag+' arrastrar el mapa no desplaza la ventana');
 // 3) pellizco: zoom
 [cx,cy]=await C();await pinch(cdp,[cx,cy],30,90);await p.waitForTimeout(900);const h3=await hash(map);ok(h3!==h2,tag+' pellizco amplía');
 // 4) dos dedos girando
 [cx,cy]=await C();await pinch(cdp,[cx,cy],60,60,0.9);await p.waitForTimeout(900);const h4=await hash(map);ok(h4!==h3,tag+' dos dedos giran');
 // 5) tocar un edificio del modelo (centro del campo)
 await map.scrollIntoViewIfNeeded();await p.locator('.v3-btn.top').evaluate(e=>e.click());await p.waitForTimeout(1200);
 const pb=await p.locator('.v3-mk.k-bar .pin').boundingBox();await touch(cdp,'touchStart',[[pb.x+pb.width/2,pb.y+pb.height/2]]);await touch(cdp,'touchEnd',[]);await p.waitForTimeout(500);
 const selNow=await p.locator('.v3-chip[aria-pressed=true]').count();ok(selNow===1,tag+' tocar el modelo selecciona una zona');
 // 6) fluidez: fotogramas durante un arrastre continuo
 await p.evaluate(()=>{window.__f=0;const c=()=>{window.__f++;window.__r=requestAnimationFrame(c)};c()});
 [cx,cy]=await C();const t0=Date.now();await drag(cdp,[cx-60,cy],[cx+60,cy+40],30);await p.waitForTimeout(500);
 const fps=await p.evaluate(([t0])=>window.__f/((Date.now()-t0)/1000),[t0]);console.log(tag,'fps aprox (render por software):',fps.toFixed(0));
 // 7) pantalla completa
 await p.locator('.v3-btn.fs').evaluate(e=>e.click());await p.waitForTimeout(700);
 const fb=await map.boundingBox();ok(fb.width>=d.viewport.width-2&&fb.height>=d.viewport.height-2,tag+' pantalla completa ocupa todo '+Math.round(fb.width)+'x'+Math.round(fb.height));
 await p.screenshot({path:S+name.replace(/ /g,'_')+'_'+lg+'_full.png'});
 await p.locator('.v3-btn.fs').evaluate(e=>e.click());await p.waitForTimeout(500);
 // 8) etiquetas dentro del plano y sin recorte
 const out=await p.evaluate(()=>{const m=document.querySelector('.v3-map').getBoundingClientRect();return [...document.querySelectorAll('.v3-mk .pin')].filter(l=>l.closest('.v3-mk').style.opacity==='1').filter(l=>{const r=l.getBoundingClientRect();return r.left<m.left-2||r.right>m.right+2}).length});
 ok(out===0,tag+' etiquetas visibles no se salen del plano ('+out+')');
 // 9) Atrás cierra la ventana
 await p.goBack();await p.waitForTimeout(500);ok(await p.locator('.dialog[open]').count()===0,tag+' Atrás cierra la ventana');
 await p.goto(URL,{waitUntil:'networkidle'});await p.locator('.menu-item',{hasText:/Ubicaci|Kokaleku/}).first().tap();await p.waitForTimeout(2500);await p.locator('.v3-map').scrollIntoViewIfNeeded();await p.screenshot({path:S+name.replace(/ /g,'_')+'_'+lg+'.png'});
 ok(errs.length===0,tag+' sin errores de consola '+JSON.stringify(errs.slice(0,2)));
 await ctx.close();}}catch(e){fail++;console.log('ERROR',name,String(e.message).split('\n')[0])}}
console.log('RESULT pass='+pass+' fail='+fail);await b.close()})();
