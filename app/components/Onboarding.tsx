"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { CupMark } from "./ui";
import { BRAND } from "../lib/tournament";
import { detectPlatform, type Platform } from "../lib/platform";

type Step = "welcome" | "ask" | "platform" | "steps" | "done";
type Guide = { icon: IconName; title: string; text: ReactNode };

const IOS: Guide[] = [
  { icon: "smartphone", title: "Abre esta página en Safari", text: <>Tiene que ser <b>Safari</b>, el navegador azul con la brújula. Si estás dentro de WhatsApp o Instagram, pulsa <b>···</b> y elige <b>«Abrir en Safari»</b>.</> },
  { icon: "share", title: "Pulsa «Compartir»", text: <>Es el botón del <b>cuadrado con una flecha hacia arriba</b>, abajo en el centro. En algunos iPhone está dentro del menú <b>···</b>.</> },
  { icon: "addhome", title: "«Añadir a pantalla de inicio»", text: <>Desliza hacia abajo en el menú que se abre y pulsa <b>«Añadir a pantalla de inicio»</b>.</> },
  { icon: "check", title: "Pulsa «Añadir»", text: <>Arriba a la derecha. El icono de <b>Derio Cup</b> aparecerá en tu pantalla de inicio.</> },
];
const ANDROID: Guide[] = [
  { icon: "smartphone", title: "Abre esta página en Chrome", text: <>Es el navegador con el círculo de colores. Si estás dentro de otra app, pulsa <b>⋮</b> y elige <b>«Abrir en Chrome»</b>.</> },
  { icon: "dotsv", title: "Pulsa el menú ⋮", text: <>Son los <b>tres puntos</b> de arriba a la derecha.</> },
  { icon: "install", title: "«Instalar aplicación»", text: <>Pulsa <b>«Instalar aplicación»</b> o <b>«Añadir a la pantalla de inicio»</b>, según tu móvil.</> },
  { icon: "check", title: "Confirma con «Instalar»", text: <>El icono de <b>Derio Cup</b> aparecerá en tu pantalla de inicio y en el menú de aplicaciones.</> },
];

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** Guion de bienvenida e instalación de la app. `start="platform"` lo abre directamente en la elección de móvil. */
export function Onboarding({ start = "welcome", onDone, onSkip }: { start?: Step; onDone: () => void; onSkip: () => void }) {
  const [step, setStep] = useState<Step>(start), [platform, setPlatform] = useState<Platform>("other"), [detected, setDetected] = useState<Platform>("other"), [n, setN] = useState(0);
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    setDetected(detectPlatform());
    const w = window as Window & { __dcInstall?: InstallEvent };
    if (w.__dcInstall) setInstallEvt(w.__dcInstall);
    const on = (e: Event) => { e.preventDefault(); w.__dcInstall = e as InstallEvent; setInstallEvt(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", on); return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  const guide = platform === "ios" ? IOS : ANDROID;
  const pick = (p: Platform) => { setPlatform(p); setN(0); setStep("steps"); };
  const nativeInstall = async () => { if (!installEvt) return; await installEvt.prompt(); const c = await installEvt.userChoice; if (c.outcome === "accepted") setStep("done"); };

  return (
    <main className="onb" aria-live="polite">
      <div className="landing-theme">{step !== "welcome" && step !== "done" && <button type="button" className="onb-skip" onClick={onSkip}>Omitir</button>}</div>
      <div className={"onb-body" + (step === "welcome" || step === "done" ? "" : " top")} key={step + n}>
        {step === "welcome" && <>
          <CupMark size={120} className="landing-cup" />
          <h1 className="wordmark"><b>DERIO</b><span>CUP</span></h1>
          <h2 className="onb-title">¡Bienvenido!</h2>
          <p className="onb-text">Aquí tendrás los partidos, los resultados y las clasificaciones de {BRAND} en tu móvil.</p>
        </>}
        {step === "ask" && <>
          <h2 className="onb-title">¿Sabes cómo se instala la app?</h2>
          <p className="onb-text">Instalarla es gratis, no ocupa espacio y se abre desde tu pantalla de inicio, como cualquier otra app.</p>
          <div className="onb-options">
            <button type="button" className="onb-option" onClick={onDone}><span className="onb-ico"><Icon name="check" size={24} /></span><span><b>Sí, ya lo he hecho</b><small>Ir a elegir torneo</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
            <button type="button" className="onb-option" onClick={() => setStep("platform")}><span className="onb-ico"><Icon name="info" size={24} /></span><span><b>No, necesito que me ayudes</b><small>Te lo explico paso a paso</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
          </div>
        </>}
        {step === "platform" && <>
          <h2 className="onb-title">¿Qué móvil tienes?</h2>
          <p className="onb-text">Los pasos son distintos en cada sistema.</p>
          <div className="onb-options">
            <button type="button" className="onb-option" onClick={() => pick("ios")}><span className="onb-ico logo ios" role="img" aria-label="Apple" /><span><b>iPhone</b><small>{detected === "ios" ? "Es el que estás usando" : "iOS · Safari"}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
            <button type="button" className="onb-option" onClick={() => pick("android")}><span className="onb-ico logo android"><img src="/plataformas/android.webp" alt="Android" width={34} height={34} /></span><span><b>Android</b><small>{detected === "android" ? "Es el que estás usando" : "Chrome"}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
          </div>
        </>}
        {step === "steps" && <>
          <div className="onb-dots" role="progressbar" aria-label="Paso" aria-valuemin={1} aria-valuemax={guide.length} aria-valuenow={n + 1}>{guide.map((_, i) => <i key={i} className={i <= n ? "on" : ""} />)}</div>
          <small className="onb-kicker">{platform === "ios" ? "iPhone" : "Android"} · Paso {n + 1} de {guide.length}</small>
          <div className="onb-art"><Icon name={guide[n].icon} size={52} /></div>
          <h2 className="onb-title">{guide[n].title}</h2>
          <p className="onb-text">{guide[n].text}</p>
          {platform === "android" && n === 1 && installEvt && <button type="button" className="btn btn-ghost" onClick={nativeInstall}>Instalar ahora desde aquí</button>}
        </>}
        {step === "done" && <>
          <div className="onb-art ok"><Icon name="check" size={52} /></div>
          <h2 className="onb-title">¡Ya casi está!</h2>
          <p className="onb-text">Cierra esta página y busca <b>Derio Cup</b> en el <b>menú principal de tu móvil</b>: la pantalla de inicio o, en Android, la lista de aplicaciones.</p>
          <div className="onb-appicon"><span className="onb-appicon-img"><CupMark size={34} /></span><b>Derio Cup</b></div>
          <p className="onb-text sm">Al abrirla podrás elegir tu torneo.</p>
        </>}
      </div>

      <div className="onb-actions">
        {step === "welcome" && <button type="button" className="btn btn-primary block" onClick={() => setStep("ask")}>Empezar<Icon name="chevron" size={18} /></button>}
        {step === "ask" && <button type="button" className="onb-link" onClick={() => setStep("welcome")}>Atrás</button>}
        {step === "platform" && <button type="button" className="onb-link" onClick={() => (start === "platform" ? onSkip() : setStep("ask"))}>Atrás</button>}
        {step === "steps" && <>
          <button type="button" className="btn btn-primary block" onClick={() => (n < guide.length - 1 ? setN(n + 1) : setStep("done"))}>{n < guide.length - 1 ? "Siguiente" : "Ya lo he hecho"}<Icon name="chevron" size={18} /></button>
          <button type="button" className="onb-link" onClick={() => (n > 0 ? setN(n - 1) : setStep("platform"))}>Atrás</button>
        </>}
        {step === "done" && <>
          <button type="button" className="onb-link strong" onClick={onDone}>Continuar en el navegador</button>
        </>}
      </div>
    </main>
  );
}
