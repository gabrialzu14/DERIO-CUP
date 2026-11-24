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

const TOURNAMENT_KEY = "derio-cup-tournament";

export default function App() {
  const [ready, setReady] = useState(false), [splash, setSplash] = useState(true);
  const [current, setCurrent] = useState<string | null>(null);
  const themeCtl = useTheme();

  useEffect(() => {
    // Recuerda el torneo elegido mientras siga vigente; si ya pasó, vuelve a la lista.
    let id: string | null = null;
    try { id = localStorage.getItem(TOURNAMENT_KEY); } catch {}
    const tn = getTournament(id);
    setCurrent(tn && isUpcoming(tn) ? tn.id : null);
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

  if (!ready || splash) return <Splash />;
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
