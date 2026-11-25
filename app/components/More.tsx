"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icons";
import { BrandName, CupMark, Tabs } from "./ui";
import { Dialog } from "./Dialog";
import { Manager } from "./Manager";
import { Onboarding } from "./Onboarding";
import { FlagEs, FlagEu } from "./LanguageScreen";
import { useLang, type Lang } from "../lib/i18n";
import { isInstalled } from "../lib/platform";
import { useEngine } from "../lib/engine";
import { BRAND, dateParts, type InfoSpec, type Match, type ResultRow, type Tournament } from "../lib/tournament";
import type { ThemePref } from "../lib/theme";
import type { Dispatch, SetStateAction } from "react";

type InfoItem = { key: string; icon: IconName; title: string; sub: string; body: ReactNode };
function buildInfo(tn: Tournament, lang: Lang, locale: string): InfoItem[] {
  const eu = lang === "eu", t = <T,>(es: T, e: T) => (eu ? e : es);
  const i: InfoSpec = (eu && tn.infoEu) || tn.info, dp = dateParts(tn.date, locale), items: InfoItem[] = [];
  const kind = (es: string, e: string) => t(es, e);
  items.push({ key: "info", icon: "info", title: kind("Información del torneo", "Txapelketaren informazioa"), sub: dp.label + " · " + tn.category, body: <>
    <p>{i.intro}</p>
    <div className="chips"><span>{tn.teams.length} {t("equipos", "talde")}</span><span>{dp.short}</span><span>{tn.venueShort}</span><span>{t("Temporada", "Denboraldia")} {tn.season}</span></div></> });
  items.push({ key: "ubicacion", icon: "pin", title: t("Ubicación · ", "Kokalekua · ") + tn.venueShort, sub: eu ? tn.venueEu ?? tn.venue : tn.venue, body: <>
    {eu ? <p>Txapelketa <b>{tn.venueEu ?? tn.venue}, Derion</b> jokatzen da. Partidak 1. eta 2. zelaien artean banatzen dira, egutegiaren arabera.</p> : <p>El torneo se disputa en las <b>{tn.venue}, Derio</b>. Los partidos se reparten entre Campo 1 y Campo 2 según el calendario.</p>}
    {i.venueImage && /* eslint-disable-next-line @next/next/no-img-element */ <img className="venue-img" src={i.venueImage.src} alt={i.venueImage.alt} loading="lazy" />}
    <a className="btn btn-primary block" href={tn.mapsUrl} target="_blank" rel="noreferrer"><Icon name="pin" size={18} />{t("Abrir en Maps", "Ireki Maps-en")}</a></> });
  if (i.parking?.length) items.push({ key: "parking", icon: "car", title: t("Aparcamiento", "Aparkalekua"), sub: t("Dónde aparcar el día del torneo", "Non aparkatu txapelketa egunean"), body: <>
    {i.parking.map(p => <figure key={p.src} className="figure">{/* eslint-disable-next-line @next/next/no-img-element */}<img className="venue-img wide" src={p.src} alt={p.alt} loading="lazy" /><figcaption>{p.title}</figcaption></figure>)}</> });
  const ng = new Set(tn.teams.map(x => x.group)).size, per = Math.round(tn.teams.length / ng);
  items.push({ key: "formato", icon: "trophy", title: t("Formato del torneo", "Txapelketaren formatua"), sub: t("Puntuación, fases y desempates", "Puntuazioa, faseak eta berdinketak"), body: <div className="fmt">
    <div className="fmt-facts">
      <span><Icon name="users" size={20} /><b>{tn.teams.length}</b><small>{t("equipos", "talde")}</small></span>
      <span><Icon name="groups" size={20} /><b>{ng}</b><small>{t("grupos", "multzo")}</small></span>
      <span><Icon name="clock" size={20} /><b>{i.minutes}&apos;</b><small>{t("por partido", "partida bakoitzeko")}</small></span>
    </div>
    <h3>{t("Puntos por partido", "Puntuak partida bakoitzeko")}</h3>
    <div className="fmt-points">
      <div className="win"><b>+3</b><small>{t("Victoria", "Garaipena")}</small></div>
      <div className="draw"><b>+1</b><small>{t("Empate", "Berdinketa")}</small></div>
      <div className="loss"><b>0</b><small>{t("Derrota", "Porrota")}</small></div>
    </div>
    <h3>{t("Cómo se juega", "Nola jokatzen den")}</h3>
    <ol className="fmt-flow">
      <li><span className="fmt-n">1</span><div><b>{t("Fase de grupos", "Multzo-fasea")}</b><p>{t(`${ng} grupos de ${per} equipos. Todos juegan contra todos.`, `${per} taldeko ${ng} multzo. Guztiek guztien aurka jokatzen dute.`)}</p></div></li>
      <li><span className="fmt-n">2</span><div><b>{t("Fases finales", "Azken faseak")}</b>
        <div className="fmt-split"><div className="gold"><i className="dot gold" />{t("Fase Oro", "Urrezko fasea")}<small>{t("1.º y 2.º de cada grupo", "Multzo bakoitzeko 1. eta 2.")}</small></div><div className="silver"><i className="dot silver" />{t("Fase Plata", "Zilarrezko fasea")}<small>{t("3.º y 4.º de cada grupo", "Multzo bakoitzeko 3. eta 4.")}</small></div></div>
        <p>{t("Cuartos de final, semifinales y final.", "Final-laurdenak, finalerdiak eta finala.")}</p></div></li>
    </ol>
    <div className="fmt-note"><Icon name="switch" size={18} /><span>{t("Los cambios son ", "Aldaketak ")}<b>{t("ilimitados", "mugagabeak")}</b>{t(" durante todo el partido.", " dira partida osoan zehar.")}</span></div>
    <div className="fmt-note"><Icon name="ball" size={18} /><span>{i.penaltyRule}</span></div>
    <h3>{t("Desempates de grupo", "Multzoko berdinketak")}</h3><ol className="fmt-ties">{i.tiebreaks.map(x => <li key={x}>{x}</li>)}</ol></div> });
  const RULE_ICONS: IconName[] = ["shirt", "flag", "hand", "ball"];
  items.push({ key: "normas", icon: "ball", title: t("Normas de juego", "Jokoaren arauak"), sub: t("Reglas específicas de ", "Arau espezifikoak: ") + BRAND, body: <>
    <ul className="rules">{i.rules.map((r, n) => <li key={r}><span className="rule-ico"><Icon name={RULE_ICONS[n] ?? "info"} size={22} /></span><p>{r}</p></li>)}</ul>
    <div className="callout warn"><Icon name="warn" size={20} /><span>{i.warning}</span></div></> });
  items.push({ key: "comidas", icon: "coffee", title: i.wc ? t("Comidas, bar y WC", "Otorduak, taberna eta komunak") : t("Comidas y bar", "Otorduak eta taberna"), sub: i.wc ? t("Servicio de comidas y ubicación de baños", "Otordu-zerbitzua eta komunen kokalekua") : t("Servicio de comidas para equipos y bar para familias", "Taldeentzako otordu-zerbitzua eta familientzako taberna"), body: <>
    {i.meals && <>{eu ? <p>Parte hartzen duten taldeek Ibaiondon <b>aukerako otordu-zerbitzua</b> dute <b>{i.meals.price}</b>ren truke. {i.meals.includes}</p> : <p>Los equipos participantes disponen de <b>servicio de comidas opcional</b> en Ibaiondo por <b>{i.meals.price}</b>. {i.meals.includes}</p>}{i.meals.contact && <p>{i.meals.contact}</p>}</>}
    <p>{i.bar}</p>{i.wc && <p><b>{t("Baños / WC:", "Komunak / WC:")}</b> {i.wc}</p>}</> });
  return items;
}

