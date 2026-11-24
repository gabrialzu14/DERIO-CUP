"use client";
import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";
import { CupMark, Tabs } from "./ui";
import { Dialog } from "./Dialog";
import { Manager } from "./Manager";
import { EVENT, type Match, type ResultRow } from "../lib/tournament";
import type { ThemePref } from "../lib/theme";
import type { Dispatch, SetStateAction } from "react";

export const TIEBREAKS = ["Puntos totales", "Puntos en partidos directos", "Diferencia de goles en partidos directos", "Goles a favor en partidos directos", "Diferencia de goles total", "Goles a favor total", "Tanda de penaltis"];

const INFO: { key: string; icon: IconName; title: string; sub: string; body: ReactNode }[] = [
  { key: "info", icon: "info", title: "Información del torneo", sub: EVENT.dateLabel + " · " + EVENT.category, body: <>
    <p>{EVENT.name} es un torneo de fútbol base organizado por el CD Derio para la categoría {EVENT.category}, temporada 2026/27.</p>
    <div className="chips"><span>16 equipos</span><span>{EVENT.dateShort}</span><span>{EVENT.venueShort}</span></div></> },
  { key: "ubicacion", icon: "pin", title: "Ubicación · Ibaiondo", sub: EVENT.venue, body: <>
    <p>El torneo se disputa en las <b>{EVENT.venue}, Derio</b>. Los partidos se reparten entre Campo 1 y Campo 2 según el calendario.</p>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="venue-img" src="/ibaiondo-campo.jpg" alt="Plano aéreo de los campos de Ibaiondo" loading="lazy" />
    <a className="btn btn-primary block" href={EVENT.mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" size={18} />Abrir en Maps</a></> },
  { key: "formato", icon: "trophy", title: "Formato del torneo", sub: "Grupos, fases finales y desempates", body: <>
    <div className="callout"><b>20 minutos</b><span>Todos los partidos · sin descanso</span></div>
    <p>Fase de grupos y dos fases finales: <b>Fase Oro</b> y <b>Fase Plata</b>. Victoria: 3 puntos · empate: 1 · derrota: 0. Los cambios son <b>ilimitados</b> durante todo el partido.</p>
    <p>En las fases finales, si hay empate se lanzan <b>3 penaltis por equipo</b>. Solo pueden lanzar inicialmente los 7 jugadores que hayan terminado el encuentro y debe mantenerse el portero que lo haya finalizado. Si continúa el empate, podrán lanzar los jugadores del banquillo.</p>
    <h3>Desempates de grupo</h3><ol>{TIEBREAKS.map(t => <li key={t}>{t}</li>)}</ol></> },
  { key: "normas", icon: "ball", title: "Normas de juego", sub: "Reglas específicas de " + EVENT.name, body: <>
    <p>El equipo designado como <b>visitante</b> deberá cambiar de equipación si existe coincidencia. Es obligatorio acudir con segunda equipación.</p>
    <p>Fuera de juego desde la línea de 13 m. El área de penalti es el área pequeña delimitada.</p>
    <p>La cesión al portero se sanciona con falta directa desde la línea de 13 m, sin barrera. <b>Todas las faltas son directas.</b></p>
    <p>Cada equipo debe traer sus propios balones para calentar.</p>
    <div className="callout warn">Las conductas antideportivas pueden suponer la eliminación por decisión de la organización.</div></> },
  { key: "comidas", icon: "coffee", title: "Comidas, bar y WC", sub: "Servicio de comidas y ubicación de baños", body: <>
    <p>Los equipos participantes disponen de servicio de comidas opcional en Ibaiondo por <b>8 €</b>. Incluye hamaiketako, plato de pasta, pan, agua y postre.</p>
    <p>Para las familias habrá servicio de bar con pintxos y bocadillos durante todo el torneo.</p>
    <p><b>Baños / WC:</b> están ubicados en la parte trasera de la grada.</p></> },
];

type Props = { ms: Match[]; koResults: Record<string, ResultRow>; setKoResults: Dispatch<SetStateAction<Record<string, ResultRow>>>; scores: Record<string, [number, number]>; setScores: Dispatch<SetStateAction<Record<string, [number, number]>>>; changeTeam: () => void; theme: ThemePref; setTheme: (t: ThemePref) => void };

export function More({ ms, koResults, setKoResults, scores, setScores, changeTeam, theme, setTheme }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [manager, setManager] = useState(false);
  const item = INFO.find(i => i.key === open);
  return (
    <div className="screen">
      <h1 className="screen-title">Más</h1>
      <p className="note">Todo lo necesario para el día del torneo.</p>
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
        <button type="button" className="menu-item" onClick={changeTeam}><span className="menu-icon"><Icon name="switch" /></span><span className="menu-text"><b>Cambiar de equipo</b><small>Seleccionar otro participante</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
        <button type="button" className="menu-item" onClick={() => setManager(true)}><span className="menu-icon"><Icon name="lock" /></span><span className="menu-text"><b>Acceso responsables</b><small>Publicar y editar resultados</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
      </div>

      <footer className="more-brand"><CupMark size={34} /><b>{EVENT.name}</b><small>{EVENT.category}</small></footer>

      {item && <Dialog title={item.title} onClose={() => setOpen(null)}><div className="prose">{item.body}</div></Dialog>}
      {manager && <Manager ms={ms} koResults={koResults} setKoResults={setKoResults} scores={scores} setScores={setScores} onClose={() => setManager(false)} />}
    </div>
  );
}
