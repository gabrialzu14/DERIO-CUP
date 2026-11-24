"use client";
import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { CupMark, Tabs } from "./ui";
import { Dialog } from "./Dialog";
import { Manager } from "./Manager";
import { useEngine } from "../lib/engine";
import { BRAND, dateParts, type InfoSpec, type Match, type ResultRow, type Tournament } from "../lib/tournament";
import type { ThemePref } from "../lib/theme";
import type { Dispatch, SetStateAction } from "react";

type InfoItem = { key: string; icon: IconName; title: string; sub: string; body: ReactNode };
function buildInfo(tn: Tournament): InfoItem[] {
  const i: InfoSpec = tn.info, dp = dateParts(tn.date), items: InfoItem[] = [];
  items.push({ key: "info", icon: "info", title: "Información del torneo", sub: dp.label + " · " + tn.category, body: <>
    <p>{i.intro}</p>
    <div className="chips"><span>{tn.teams.length} equipos</span><span>{dp.short}</span><span>{tn.venueShort}</span><span>Temporada {tn.season}</span></div></> });
  items.push({ key: "ubicacion", icon: "pin", title: "Ubicación · " + tn.venueShort, sub: tn.venue, body: <>
    <p>El torneo se disputa en las <b>{tn.venue}, Derio</b>. Los partidos se reparten entre Campo 1 y Campo 2 según el calendario.</p>
    {i.venueImage && /* eslint-disable-next-line @next/next/no-img-element */ <img className="venue-img" src={i.venueImage.src} alt={i.venueImage.alt} loading="lazy" />}
    <a className="btn btn-primary block" href={tn.mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" size={18} />Abrir en Maps</a></> });
  if (i.parking?.length) items.push({ key: "parking", icon: "car", title: "Aparcamiento", sub: "Dónde aparcar el día del torneo", body: <>
    {i.parking.map(p => <figure key={p.src} className="figure">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="venue-img wide" src={p.src} alt={p.alt} loading="lazy" /><figcaption>{p.title}</figcaption></figure>)}</> });
  items.push({ key: "formato", icon: "trophy", title: "Formato del torneo", sub: "Grupos, fases finales y desempates", body: <>
    <div className="callout"><b>{i.minutes} minutos</b><span>Todos los partidos · sin descanso</span></div>
    <p>Fase de grupos y dos fases finales: <b>Fase Oro</b> y <b>Fase Plata</b>. Victoria: 3 puntos · empate: 1 · derrota: 0. Los cambios son <b>ilimitados</b> durante todo el partido.</p>
    <p>{i.penaltyRule}</p>
    <h3>Desempates de grupo</h3><ol>{i.tiebreaks.map(t => <li key={t}>{t}</li>)}</ol></> });
  items.push({ key: "normas", icon: "ball", title: "Normas de juego", sub: "Reglas específicas de " + BRAND, body: <>
    {i.rules.map(r => <p key={r}>{r}</p>)}<div className="callout warn">{i.warning}</div></> });
  items.push({ key: "comidas", icon: "coffee", title: i.wc ? "Comidas, bar y WC" : "Comidas y bar", sub: i.wc ? "Servicio de comidas y ubicación de baños" : "Servicio de comidas para equipos y bar para familias", body: <>
    {i.meals && <><p>Los equipos participantes disponen de <b>servicio de comidas opcional</b> en Ibaiondo por <b>{i.meals.price}</b>. {i.meals.includes}</p>{i.meals.contact && <p>{i.meals.contact}</p>}</>}
    <p>{i.bar}</p>{i.wc && <p><b>Baños / WC:</b> {i.wc}</p>}</> });
  return items;
}

type Props = { ms: Match[]; koResults: Record<string, ResultRow>; setKoResults: Dispatch<SetStateAction<Record<string, ResultRow>>>; scores: Record<string, [number, number]>; setScores: Dispatch<SetStateAction<Record<string, [number, number]>>>; changeTeam: () => void; changeTournament: () => void; theme: ThemePref; setTheme: (t: ThemePref) => void };

export function More({ ms, koResults, setKoResults, scores, setScores, changeTeam, changeTournament, theme, setTheme }: Props) {
  const { tn } = useEngine();
  const INFO = buildInfo(tn);
  const [open, setOpen] = useState<string | null>(null);
  const [manager, setManager] = useState(false);
  const item = INFO.find(i => i.key === open);
  return (
    <div className="screen">
      <h1 className="screen-title">Más</h1>
      <p className="note">Todo lo necesario para el día del torneo {tn.category}.</p>
      <div className="menu-card">
        {INFO.map(i => (
          <button key={i.key} type="button" className="menu-item" onClick={() => setOpen(i.key)}>
            <span className="menu-icon"><Icon name={i.icon} /></span><span className="menu-text"><b>{i.title}</b><small>{i.sub}</small></span><Icon name="chevron" size={18} className="icon chev" />
          </button>
        ))}
      </div>

      <h2 className="list-title">Ajustes</h2>
      <div className="menu-card">
        <div className="menu-item static">
          <span className="menu-icon"><Icon name="sun" /></span><span className="menu-text"><b>Apariencia</b><small>Sigue el sistema o fija un modo</small></span>
        </div>
        <div className="menu-pad"><Tabs label="Apariencia" idPrefix="theme" value={theme} onChange={setTheme} items={[{ key: "system", label: "Sistema" }, { key: "light", label: "Claro" }, { key: "dark", label: "Oscuro" }]} /></div>
        <button type="button" className="menu-item" onClick={changeTournament}><span className="menu-icon"><Icon name="list" /></span><span className="menu-text"><b>Cambiar de torneo</b><small>Volver a la lista de torneos</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
        <button type="button" className="menu-item" onClick={changeTeam}><span className="menu-icon"><Icon name="switch" /></span><span className="menu-text"><b>Cambiar de equipo</b><small>Seleccionar otro participante</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
        <button type="button" className="menu-item" onClick={() => setManager(true)}><span className="menu-icon"><Icon name="lock" /></span><span className="menu-text"><b>Acceso responsables</b><small>Publicar y editar resultados</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
      </div>

      <footer className="more-brand"><CupMark size={34} /><b>{BRAND}</b><small>{tn.category}</small></footer>

      {item && <Dialog title={item.title} onClose={() => setOpen(null)}><div className="prose">{item.body}</div></Dialog>}
      {manager && <Manager ms={ms} koResults={koResults} setKoResults={setKoResults} scores={scores} setScores={setScores} onClose={() => setManager(false)} />}
    </div>
  );
}
