"use client";
import { useLang } from "../lib/i18n";
import { Icon } from "./icons";
import { directionsUrl, type PlaceKey } from "../lib/directions";

type Pt = [number, number];

/** Rayas de aparcamiento en batería: segmentos perpendiculares a un recorrido, cada `gap` unidades, hacia un lado (`side` = ±1). */
function battery(pts: Pt[], gap: number, len: number, off: number, side: 1 | -1): string {
  let d = "", carry = 0;
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy * side, ny = ux * side;
    for (let s = carry; s <= L; s += gap) {
      const x = x0 + ux * s + nx * off, y = y0 + uy * s + ny * off;
      d += `M${x.toFixed(1)} ${y.toFixed(1)}l${(nx * len).toFixed(1)} ${(ny * len).toFixed(1)}`;
      carry = s + gap - L;
    }
  }
  return d;
}

const ACCESS: Pt[] = [[490, 152], [472, 210], [459, 280], [452, 372]];
const UNTZAGA: Pt[] = [[878, 300], [995, 392]];

/** Flecha de «Entrada» hacia la izquierda (hacia el campo). */
const Entry = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}><circle r="19" fill="var(--pk-red)" stroke="var(--pk-sf)" strokeWidth="3" /><path d="M7 0H-7M-1 -6l-6 6 6 6" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></g>
);
const Pin = ({ x, y, color, r = 20 }: { x: number; y: number; color: string; r?: number }) => (
  <g transform={`translate(${x} ${y})`}><circle r={r} fill={color} stroke="var(--pk-sf)" strokeWidth="3" /><text y={r * .36} textAnchor="middle" fontWeight="900" fontSize={r} fill="#fff">P</text></g>
);

/** Plano del aparcamiento junto al campo (vial de acceso y Camino Untzaga en batería, y la campa). */
export function ParkingNear() {
  const { t } = useLang();
  return (
    <svg className="pk-map" viewBox="0 0 1000 515" role="img" aria-label={t("Plano del aparcamiento junto al campo de Ibaiondo", "Ibaiondo zelaiaren ondoko aparkalekuaren planoa", "Plan du parking à côté du stade d’Ibaiondo")}>
      <defs><pattern id="pk-hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="var(--pk-red)" strokeWidth="3" opacity=".35" /></pattern></defs>
      <rect width="1000" height="515" fill="var(--pk-ground)" />
      <path d="M0 0H470L430 190 380 200 0 190Z" fill="var(--pk-grass)" /><path d="M700 0H1000V330L850 250 740 150Z" fill="var(--pk-grass)" />
      <path d="M720 515L860 330 1000 400V515Z" fill="var(--pk-trees)" /><path d="M0 200H30V515H0Z" fill="var(--pk-trees)" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {[["var(--pk-edge)", 26], ["var(--pk-road)", 20]].map(([c, w]) => <g key={c} stroke={c as string} strokeWidth={w as number}><path d="M0 135 100 98 270 58 400 22 540 30" /><path d="M533 92 492 150 462 235 452 330 452 420" /><path d="M630 98 720 160 810 222 890 285 1000 380" /><path d="M520 0 545 25M640 0 610 25" /></g>)}
      </g>
      <circle cx="575" cy="60" r="42" fill="none" stroke="var(--pk-edge)" strokeWidth="28" /><circle cx="575" cy="60" r="42" fill="none" stroke="var(--pk-road)" strokeWidth="22" /><circle cx="575" cy="60" r="24" fill="var(--pk-grass)" />
      <rect x="22" y="225" width="350" height="217" rx="6" fill="var(--pk-pitch)" />
      <g fill="none" stroke="var(--pk-line)" strokeWidth="2.5"><rect x="34" y="236" width="326" height="195" /><path d="M197 236V431" /><circle cx="197" cy="333" r="30" /><rect x="34" y="276" width="52" height="115" /><rect x="308" y="276" width="52" height="115" /></g>
      <rect x="120" y="456" width="158" height="34" rx="4" fill="var(--pk-bld)" /><rect x="18" y="120" width="60" height="45" rx="4" fill="var(--pk-bld)" />
      {/* en batería: franja + rayas perpendiculares a la calzada */}
      <path d={"M" + ACCESS.map(p => p.join(" ")).join(" ")} transform="translate(-14 0)" fill="none" stroke="color-mix(in srgb, var(--pk-red) 22%, transparent)" strokeWidth="22" strokeLinecap="round" />
      <path d={battery(ACCESS, 9, 20, 4, 1)} stroke="var(--pk-red)" strokeWidth="2.6" strokeLinecap="round" />
      <path d={battery(UNTZAGA, 9, 20, 6, 1)} stroke="var(--pk-red)" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="392" y="420" width="64" height="70" rx="6" fill="url(#pk-hatch)" stroke="var(--pk-red)" strokeWidth="5" />
      <path d="M512 425 693 198 848 320 685 512 612 512Z" fill="url(#pk-hatch)" stroke="var(--pk-red)" strokeWidth="5" strokeLinejoin="round" />
      <Pin x={680} y={360} color="var(--pk-red)" /><Pin x={424} y={452} color="var(--pk-red)" r={16} />
      <Entry x={382} y={404} />
      <g className="pk-lbl"><text x="197" y="212" textAnchor="middle">Ibaiondo</text><text x="680" y="408" textAnchor="middle">{t("Campa", "Zelaigunea", "Pré")}</text></g>
      <g className="pk-st"><text x="170" y="62" transform="rotate(-15 170 62)">Calle Errekalde</text><text x="500" y="330" transform="rotate(-82 500 330)">Camino Untzaga</text><text x="760" y="160" transform="rotate(36 760 160)">Camino Untzaga</text><text x="575" y="122" textAnchor="middle">{t("Rotonda", "Biribilgunea", "Rond-point")}</text></g>
    </svg>
  );
}

