"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "./icons";
import { Crest, CupMark } from "./ui";
import { Home } from "./Home";
import { Partidos } from "./Partidos";
import { Clasificacion } from "./Clasificacion";
import { Fases } from "./Fases";
import { Team } from "./Team";
import { More } from "./More";
import { Dialog } from "./Dialog";
import { Welcome } from "./Welcome";
import { EngineContext, makeEngine } from "../lib/engine";
import { BRAND, SB_URL, dateParts, sbHeaders, type G, type ResultRow, type Tournament } from "../lib/tournament";
import type { useTheme } from "../lib/useTheme";

export type TabId = "inicio" | "partidos" | "clasificacion" | "fases" | "mas" | "mi";
const TAB_IDS: TabId[] = ["inicio", "partidos", "clasificacion", "fases", "mas", "mi"];
const NAV: { id: Exclude<TabId, "mi">; label: string; icon: IconName }[] = [
  { id: "inicio", label: "Inicio", icon: "home" }, { id: "partidos", label: "Partidos", icon: "ball" }, { id: "clasificacion", label: "Clasificación", icon: "table" }, { id: "fases", label: "Fases", icon: "trophy" }, { id: "mas", label: "Más", icon: "more" },
];
const VISITOR_KEY = "derio-cup-visitor";
type Scores = Record<string, [number, number]>;
type Results = Record<string, ResultRow>;

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { localStorage.removeItem(k); } catch {} },
};
const tabFromHash = (): TabId => { const h = window.location.hash.replace("#", "") as TabId; return TAB_IDS.includes(h) ? h : "inicio"; };

