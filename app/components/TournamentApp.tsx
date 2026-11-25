"use client";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "./icons";
import { BrandName, Crest, CupMark } from "./ui";
import { Home } from "./Home";
import { Partidos } from "./Partidos";
import { Clasificacion } from "./Clasificacion";
import { Fases } from "./Fases";
import { Team } from "./Team";
import { More } from "./More";
import { Dialog } from "./Dialog";
import { Welcome } from "./Welcome";
import { smooth } from "../lib/smooth";
import { scrollToTop } from "../lib/scroll";
import { useLang } from "../lib/i18n";
import { EngineContext, OpenTeamContext, makeEngine } from "../lib/engine";
import { BRAND, SB_URL, sbHeaders, tournamentTag, type G, type ResultRow, type Tournament } from "../lib/tournament";
import type { useTheme } from "../lib/useTheme";

export type TabId = "inicio" | "partidos" | "clasificacion" | "fases" | "mas" | "equipo";
const TAB_IDS: TabId[] = ["inicio", "partidos", "clasificacion", "fases", "mas"];
const NAV: { id: Exclude<TabId, "equipo">; label: string; icon: IconName }[] = [
  { id: "inicio", label: "Inicio", icon: "home" }, { id: "partidos", label: "Partidos", icon: "ball" }, { id: "clasificacion", label: "Clasificaciones", icon: "table" }, { id: "fases", label: "Fases", icon: "trophy" }, { id: "mas", label: "Más", icon: "more" },
];
const VISITOR_KEY = "derio-cup-visitor";
type Scores = Record<string, [number, number]>;
type Results = Record<string, ResultRow>;

const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k: string) => { try { localStorage.removeItem(k); } catch {} },
};
/** Ruta actual a partir del hash: «#partidos», «#equipo/derio»… */
const routeFromHash = (teams: string[]): { tab: TabId; team: string | null } => {
  const h = window.location.hash.replace("#", "");
  if (h.startsWith("equipo/")) { const id = decodeURIComponent(h.slice(7)); if (teams.includes(id)) return { tab: "equipo", team: id }; }
  return { tab: TAB_IDS.includes(h as TabId) ? (h as TabId) : "inicio", team: null };
};

