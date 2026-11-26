"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LOGO_PATHS, LOGO_VIEWBOX } from "../lib/logoPaths";
import { BrandName, Crest, CupMark } from "./ui";
import { Icon } from "./icons";
import { useEngine } from "../lib/engine";
import { clubTone } from "../lib/crests";
import { useLang } from "../lib/i18n";
import { BRAND, GROUPS, tournamentTag } from "../lib/tournament";

/** Curva cubic-bezier(.77,0,.175,1) (la misma del trazo en CSS) para que la chispa siga exactamente a la línea. */
const easeInOut = (x: number) => {
  let lo = 0, hi = 1, m = 0;
  for (let i = 0; i < 28; i++) { m = (lo + hi) / 2; const xm = 3 * (1 - m) * (1 - m) * m * .77 + 3 * (1 - m) * m * m * .175 + m * m * m; xm < x ? (lo = m) : (hi = m); }
  return 3 * (1 - m) * m * m + m * m * m;
};
/** Las líneas largas se dibujan primero; cada una empieza 60 ms después de la anterior. */
const SPLASH_ORDER = LOGO_PATHS.map((d, i) => ({ d, i })).sort((a, b) => b.d.length - a.d.length).map((o, rank) => ({ ...o, delay: 80 + rank * 60, dur: Math.round(700 + Math.min(o.d.length, 1100) * 0.62) }));
export const SPLASH_MS = 3300;

/** Pantalla de carga: el logo se dibuja con degradado y una chispa que recorre cada línea; después se rellena, brilla y aparece el nombre. */
export function Splash() {
  const sparks = useRef<(SVGCircleElement | null)[]>([]), svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !svg.current) return;
    const anims: Animation[] = [];
    SPLASH_ORDER.forEach((o, k) => {
      const c = sparks.current[k]; if (!c || !c.animate) return;
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "path"); probe.setAttribute("d", o.d); svg.current!.appendChild(probe);
      const L = probe.getTotalLength(), N = 40, kf: Keyframe[] = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, pt = probe.getPointAtLength(L * easeInOut(u));
        // la chispa se apaga antes de terminar la línea: al completarse el logo no queda ningún punto
        kf.push({ offset: u, transform: `translate(${pt.x}px,${pt.y}px)`, opacity: u < .04 ? u / .04 : u > .78 ? Math.max(0, (1 - u) / .22) : 1 });
      }
      probe.remove();
      const a = c.animate(kf, { duration: o.dur, delay: o.delay, easing: "linear", fill: "both" });
      a.onfinish = () => { c.style.display = "none"; };
      anims.push(a);
    });
    return () => anims.forEach(a => a.cancel());
  }, []);
  const all = LOGO_PATHS.join(""), { t } = useLang();
  return (
    <div className="splash" role="status" aria-label={t("Cargando", "Kargatzen", "Chargement")}>
      <span className="sp-halo" aria-hidden="true" />
      <svg ref={svg} className="sp-logo" viewBox={LOGO_VIEWBOX} aria-hidden="true">
        <defs>
          <linearGradient id="sp-g" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="582" y2="600"><stop offset="0" style={{ stopColor: "var(--accent)" }} /><stop offset="1" style={{ stopColor: "var(--red)" }} /></linearGradient>
          <linearGradient id="sp-gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".85" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          <mask id="sp-m" maskUnits="userSpaceOnUse" x="-20" y="-20" width="640" height="700"><path d={all} fillRule="evenodd" fill="#fff" /></mask>
        </defs>
        <g mask="url(#sp-m)">
          <path d={all} fillRule="evenodd" className="sp-fill" />
          <g transform="skewX(-18)"><rect className="sp-glint" x="-120" y="-40" width="120" height="720" /></g>
        </g>
        {SPLASH_ORDER.map(o => <path key={o.i} d={o.d} pathLength={1} className="sp-path" style={{ "--t": o.delay + "ms", "--d": o.dur + "ms" } as CSSProperties} />)}
        {SPLASH_ORDER.map((o, k) => <circle key={o.i} ref={el => { sparks.current[k] = el; }} r={o.d.length > 300 ? 11 : 7} className="sp-spark" />)}
      </svg>
      <b className="sp-word" aria-label={BRAND}>{"DERIO".split("").map((ch, k) => <i key={k} style={{ "--k": k } as CSSProperties}>{ch}</i>)}{"CUP".split("").map((ch, k) => <i key={k} className="l" style={{ "--k": k + 5 } as CSSProperties}>{ch}</i>)}</b>
    </div>
  );
}

