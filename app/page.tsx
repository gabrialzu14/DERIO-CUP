"use client";
import { scrollToTop } from "./lib/scroll";
import { useEffect, useState } from "react";
import { Icon } from "./components/icons";
import { Landing } from "./components/Landing";
import { Splash } from "./components/Welcome";
import { TournamentApp } from "./components/TournamentApp";
import { TOURNAMENTS, getTournament } from "./lib/editions";
import { isUpcoming } from "./lib/tournament";
import { useTheme } from "./lib/useTheme";
import { Onboarding } from "./components/Onboarding";
import { ONBOARDED_KEY, isInstalled } from "./lib/platform";

const TOURNAMENT_KEY = "derio-cup-tournament";

export default function App() {
  const [ready, setReady] = useState(false), [splash, setSplash] = useState(true);
  const [current, setCurrent] = useState<string | null>(null), [onboarding, setOnboarding] = useState(false);
  const themeCtl = useTheme();

  useEffect(() => {
    // Recuerda el torneo elegido mientras siga vigente; si ya pasó, vuelve a la lista.
    let id: string | null = null;
    try { id = localStorage.getItem(TOURNAMENT_KEY); } catch {}
    const tn = getTournament(id);
    setCurrent(tn && isUpcoming(tn) ? tn.id : null);
    // Guion de instalación: solo en el navegador, la primera vez y si aún no ha elegido torneo.
    let done = false; try { done = !!localStorage.getItem(ONBOARDED_KEY); } catch {}
    setOnboarding(!isInstalled() && !done && !(tn && isUpcoming(tn)));
    setReady(true);
    let seen = false;
    try { seen = !!sessionStorage.getItem("derio-cup-splash"); sessionStorage.setItem("derio-cup-splash", "1"); } catch {}
    if (seen) { setSplash(false); return; }
    const t = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(t);
  }, []);

  const choose = (id: string | null) => {
    setCurrent(id);
    try { id ? localStorage.setItem(TOURNAMENT_KEY, id) : localStorage.removeItem(TOURNAMENT_KEY); } catch {}
    scrollToTop();
  };

  const finishOnboarding = () => { try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {} setOnboarding(false); scrollToTop(); };
  if (!ready || splash) return <Splash />;
  if (onboarding) return <Onboarding onDone={finishOnboarding} onSkip={finishOnboarding} />;
  const tn = getTournament(current);
  if (tn) return <TournamentApp key={tn.id} tn={tn} onExit={() => choose(null)} themeCtl={themeCtl} />;

  const upcoming = TOURNAMENTS.filter(isUpcoming).sort((a, b) => a.date.localeCompare(b.date));
  return (
    <Landing
      tournaments={upcoming}
      onSelect={choose}
      themeButton={<button type="button" className="icon-btn" aria-label={themeCtl.resolved === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} onClick={themeCtl.toggle}><Icon name={themeCtl.resolved === "dark" ? "sun" : "moon"} size={20} /></button>}
    />
  );
}
