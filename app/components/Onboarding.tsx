"use client";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { BrandName, CupMark } from "./ui";
import { LangToggle } from "./LanguageScreen";
import { BRAND } from "../lib/tournament";
import { useLang } from "../lib/i18n";
import { smooth } from "../lib/smooth";
import { detectPlatform, type Platform } from "../lib/platform";

type Step = "welcome" | "ask" | "platform" | "steps" | "done";
type Guide = { icon: IconName; logo?: "safari" | "chrome"; title: string; text: ReactNode };

const guides = (lang: "es" | "eu"): { ios: Guide[]; android: Guide[] } => lang === "eu" ? {
  ios: [
    { icon: "smartphone", logo: "safari", title: "Ireki orri hau Safarin", text: <><b>Safari</b> izan behar da, iparrorratza duen nabigatzaile urdina. WhatsApp-en edo Instagram-en bazaude, sakatu <b>···</b> eta aukeratu <b>«Ireki Safarin»</b>.</> },
    { icon: "share", title: "Sakatu «Partekatu»", text: <><b>Karratua eta gora doan gezia</b> dituen botoia da, behean erdian. iPhone batzuetan <b>···</b> menuaren barruan dago.</> },
    { icon: "addhome", title: "«Gehitu hasierako pantailara»", text: <>Irristatu behera irekitzen den menuan eta sakatu <b>«Gehitu hasierako pantailara»</b>.</> },
    { icon: "check", title: "Sakatu «Gehitu»", text: <>Goian eskuinean. <b>Derio Cup</b>-en ikonoa zure hasierako pantailan agertuko da.</> },
  ],
  android: [
    { icon: "smartphone", logo: "chrome", title: "Ireki orri hau Chrome-n", text: <>Kolore-borobila duen nabigatzailea da. Beste aplikazio baten barruan bazaude, sakatu <b>⋮</b> eta aukeratu <b>«Ireki Chrome-n»</b>.</> },
    { icon: "dotsv", title: "Sakatu ⋮ menua", text: <>Goian eskuinean dauden <b>hiru puntuak</b> dira.</> },
    { icon: "install", title: "«Instalatu aplikazioa»", text: <>Sakatu <b>«Instalatu aplikazioa»</b> edo <b>«Gehitu hasierako pantailara»</b>, zure mugikorraren arabera.</> },
    { icon: "check", title: "Baieztatu «Instalatu»-rekin", text: <><b>Derio Cup</b>-en ikonoa hasierako pantailan eta aplikazioen menuan agertuko da.</> },
  ],
} : {
  ios: [
    { icon: "smartphone", logo: "safari", title: "Abre esta página en Safari", text: <>Tiene que ser <b>Safari</b>, el navegador azul con la brújula. Si estás dentro de WhatsApp o Instagram, pulsa <b>···</b> y elige <b>«Abrir en Safari»</b>.</> },
    { icon: "share", title: "Pulsa «Compartir»", text: <>Es el botón del <b>cuadrado con una flecha hacia arriba</b>, abajo en el centro. En algunos iPhone está dentro del menú <b>···</b>.</> },
    { icon: "addhome", title: "«Añadir a pantalla de inicio»", text: <>Desliza hacia abajo en el menú que se abre y pulsa <b>«Añadir a pantalla de inicio»</b>.</> },
    { icon: "check", title: "Pulsa «Añadir»", text: <>Arriba a la derecha. El icono de <b>Derio Cup</b> aparecerá en tu pantalla de inicio.</> },
  ],
  android: [
    { icon: "smartphone", logo: "chrome", title: "Abre esta página en Chrome", text: <>Es el navegador con el círculo de colores. Si estás dentro de otra app, pulsa <b>⋮</b> y elige <b>«Abrir en Chrome»</b>.</> },
    { icon: "dotsv", title: "Pulsa el menú ⋮", text: <>Son los <b>tres puntos</b> de arriba a la derecha.</> },
    { icon: "install", title: "«Instalar aplicación»", text: <>Pulsa <b>«Instalar aplicación»</b> o <b>«Añadir a la pantalla de inicio»</b>, según tu móvil.</> },
    { icon: "check", title: "Confirma con «Instalar»", text: <>El icono de <b>Derio Cup</b> aparecerá en tu pantalla de inicio y en el menú de aplicaciones.</> },
  ],
};

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/** Guion de bienvenida e instalación de la app. `start="platform"` lo abre directamente en la elección de móvil. */
export function Onboarding({ start = "welcome", onDone, onSkip, themeCtl }: { start?: Step; onDone: () => void; onSkip: () => void; themeCtl?: { resolved: "light" | "dark"; toggle: () => void } }) {
  const { lang, t } = useLang();
  const [step, setStep] = useState<Step>(start), [platform, setPlatform] = useState<Platform>("other"), [detected, setDetected] = useState<Platform>("other"), [n, setN] = useState(0);
  const goStep = (s: Step) => smooth(() => setStep(s)), goN = (v: number) => smooth(() => setN(v));
  const [installEvt, setInstallEvt] = useState<InstallEvent | null>(null);
  useEffect(() => {
    setDetected(detectPlatform());
    const w = window as Window & { __dcInstall?: InstallEvent };
    if (w.__dcInstall) setInstallEvt(w.__dcInstall);
    const on = (e: Event) => { e.preventDefault(); w.__dcInstall = e as InstallEvent; setInstallEvt(e as InstallEvent); };
    window.addEventListener("beforeinstallprompt", on); return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);
  const guide = platform === "ios" ? guides(lang).ios : guides(lang).android;
  const pick = (p: Platform) => { setPlatform(p); goN(0); goStep("steps"); };
  const nativeInstall = async () => { if (!installEvt) return; await installEvt.prompt(); const c = await installEvt.userChoice; if (c.outcome === "accepted") goStep("done"); };

  return (
    <main className="onb" aria-live="polite">
      <div className="onb-top"><div className="onb-left">{themeCtl && <button type="button" className="icon-btn onb-theme" aria-label={themeCtl.resolved === "dark" ? t("Cambiar a modo claro", "Aldatu modu argira") : t("Cambiar a modo oscuro", "Aldatu modu ilunera")} onClick={themeCtl.toggle}><Icon name={themeCtl.resolved === "dark" ? "sun" : "moon"} size={20} /></button>}{step !== "welcome" && step !== "done" ? <button type="button" className="onb-skip" onClick={onSkip}>{t("Omitir", "Saltatu")}</button> : null}</div><LangToggle /></div>
      <div className={"onb-body" + (step === "welcome" || step === "done" ? "" : " top")} key={step + n}>
        {step === "welcome" && <>
          <CupMark size={120} className="landing-cup brand-grad" />
          <h1 className="wordmark"><b>DERIO</b><span>CUP</span></h1>
          <h2 className="onb-title">{t("¡Bienvenido!", "Ongi etorri!")}</h2>
          <p className="onb-text">{t(`Aquí tendrás los partidos, los resultados y las clasificaciones de ${BRAND} en tu móvil.`, `Hemen izango dituzu ${BRAND}-eko partidak, emaitzak eta sailkapenak zure mugikorrean.`)}</p>
        </>}
        {step === "ask" && <>
          <h2 className="onb-title">{t("¿Sabes cómo se instala la app?", "Badakizu aplikazioa nola instalatzen den?")}</h2>
          <p className="onb-text">{t("Instalarla es gratis, no ocupa espacio y se abre desde tu pantalla de inicio, como cualquier otra app.", "Instalatzea doakoa da, ez du lekurik hartzen eta zure hasierako pantailatik irekitzen da, beste edozein aplikazio bezala.")}</p>
          <div className="onb-cards">
            <button type="button" className="onb-card yes" onClick={onDone}><span className="onb-card-ico"><Icon name="check" size={34} /></span><b>{t("Sí, ya lo he hecho", "Bai, instalatuta dut")}</b><small>{t("Ir a elegir torneo", "Txapelketa aukeratzera joan")}</small></button>
            <button type="button" className="onb-card help" onClick={() => goStep("platform")}><span className="onb-card-ico"><Icon name="info" size={34} /></span><b>{t("No, ayúdame", "Ez, lagun nazazu")}</b><small>{t("Te lo explico paso a paso", "Pausoz pauso azalduko dizut")}</small></button>
          </div>
        </>}
        {step === "platform" && <>
          <h2 className="onb-title">{t("¿Qué móvil tienes?", "Zer mugikor duzu?")}</h2>
          <p className="onb-text">{t("Los pasos son distintos en cada sistema.", "Pausoak desberdinak dira sistema bakoitzean.")}</p>
          <div className="onb-cards">
            <button type="button" className={"onb-card" + (detected === "ios" ? " is-mine" : "")} onClick={() => pick("ios")}><span className="onb-card-ico logo ios" role="img" aria-label="Apple" /><b>iPhone</b><small>Safari</small></button>
            <button type="button" className={"onb-card" + (detected === "android" ? " is-mine" : "")} onClick={() => pick("android")}><span className="onb-card-ico logo android"><img src="/plataformas/android.webp" alt="Android" width={56} height={56} decoding="async" /></span><b>Android</b><small>Chrome</small></button>
          </div>
        </>}
        {step === "steps" && <>
          <div className="onb-dots" role="progressbar" aria-label="Paso" aria-valuemin={1} aria-valuemax={guide.length} aria-valuenow={n + 1}>{guide.map((_, i) => <i key={i} className={i <= n ? "on" : ""} />)}</div>
          <small className="onb-kicker">{platform === "ios" ? "iPhone" : "Android"} · {t(`Paso ${n + 1} de ${guide.length}`, `${n + 1}/${guide.length}. pausoa`)}</small>
          <div className={"onb-art" + (guide[n].logo ? " has-logo" : "")}>{guide[n].logo ? <img src={`/plataformas/${guide[n].logo}.webp`} alt={guide[n].logo === "safari" ? "Safari" : "Chrome"} width={72} height={72} decoding="async" draggable={false} /> : <Icon name={guide[n].icon} size={52} />}</div>
          <h2 className="onb-title">{guide[n].title}</h2>
          <p className="onb-text">{guide[n].text}</p>
          {platform === "android" && n === 1 && installEvt && <button type="button" className="btn btn-ghost" onClick={nativeInstall}>{t("Instalar ahora desde aquí", "Instalatu orain hemendik")}</button>}
        </>}
        {step === "done" && <>
          <div className="onb-art ok"><Icon name="check" size={52} /></div>
          <h2 className="onb-title">{t("¡Ya casi está!", "Ia eginda!")}</h2>
          <p className="onb-text">{lang === "eu" ? <>Itxi orri hau eta bilatu <b>Derio Cup</b> zure <b>mugikorraren menu nagusian</b>: hasierako pantailan edo, Androiden, aplikazioen zerrendan.</> : <>Cierra esta página y busca <b>Derio Cup</b> en el <b>menú principal de tu móvil</b>: la pantalla de inicio o, en Android, la lista de aplicaciones.</>}</p>
          <div className="onb-appicon"><span className="onb-appicon-img"><CupMark size={34} /></span><BrandName as="b" /></div>
          <p className="onb-text sm">{t("Al abrirla podrás elegir tu torneo.", "Irekitzean zure txapelketa aukeratu ahal izango duzu.")}</p>
        </>}
      </div>

      <div className="onb-actions">
        {step === "welcome" && <button type="button" className="btn btn-primary block" onClick={() => goStep("ask")}>{t("Empezar", "Hasi")}<Icon name="chevron" size={18} /></button>}
        {step === "ask" && <button type="button" className="onb-link" onClick={() => goStep("welcome")}>{t("Atrás", "Atzera")}</button>}
        {step === "platform" && <button type="button" className="onb-link" onClick={() => (start === "platform" ? onSkip() : goStep("ask"))}>{t("Atrás", "Atzera")}</button>}
        {step === "steps" && <>
          <button type="button" className="btn btn-primary block" onClick={() => (n < guide.length - 1 ? goN(n + 1) : goStep("done"))}>{n < guide.length - 1 ? t("Siguiente", "Hurrengoa") : t("Ya lo he hecho", "Eginda dago")}<Icon name="chevron" size={18} /></button>
          <button type="button" className="onb-link" onClick={() => (n > 0 ? goN(n - 1) : goStep("platform"))}>{t("Atrás", "Atzera")}</button>
        </>}
        {step === "done" && <>
          <button type="button" className="onb-link strong" onClick={onDone}>{t("Continuar en el navegador", "Jarraitu nabigatzailean")}</button>
        </>}
      </div>
    </main>
  );
}