export function TournamentApp({ tn, onExit, themeCtl }: { tn: Tournament; onExit: () => void; themeCtl: ReturnType<typeof useTheme> }) {
  const engine = useMemo(() => makeEngine(tn), [tn]);
  // La edición original conserva sus claves antiguas para no perder la elección de equipo.
  const teamKey = tn.idPrefix ? "derio-cup-team:" + tn.id : "derio-cup-team", cacheKey = "derio-cup-cache-v2" + (tn.idPrefix ? ":" + tn.id : "");

  const [selected, setSelected] = useState<string | null>(() => store.get(teamKey)), [choosing, setChoosing] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>(() => tabFromHash()), [group, setGroup] = useState<G>("A"), [phase, setPhase] = useState<"oro" | "plata">("oro");
  const [scores, setScores] = useState<Scores>({}), [koResults, setKoResults] = useState<Results>({});
  const [fanCounts, setFanCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false), [offline, setOffline] = useState(false), [syncing, setSyncing] = useState(false), [lastSync, setLastSync] = useState<Date | null>(null);
  const [rules, setRules] = useState(false);
  const mainRef = useRef<HTMLElement>(null), firstTab = useRef(true);
  const { theme, resolved, setTheme, toggle } = themeCtl;
  const dp = dateParts(tn.date);

  /* ---- caché del último estado conocido ---- */
  useEffect(() => {
    try { const c = JSON.parse(store.get(cacheKey) || "null"); if (c) { setScores(c.scores || {}); setKoResults(c.ko || {}); setLoaded(true); } } catch {}
  }, [cacheKey]);

  /* ---- navegación por hash: el botón Atrás del móvil cambia de pestaña ---- */
  useEffect(() => { const on = () => setTab(tabFromHash()); window.addEventListener("hashchange", on); return () => window.removeEventListener("hashchange", on); }, []);
  const go = useCallback((t: TabId, o?: { group?: G; phase?: "oro" | "plata" }) => {
    if (o?.group) setGroup(o.group);
    if (o?.phase) setPhase(o.phase);
    const hash = t === "inicio" ? "" : "#" + t;
    if (window.location.hash !== hash) { if (hash) window.location.hash = hash; else history.pushState(null, "", window.location.pathname + window.location.search); setTab(t); }
  }, []);
  useEffect(() => {
    if (firstTab.current) { firstTab.current = false; return; }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [tab]);

  /* ---- datos de este torneo ---- */
  const load = useCallback(async (manual = false) => {
    if (manual) setSyncing(true);
    try {
      const r = await fetch(SB_URL + "/rest/v1/derio_cup_results?select=*", { headers: sbHeaders, cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      const rows: ResultRow[] = (await r.json()).filter((x: ResultRow) => engine.owns(x.match_id)), s: Scores = {}, k: Results = {};
      rows.forEach(x => { if (engine.isGroupId(x.match_id)) s[x.match_id] = [x.home_score, x.away_score]; else k[x.match_id] = x; });
      setScores(s); setKoResults(k); setLastSync(new Date()); setOffline(false); setLoaded(true);
      store.set(cacheKey, JSON.stringify({ scores: s, ko: k }));
    } catch { setOffline(true); setLoaded(true); }
    finally { if (manual) setTimeout(() => setSyncing(false), 450); }
  }, [engine, cacheKey]);
  const loadFans = useCallback(async () => {
    try {
      const r = await fetch(SB_URL + "/rest/v1/derio_cup_fans?select=team_id", { headers: sbHeaders, cache: "no-store" });
      if (!r.ok) return;
      const rows: { team_id: string }[] = await r.json(), z: Record<string, number> = {};
      rows.forEach(x => { const id = engine.fanTeam(x.team_id); if (id) z[id] = (z[id] || 0) + 1; });
      setFanCounts(z);
    } catch {}
  }, [engine]);
  useEffect(() => {
    load(); loadFans();
    const timer = setInterval(() => { if (document.visibilityState === "visible") { load(); loadFans(); } }, 60000);
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("online", onVisible); document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); window.removeEventListener("online", onVisible); document.removeEventListener("visibilitychange", onVisible); };
  }, [load, loadFans]);

  const ms = useMemo(() => engine.matches.map(m => (scores[m.id] ? { ...m, hs: scores[m.id][0], as: scores[m.id][1] } : m)), [engine, scores]);

  /* ---- selección de equipo ---- */
  const registerFan = async (id: string) => {
    let vid = store.get(VISITOR_KEY);
    if (!vid) { vid = crypto.randomUUID(); store.set(VISITOR_KEY, vid); }
    try { await fetch(SB_URL + "/rest/v1/derio_cup_fans?on_conflict=visitor_id", { method: "POST", headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ visitor_id: vid, team_id: engine.fanKey(id), updated_at: new Date().toISOString() }) }); } catch {}
  };
  const pick = (id: string) => {
    if (choosing) return;
    setChoosing(id); navigator.vibrate?.(10);
    registerFan(id).then(loadFans);
    setTimeout(() => { store.set(teamKey, id); setSelected(id); setChoosing(null); window.scrollTo({ top: 0 }); history.replaceState(null, "", window.location.pathname); setTab("inicio"); }, 650);
  };
  const neutral = () => { store.set(teamKey, "neutral"); setSelected("neutral"); window.scrollTo({ top: 0 }); setTab("inicio"); };
  const changeTeam = () => { store.del(teamKey); setSelected(null); };
  const exit = () => { history.replaceState(null, "", window.location.pathname); onExit(); };

  const validTeam = selected === "neutral" || (!!selected && tn.teams.some(t => t.id === selected));
  if (!validTeam) return <EngineContext.Provider value={engine}><Welcome choosing={choosing} onPick={pick} onNeutral={neutral} onBack={exit} /></EngineContext.Provider>;
  const mine = selected!;

  const activeNav = tab === "mi" ? "inicio" : tab;
  return (
    <EngineContext.Provider value={engine}>
      <div className="app">
        <a className="skip" href="#contenido" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}>Saltar al contenido</a>
        <header className="app-header">
          <div className="app-header-in">
            <button type="button" className="brand" onClick={() => go("inicio")} aria-label={`${BRAND} ${tn.category}, ir al inicio`}>
              <CupMark size={30} />
              <span><b>{BRAND}</b><small>{tn.category} · {dp.short}</small></span>
            </button>
            <div className="header-actions">
              {mine !== "neutral" && <button type="button" className="icon-btn avatar" aria-label={"Mi equipo: " + engine.T(mine).name} onClick={() => go("mi")}><Crest id={mine} size={26} /></button>}
              <button type="button" className={"icon-btn" + (syncing ? " is-spinning" : "")} aria-label="Actualizar resultados" onClick={() => load(true)}><Icon name="refresh" size={20} /></button>
              <button type="button" className="icon-btn" aria-label={resolved === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} onClick={toggle}><Icon name={resolved === "dark" ? "sun" : "moon"} size={20} /></button>
            </div>
          </div>
        </header>

        {offline && <div className="banner" role="status"><Icon name="wifi" size={18} /><span>Sin conexión. Mostrando los últimos datos guardados.</span><button type="button" onClick={() => load(true)}>Reintentar</button></div>}

        <main id="contenido" ref={mainRef} tabIndex={-1} className="main" aria-busy={!loaded}>
          {tab === "inicio" && <Home ms={ms} koResults={koResults} selected={mine} fanCounts={fanCounts} loaded={loaded} go={go} />}
          {tab === "partidos" && <Partidos ms={ms} koResults={koResults} />}
          {tab === "clasificacion" && <Clasificacion group={group} setGroup={setGroup} ms={ms} onRules={() => setRules(true)} />}
          {tab === "fases" && <Fases kind={phase} setKind={setPhase} ms={ms} koResults={koResults} />}
          {tab === "mi" && mine !== "neutral" && <Team id={mine} ms={ms} koResults={koResults} back={() => go("inicio")} />}
          {tab === "mas" && <More ms={ms} koResults={koResults} setKoResults={setKoResults} scores={scores} setScores={setScores} changeTeam={changeTeam} changeTournament={exit} theme={theme} setTheme={setTheme} />}
          {lastSync && tab !== "mas" && <p className="sync-note">Actualizado a las {lastSync.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}</p>}
        </main>

        <nav className="tabbar" aria-label="Navegación principal">
          <ul>
            {NAV.map(n => (
              <li key={n.id}><button type="button" aria-current={activeNav === n.id ? "page" : undefined} onClick={() => go(n.id)}><Icon name={n.icon} size={24} /><span>{n.label}</span></button></li>
            ))}
          </ul>
        </nav>

        {rules && <Dialog title="Criterios de desempate" onClose={() => setRules(false)}><div className="prose"><p>Si dos o más equipos de un grupo empatan a puntos, se desempata por este orden:</p><ol>{tn.info.tiebreaks.map(t => <li key={t}>{t}</li>)}</ol></div></Dialog>}
      </div>
    </EngineContext.Provider>
  );
}
