"use client";
import { ParkingMaps } from "./ParkingMaps";
import { directionsUrl } from "../lib/directions";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icons";
import { BrandName, CupMark } from "./ui";
import { VenueMap3D } from "./VenueMap3D";
import { Dialog } from "./Dialog";
import { Manager } from "./Manager";
import { Onboarding } from "./Onboarding";
import { LangToggle } from "./LanguageScreen";
import { pick, useLang, type Lang } from "../lib/i18n";
import { isInstalled } from "../lib/platform";
import { useEngine } from "../lib/engine";
import { BRAND, dateParts, infoFor, venueFor, type InfoSpec, type Match, type ResultRow, type Tournament } from "../lib/tournament";
import type { ThemePref } from "../lib/theme";
import type { Dispatch, SetStateAction } from "react";

type InfoItem = { key: string; icon: IconName; title: string; sub: string; body: ReactNode };
function buildInfo(tn: Tournament, lang: Lang, locale: string): InfoItem[] {
  const eu = lang === "eu", t = <T,>(es: T, e: T, fr?: T) => pick(lang, es, e, fr === undefined ? es : fr);
  const i: InfoSpec = infoFor(tn, lang), dp = dateParts(tn.date, locale), items: InfoItem[] = [];
  const kind = (es: string, e: string, fr?: string) => t(es, e, fr);
  items.push({ key: "info", icon: "info", title: kind("Información del torneo", "Txapelketaren informazioa", "Présentation du tournoi"), sub: dp.label + " · " + tn.category, body: <>
    <p>{i.intro}</p>
    <div className="chips"><span>{tn.teams.length} {t("equipos", "talde", "équipes")}</span><span>{dp.short}</span><span>{tn.venueShort}</span><span>{t("Temporada", "Denboraldia", "Saison")} {tn.season}</span></div></> });
  items.push({ key: "ubicacion", icon: "pin", title: t("Ubicación · ", "Kokalekua · ", "Lieu · ") + tn.venueShort, sub: venueFor(tn, lang), body: <>
    {t(<p>El torneo se disputa en las <b>{tn.venue}, Derio</b>. Los partidos se reparten entre los campos C1 y C2 según el calendario.</p>, <p>Txapelketa hemen jokatzen da: <b>{tn.venueEu ?? tn.venue}, Derio</b>. Partidak Z1 eta Z2 zelaien artean banatzen dira, egutegiaren arabera.</p>, <p>Le tournoi se déroule au <b>{venueFor(tn, "fr")}</b>, à Derio. Les matchs se répartissent entre les terrains T1 et T2 selon le programme.</p>)}
    <VenueMap3D fallback={i.venueImage} />
    <div className="dir-row"><a className="btn btn-primary" href={directionsUrl("ibaiondo")} target="_blank" rel="noreferrer"><Icon name="car" size={18} />{t("Cómo llegar", "Nola iritsi", "Itinéraire")}</a><a className="btn btn-ghost" href={tn.mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" size={18} />{t("Ver en Maps", "Ikusi Maps-en", "Voir sur Maps")}</a></div></> });
  if (i.parking?.length) items.push({ key: "parking", icon: "car", title: t("Aparcamiento", "Aparkalekua", "Parking"), sub: t("Dónde aparcar el día del torneo", "Non aparkatu txapelketa egunean", "Où se garer le jour du tournoi"), body: <>
    <ParkingMaps /></> });
  const ng = new Set(tn.teams.map(x => x.group)).size, per = Math.round(tn.teams.length / ng);
  items.push({ key: "formato", icon: "trophy", title: t("Formato del torneo", "Txapelketaren formatua", "Format du tournoi"), sub: t("Puntuación, fases y desempates", "Puntuazioa, faseak eta berdinketa hausteak", "Points, phases et départage"), body: <div className="fmt">
    <div className="fmt-facts">
      <span><Icon name="users" size={20} /><b>{tn.teams.length}</b><small>{t("equipos", "talde", "équipes")}</small></span>
      <span><Icon name="groups" size={20} /><b>{ng}</b><small>{t("grupos", "multzo", "groupes")}</small></span>
      <span><Icon name="clock" size={20} /><b>{i.minutes}&apos;</b><small>{t("por partido", "partida bakoitzeko", "par match")}</small></span>
    </div>
    <h3>{t("Puntos por partido", "Partida bakoitzeko puntuak", "Points par match")}</h3>
    <div className="fmt-points">
      <div className="win"><b>+3</b><small>{t("Victoria", "Garaipena", "Victoire")}</small></div>
      <div className="draw"><b>+1</b><small>{t("Empate", "Berdinketa", "Nul")}</small></div>
      <div className="loss"><b>0</b><small>{t("Derrota", "Porrota", "Défaite")}</small></div>
    </div>
    <h3>{t("Cómo se juega", "Nola jokatzen den", "Déroulement")}</h3>
    <ol className="fmt-flow">
      <li><span className="fmt-n">1</span><div><b>{t("Fase de grupos", "Multzo-fasea", "Phase de groupes")}</b><p>{t(`${ng} grupos de ${per} equipos. Todos juegan contra todos.`, `${per} taldeko ${ng} multzo. Guztiek guztien aurka jokatzen dute.`, `${ng} groupes de ${per} équipes. Chaque équipe affronte toutes les autres de son groupe.`)}</p></div></li>
      <li><span className="fmt-n">2</span><div><b>{t("Fases finales", "Azken faseak", "Phases finales")}</b>
        <div className="fmt-split"><div className="gold"><i className="dot gold" />{t("Fase Oro", "Urrezko fasea", "Phase Or")}<small>{t("1.º y 2.º de cada grupo", "Multzo bakoitzeko 1.a eta 2.a", "1er et 2e de chaque groupe")}</small></div><div className="silver"><i className="dot silver" />{t("Fase Plata", "Zilarrezko fasea", "Phase Argent")}<small>{t("3.º y 4.º de cada grupo", "Multzo bakoitzeko 3.a eta 4.a", "3e et 4e de chaque groupe")}</small></div></div>
        <p>{tn.ko.cf ? t("Cuartos de final, semifinales y final.", "Final-laurdenak, finalerdiak eta finala.", "Quarts de finale, demi-finales et finale.") : t("Semifinales y final.", "Finalerdiak eta finala.", "Demi-finales et finale.")}</p></div></li>
    </ol>
    <div className="fmt-note"><Icon name="switch" size={18} /><span>{t("Los cambios son ", "Aldaketak ", "Les remplacements sont ")}<b>{t("ilimitados", "mugagabeak", "illimités")}</b>{t(" durante todo el partido.", " dira partida osoan zehar.", " pendant tout le match.")}</span></div>
    <div className="fmt-note"><Icon name="ball" size={18} /><span>{i.penaltyRule}</span></div>
    <h3>{t("Desempates de grupo", "Multzoko berdinketa hausteak", "Départage des groupes")}</h3><ol className="fmt-ties">{i.tiebreaks.map(x => <li key={x}>{x}</li>)}</ol></div> });
  const RULE_ICONS: IconName[] = ["shirt", "flag", "hand", "ball"];
  items.push({ key: "normas", icon: "ball", title: t("Normas de juego", "Jokoaren arauak", "Règles du jeu"), sub: t(`Reglas específicas de ${BRAND}`, `${BRAND}-eko arau bereziak`, `Règles propres à la ${BRAND}`), body: <>
    <ul className="rules">{i.rules.map((r, n) => <li key={r}><span className="rule-ico"><Icon name={RULE_ICONS[n] ?? "info"} size={22} /></span><p>{r}</p></li>)}</ul>
    <div className="callout warn"><Icon name="warn" size={20} /><span>{i.warning}</span></div></> });
  items.push({ key: "comidas", icon: "coffee", title: i.wc ? t("Comidas, bar y WC", "Otorduak, taberna eta komunak", "Repas, buvette et WC") : t("Comidas y bar", "Otorduak eta taberna", "Repas et buvette"), sub: i.wc ? t("Servicio de comidas y ubicación de baños", "Otordu-zerbitzua eta komunen kokalekua", "Repas et emplacement des toilettes") : t("Servicio de comidas para equipos y bar para familias", "Taldeentzako otordu-zerbitzua eta familientzako taberna", "Repas pour les équipes et buvette pour les familles"), body: <>
    {i.meals && <>{t(<p>Los equipos participantes disponen de <b>servicio de comidas opcional</b> en Ibaiondo por <b>{i.meals.price}</b>. {i.meals.includes}</p>, <p>Parte hartzen duten taldeek <b>aukerako otordu-zerbitzua</b> dute Ibaiondon. Prezioa: <b>{i.meals.price}</b>. {i.meals.includes}</p>, <p>Les équipes participantes peuvent bénéficier d’un <b>service de repas en option</b> à Ibaiondo, au prix de <b>{i.meals.price}</b>. {i.meals.includes}</p>)}{i.meals.contact && <p>{i.meals.contact}</p>}</>}
    <p>{i.bar}</p>{i.wc && <p><b>{t("Baños / WC:", "Komunak / WC:", "Toilettes :")}</b> {i.wc}</p>}</> });
  return items;
}

type Props = { ms: Match[]; koResults: Record<string, ResultRow>; setKoResults: Dispatch<SetStateAction<Record<string, ResultRow>>>; scores: Record<string, [number, number]>; setScores: Dispatch<SetStateAction<Record<string, [number, number]>>>; changeTeam: () => void; changeTournament: () => void; theme: ThemePref; setTheme: (t: ThemePref) => void };

export function More({ ms, koResults, setKoResults, scores, setScores, changeTeam, changeTournament, theme, setTheme }: Props) {
  const { tn } = useEngine(), { lang, t, locale } = useLang();
  const INFO = buildInfo(tn, lang, locale);
  const [open, setOpen] = useState<string | null>(null);
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [manager, setManager] = useState(false), [install, setInstall] = useState(false), [installed, setInstalled] = useState(true);
  useEffect(() => setInstalled(isInstalled()), []);
  const item = INFO.find(i => i.key === open);
  return (
    <div className="screen">
      <h1 className="screen-title">{t("Información adicional", "Informazio gehigarria", "Infos pratiques")}</h1>
      <p className="note">{t(`Todo lo necesario para el día del torneo ${tn.category}.`, `${tn.category} txapelketaren egunerako behar den guztia.`, `Tout ce qu’il faut savoir pour le jour du tournoi ${tn.category}.`)}</p>
      <div className="menu-card">
        {INFO.map(i => (
          <button key={i.key} type="button" className="menu-item" onClick={() => setOpen(i.key)}>
            <span className="menu-icon"><Icon name={i.icon} /></span><span className="menu-text"><b>{i.title}</b><small>{i.sub}</small></span><Icon name="chevron" size={18} className="icon chev" />
          </button>
        ))}
      </div>

      <h2 className="list-title">{t("Ajustes", "Ezarpenak", "Réglages")}</h2>
      <div className="menu-card">
        <div className="menu-item lang-inline"><span className="menu-icon"><Icon name="langs" /></span><span className="menu-text"><b>{t("Idioma", "Hizkuntza", "Langue")}</b></span><LangToggle bare /></div>
        <div className="menu-item lang-inline" role="group" aria-label={t("Apariencia", "Itxura", "Apparence")}>
          <span className="menu-icon"><Icon name={isDark ? "moon" : "sun"} /></span>
          <span className="menu-text"><b>{t("Apariencia", "Itxura", "Apparence")}</b><small>{isDark ? t("Oscuro", "Iluna", "Sombre") : t("Claro", "Argia", "Clair")}</small></span>
          <div className="lang-toggle theme-toggle" data-pos={isDark ? 1 : 0} style={{ "--n": 2 } as CSSProperties}>
            <div className="lang-toggle-row" role="radiogroup" aria-label={t("Apariencia", "Itxura", "Apparence")}>
              {([["light", "sun", t("Claro", "Argia", "Clair")], ["dark", "moon", t("Oscuro", "Iluna", "Sombre")]] as const).map(([k, ic, lb]) => (
                <button key={k} type="button" role="radio" aria-checked={(isDark ? "dark" : "light") === k} aria-label={lb} title={lb} onClick={() => setTheme(k)}><Icon name={ic} size={20} /></button>
              ))}
              <span className="lang-bar" aria-hidden="true" />
            </div>
          </div>
        </div>
        {!installed && <button type="button" className="menu-item" onClick={() => setInstall(true)}><span className="menu-icon"><Icon name="install" /></span><span className="menu-text"><b>{t("Instalar la app", "Instalatu aplikazioa", "Installer l’application")}</b><small>{t("Añádela a tu pantalla de inicio", "Gehitu zure hasierako pantailara", "Ajoutez-la à votre écran d’accueil")}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>}
        <button type="button" className="menu-item" onClick={changeTournament}><span className="menu-icon"><Icon name="list" /></span><span className="menu-text"><b>{t("Cambiar de torneo", "Aldatu txapelketa", "Changer de tournoi")}</b><small>{t("Volver a la lista de torneos", "Itzuli txapelketen zerrendara", "Revenir à la liste des tournois")}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
        <button type="button" className="menu-item" onClick={changeTeam}><span className="menu-icon"><Icon name="switch" /></span><span className="menu-text"><b>{t("Cambiar de equipo", "Aldatu taldea", "Changer d’équipe")}</b><small>{t("Seleccionar otro participante", "Aukeratu beste talde bat", "Choisir une autre équipe")}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
        <button type="button" className="menu-item" onClick={() => setManager(true)}><span className="menu-icon"><Icon name="lock" /></span><span className="menu-text"><b>{t("Acceso responsables", "Arduradunen sarbidea", "Accès organisateurs")}</b><small>{t("Publicar y editar resultados", "Argitaratu eta editatu emaitzak", "Publier et modifier les scores")}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
      </div>

      <footer className="more-brand"><CupMark size={34} className="brand-grad" /><BrandName as="b" /><small>{tn.category}</small></footer>

      {item && <Dialog title={item.title} onClose={() => setOpen(null)}><div className="prose">{item.body}</div></Dialog>}
      {install && createPortal(<div className="onb-overlay"><Onboarding start="platform" onDone={() => setInstall(false)} onSkip={() => setInstall(false)} /></div>, document.body)}
      {manager && <Manager ms={ms} koResults={koResults} setKoResults={setKoResults} scores={scores} setScores={setScores} onClose={() => setManager(false)} />}
    </div>
  );
}