const WALK: Pt[] = [[585, 378], [560, 385], [500, 330], [400, 262], [300, 198], [240, 180], [214, 196], [206, 250], [210, 290]];

/** Plano del aparcamiento alternativo (Seminario) con la ruta a pie hasta la entrada del campo. */
export function ParkingAlt() {
  const { t } = useLang();
  const road = (k: string, c: string, w: number) => <g key={k} stroke={c} strokeWidth={w}><path d="M0 182 120 140 225 148" /><path d="M262 130 330 60 380 0" /><path d="M228 172 210 230 210 300" /><path d="M296 178 400 252 500 322 560 392 760 396 860 350 940 400" /><path d="M700 200 800 70 860 0" /></g>;
  return (
    <svg className="pk-map" viewBox="0 0 1000 414" role="img" aria-label={t("Plano del aparcamiento del Seminario y ruta a pie hasta Ibaiondo", "Seminarioko aparkalekuaren planoa eta Ibaiondora oinez joateko bidea", "Plan du parking du Seminario et trajet à pied jusqu’à Ibaiondo")}>
      <rect width="1000" height="414" fill="var(--pk-ground)" />
      <path d="M0 0H330L240 120 0 160Z" fill="var(--pk-trees)" /><path d="M400 30 600 20 560 270 430 250Z" fill="var(--pk-grass)" /><path d="M860 260 1000 120V414H780Z" fill="var(--pk-grass)" />
      <g fill="var(--pk-bld)"><path d="M480 290 560 165 600 180 520 305Z" /><rect x="600" y="80" width="90" height="70" rx="4" transform="rotate(30 645 115)" /><rect x="560" y="170" width="70" height="55" rx="4" transform="rotate(30 595 197)" /><rect x="520" y="290" width="60" height="70" rx="4" transform="rotate(30 550 325)" /><rect x="700" y="10" width="110" height="80" rx="4" transform="rotate(30 755 50)" /><rect x="610" y="230" width="50" height="45" rx="4" transform="rotate(30 635 252)" /></g>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">{road("e", "var(--pk-edge)", 20)}{road("r", "var(--pk-road)", 15)}</g>
      <circle cx="262" cy="155" r="30" fill="none" stroke="var(--pk-edge)" strokeWidth="22" /><circle cx="262" cy="155" r="30" fill="none" stroke="var(--pk-road)" strokeWidth="17" /><circle cx="262" cy="155" r="15" fill="var(--pk-grass)" />
      <rect x="5" y="235" width="160" height="100" rx="4" fill="var(--pk-pitch)" />
      <g fill="none" stroke="var(--pk-line)" strokeWidth="2"><rect x="12" y="241" width="146" height="88" /><path d="M85 241V329" /><circle cx="85" cy="285" r="14" /></g>
      <rect x="45" y="340" width="80" height="18" rx="3" fill="var(--pk-bld)" />
      <path d="M583 378 712 372 822 240 868 268 985 112 880 8 736 178 640 300Z" fill="color-mix(in srgb, var(--pk-blue) 16%, transparent)" stroke="var(--pk-blue)" strokeWidth="5" strokeLinejoin="round" />
      <g stroke="var(--pk-blue)" strokeWidth="2" opacity=".35"><path d="M660 330 770 190M700 340 820 190M760 310 900 130M800 270 930 100M690 300 800 160" /></g>
      <path className="pk-walk" d={"M" + WALK.map(p => p.join(" ")).join(" ")} fill="none" stroke="var(--pk-red)" strokeWidth="7" />
      <Entry x={210} y={300} /><Pin x={820} y={190} color="var(--pk-blue)" />
      <g className="pk-lbl"><text x="85" y="224" textAnchor="middle">Ibaiondo</text><text x="210" y="348" textAnchor="middle">{t("Entrada", "Sarrera", "Entrée")}</text><text x="880" y="236" textAnchor="middle">Seminario</text></g>
      <g className="pk-st"><text x="60" y="150" transform="rotate(-18 60 150)">Calle Errekalde</text><text x="400" y="240" transform="rotate(35 400 240)">Camino Untzaga</text><text x="650" y="408">Camino Untzaga</text></g>
    </svg>
  );
}

