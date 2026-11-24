const {chromium,devices}=require('playwright');
let pass=0,fail=0;const ok=(c,m)=>{if(c)pass++;else{fail++;console.log('FAIL '+m)}};
const URL='http://localhost:3100/';
const hash=p=>p.evaluate(()=>location.hash);
const swipe=async(p,x,y1,y2)=>{const cdp=await p.context().newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y1}]});
 for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y1+(y2-y1)*i/8}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);};
(async()=>{const b=await chromium.launch();
for(const [name,prof] of [['iPhone 12',devices['iPhone 12']],['Pixel 5',devices['Pixel 5']]]){
 const T=`[${name}]`;
 const ctx=await b.newContext({...prof,colorScheme:'light'});const p=await ctx.newPage();await p.addInitScript(()=>{localStorage.setItem('derio-cup-onboarded','1');localStorage.setItem('derio-cup-lang','es')});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
 await p.route('**/derio_cup_fans*',r=>r.request().method()==='POST'?r.fulfill({status:201,body:''}):r.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await p.goto(URL,{waitUntil:'networkidle'});await p.waitForTimeout(2700);
 // 1 flujo inicial
 await p.locator('.tourney-card').tap();await p.waitForTimeout(400);
 ok(await p.locator('.welcome').isVisible(),T+' abre elegir equipo');
 await p.locator('.continue-btn').count();
 ok(!(await p.locator('.continue-btn').isVisible()),T+' Continuar oculto sin elegir');
 await p.locator('.team-pick',{hasText:'Ermua'}).tap();await p.waitForTimeout(500);
 await p.locator('.team-pick',{hasText:'Ermua'}).tap();await p.waitForTimeout(400);
 ok(!(await p.locator('.continue-btn').isVisible()),T+' desmarcar oculta Continuar');
 await p.locator('.team-pick',{hasText:'Etxebarri'}).tap();await p.waitForTimeout(500);
 await p.locator('.continue-btn').tap();await p.waitForTimeout(900);
 ok(await p.locator('.fairplay').isVisible(),T+' aviso de juego limpio al elegir equipo');await p.locator('.fairplay .btn').tap();await p.waitForTimeout(400);
 ok(await p.locator('.tabbar').isVisible(),T+' entra al torneo');
 // 2 pestañas e historial
 for(const l of ['Partidos','Clasificación','Fases','Info'])await p.locator('nav button',{hasText:l}).tap(),await p.waitForTimeout(250);
 ok(await hash(p)==='#mas',T+' hash #mas');
 await p.goBack();await p.waitForTimeout(250);ok(await hash(p)==='#fases',T+' Atrás→fases');
 await p.goBack();await p.waitForTimeout(250);ok(await hash(p)==='#clasificacion',T+' Atrás→clasificación');
 await p.goForward();await p.waitForTimeout(250);ok(await hash(p)==='#fases'&&(await p.locator('nav button[aria-current=page]').innerText()).includes('Fases'),T+' Adelante→fases y pestaña activa');
 // 3 perfiles
 await p.locator('nav button',{hasText:'Partidos'}).tap();await p.waitForTimeout(300);
 await p.locator('.match-team',{hasText:'Bermeo'}).first().tap();await p.waitForTimeout(300);
 ok((await hash(p))==='#equipo/bermeo','perfil bermeo');
 await p.locator('.match-team',{hasText:'Leioa'}).first().tap();await p.waitForTimeout(300);
 ok((await p.locator('.profile-name h1').innerText())==='Leioa',T+' perfil rival');
 await p.locator('.back-btn').tap();await p.waitForTimeout(300);
 ok((await p.locator('.profile-name h1').innerText())==='Bermeo',T+' Volver→perfil anterior');
 await p.locator('.back-btn').tap();await p.waitForTimeout(300);
 ok(await hash(p)==='#partidos',T+' Volver→Partidos');
 // deep link + Volver sin historial
 await p.goto(URL+'#equipo/gernika',{waitUntil:'networkidle'});await p.waitForTimeout(400);
 await p.locator('.back-btn').tap();await p.waitForTimeout(400);
 ok(await hash(p)===''&&await p.locator('.screen.home').count()===1,T+' Volver sin historial → Inicio (no sale de la app)');
 // 4 diálogos y botón atrás
 await p.locator('nav button',{hasText:'Info'}).tap();await p.waitForTimeout(300);
 const n0=await p.evaluate(()=>history.length);
 await p.locator('.menu-item',{hasText:'Normas'}).tap();await p.waitForTimeout(500);
 ok(await p.locator('dialog[open]').count()===1,T+' diálogo abierto');
 ok(await p.evaluate(()=>document.getElementById('scroller').style.overflowY)==='hidden',T+' scroll del fondo bloqueado con diálogo');
 await p.goBack();await p.waitForTimeout(500);
 ok(await p.locator('dialog').count()===0&&await hash(p)==='#mas',T+' Atrás cierra el diálogo y se queda en Más');
 ok(await p.evaluate(()=>document.getElementById('scroller').style.overflowY)==='',T+' scroll desbloqueado');
 await p.locator('.menu-item',{hasText:'Normas'}).tap();await p.waitForTimeout(500);
 await p.locator('.dialog-panel .icon-btn').tap();await p.waitForTimeout(600);
 ok(await p.locator('dialog').count()===0,T+' cerrar con ✕');
 const n1=await p.evaluate(()=>history.length);
 await p.goBack();await p.waitForTimeout(300);
 ok(await hash(p)!=='#mas',T+' tras cerrar con ✕ Atrás sale de Más (sin pasos fantasma) → '+await hash(p));
 await p.goForward();await p.waitForTimeout(300);
 // abrir de nuevo, Escape (teclado)
 await p.locator('.menu-item',{hasText:'Formato'}).tap();await p.waitForTimeout(400);
 await p.keyboard.press('Escape');await p.waitForTimeout(500);
 ok(await p.locator('dialog').count()===0,T+' Escape cierra');
 // gestor
 await p.locator('.menu-item',{hasText:'Acceso responsables'}).tap();await p.waitForTimeout(500);
 const inp=p.locator('.field input');
 const fs=await inp.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));ok(fs>=16,T+' input ≥16px (sin zoom iOS)');
 await inp.fill('9999');await p.locator('button',{hasText:'Acceder'}).tap();await p.waitForTimeout(300);
 ok(await p.locator('.form-error').count()===1,T+' código incorrecto');
 await p.goBack();await p.waitForTimeout(500);ok(await p.locator('dialog').count()===0,T+' Atrás cierra el gestor');
 // 5 tema
 await p.locator('.menu-item',{hasText:'Cambiar de torneo'}).tap();await p.waitForTimeout(500);
 ok(await p.locator('.landing').count()===1,T+' Cambiar de torneo → lista');
 await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(1000);
 ok(await p.locator('.landing').count()===1,T+' recarga mantiene la lista');
 await p.locator('.tourney-card').tap();await p.waitForTimeout(500);
 ok(await p.locator('.tabbar').count()===1,T+' vuelve al torneo con equipo recordado');
 await p.locator('nav button',{hasText:'Info'}).tap();await p.waitForTimeout(300);
 await p.locator('.menu-item',{hasText:'Cambiar de equipo'}).tap();await p.waitForTimeout(500);
 ok(await p.locator('.welcome').count()===1,T+' Cambiar de equipo → elegir');
 await p.locator('.back-btn').tap();await p.waitForTimeout(400);
 ok(await p.locator('.landing').count()===1,T+' Torneos desde elegir equipo');
 await p.locator('.tourney-card').tap();await p.waitForTimeout(400);
 await p.locator('button',{hasText:'No tengo equipo'}).tap();await p.waitForTimeout(700);await p.locator('.fairplay .btn').tap();await p.waitForTimeout(400);
 ok(await p.locator('.tabbar').isVisible()&&await p.locator('.team-card').count()===0,T+' sin equipo: entra sin tarjeta de equipo');
 // 6 gestos: arrastrar hacia abajo/arriba en el borde no mueve la página
 await p.goto(URL,{waitUntil:'networkidle'});await p.waitForTimeout(500);
 await swipe(p,200,200,700);
 let st=await p.evaluate(()=>({sy:scrollY,top:document.getElementById('scroller').scrollTop,vv:visualViewport.offsetTop,pageTop:document.documentElement.scrollTop}));
 ok(st.sy===0&&st.top===0&&st.vv===0&&st.pageTop===0,T+' arrastrar abajo en la cima no mueve nada '+JSON.stringify(st));
 await p.evaluate(()=>document.getElementById('scroller').scrollTo(0,99999));await swipe(p,200,700,200);
 st=await p.evaluate(()=>({sy:scrollY,vv:visualViewport.offsetTop,pageTop:document.documentElement.scrollTop}));
 ok(st.sy===0&&st.vv===0&&st.pageTop===0,T+' arrastrar arriba al final no mueve la página '+JSON.stringify(st));
 // swipe horizontal
 const sx=await p.evaluate(()=>scrollX);const cdp=await ctx.newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:300,y:400}]});for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:300-30*i,y:400}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);
 ok(await p.evaluate(()=>scrollX)===sx&&await p.evaluate(()=>document.getElementById('scroller').scrollLeft)===0,T+' arrastre horizontal no mueve la pantalla');
 // selección y arrastre
 const sel=await p.evaluate(()=>({body:getComputedStyle(document.body).userSelect,btn:getComputedStyle(document.querySelector('button')).userSelect,img:getComputedStyle(document.querySelector('img')||document.body).getPropertyValue('-webkit-user-drag')}));
 ok(sel.body==='none'&&sel.btn==='none',T+' selección desactivada en la app '+JSON.stringify(sel));
 // 7 pulsaciones rápidas
 await p.goto(URL+'#partidos',{waitUntil:'networkidle'});await p.waitForTimeout(400);
 for(let i=0;i<12;i++){for(const l of ['Inicio','Partidos','Clasificación','Fases','Info'])await p.locator('nav button',{hasText:l}).tap({timeout:3000});}
 await p.waitForTimeout(400);
 ok(await hash(p)==='#mas'&&(await p.locator('nav button[aria-current=page]').innerText()).includes('Info'),T+' pulsaciones rápidas coherentes');
 // 8 rotación
 const vp=p.viewportSize();await p.setViewportSize({width:vp.height,height:vp.width});await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)&&await p.locator('.tabbar').isVisible(),T+' apaisado correcto');
 await p.setViewportSize(vp);await p.waitForTimeout(300);
 // 9 sin conexión
 await p.goto(URL+'#partidos',{waitUntil:'networkidle'});await p.waitForTimeout(500);
 await ctx.setOffline(true);await p.locator('button[aria-label="Actualizar resultados"]').tap();await p.waitForTimeout(1200);
 ok(await p.locator('.banner').count()===1,T+' banner sin conexión');
 await ctx.setOffline(false);await p.locator('.banner button').tap();await p.waitForTimeout(1500);
 ok(await p.locator('.banner').count()===0,T+' banner desaparece al reconectar');
 // 10 tema
 await p.locator('button[aria-label^="Cambiar a modo"]').tap();await p.waitForTimeout(300);
 const th=await p.evaluate(()=>document.documentElement.dataset.theme);await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(600);
 ok(th&&await p.evaluate(()=>document.documentElement.dataset.theme)===th,T+' tema persiste');
 ok(errs.length===0,T+' sin errores JS '+errs.slice(0,2));
 await ctx.close();
}
await b.close();console.log(`RESULT pass=${pass} fail=${fail}`);})();
