// @ts-nocheck — escena 3D de Ibaiondo (Three.js). Se carga bajo demanda al abrir «Ubicación».
import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";

export type ZoneKey = "c1" | "c2" | "bar" | "wc" | "parking" | "entrada";
export type Proj = Record<ZoneKey, { x: number; y: number; vis: boolean }> & { far: boolean };

/** Plano 3D de Ibaiondo: gira, mueve y amplía; al pulsar una zona solo se resalta (sin zoom). */
export function createVenueScene(canvas: HTMLCanvasElement, host: HTMLElement, opts: { onPick: (k: ZoneKey | null) => void; onFrame: (p: Proj) => void; reduceMotion: boolean }) {
  const cv = canvas, map = host;
  const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  R.setPixelRatio(Math.min(1.75, devicePixelRatio)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap; R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = true;
  let dirty = true; const wake = () => { dirty = true; };
  const S = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(38, 1, 1, 2000);
  const ctl = new MapControls(cam, cv); ctl.enableDamping = true; ctl.dampingFactor = .12; ctl.zoomToCursor = true; ctl.maxPolarAngle = 1.45; ctl.minPolarAngle = .25; ctl.minDistance = 12; ctl.maxDistance = 380;
  ctl.enablePan = true; ctl.screenSpacePanning = false; cv.style.touchAction = "none"; ctl.panSpeed = 1.0; ctl.rotateSpeed = .7; ctl.zoomSpeed = .9;
  ctl.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }; ctl.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  ctl.addEventListener("change", () => { wake(); const t = ctl.target; t.x = Math.max(-260, Math.min(260, t.x)); t.z = Math.max(-230, Math.min(230, t.z)); t.y = 0; });
  const HOME = { p: new THREE.Vector3(150, 135, 170), t: new THREE.Vector3(0, 0, 25) }; cam.position.copy(HOME.p); ctl.target.copy(HOME.t);
  // luces
  const hemi=new THREE.HemisphereLight(0xdfefff,0x3d5a2a,1.0);S.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff1dc,2.2);sun.position.set(90,140,60);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-120,right:120,top:100,bottom:-100});S.add(sun);
  const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,...o});
  const box=(w,h,d,m,x,y,z)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=b.receiveShadow=true;S.add(b);return b};
  // suelo (x = este, z = sur)
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(560,480),mat(0x7aa35c));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;S.add(ground);
  // campos secos al este y sur
  const dry=mat(0xb9b27a);[[52,10,26,110],[28,106,50,40]].forEach(([x,z,w,d])=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),dry);m.rotation.x=-Math.PI/2;m.position.set(x,.03,z);m.receiveShadow=true;S.add(m)});
  // césped con líneas
  const tc=document.createElement('canvas');tc.width=2000;tc.height=1280;const g=tc.getContext('2d');
  for(let i=0;i<20;i++){g.fillStyle=i%2?'#2f8a45':'#2b8040';g.fillRect(i*100,0,100,1280)}
  g.strokeStyle='rgba(255,255,255,.92)';g.lineWidth=7;const L=(x,y,w,h)=>g.strokeRect(x,y,w,h);
  L(40,40,1920,1200);g.beginPath();g.moveTo(1000,40);g.lineTo(1000,1240);g.stroke();
  g.beginPath();g.arc(1000,640,176,0,Math.PI*2);g.stroke();g.fillStyle='#fff';g.beginPath();g.arc(1000,640,7,0,7);g.fill();
  L(40,262,317,756);L(1643,262,317,756);L(40,468,106,344);L(1854,468,106,344);
  [[251,0],[1749,Math.PI]].forEach(([x,a])=>{g.beginPath();g.arc(x,640,7,0,7);g.fill();g.beginPath();g.arc(x,640,176,a-0.83,a+0.83);g.stroke()});
  [[40,40,0],[1960,40,Math.PI/2],[1960,1240,Math.PI],[40,1240,-Math.PI/2]].forEach(([x,y,a])=>{g.beginPath();g.arc(x,y,19,a,a+Math.PI/2);g.stroke()});
  const tex=new THREE.CanvasTexture(tc);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
  const pitch=new THREE.Mesh(new THREE.PlaneGeometry(100,64),new THREE.MeshStandardMaterial({map:tex,roughness:.95}));pitch.rotation.set(-Math.PI/2,0,Math.PI/2);pitch.position.y=.14;pitch.receiveShadow=true;S.add(pitch);
  // borde de hormigón y valla
  box(74,.1,112,mat(0xcfd2d0),0,.02,0);
  const fenceM=new THREE.MeshStandardMaterial({color:0x9aa3a8,transparent:true,opacity:.35});
  [[0,-56,74,.1],[0,56,74,.1],[-37,0,.1,112],[37,0,.1,112]].forEach(([x,z,w,d])=>box(w,2.2,d,fenceM,x,1.1,z));
  // zonas: Campo 1 = mitad norte, Campo 2 = mitad sur
  const zones=[];const zone=(k,w,d,x,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.18,z);m.userData.k=k;S.add(m);zones.push(m);return m};
  const z1=zone('c1',64,50,0,25),z2=zone('c2',64,50,0,-25);
  const goalM=mat(0xffffff,{roughness:.4});[-50,50].forEach(z=>box(7.3,2.4,.3,goalM,0,1.2,z));
  // grada en el lado oeste
  const body=box(9,5,44,mat(0x4a505a),-43,2.5,1);const steps=[0,1,2,3].map(i=>box(1.6,.6,42,mat(0x7b828c),-39.2-i*1.4,1+i*.9,1));
  const roof=box(11,.5,46,mat(0xf2f4f6,{roughness:.5}),-42,7.6,1);[-20,1,22].forEach(z=>box(.5,7.5,.5,mat(0xdde1e5),-37.2,3.8,z));
  box(9,2.2,6,mat(0xd8d4cc),-42,1.1,27); // escaleras al sur de la grada
  [-4,8,20].forEach(z=>box(1.6,1.4,3,mat(0x8a2f2a),-38.3,.8,z));

  // caseta (bar) al norte de la grada
  const hut=box(6,3.2,15,mat(0xf0f0ee),-43,1.6,-36);const hroof=box(6.6,.35,15.6,mat(0xb86a3e),-43,3.4,-36);
  // bar en el extremo sur de la grada y WC detrás de la grada
  const barB=box(5,3,6,mat(0xe8e2d6),-38,1.5,26);const barR=box(5.6,.35,6.6,mat(0xc2693b),-38,3.1,26);barB.userData.k=barR.userData.k='bar';zones.push(barB,barR);
  const wcB=box(4,2.8,8,mat(0xdfe3e8),-50,1.4,1);wcB.userData.k='wc';zones.push(wcB);
  // aparcamiento al suroeste y carretera al sur
  const asph=mat(0x5d6166);const pk=box(26,.08,22,asph,-32,.05,67.5);pk.userData.k='parking';zones.push(pk);box(6,.081,24,mat(0x6b7076),-48,.05,68);
  // marcas del aparcamiento copiadas de la vista cenital (px de la captura → metros)
  const PX=(x,z)=>[-45+(x-225)*0.059,56.5+(z-860)*0.059];const lineM=mat(0xffffff,{roughness:.6});
  function seg(a,b,c,d,w=.16){const[p,q]=PX(a,b),[r,s]=PX(c,d);const L=Math.hypot(r-p,s-q);const m=new THREE.Mesh(new THREE.BoxGeometry(w,.03,L),lineM);m.position.set((p+r)/2,.1,(q+s)/2);m.rotation.y=Math.atan2(r-p,s-q);S.add(m)}
  [245,290,330,370,410,455,495,540,580].forEach(x=>seg(x,868,x+14,940));seg(240,868,600,868);
  const dis=box(3.2,.03,4.6,mat(0x4a7fc1),...(()=>{const[a,b]=PX(632,905);return[a,.1,b]})());
  seg(305,1020,590,1020);seg(305,1020,305,1200);seg(590,1020,590,1200);seg(305,1105,590,1105);seg(305,1200,590,1200);
  [350,390,430,470,510,550].forEach(x=>seg(x,1025,x+12,1100));
  [345,385,425,468,510,550].forEach(x=>seg(x,1110,x,1196));
  // flechas de sentido
  [[455,985,'L'],[262,1105,'U'],[622,1105,'U']].forEach(([x,z,d])=>{const[p,q]=PX(x,z);const a=new THREE.Mesh(new THREE.ConeGeometry(.7,1.6,3),lineM);a.rotation.x=-Math.PI/2;a.rotation.z=d==='L'?Math.PI/2:0;a.position.set(p,.12,q);a.scale.y=.15;S.add(a)});
  box(6,.07,110,asph,-48,.04,12); // vial por detrás de la grada hasta el aparcamiento
  // calles: del aparcamiento a la rotonda (sur) y calle Errekalde subiendo por el este hasta las casas del norte
  const road=(pts,w=9)=>{const c=new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,.05,z)));const n=60,pos=[];for(let i=0;i<n;i++){const a=c.getPoint(i/n),b=c.getPoint((i+1)/n),d=b.clone().sub(a);const len=d.length();const m=new THREE.Mesh(new THREE.BoxGeometry(w,.07,len+.6),asph);m.position.copy(a.clone().add(b).multiplyScalar(.5));m.rotation.y=Math.atan2(d.x,d.z);m.receiveShadow=true;S.add(m)}};
  // carretera calcada de la vista cenital (escala ≈0,157 m/px): del aparcamiento al este, curva al sur y rotonda de Camino Untzaga
  road([[-25,79],[-16,83],[-1,82],[18,79],[36,79],[50,84],[65,93],[74,101]]);
  road([[92,98],[96,68],[90,47],[73,12],[74,-30],[60,-62],[40,-72]]); // calle Errekalde por el este del campo
  road([[74,114],[58,132],[35,164]]);road([[86,118],[112,138],[146,156]]);box(4,.08,20,mat(0xcfd2d0),-13,.06,66);
  // detalles: setos rojizos al norte del aparcamiento, carril rayado al este, banco, papelera y porterías pequeñas
  const bush=mat(0x8a3b2e);for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(1.1,8,6),bush);b.position.set(-42+i*2.6,1,55);b.castShadow=true;S.add(b)}
  const hatch=mat(0xf2f2f2);for(let i=0;i<4;i++){[.6,-.6].forEach(r=>{const h=box(.22,.1,4.6,hatch,-13,.1,59.5+i*4.4);h.rotation.y=r})}[-15,-11].forEach(x=>box(.22,.1,18,hatch,x,.1,66));



  // línea de valla norte-sur del campo seco y farolas de la calle
  for(let i=0;i<5;i++){box(.25,6,.25,mat(0x9aa3a8),-4+i*15,3,86);box(1.4,.3,.4,mat(0xdfe3e8),-4+i*15,6,86)}road([[-48,74],[-75,74]],4);
  const rb=new THREE.Mesh(new THREE.RingGeometry(9,15,40),asph);rb.rotation.x=-Math.PI/2;rb.position.set(81,.06,106);S.add(rb);
  const rbc=new THREE.Mesh(new THREE.CircleGeometry(9,40),mat(0x5f8f45));rbc.rotation.x=-Math.PI/2;rbc.position.set(81,.07,106);S.add(rbc);
  // edificio de tejado naranja al norte
  const wall=mat(0xece6dc),tile=mat(0xc2693b);
  function house(x,z,w,d,h){box(w,h,d,wall,x,h/2,z);const r=new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w,d)/2*1.02,3.5,4),tile);r.rotation.y=Math.PI/4;r.scale.set(w/Math.hypot(w,d)*1.42,1,d/Math.hypot(w,d)*1.42);r.position.set(x,h+1.75,z);r.castShadow=true;S.add(r)}
  house(18,-82,34,12,5);house(6,-72,12,18,5);house(46,-80,12,9,4);
  // focos
  const poleM=mat(0xb9bec4,{metalness:.6,roughness:.4});const lamps=[];
  [[-38,-30],[-38,30],[38,-30],[38,30]].forEach(([x,z])=>{box(.5,18,.5,poleM,x,9,z);const h=box(1,1,3,mat(0xe9ecef),x,18,z);lamps.push(h);
 const sp=new THREE.SpotLight(0xfff6d8,0,140,0.7,0.5,1.2);sp.position.set(x,18,z);sp.target.position.set(x*.2,0,z*.2);S.add(sp,sp.target);lamps.push(sp)});
  // árboles: banda densa al oeste, cipreses al sur, arbolado al norte
  const tr=mat(0x2f6b34),trunk=mat(0x5a4632),cyp=mat(0x2a5a2f);let seed=7;const rand=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};const rnd=(a,b)=>a+rand()*(b-a);
  function tree(x,z,s=1){box(.6*s,3*s,.6*s,trunk,x,1.5*s,z);const t=new THREE.Mesh(new THREE.IcosahedronGeometry(3.6*s,0),tr);t.position.set(x,5.2*s,z);t.castShadow=true;S.add(t)}
  function cypress(x,z){const t=new THREE.Mesh(new THREE.ConeGeometry(1.6,9,7),cyp);t.position.set(x,4.5,z);t.castShadow=true;S.add(t)}
  [[-3,58,.9],[-2,66,.85],[-4,73,.75]].forEach(([x,z,s])=>tree(x,z,s));
  for(let i=0;i<46;i++)tree(rnd(-110,-54),rnd(-110,55),rnd(1,1.7));for(let i=0;i<14;i++)tree(rnd(-40,70),rnd(-120,-95),rnd(.9,1.4));
  [[-10,58],[0,60],[10,58],[24,62]].forEach(([x,z])=>cypress(x,z));for(let i=0;i<14;i++)tree(rnd(82,130),rnd(-40,110),rnd(.9,1.4));

  // posiciones 3D de las etiquetas
  const anchors: Record<ZoneKey, THREE.Vector3> = { c1: new THREE.Vector3(0, 1, 25), c2: new THREE.Vector3(0, 1, -25), wc: new THREE.Vector3(-50, 5, 1), bar: new THREE.Vector3(-38, 6, 26), parking: new THREE.Vector3(-32, 3, 66), entrada: new THREE.Vector3(-13, 3, 58) };

  // ---- selección, día/noche, vista general ----
  let cur: ZoneKey | null = null;
  const select = (k: ZoneKey | null) => { cur = k; z1.material.opacity = k === "c1" ? .28 : 0; z1.material.color.set(0xffd54a); z2.material.opacity = k === "c2" ? .28 : 0; z2.material.color.set(0xe6ecf3); wake(); };
  const setNight = (n: boolean) => {
    S.background = new THREE.Color(n ? 0x0a1424 : 0xcfe3f2); S.fog = new THREE.Fog(S.background, 220, 520);
    hemi.intensity = n ? .25 : 1.0; sun.intensity = n ? .15 : 2.2;
    lamps.forEach(l => { if (l.isSpotLight) l.intensity = n ? 170 : 0; else l.material.emissive = new THREE.Color(n ? 0xfff3c4 : 0); });
    R.shadowMap.needsUpdate = true; wake();
  };
  let fly: any = null; const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const resetView = () => { if (opts.reduceMotion) { cam.position.copy(HOME.p); ctl.target.copy(HOME.t); wake(); return; } fly = { t0: performance.now(), fp: cam.position.clone(), ft: ctl.target.clone() }; };
  // toque en el modelo
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2(); let down: number[] | null = null;
  const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY]; };
  const onUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = cv.getBoundingClientRect(); pt.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(pt, cam);
    const h = ray.intersectObjects(zones)[0]; opts.onPick(h ? h.object.userData.k : null);
  };
  cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointerup", onUp);
  const size = () => { const w = map.clientWidth, h = map.clientHeight; if (!w || !h) return; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); wake(); };
  const ro = new ResizeObserver(size); ro.observe(map); size();
  // bucle: solo se dibuja cuando algo cambia
  const v = new THREE.Vector3(); let raf = 0, alive = true;
  const proj: any = { far: false };
  const loop = (now: number) => {
    if (!alive) return; raf = requestAnimationFrame(loop);
    if (fly) { const k = Math.min(1, (now - fly.t0) / 700), e = ease(k); cam.position.lerpVectors(fly.fp, HOME.p, e); ctl.target.lerpVectors(fly.ft, HOME.t, e); if (k === 1) fly = null; wake(); }
    const moved = ctl.update(); if (!moved && !dirty) return; dirty = false; R.render(S, cam);
    const w = map.clientWidth, h = map.clientHeight; proj.far = cam.position.distanceTo(ctl.target) > 135;
    (Object.keys(anchors) as ZoneKey[]).forEach(k => { v.copy(anchors[k]).project(cam); proj[k] = { x: (v.x * .5 + .5) * w, y: (-v.y * .5 + .5) * h, vis: v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1 }; });
    opts.onFrame(proj);
  };
  raf = requestAnimationFrame(loop);
  const dispose = () => {
    alive = false; cancelAnimationFrame(raf); ro.disconnect(); cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointerup", onUp); ctl.dispose();
    S.traverse((o: any) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => { m.map?.dispose?.(); m.dispose(); }); });
    R.dispose();
  };
  return { select, setNight, resetView, dispose };
}