export function TournamentApp({ tn, onExit, themeCtl }: { tn: Tournament; onExit: () => void; themeCtl: ReturnType<typeof useTheme> }) {
  const engine = useMemo(() => makeEngine(tn), [tn]);
  // La edición original conserva sus claves antiguas para no perder la elección de equipo.
  const teamKey = tn.idPrefix ? "derio-cup-team:" + tn.id : "derio-cup-team", cacheKey = "derio-cup-cache-v2" + (tn.idPrefix ? ":" + tn.id : "");

  const [selected, setSelected] = useState<string | null>(() => store.get(teamKey)), [choosing, setChoosing] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>(() => routeFromHash(tn.teams.map(t => t.id)).tab), [viewTeam, setViewTeam] = useState<string | null>(() => routeFromHash(tn.teams.map(t => t.id)).team), [group, setGroup] = useState<G>("A"), [phase, setPhase] = useState<"oro" | "plata">("oro");
  const [scores, setScores] = useState<Scores>({}), [koResults, setKoResults] = useState<Results>({});
  const [fanCounts, setFanCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false), [offline, setOffline] = useState(false), [syncing, setSyncing] = useState(false), [lastSync, setLastSync] = useState<Date | null>(null);
  const [rules, setRules] = useState(false), [fairplay, setFairplay] = useState(false);
  const mainRef = useRef<HTMLElement>(null), firstTab = useRef(true), tabRef = useRef<TabId>(tab), fromTab = useRef<TabId>("inicio");
  const { theme, resolved, setTheme, toggle } = themeCtl, { lang, t, locale } = useLang();
  const navLabel: Record<string, string> = lang === "eu" ? { inicio: "Hasiera", partidos: "Partidak", clasificacion: "Sailkapenak", fases: "Faseak", mas: "Info" } : { mas: "Info" };

  /* ---- caché del último estado conocido ---- */
  useEffect(() => {
    try { const c = JSON.parse(store.get(cacheKey) || "null"); if (c) { setScores(c.scores || {}); setKoResults(c.ko || {}); setLoaded(true); } } catch {}
  }, [cacheKey]);

  /* ---- navegación: cada pantalla es un paso del historial, así que Atrás (móvil/gesto) vuelve a la anterior ---- */
  useEffect(() => { tabRef.current = tab; }, [tab]);
  useEffect(() => {
    const ids = tn.teams.map(t => t.id);
    const on = () => { const r = routeFromHash(ids); setTab(r.tab); setViewTeam(r.team); };
    window.addEventListener("popstate", on); return () => window.removeEventListener("popstate", on);
  }, [tn]);
  const go = useCallback((t: TabId, o?: { group?: G; phase?: "oro" | "plata"; team?: string }) => {
    if (o?.group) setGroup(o.group);
    if (o?.phase) setPhase(o.phase);
    if (t === "equipo" && o?.team) { if (tabRef.current !== "equipo") fromTab.current = tabRef.current; setViewTeam(o.team); }
    const hash = t === "inicio" ? "" : t === "equipo" && o?.team ? "#equipo/" + encodeURIComponent(o.team) : "#" + t;
    if (window.location.hash !== hash) {
      // «dc» = posición dentro de la app; permite saber si «Volver» puede retroceder sin salir de ella.
      history.pushState({ dc: ((history.state?.dc as number | undefined) ?? 0) + 1 }, "", window.location.pathname + window.location.search + hash);
      setTab(t); setViewTeam(t === "equipo" ? o?.team ?? null : null);
    }
  }, []);
  const openTeam = useCallback((id: string) => go("equipo", { team: id }), [go]);
  /** «Volver»: al paso anterior si venimos de dentro de la app; si no, a Inicio. */
  const back = useCallback(() => { if (((history.state?.dc as number | undefined) ?? 0) > 0) history.back(); else go("inicio"); }, [go]);
  useEffect(() => {
    if (firstTab.current) { firstTab.current = false; return; }
    scrollToTop();
    mainRef.current?.focus({ preventScroll: true });
  }, [tab, viewTeam]);

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
  // Un registro por visitante y torneo: la afición de cada torneo se cuenta aparte.
  const registerFan = async (id: string) => {
    let vid = store.get(VISITOR_KEY);
    if (!vid) { vid = crypto.randomUUID(); store.set(VISITOR_KEY, vid); }
    try { await fetch(SB_URL + "/rest/v1/derio_cup_fans?on_conflict=visitor_id", { method: "POST", headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ visitor_id: tn.idPrefix ? vid + ":" + tn.id : vid, team_id: engine.fanKey(id), updated_at: new Date().toISOString() }) }); } catch {}
  };
  const pick = (id: string) => {
    if (choosing) return;
    setChoosing(id);
    registerFan(id).then(loadFans);
    setTimeout(() => { store.set(teamKey, id); smooth(() => { setSelected(id); setChoosing(null); setFairplay(true); }); scrollToTop(); history.replaceState(null, "", window.location.pathname); setTab("inicio"); }, 220);
  };
  const neutral = () => { store.set(teamKey, "neutral"); setSelected("neutral"); setFairplay(true); scrollToTop(); setTab("inicio"); };
  const changeTeam = () => { store.del(teamKey); setSelected(null); };
  const exit = () => { history.replaceState(null, "", window.location.pathname); onExit(); };

  const validTeam = selected === "neutral" || (!!selected && tn.teams.some(t => t.id === selected));
  if (!validTeam) return <EngineContext.Provider value={engine}><Welcome choosing={choosing} onPick={pick} onNeutral={neutral} onBack={exit} /></EngineContext.Provider>;
  const mine = selected!;

  const activeNav = tab === "equipo" ? (viewTeam === mine ? "inicio" : fromTab.current) : tab;
  return (
    <EngineContext.Provider value={engine}>
      <OpenTeamContext.Provider value={openTeam}>
      <div className="app">
        <a className="skip" href="#contenido" onClick={e => { e.preventDefault(); mainRef.current?.focus(); }}>{t("Saltar al contenido", "Joan edukira")}</a>
        <header className="app-header">
          <div className="app-header-in">
            <button type="button" className="brand" onClick={() => go("inicio")} aria-label={`${BRAND} ${tn.category}, ${t("ir al inicio", "joan hasierara")}`}>
              <CupMark size={30} className="brand-grad" />
              <span><BrandName as="b" /><small>{tournamentTag(tn, locale)}</small></span>
            </button>
            <div className="header-actions">
              {mine !== "neutral" && <button type="button" className="icon-btn avatar" aria-label={t("Mi equipo: ", "Nire taldea: ") + engine.T(mine).name} onClick={() => go("equipo", { team: mine })}><Crest id={mine} size={26} /></button>}
              <button type="button" className={"icon-btn" + (syncing ? " is-spinning" : "")} aria-label={t("Actualizar resultados", "Eguneratu emaitzak")} onClick={() => load(true)}><Icon name="refresh" size={20} /></button>
              <button type="button" className="icon-btn" aria-label={resolved === "dark" ? t("Cambiar a modo claro", "Aldatu modu argira") : t("Cambiar a modo oscuro", "Aldatu modu ilunera")} onClick={toggle}><Icon name={resolved === "dark" ? "sun" : "moon"} size={20} /></button>
            </div>
          </div>
        </header>

        {offline && <div className="banner" role="status"><Icon name="wifi" size={18} /><span>{t("Sin conexión. Mostrando los últimos datos guardados.", "Konexiorik ez. Gordetako azken datuak erakusten.")}</span><button type="button" onClick={() => load(true)}>{t("Reintentar", "Saiatu berriro")}</button></div>}

        <main id="contenido" ref={mainRef} tabIndex={-1} className="main" aria-busy={!loaded}>
          {tab === "inicio" && <Home ms={ms} koResults={koResults} selected={mine} fanCounts={fanCounts} loaded={loaded} go={go} />}
          {tab === "partidos" && <Partidos ms={ms} koResults={koResults} />}
          {tab === "clasificacion" && <Clasificacion group={group} setGroup={setGroup} ms={ms} onRules={() => setRules(true)} />}
          {tab === "fases" && <Fases kind={phase} setKind={setPhase} ms={ms} koResults={koResults} />}
          {tab === "equipo" && viewTeam && <Team key={viewTeam} id={viewTeam} ms={ms} koResults={koResults} back={back} isMine={viewTeam === mine} goGroup={g => go("clasificacion", { group: g })} />}
          {tab === "mas" && <More ms={ms} koResults={koResults} setKoResults={setKoResults} scores={scores} setScores={setScores} changeTeam={changeTeam} changeTournament={exit} theme={theme} setTheme={setTheme} />}
          {lastSync && tab !== "mas" && <p className="sync-note">{t("Actualizado a las ", "Eguneratuta: ")}{lastSync.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" })}</p>}
        </main>

        {createPortal(<nav className="tabbar" aria-label={t("Navegación principal", "Nabigazio nagusia")}>
          <ul>
            {NAV.map(n => (
              <li key={n.id}><button type="button" aria-current={activeNav === n.id ? "page" : undefined} onClick={() => go(n.id)}>{n.id === "fases" ? <CupMark size={22} className="tab-cup" /> : <Icon name={n.icon} size={24} />}<span>{navLabel[n.id] ?? n.label}</span></button></li>
            ))}
          </ul>
        </nav>, document.body)}

        {fairplay && <Dialog title={t("¡ANIMA A TU EQUIPO!", "ANIMATU ZURE TALDEA!")} onClose={() => setFairplay(false)} compact centered>
          <div className="fairplay">
            <span className="fairplay-ico" role="img" aria-label={t("Familias animando juntas", "Familiak elkarrekin animatzen")}><i className="fp-arm l" /><i className="fp-arm r" /><i className="fp-body" /></span>
            <p>{t("Lo importante no es el resultado, es que los niños y niñas disfruten del día.", "Garrantzitsuena ez da emaitza, haurrek egunaz gozatzea baizik.")}</p>
            <p>{t("Los insultos y faltas de respeto desde la grada podrán ser motivo de expulsión de las instalaciones.", "Harmailatik egindako irainak eta errespetu faltak instalazioetatik kanporatzeko arrazoi izan daitezke.")}</p>
            <p className="fairplay-key">{t("RESPETA al rival,", "ERRESPETATU aurkaria,")}<br />{t("RESPETA a los árbitros,", "ERRESPETATU epaileak,")}<br />{t("RESPETA los valores de este deporte.", "ERRESPETATU kirol honen balioak.")}</p>
            <button type="button" className="btn btn-primary block" onClick={() => setFairplay(false)}>{t("Entendido", "Ados")}</button>
          </div>
        </Dialog>}
        {rules && <Dialog title={t("Criterios de desempate", "Berdinketa-irizpideak")} onClose={() => setRules(false)}><div className="prose"><p>{t("Si dos o más equipos de un grupo empatan a puntos, se desempata por este orden:", "Multzo bateko bi talde edo gehiago puntuetan berdintzen badira, ordena honetan askatzen da berdinketa:")}</p><ol>{((lang === "eu" && tn.infoEu) || tn.info).tiebreaks.map(x => <li key={x}>{x}</li>)}</ol></div></Dialog>}
      </div>
      </OpenTeamContext.Provider>
    </EngineContext.Provider>
  );
}