/** Elección de equipo: se marca (con el color del club) y solo se entra al pulsar «Continuar». */
export function Welcome({ choosing, onPick, onNeutral, onBack }: { choosing: string | null; onPick: (id: string) => void; onNeutral: () => void; onBack: () => void }) {
  const { tn, T } = useEngine(), { t: tr, locale } = useLang();
  const [picked, setPicked] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null); // conserva el color del botón mientras se oculta
  const toggle = (id: string) => {
    if (choosing) return;
    const next = picked === id ? null : id;
    if (next) { navigator.vibrate?.(10); setLast(next); }
    setPicked(next);
  };
  const colors = (id: string) => { const tone = clubTone(T(id).crest ?? T(id).name, id); return { "--pk-bg": tone.bg, "--pk-fg": tone.fg } as CSSProperties; };
  return (
    <main className="welcome">
      <button type="button" className="back-btn" onClick={onBack} disabled={!!choosing}><Icon name="back" size={18} />{tr("Torneos", "Txapelketak", "Tournois")}</button>
      <header className="welcome-head">
        <CupMark size={64} className="brand-grad" />
        <h1><BrandName /></h1>
        <p>{tournamentTag(tn, locale)}</p>
        <h2>{tr("Elige tu equipo", "Aukeratu zure taldea", "Choisissez votre équipe")}</h2>
        <small>{tr("Para seguirlo de cerca. Puedes cambiarlo cuando quieras.", "Gertutik jarraitzeko. Nahi duzunean alda dezakezu.", "Pour la suivre de près. Vous pourrez en changer à tout moment.")}</small>
      </header>
      {GROUPS.map(g => (
        <section key={g} aria-labelledby={"wg-" + g}>
          <h3 id={"wg-" + g} className="welcome-group">{tr(`Grupo ${g}`, `${g} multzoa`, `Groupe ${g}`)}</h3>
          <div className="team-grid">
            {tn.teams.filter(t => t.group === g).map(t => (
              <button key={t.id} type="button" aria-pressed={picked === t.id} className={"team-pick" + (picked === t.id ? " is-picked" : "") + (choosing && picked !== t.id ? " is-dim" : "")} style={colors(t.id)} disabled={!!choosing} onClick={() => toggle(t.id)}>
                {picked === t.id && <span className="pick-ring" aria-hidden="true" />}
                <Crest id={t.id} size={56} />
                <b>{t.pick ?? t.name}</b>
                {picked === t.id && <span className="chosen-mark"><Icon name="check" size={16} /></span>}
              </button>
            ))}
          </div>
        </section>
      ))}
      <button type="button" className="btn btn-ghost block" disabled={!!choosing} onClick={onNeutral}>{tr("No tengo equipo", "Ez dut talderik", "Aucune équipe")}</button>

      <div className="continue-bar" data-show={picked ? "true" : "false"} aria-hidden={!picked}>
        <button type="button" className="continue-btn" style={last ? colors(last) : undefined} tabIndex={picked ? 0 : -1} disabled={!picked || !!choosing} onClick={() => picked && onPick(picked)}>
          {tr("Continuar", "Jarraitu", "Continuer")}<Icon name="chevron" size={20} />
        </button>
      </div>
    </main>
  );
}