/** Ajuste de idioma: un botón que abre una ventana pequeña con las dos opciones. */
function LangPopup({ onClose }: { onClose: () => void }) {
  const { lang, setLang, t } = useLang();
  const opts: { key: Lang; name: string; flag: ReactNode }[] = [{ key: "es", name: "Castellano", flag: <FlagEs /> }, { key: "eu", name: "Euskara", flag: <FlagEu /> }];
  return (
    <Dialog title={t("Idioma", "Hizkuntza")} onClose={onClose} compact>
      <div className="lang-list" role="radiogroup" aria-label={t("Idioma", "Hizkuntza")}>
        {opts.map(o => (
          <button key={o.key} type="button" role="radio" aria-checked={lang === o.key} className={"lang-row" + (lang === o.key ? " is-on" : "")} onClick={() => { setLang(o.key); onClose(); }}>
            {o.flag}<b>{o.name}</b><span className="lang-check" aria-hidden="true">{lang === o.key && <Icon name="check" size={16} />}</span>
          </button>
        ))}
      </div>
    </Dialog>
  );
}

type Props = { ms: Match[]; koResults: Record<string, ResultRow>; setKoResults: Dispatch<SetStateAction<Record<string, ResultRow>>>; scores: Record<string, [number, number]>; setScores: Dispatch<SetStateAction<Record<string, [number, number]>>>; changeTeam: () => void; changeTournament: () => void; theme: ThemePref; setTheme: (t: ThemePref) => void };

