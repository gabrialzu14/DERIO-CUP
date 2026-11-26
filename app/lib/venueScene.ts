// @ts-nocheck — escena 3D de Ibaiondo (Three.js). Se carga bajo demanda al abrir «Ubicación».
import * as THREE from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type ZoneKey = "c1" | "c2" | "bar" | "wc" | "parking" | "entrada";
export type Proj = Record<ZoneKey, { x: number; y: number; vis: boolean; s: number; h: number }> & { far: boolean };

/** Plano 3D de Ibaiondo: gira, mueve y amplía; al pulsar una zona solo se resalta (sin zoom). */
export function createVenueScene(canvas: HTMLCanvasElement, host: HTMLElement, opts: { onPick: (k: ZoneKey | null) => void; onFrame: (p: Proj) => void; reduceMotion: boolean }) {
  const cv = canvas, map = host;
  const R = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  R.setPixelRatio(Math.min(1.5, devicePixelRatio)); R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap; R.shadowMap.autoUpdate = false; R.shadowMap.needsUpdate = true;
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
  // dos campos de fútbol 7 transversales (mismas medidas que el plano 3D de cdderio.com/ibaiondo): de banda a banda, línea de 13 m a ±18,5 m y áreas de 25 m junto a cada banda
  { const CX = (z: number) => 1000 + z * (960 / 51.75), CY = (x: number) => 640 + x * (600 / 31.25), TL = 31.25;
    g.strokeStyle = 'rgba(244,184,52,.95)'; g.lineWidth = 6; g.lineJoin = 'miter';
    const poly = (pts: [number, number][]) => { g.beginPath(); pts.forEach(([z, x], i) => i ? g.lineTo(CX(z), CY(x)) : g.moveTo(CX(z), CY(x))); g.stroke(); };
    [[-47, -5, -38.5, -13.5], [4.5, 47, 13, 38.5]].forEach(([z0, z1, a0, a1]) => {
      poly([[z0, -TL], [z0, TL]]); poly([[z1, -TL], [z1, TL]]);
      [-1, 1].forEach(sx => { poly([[z0, sx * 18.5], [z1, sx * 18.5]]); poly([[a0, sx * TL], [a0, sx * 22.5], [a1, sx * 22.5], [a1, sx * TL]]); });
    }); }
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
  const goalM=mat(0xffffff,{roughness:.4}), netM=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.28,roughness:1});
  [-50,50].forEach(z=>{const sg=z<0?-1:1; box(.18,2.4,.18,goalM,-3.65,1.2,z); box(.18,2.4,.18,goalM,3.65,1.2,z); box(7.5,.18,.18,goalM,0,2.4,z); box(7.3,2.3,2.2,netM,0,1.15,z+sg*1.1);});
  // banderines de córner
  [[-32,-50],[32,-50],[-32,50],[32,50]].forEach(([x,z])=>{box(.08,1.5,.08,mat(0xf5f5f5),x,.75,z);box(.5,.35,.04,mat(0xf2c200),x+.25,1.3,z)});
  // vallas publicitarias alrededor del campo (morado y granate, como las del campo real)
  { const bm=[mat(0x8e2a7a),mat(0x7a1f3a)]; for(let k=0;k<16;k++){const z=-48+k*6.4;[-34.4,34.4].forEach((x,j)=>box(.25,.9,6.2,bm[(k+j)%2],x,.45,z+3.1-3.1))}
    for(let k=0;k<10;k++){[-54,54].forEach((z,j)=>box(6.4,.9,.25,bm[(k+j)%2],-32+k*6.4+3.2,.45,z))} }
  // grada en el lado oeste: estructura, fachada con puertas y ventanas, gradas azules y granates, cubierta blanca con borde azul
  const body=box(9,5,44,mat(0x4a505a),-43,2.5,1);
  const tierCol=[0x2f5fb0,0xa83232];const steps=[0,1,2,3].map(i=>box(1.6,.6,42,mat(tierCol[i%2]),-39.2-i*1.4,1+i*.9,1));
  box(.12,.9,42,mat(0x2a5db0),-38.2,1.7,1); // barandilla azul del frente
  { const win=mat(0x1d252e),door=mat(0xe9eef2); for(let k=0;k<11;k++){const z=-18+k*4;box(.1,1.4,1.6,k%3===1?door:win,-38.45,1.9,z)} }
  const roof=box(11.5,.5,47,mat(0xf5f7f8,{roughness:.5}),-42,7.7,1);roof.rotation.z=-.06;
  box(.4,.5,47.4,mat(0x2a5db0),-36.4,7.15,1); // canto azul de la cubierta
  // rótulo «Derio Cup» sobre el tejado: copa + «Derio» en negrita y «Cup» fino, con el degradado de marca y muy sutil
  { const W = 2048, H = Math.round(2048 * 10.4 / 44), cvs = document.createElement("canvas"); cvs.width = W; cvs.height = H;
    const tx = new THREE.CanvasTexture(cvs); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
    const grp = new THREE.Group(); grp.position.set(-42, 7.7, 1); grp.rotation.z = -.06; S.add(grp);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(44, 10.4), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    sign.rotation.set(-Math.PI / 2, 0, Math.PI / 2); sign.position.y = .28; grp.add(sign);
    (async () => {
      const ff = getComputedStyle(document.body).fontFamily || "system-ui";
      try { await Promise.all([document.fonts.load(`800 150px ${ff}`), document.fonts.load(`300 150px ${ff}`)]); } catch {}
      const img = new Image(); img.src = "/logo-derio-cup.webp"; try { await img.decode(); } catch { return; }
      const g = cvs.getContext("2d")!; g.clearRect(0, 0, W, H);
      const fs0 = 150, ih0 = 196, ar = img.naturalWidth / img.naturalHeight, gap0 = 34;
      g.textBaseline = "alphabetic"; g.font = `800 ${fs0}px ${ff}`; const wd0 = g.measureText("Derio").width; g.font = `300 ${fs0}px ${ff}`; const wc0 = g.measureText("Cup").width;
      // tamaño intermedio entre el original (x1) y el que llenaría toda la cubierta (kMax)
      const kMax = Math.min(W * .92 / (ih0 * ar + gap0 + wd0 + 10 + wc0), H * .84 / ih0), k = 1 + (kMax - 1) * .5, fs = fs0 * k, ih = ih0 * k, iw = ih * ar, gap = gap0 * k, wd = wd0 * k, wc = wc0 * k;
      const total = iw + gap + wd + 10 * k + wc, x0 = (W - total) / 2, cy = H / 2;
      const grad = g.createLinearGradient(x0, 0, x0 + total, 0); grad.addColorStop(0, "#0a5cc2"); grad.addColorStop(.55, "#7a2a9a"); grad.addColorStop(1, "#cf1738");
      // la copa se tiñe con el degradado (el logo original es blanco)
      const ic = document.createElement("canvas"); ic.width = Math.ceil(iw); ic.height = ih; const ig = ic.getContext("2d")!; ig.drawImage(img, 0, 0, iw, ih); ig.globalCompositeOperation = "source-in";
      const ig2 = ig.createLinearGradient(-(x0), 0, total, 0); ig2.addColorStop(0, "#0a5cc2"); ig2.addColorStop(.55, "#7a2a9a"); ig2.addColorStop(1, "#cf1738"); ig.fillStyle = ig2; ig.fillRect(0, 0, iw, ih);
      g.globalAlpha = .62; g.drawImage(ic, x0, cy - ih / 2);
      g.fillStyle = grad; g.font = `800 ${fs}px ${ff}`; g.fillText("Derio", x0 + iw + gap, cy + fs * .36); g.font = `300 ${fs}px ${ff}`; g.fillText("Cup", x0 + iw + gap + wd + 10 * k, cy + fs * .36);
      tx.needsUpdate = true; wake();
    })(); }
  [-20,-6,8,22].forEach(z=>box(.5,7.5,.5,mat(0xdde1e5),-37.2,3.8,z));
  box(9,2.2,6,mat(0xd8d4cc),-42,1.1,27); // escaleras al sur de la grada
  // banquillos cubiertos (rojos) frente a la grada
  [[-9, 0x8a2f2a], [11, 0x2f4f8a]].forEach(([z, c]) => { box(1.8, 1.3, 6.6, mat(c as number), -35.6, .75, z as number); box(2.3, .14, 7, mat(0xcfd6dc), -35.6, 2.0, z as number); [-3, 3].forEach(d => box(.12, 1.3, .12, mat(0xdde1e5), -34.7, 1.3, (z as number) + d)); });

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
  // coches aparcados (colores sobrios), colocados en las plazas de la vista cenital
  { let sd=11;const rr=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};const cols=[0xd8dde3,0x2b3a52,0xa83232,0x3a6ea5,0x1f1f24,0xe9e6df,0x6b7b8c,0x8a9aa8];
    const car=(x,z,ry)=>{const c=cols[Math.floor(rr()*cols.length)];const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(1.8,.9,4.2),mat(c,{roughness:.5}));b.position.y=.7;const t=new THREE.Mesh(new THREE.BoxGeometry(1.6,.75,2.2),mat(0x20262d,{roughness:.3}));t.position.set(0,1.4,-.1);g.add(b,t);g.position.set(x,0,z);g.rotation.y=ry;g.traverse(o=>{o.castShadow=true});S.add(g)};
    const P=(px,pz)=>[-45+(px-225)*0.059,56.5+(pz-860)*0.059];
    [290,330,370,410,455,495,540].forEach(px=>{if(rr()>.25){const [x,z]=P(px+10,905);car(x,z,.12)}});
    [350,390,430,470,510,550].forEach(px=>{if(rr()>.4){const [x,z]=P(px+6,1065);car(x,z,.1)}});
    [345,385,425,468,510,550].forEach(px=>{if(rr()>.4){const [x,z]=P(px,1153);car(x,z,0)}}); }
  box(6,.07,110,asph,-48,.04,12); // vial por detrás de la grada hasta el aparcamiento
  // calles: del aparcamiento a la rotonda (sur) y calle Errekalde subiendo por el este hasta las casas del norte
  const road=(pts,w=9)=>{const c=new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,.05,z)));const n=60,pos=[];for(let i=0;i<n;i++){const a=c.getPoint(i/n),b=c.getPoint((i+1)/n),d=b.clone().sub(a);const len=d.length();const m=new THREE.Mesh(new THREE.BoxGeometry(w,.07,len+.6),asph);m.position.copy(a.clone().add(b).multiplyScalar(.5));m.rotation.y=Math.atan2(d.x,d.z);m.receiveShadow=true;S.add(m)}return c};
  // carretera calcada de la vista cenital (escala ≈0,157 m/px): del aparcamiento al este, curva al sur y rotonda de Camino Untzaga
  const mainRoad=road([[-32,68],[-31,78],[-22,83],[-1,82],[18,79],[36,79],[50,84],[65,93],[74,101]]);
  road([[92,98],[96,68],[90,47],[73,12],[74,-30],[60,-62],[40,-72]]); // calle Errekalde por el este del campo
  road([[74,114],[58,132],[35,164]]);road([[86,118],[112,138],[146,156]]);box(4,.08,20,mat(0xcfd2d0),-13,.06,66);
  // detalles: setos rojizos al norte del aparcamiento, carril rayado al este, banco, papelera y porterías pequeñas
  const bush=mat(0x8a3b2e);for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(1.1,8,6),bush);b.position.set(-42+i*2.6,1,55);b.castShadow=true;S.add(b)}
  const hatch=mat(0xf2f2f2);for(let i=0;i<4;i++){[.6,-.6].forEach(r=>{const h=box(.22,.1,4.6,hatch,-13,.1,59.5+i*4.4);h.rotation.y=r})}[-15,-11].forEach(x=>box(.22,.1,18,hatch,x,.1,66));



  // farolas a un lado de la carretera, orientadas según su dirección y con el brazo hacia el asfalto
  { const poleLamp=mat(0x9aa3a8), head=mat(0xdfe3e8); const len=mainRoad.getLength();
    for (let d = 20; d < len - 6; d += 17) {
      const u = d / len, pt = mainRoad.getPointAt(u), tg = mainRoad.getTangentAt(u).setY(0).normalize(), nx = new THREE.Vector3(-tg.z, 0, tg.x); // normal hacia la izquierda
      const side = nx.clone().multiplyScalar(-6.5), base = pt.clone().add(side), ang = Math.atan2(tg.x, tg.z);
      const pole = box(.25, 6, .25, poleLamp, base.x, 3, base.z);
      const arm = box(.2, .2, 2.4, head, base.x - side.x / 6.5 * 1.0, 6, base.z - side.z / 6.5 * 1.0); arm.rotation.y = Math.atan2(-side.x, -side.z);
      const lamp = box(.5, .25, 1.1, head, base.x - side.x / 6.5 * 2.1, 5.85, base.z - side.z / 6.5 * 2.1); lamp.rotation.y = ang;
      void pole;
    } }
  road([[-48,74],[-75,74]],4);
  const rb=new THREE.Mesh(new THREE.RingGeometry(9,15,40),asph);rb.rotation.x=-Math.PI/2;rb.position.set(81,.06,106);S.add(rb);
  const rbc=new THREE.Mesh(new THREE.CircleGeometry(9,40),mat(0x5f8f45));rbc.rotation.x=-Math.PI/2;rbc.position.set(81,.07,106);S.add(rbc);
  // edificio de tejado naranja al norte
  const wall=mat(0xece6dc),tile=mat(0xc2693b);
  function house(x,z,w,d,h){box(w,h,d,wall,x,h/2,z);const r=new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w,d)/2*1.02,3.5,4),tile);r.rotation.y=Math.PI/4;r.scale.set(w/Math.hypot(w,d)*1.42,1,d/Math.hypot(w,d)*1.42);r.position.set(x,h+1.75,z);r.castShadow=true;S.add(r)}
  house(18,-82,34,12,5);house(6,-72,12,18,5);house(46,-80,12,9,4);
  // focos
  const poleM=mat(0xb9bec4,{metalness:.6,roughness:.4});const lamps=[];
  const lampM=mat(0xe9ecef);[[-38,-30],[-38,30],[38,-30],[38,30]].forEach(([x,z])=>{box(.5,20,.5,poleM,x,10,z);const h=box(.5,.5,3,lampM,x,20,z);lamps.push(h);for(let r=0;r<2;r++)for(let c=0;c<3;c++)box(.7,.7,.5,lampM,x+(x<0?.5:-.5),19.5+r*.9,z-1+c*1);

 const sp=new THREE.SpotLight(0xfff6d8,0,140,0.7,0.5,1.2);sp.position.set(x,20,z);sp.target.position.set(x*.2,0,z*.2);S.add(sp,sp.target);lamps.push(sp)});
  // árboles: banda densa al oeste, cipreses al sur, arbolado al norte
  const tr=mat(0x2f6b34),trunk=mat(0x5a4632),cyp=mat(0x2a5a2f);let seed=7;const rand=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};const rnd=(a,b)=>a+rand()*(b-a);
  function tree(x,z,s=1){box(.6*s,3*s,.6*s,trunk,x,1.5*s,z);const t=new THREE.Mesh(new THREE.IcosahedronGeometry(3.6*s,0),tr);t.position.set(x,5.2*s,z);t.castShadow=true;S.add(t)}
  function cypress(x,z){const t=new THREE.Mesh(new THREE.ConeGeometry(1.6,9,7),cyp);t.position.set(x,4.5,z);t.castShadow=true;S.add(t)}
  [[-3,58,.9],[-2,66,.85],[-4,73,.75]].forEach(([x,z,s])=>tree(x,z,s));
  for(let i=0;i<46;i++)tree(rnd(-110,-54),rnd(-110,55),rnd(1,1.7));for(let i=0;i<14;i++)tree(rnd(-40,70),rnd(-120,-95),rnd(.9,1.4));
  [[-10,58],[0,60],[10,58],[24,62]].forEach(([x,z])=>cypress(x,z));for(let i=0;i<14;i++)tree(rnd(82,130),rnd(-40,110),rnd(.9,1.4));

  // Optimización: todo lo estático que comparte material se fusiona en una sola malla (de ~300 dibujos por fotograma a unas decenas)
  // y deja de recalcular su posición en cada fotograma. Las zonas que se resaltan y los focos se quedan aparte.
  { S.updateMatrixWorld(true); const keep = new Set([...zones, ...lamps]), groups = new Map();
    S.traverse(o => { if (!o.isMesh || keep.has(o) || Array.isArray(o.material)) return; const M = o.material, k = [M.type, M.color?.getHex(), M.emissive?.getHex(), M.opacity, M.transparent, M.map?.uuid, M.roughness, M.metalness, M.side, M.depthWrite, M.polygonOffset, M.vertexColors].join(",") + "|" + o.castShadow + "|" + o.receiveShadow + "|" + o.renderOrder; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o); });
    for (const list of groups.values()) {
      if (list.length < 2) continue;
      const geos = list.map(m => { const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld); for (const n of Object.keys(g.attributes)) if (n !== "position" && n !== "normal" && n !== "uv") g.deleteAttribute(n); if (!g.attributes.normal) g.computeVertexNormals(); return g; });
      if (!geos.every(g => g.attributes.uv)) geos.forEach(g => g.deleteAttribute("uv"));
      const merged = mergeGeometries(geos, false); geos.forEach(g => g.dispose()); if (!merged) continue;
      const mm = new THREE.Mesh(merged, list[0].material); mm.castShadow = list[0].castShadow; mm.receiveShadow = list[0].receiveShadow; mm.renderOrder = list[0].renderOrder;
      list.forEach(m => { m.parent.remove(m); m.geometry.dispose(); }); S.add(mm);
    }
    S.traverse(o => { if (o !== cam) { o.updateMatrix(); o.matrixAutoUpdate = false; } }); S.updateMatrixWorld(true); }

  // posiciones 3D de las etiquetas
  const anchors: Record<ZoneKey, THREE.Vector3> = { c1: new THREE.Vector3(0, .4, 25), c2: new THREE.Vector3(0, .4, -25), wc: new THREE.Vector3(-50, .4, 1), bar: new THREE.Vector3(-38, .4, 26), parking: new THREE.Vector3(-32, .4, 64), entrada: new THREE.Vector3(-13, .4, 59) };

  // ---- selección, día/noche, vista general ----
  let cur: ZoneKey | null = null;
  let onSelect: (k: ZoneKey | null) => void = () => {};
  const select = (k: ZoneKey | null) => { onSelect(k); cur = k; z1.material.opacity = k === "c1" ? .28 : 0; z1.material.color.set(0xffd54a); z2.material.opacity = k === "c2" ? .28 : 0; z2.material.color.set(0xe6ecf3); wake(); };
  const setNight = (n: boolean) => {
    S.background = new THREE.Color(n ? 0x0a1424 : 0xcfe3f2); S.fog = new THREE.Fog(S.background, 220, 520);
    hemi.intensity = n ? .25 : 1.0; sun.intensity = n ? .15 : 2.2;
    lamps.forEach(l => { if (l.isSpotLight) l.intensity = n ? 170 : 0; else l.material.emissive = new THREE.Color(n ? 0xfff3c4 : 0); });
    R.shadowMap.needsUpdate = true; wake();
  };
  // Vuelo de cámara suave: pequeño zoom a la zona elegida y, pasado un momento, vuelta a la vista general
  let fly: any = null, back: ReturnType<typeof setTimeout> | null = null; const easeIO = (t: number) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const flyTo = (tp: THREE.Vector3, tt: THREE.Vector3, dur: number) => { if (opts.reduceMotion) { cam.position.copy(tp); ctl.target.copy(tt); wake(); return; } fly = { t0: performance.now(), dur, fp: cam.position.clone(), ft: ctl.target.clone(), tp, tt }; };
  const clearBack = () => { if (back) { clearTimeout(back); back = null; } };
  const resetView = () => { clearBack(); flyTo(HOME.p.clone(), HOME.t.clone(), 1000); };
  onSelect = (k) => {
    clearBack();
    if (!k) { flyTo(HOME.p.clone(), HOME.t.clone(), 1000); return; }
    if (opts.reduceMotion) return;
    // acercamiento sutil (≈ 30 %) centrado a medias en la zona; si ya estás muy cerca, apenas se mueve
    const a = anchors[k], dir = cam.position.clone().sub(ctl.target), dist = Math.max(48, dir.length() * .72);
    const tt = ctl.target.clone().lerp(new THREE.Vector3(a.x, 0, a.z), .55), tp = tt.clone().add(dir.normalize().multiplyScalar(dist));
    flyTo(tp, tt, 950);
    back = setTimeout(() => { back = null; flyTo(HOME.p.clone(), HOME.t.clone(), 1100); }, 4200); // tras verla, vuelve a la vista general
  };
  ctl.addEventListener("start", () => { clearBack(); fly = null; }); // si el usuario toca el mapa, manda él
  const proj: any = { far: false };
  // toque en el modelo
  const ray = new THREE.Raycaster(), pt = new THREE.Vector2(); let down: number[] | null = null;
  const onDown = (e: PointerEvent) => { down = [e.clientX, e.clientY]; };
  const onUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = cv.getBoundingClientRect(); pt.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(pt, cam);
    const lx = e.clientX - r.left, ly = e.clientY - r.top; let best: ZoneKey | null = null, bd = 34;
    // las etiquetas no capturan toques (para no bloquear el arrastre): se detecta la más cercana al dedo
    (Object.keys(anchors) as ZoneKey[]).forEach(k => { const q = proj[k]; if (!q || !q.vis) return; const d = Math.min(Math.hypot(q.x - lx, q.y - q.h * q.s - 22 * q.s - ly), Math.hypot(q.x - lx, q.y - ly)); if (d < bd) { bd = d; best = k; } });
    if (best) { opts.onPick(best); return; }
    const h = ray.intersectObjects(zones)[0]; opts.onPick(h ? h.object.userData.k : null);
  };
  cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointerup", onUp);
  const size = () => { const w = map.clientWidth, h = map.clientHeight; if (!w || !h) return; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); wake(); };
  const ro = new ResizeObserver(size); ro.observe(map); size();
  // bucle: solo se dibuja cuando algo cambia
  const v = new THREE.Vector3(); let raf = 0, alive = true;
  const loop = (now: number) => {
    if (!alive) return; raf = requestAnimationFrame(loop);
    if (fly) { const k = Math.min(1, (now - fly.t0) / fly.dur), e = easeIO(k); cam.position.lerpVectors(fly.fp, fly.tp, e); ctl.target.lerpVectors(fly.ft, fly.tt, e); if (k === 1) fly = null; wake(); }
    const moved = ctl.update(); if (!moved && !dirty) return; dirty = false; R.render(S, cam);
    const w = map.clientWidth, h = map.clientHeight; proj.far = cam.position.distanceTo(ctl.target) > 135;
    const sc = Math.max(.74, Math.min(1.08, 125 / cam.position.distanceTo(ctl.target)));
    (Object.keys(anchors) as ZoneKey[]).forEach(k => { v.copy(anchors[k]).project(cam); proj[k] = { x: (v.x * .5 + .5) * w, y: (-v.y * .5 + .5) * h, vis: v.z < 1 && Math.abs(v.x) < .9 && Math.abs(v.y) < .92, s: sc, h: 34 }; });
    // los pines se ordenan de delante hacia atrás; si dos chocan, el de detrás sube
    const placed: { L: number; W: number; top: number; H: number }[] = [], W = 38 * sc, H = 44 * sc;
    (Object.keys(anchors) as ZoneKey[]).sort((a, b) => proj[b].y - proj[a].y).forEach(k => { const q = proj[k]; let hh = 34 * sc; for (let t = 0; t < 14; t++) { const top = q.y - hh - H, L = q.x - W / 2; if (!placed.some(o => L < o.L + o.W + 4 && L + W + 4 > o.L && top < o.top + o.H + 4 && top + H + 4 > o.top)) break; hh += H * .55; } hh = Math.max(14 * sc, Math.min(hh, q.y - H - 6)); // el pin nunca se sale por arriba del plano
      placed.push({ L: q.x - W / 2, W, top: q.y - hh - H, H }); q.h = hh / sc; });
    opts.onFrame(proj);
  };
  raf = requestAnimationFrame(loop);
  // fuera de pantalla (sección cerrada o desplazada) no se dibuja nada
  const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting && alive) { wake(); raf = requestAnimationFrame(loop); } }); io.observe(map);
  const dispose = () => { io.disconnect();
    alive = false; clearBack(); cancelAnimationFrame(raf); ro.disconnect(); cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointerup", onUp); ctl.dispose();
    S.traverse((o: any) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => { m.map?.dispose?.(); m.dispose(); }); });
    R.dispose();
  };
  return { select, setNight, resetView, dispose };
}