/** Los dos planos de aparcamiento con su leyenda y enlace a la foto aérea original. */
export function ParkingMaps() {
  const { t } = useLang();
  const go = (k: PlaceKey, label: string) => <a className="btn btn-primary block" href={directionsUrl(k)} target="_blank" rel="noreferrer"><Icon name="car" size={18} />{label}</a>;
  return (
    <div className="pk-wrap">
      <figure className="pk-fig">
        <figcaption><b>{t("Aparcamiento", "Aparkalekua", "Parking")}</b><span>{t("Junto al campo: en batería en el vial de acceso y en Camino Untzaga, al final del vial y en la campa.", "Zelaiaren ondoan: bateria-aparkalekua sarbide-bidean eta Untzaga bidean, bidearen amaieran eta zelaigunean.", "À côté du stade : en bataille le long de la voie d’accès et du Camino Untzaga, au bout de la voie d’accès et dans le pré.")}</span></figcaption>
        <ParkingNear />
        <div className="pk-legend"><span><i className="sw hatch" />{t("Zona de aparcamiento", "Aparkatzeko gunea", "Zone de stationnement")}</span><span><i className="sw batt" />{t("Aparcamiento en batería", "Bateria-aparkalekua", "Parking en bataille")}</span><span><i className="sw entry" />{t("Entrada al campo", "Zelairako sarrera", "Entrée du stade")}</span></div>
        {go("ibaiondo", t("Cómo llegar al campo", "Nola iritsi zelaira", "Itinéraire vers le stade"))}
      </figure>
      <figure className="pk-fig">
        <figcaption><b>{t("Aparcamiento alternativo · Seminario", "Ordezko aparkalekua · Seminarioa", "Parking de délestage · Seminario")}</b><span>{t("Si el de junto al campo está lleno. Desde allí, unos 350 m a pie (≈ 5 min) por Camino Untzaga hasta la entrada.", "Zelaiaren ondokoa beteta badago. Handik, 350 m inguru oinez (≈ 5 min) Untzaga bidetik sarreraraino.", "Si le parking du stade est complet. De là, environ 350 m à pied (≈ 5 min) par le Camino Untzaga jusqu’à l’entrée.")}</span></figcaption>
        <ParkingAlt />
        <div className="pk-legend"><span><i className="sw alt" />{t("Aparcamiento del Seminario", "Seminarioko aparkalekua", "Parking du Seminario")}</span><span><i className="sw walk" />{t("Ruta a pie hasta la entrada", "Oinezko bidea sarreraraino", "Trajet à pied jusqu’à l’entrée")}</span></div>
        {go("seminario", t("Cómo llegar al Seminario", "Nola iritsi Seminariora", "Itinéraire vers le Seminario"))}
      </figure>
    </div>
  );
}