export function More({ ms, koResults, setKoResults, scores, setScores, changeTeam, changeTournament, theme, setTheme }: Props) {
  const { tn } = useEngine(), { lang, t, locale } = useLang();
  const INFO = buildInfo(tn, lang, locale), [langOpen, setLangOpen] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [manager, setManager] = useState(false), [install, setInstall] = useState(false), [installed, setInstalled] = useState(true);
  useEffect(() => setInstalled(isInstalled()), []);
  const item = INFO.find(i => i.key === open);
  return (
    <div className="screen">
      <h1 className="screen-title">{t("Información adicional", "Informazio gehigarria")}</h1>
      <p className="note">{t(`Todo lo necesario para el día del torneo ${tn.category}.`, `${tn.category} txapelketaren egunerako behar den guztia.`)}</p>
      <div className="menu-card">
        {INFO.map(i => (
          <button key={i.key} type="button" className="menu-item" onClick={() => setOpen(i.key)}>
            <span className="menu-icon"><Icon name={i.icon} /></span><span className="menu-text"><b>{i.title}</b><small>{i.sub}</small></span><Icon name="chevron" size={18} className="icon chev" />
          </button>
        ))}
      </div>

      <h2 className="list-title">{t("Ajustes", "Ezarpenak")}</h2>
      <div className="menu-card">
        <button type="button" className="menu-item" onClick={() => setLangOpen(true)}><span className="menu-icon"><Icon name="langs" /></span><span className="menu-text"><b>{t("Idioma", "Hizkuntza")}</b><small>{lang === "eu" ? "Euskara" : "Castellano"}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
        <div className="menu-item static">
          <span className="menu-icon"><Icon name="sun" /></span><span className="menu-text"><b>{t("Apariencia", "Itxura")}</b><small>{t("Sigue el sistema o fija un modo", "Sistemaren araberakoa edo modu finkoa")}</small></span>
        </div>
        <div className="menu-pad"><Tabs label={t("Apariencia", "Itxura")} idPrefix="theme" value={theme} onChange={setTheme} items={[{ key: "system", label: t("Sistema", "Sistema") }, { key: "light", label: t("Claro", "Argia") }, { key: "dark", label: t("Oscuro", "Iluna") }]} /></div>
        {!installed && <button type="button" className="menu-item" onClick={() => setInstall(true)}><span className="menu-icon"><Icon name="install" /></span><span className="menu-text"><b>{t("Instalar la app", "Instalatu aplikazioa")}</b><small>{t("Añádela a tu pantalla de inicio", "Gehitu zure hasierako pantailara")}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>}
        <button type="button" className="menu-item" onClick={changeTournament}><span className="menu-icon"><Icon name="list" /></span><span className="menu-text"><b>{t("Cambiar de torneo", "Aldatu txapelketa")}</b><small>{t("Volver a la lista de torneos", "Itzuli txapelketen zerrendara")}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
        <button type="button" className="menu-item" onClick={changeTeam}><span className="menu-icon"><Icon name="switch" /></span><span className="menu-text"><b>{t("Cambiar de equipo", "Aldatu taldea")}</b><small>{t("Seleccionar otro participante", "Aukeratu beste talde bat")}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
        <button type="button" className="menu-item" onClick={() => setManager(true)}><span className="menu-icon"><Icon name="lock" /></span><span className="menu-text"><b>{t("Acceso responsables", "Arduradunen sarbidea")}</b><small>{t("Publicar y editar resultados", "Argitaratu eta editatu emaitzak")}</small></span><Icon name="chevron" size={18} className="icon chev" /></button>
      </div>

      <footer className="more-brand"><CupMark size={34} className="brand-grad" /><BrandName as="b" /><small>{tn.category}</small></footer>

      {langOpen && <LangPopup onClose={() => setLangOpen(false)} />}
      {item && <Dialog title={item.title} onClose={() => setOpen(null)}><div className="prose">{item.body}</div></Dialog>}
      {install && createPortal(<div className="onb-overlay"><Onboarding start="platform" onDone={() => setInstall(false)} onSkip={() => setInstall(false)} /></div>, document.body)}
      {manager && <Manager ms={ms} koResults={koResults} setKoResults={setKoResults} scores={scores} setScores={setScores} onClose={() => setManager(false)} />}
    </div>
  );
}
