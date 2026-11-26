/* Torneos de la app. Para añadir uno nuevo: copia un bloque, cambia los datos y
   (si hay escudos nuevos) deja los PNG en /public. Pasada su fecha, el torneo
   desaparece solo de la pantalla de inicio. */
import type { GroupMatchDef, InfoSpec, Team, Tournament } from "./tournament";

const MAPS = "https://maps.app.goo.gl/q2zy9gfVQ1dPcaqS6";
const VENUE = "Instalaciones Deportivas de Ibaiondo", VENUE_EU = "Ibaiondoko Kirol Instalazioak", VENUE_FR = "Complexe sportif d’Ibaiondo";
const T = (id: string, name: string, group: Team["group"], extra: Partial<Team> = {}): Team => ({ id, name, group, ...extra });
const SANSE = { crest: "Arrupe Chaminade", pick: "Arrupe Chaminade • Sanse" }, SANSE_B = { crest: "Arrupe Chaminade", pick: "Arrupe Chaminade B • Sanse B" };
/** Genera la lista de partidos de grupos a partir de filas «hora, campo, grupo, local, visitante». */
const rows = (r: [string, 1 | 2, Team["group"], string, string][]): GroupMatchDef[] => r.map(([time, field, group, home, away]) => ({ time, field, group, home, away }));

/* ------------------------------------------------------------------ 2015 */
const TEAMS_2015: Team[] = [
  T("leioa", "Leioa", "A"), T("bermeo", "Bermeo", "A"), T("gernika", "Gernika", "A"), T("ermua", "Ermua Blues", "A"),
  T("ariznabarra", "Ariznabarra", "B"), T("sestao", "Sestao River", "B"), T("portugalete", "Portugalete", "B"), T("lagun-artea", "Lagun Artea", "B"),
  T("bge-aiboa", "BGE Aiboa", "C"), T("durango-b", "Cultural Durango B", "C"), T("derio", "Derio", "C"), T("arrupe", "Sanse", "C", SANSE),
  T("arrupe-b", "Sanse B", "D", SANSE_B), T("etxebarri", "Etxebarri", "D"), T("durango", "Cultural Durango", "D"), T("abadino", "Abadiño", "D"),
];

const SCHEDULE_2015 = rows([
  // Jornada 1
  ["10:15", 1, "A", "leioa", "bermeo"], ["10:15", 2, "A", "gernika", "ermua"],
  ["10:40", 1, "B", "ariznabarra", "sestao"], ["10:40", 2, "B", "portugalete", "lagun-artea"],
  ["11:05", 1, "C", "bge-aiboa", "durango-b"], ["11:05", 2, "C", "derio", "arrupe"],
  ["11:30", 1, "D", "arrupe-b", "etxebarri"], ["11:30", 2, "D", "durango", "abadino"],
  // Jornada 2
  ["11:55", 1, "A", "leioa", "gernika"], ["11:55", 2, "A", "bermeo", "ermua"],
  ["12:20", 1, "B", "ariznabarra", "portugalete"], ["12:20", 2, "B", "sestao", "lagun-artea"],
  ["12:45", 1, "C", "bge-aiboa", "derio"], ["12:45", 2, "C", "durango-b", "arrupe"],
  ["13:10", 1, "D", "arrupe-b", "durango"], ["13:10", 2, "D", "etxebarri", "abadino"],
  // Jornada 3
  ["13:35", 1, "A", "leioa", "ermua"], ["13:35", 2, "A", "bermeo", "gernika"],
  ["14:00", 1, "B", "ariznabarra", "lagun-artea"], ["14:00", 2, "B", "sestao", "portugalete"],
  ["14:25", 1, "C", "bge-aiboa", "arrupe"], ["14:25", 2, "C", "durango-b", "derio"],
  ["14:50", 1, "D", "arrupe-b", "abadino"], ["14:50", 2, "D", "etxebarri", "durango"],
]);

const INFO_2015: InfoSpec = {
  intro: "Derio Cup es un torneo de fútbol base organizado por el CD Derio, que se lleva a cabo en las Instalaciones Deportivas de Ibaiondo (Derio). Lo forman 16 equipos, divididos en 4 grupos de 4 equipos, con Fase de grupos y dos Fases finales (Fase Oro y Fase Plata).",
  minutes: 20,
  penaltyRule: "En la fase final, si el partido termina en empate, se lanzarán 3 penaltis por equipo para decidir el desempate. Solo podrán lanzar los 7 jugadores que hayan finalizado el partido y es obligatorio mantener el portero que haya acabado el partido. En caso de seguir empatados podrán lanzar los jugadores que estaban en el banquillo.",
  tiebreaks: ["Puntos totales", "Puntos en partidos directos", "Diferencia de goles en partidos directos", "Goles a favor en partidos directos", "Diferencia de goles total", "Goles a favor total", "Si sigue el empate, se lanzará una moneda al aire para determinar la clasificación"],
  rules: [
    "Es obligatorio que cada equipo acuda con una segunda equipación, siendo el equipo que se asigne como visitante el que deba cambiar su indumentaria habitual.",
    "Fuera de juego a partir de la línea de 13 m. El área de penalti será la delimitada en el campo (área pequeña).",
    "La cesión al portero será castigada como falta directa desde la línea de 13 m sin barrera (perpendicular al lugar de la infracción). Todas las faltas serán directas.",
    "Cada equipo tendrá que traer sus propios balones para calentar antes de los partidos, ya que la organización no proporcionará ninguno.",
  ],
  warning: "Cualquier conducta antideportiva por parte de algún equipo se penalizará con la eliminación por decisión de la organización.",
  meals: { price: "8 €", includes: "Hamaiketako, plato de pasta (blancos, con tomate o carne con tomate), pan, agua y postre.", contact: "Si estáis interesados, contactad con el responsable del torneo para gestionar el número de comensales." },
  bar: "Para las familias habrá servicio de bar con variedad de pintxos y bocadillos durante todo el torneo.",
  parking: [
    { src: "/aparcamiento-1.webp", title: "Aparcamiento", alt: "Plano de aparcamiento junto al campo de Ibaiondo" },
    { src: "/aparcamiento-2.webp", title: "Aparcamiento alternativo", alt: "Plano del aparcamiento alternativo cercano a Ibaiondo" },
  ],
};

/* ------------------------------------------------------------------ 2018 (6 de diciembre) */
const S1 = { crest: "Arrupe Chaminade", pick: "Arrupe Chaminade 1 • Sanse 1" }, S2 = { crest: "Arrupe Chaminade", pick: "Arrupe Chaminade 2 • Sanse 2" };
const BGE = { crest: "BGE Aiboa" };
const TEAMS_2018: Team[] = [
  T("santutxu-b", "Santutxu B", "A", { crest: "Santutxu" }), T("arrupe-1", "Sanse 1", "A", S1), T("derio", "Derio", "A"), T("portugalete", "Portugalete", "A"),
  T("baskauri", "Baskauri", "B"), T("durango", "Cultural Durango", "B"), T("danok-a", "Danok Bat A", "B"), T("bermeo", "Bermeo", "B"),
  T("danok-b", "Danok Bat B", "C"), T("abadino", "Abadiño", "C"), T("bge-algorta", "BGE Algorta", "C", BGE), T("santutxu-a", "Santutxu A", "C", { crest: "Santutxu" }),
  T("romo", "Romo", "D"), T("arrupe-2", "Sanse 2", "D", S2), T("bge-arrigunaga", "BGE Arrigunaga", "D", BGE), T("athletic", "Athletic Academy", "D"),
];
const SCHEDULE_2018 = rows([
  // Jornada 1
  ["10:15", 1, "A", "santutxu-b", "arrupe-1"], ["10:15", 2, "A", "derio", "portugalete"],
  ["10:40", 1, "B", "baskauri", "durango"], ["10:40", 2, "B", "danok-a", "bermeo"],
  ["11:05", 1, "C", "danok-b", "abadino"], ["11:05", 2, "C", "bge-algorta", "santutxu-a"],
  ["11:30", 1, "D", "romo", "arrupe-2"], ["11:30", 2, "D", "bge-arrigunaga", "athletic"],
  // Jornada 2
  ["11:55", 1, "A", "santutxu-b", "derio"], ["11:55", 2, "A", "arrupe-1", "portugalete"],
  ["12:20", 1, "B", "baskauri", "danok-a"], ["12:20", 2, "B", "durango", "bermeo"],
  ["12:45", 1, "C", "danok-b", "bge-algorta"], ["12:45", 2, "C", "abadino", "santutxu-a"],
  ["13:10", 1, "D", "romo", "bge-arrigunaga"], ["13:10", 2, "D", "arrupe-2", "athletic"],
  // Jornada 3
  ["13:35", 1, "A", "santutxu-b", "portugalete"], ["13:35", 2, "A", "arrupe-1", "derio"],
  ["14:00", 1, "B", "baskauri", "bermeo"], ["14:00", 2, "B", "durango", "danok-a"],
  ["14:25", 1, "C", "danok-b", "santutxu-a"], ["14:25", 2, "C", "abadino", "bge-algorta"],
  ["14:50", 1, "D", "romo", "athletic"], ["14:50", 2, "D", "arrupe-2", "bge-arrigunaga"],
]);

/* ------------------------------------------------------------------ 2017 (edición anterior) */
const TEAMS_2017: Team[] = [
  T("danok-a", "Danok Bat A", "A"), T("portugalete", "Portugalete", "A"), T("ermua", "Ermua Blues", "A"), T("urduliz", "Urduliz", "A"),
  T("leioa", "Leioa", "B"), T("indautxu", "Indautxu", "B"), T("deusto", "Deusto", "B"), T("etorkizuna", "Etorkizuna", "B"),
  T("santutxu", "Santutxu", "C"), T("durango", "Cultural Durango", "C"), T("arrupe", "Sanse", "C", SANSE), T("derio", "Derio", "C"),
  T("danok-b", "Danok Bat B", "D"), T("retuerto", "Retuerto", "D"), T("ariznabarra", "Ariznabarra", "D"), T("trapagaran", "Trapagaran", "D"),
];
const SCHEDULE_2017 = rows([
  ["12:00", 1, "A", "danok-a", "portugalete"], ["12:00", 2, "A", "ermua", "urduliz"], ["12:25", 1, "B", "leioa", "indautxu"], ["12:25", 2, "B", "deusto", "etorkizuna"],
  ["12:50", 1, "C", "derio", "santutxu"], ["12:50", 2, "C", "durango", "arrupe"], ["13:15", 1, "D", "trapagaran", "ariznabarra"], ["13:15", 2, "D", "danok-b", "retuerto"],
  ["13:40", 1, "A", "danok-a", "ermua"], ["13:40", 2, "A", "portugalete", "urduliz"], ["14:05", 1, "B", "leioa", "deusto"], ["14:05", 2, "B", "indautxu", "etorkizuna"],
  ["14:30", 1, "C", "derio", "arrupe"], ["14:30", 2, "C", "durango", "santutxu"], ["14:55", 1, "D", "retuerto", "ariznabarra"], ["14:55", 2, "D", "danok-b", "trapagaran"],
  ["15:20", 1, "A", "ermua", "portugalete"], ["15:20", 2, "A", "danok-a", "urduliz"], ["15:45", 1, "B", "leioa", "etorkizuna"], ["15:45", 2, "B", "indautxu", "deusto"],
  ["16:10", 1, "C", "derio", "durango"], ["16:10", 2, "C", "santutxu", "arrupe"], ["16:35", 1, "D", "retuerto", "trapagaran"], ["16:35", 2, "D", "danok-b", "ariznabarra"],
]);
const INFO_2017: InfoSpec = {
  intro: "Derio Cup es un torneo de fútbol base organizado por el CD Derio para la categoría Benjamín 2017, temporada 2026/27.",
  minutes: 20,
  penaltyRule: "En las fases finales, si hay empate se lanzan 3 penaltis por equipo. Solo pueden lanzar inicialmente los 7 jugadores que hayan terminado el encuentro y debe mantenerse el portero que lo haya finalizado. Si continúa el empate, podrán lanzar los jugadores del banquillo.",
  tiebreaks: ["Puntos totales", "Puntos en partidos directos", "Diferencia de goles en partidos directos", "Goles a favor en partidos directos", "Diferencia de goles total", "Goles a favor total", "Tanda de penaltis"],
  rules: [
    "El equipo designado como visitante deberá cambiar de equipación si existe coincidencia. Es obligatorio acudir con segunda equipación.",
    "Fuera de juego desde la línea de 13 m. El área de penalti es el área pequeña delimitada.",
    "La cesión al portero se sanciona con falta directa desde la línea de 13 m, sin barrera. Todas las faltas son directas.",
    "Cada equipo debe traer sus propios balones para calentar.",
  ],
  warning: "Las conductas antideportivas pueden suponer la eliminación por decisión de la organización.",
  meals: { price: "8 €", includes: "Hamaiketako, plato de pasta, pan, agua y postre." },
  bar: "Para las familias habrá servicio de bar con pintxos y bocadillos durante todo el torneo.",
  wc: "Los baños / WC están ubicados en la parte trasera de la grada.",
  venueImage: { src: "/ibaiondo-campo.jpg", alt: "Plano aéreo de los campos de Ibaiondo" },
};


/* ------------------------------------------------------------------ textos en euskera */
const TIEBREAKS_EU_2017 = ["Puntu guztiak", "Zuzeneko partidetako puntuak", "Zuzeneko partidetako gol-diferentzia", "Zuzeneko partidetako golak alde", "Gol-diferentzia orokorra", "Golak alde (guztira)", "Penalti-tanda"];
const INFO_2015_EU: InfoSpec = {
  intro: "Derio Cup CD Derio-k antolatutako oinarriko futbol txapelketa da, Ibaiondoko Kirol Instalazioetan (Derio) jokatzen dena. 16 talde izango dira, 4 taldeko 4 multzotan banatuta, multzo-fasearekin eta bi azken faserekin (Urrezko fasea eta Zilarrezko fasea).",
  minutes: 20,
  penaltyRule: "Azken faseetan, partida berdinketan amaitzen bada, talde bakoitzak 3 penalti jaurtiko ditu berdinketa ebazteko. Partida amaitu duten 7 jokalariek bakarrik jaurti dezakete eta partida amaitu duen atezainak jarraitu behar du. Berdinketak jarraitzen badu, aldaketa-aulkiko jokalariek jaurti ahal izango dute.",
  tiebreaks: ["Puntu guztiak", "Zuzeneko partidetako puntuak", "Zuzeneko partidetako gol-diferentzia", "Zuzeneko partidetako golak alde", "Gol-diferentzia orokorra", "Golak alde (guztira)", "Berdinketak jarraitzen badu, txanpona airera botako da sailkapena zehazteko"],
  rules: [
    "Talde bakoitzak bigarren jantzia ekarri behar du derrigorrez; kanpoko talde gisa izendatutakoak aldatu beharko du ohiko jantzia.",
    "Jokoz kanpo 13 metroko lerrotik aurrera. Penalti-area zelaian zehaztutakoa izango da (area txikia).",
    "Atezainari egindako atzerako pasea 13 metroko lerrotik jarritako zuzeneko falta (hesirik gabe, arau-haustearen lekuarekiko perpendikularra) bidez zigortuko da. Falta guztiak zuzenekoak dira.",
    "Talde bakoitzak bere baloiak ekarri behar ditu partidak hasi aurretik berotzeko, antolakuntzak ez baitu bat ere emango.",
  ],
  warning: "Talde batek jokabide antikiroltsuren bat izanez gero, antolakuntzaren erabakiz kanporatua izango da.",
  meals: { price: "8 €", includes: "Hamaiketakoa, pasta-platera (zuriak, tomatearekin edo haragia tomatearekin), ogia, ura eta postrea.", contact: "Interesatuta bazaudete, jarri harremanetan txapelketaren arduradunarekin otordu kopurua kudeatzeko." },
  bar: "Familientzat, pintxo eta ogitarteko askotariko tabernaren zerbitzua egongo da txapelketa osoan zehar.",
  parking: [
    { src: "/aparcamiento-1.webp", title: "Aparkalekua", alt: "Ibaiondo zelaiaren ondoko aparkalekuaren planoa" },
    { src: "/aparcamiento-2.webp", title: "Ordezko aparkalekua", alt: "Ibaiondotik gertu dagoen ordezko aparkalekuaren planoa" },
  ],
};
const INFO_2017_EU: InfoSpec = {
  intro: "Derio Cup CD Derio-k antolatutako oinarriko futbol txapelketa da, Benjamin 2017 kategoriarako, 2026/27 denboraldia.",
  minutes: 20,
  penaltyRule: "Azken faseetan, berdinketa badago, talde bakoitzak 3 penalti jaurtiko ditu. Hasieran partida amaitu duten 7 jokalariek bakarrik jaurti dezakete eta amaitu duen atezainak jarraitu behar du. Berdinketak jarraitzen badu, aldaketa-aulkiko jokalariek jaurti ahal izango dute.",
  tiebreaks: TIEBREAKS_EU_2017,
  rules: [
    "Kanpoko talde gisa izendatutakoak jantzia aldatu beharko du bat egiten badute. Bigarren jantzia ekartzea derrigorrezkoa da.",
    "Jokoz kanpo 13 metroko lerrotik aurrera. Penalti-area area txiki mugatua da.",
    "Atezainari egindako atzerako pasea 13 metroko lerrotik jarritako zuzeneko falta bidez zigortzen da, hesirik gabe. Falta guztiak zuzenekoak dira.",
    "Talde bakoitzak bere baloiak ekarri behar ditu berotzeko.",
  ],
  warning: "Jokabide antikiroltsuek antolakuntzaren erabakiz kanporatzea ekar dezakete.",
  meals: { price: "8 €", includes: "Hamaiketakoa, pasta-platera, ogia, ura eta postrea." },
  bar: "Familientzat, pintxo eta ogitartekoen taberna-zerbitzua egongo da txapelketa osoan zehar.",
  wc: "Komunak harmailaren atzeko aldean daude.",
  venueImage: { src: "/ibaiondo-campo.jpg", alt: "Ibaiondoko zelaien ikuspegi aireko planoa" },
};

/* ------------------------------------------------------------------ textos en francés */
const INFO_2015_FR: InfoSpec = {
  intro: "La Derio Cup est un tournoi de football des jeunes organisé par le CD Derio au complexe sportif d’Ibaiondo (Derio). Il réunit 16 équipes, réparties en 4 groupes de 4, avec une phase de groupes et deux phases finales (Phase Or et Phase Argent).",
  minutes: 20,
  penaltyRule: "En phase finale, en cas d’égalité à la fin du match, les équipes sont départagées par une séance de tirs au but (3 tirs par équipe). Seuls les 7 joueurs présents sur le terrain à la fin du match peuvent tirer, et le gardien qui a terminé le match doit obligatoirement rester dans les buts. En cas de nouvelle égalité, les joueurs restés sur le banc peuvent également tirer.",
  tiebreaks: ["Total des points", "Points en confrontations directes", "Différence de buts en confrontations directes", "Buts marqués en confrontations directes", "Différence de buts générale", "Total des buts marqués", "Si l’égalité persiste, le classement se décide à pile ou face"],
  rules: [
    "Chaque équipe doit obligatoirement venir avec un deuxième jeu de maillots : c’est l’équipe désignée comme visiteuse qui devra changer de tenue.",
    "Hors-jeu à partir de la ligne des 13 m. La surface de réparation est celle tracée sur le terrain (petite surface).",
    "La passe en retrait au gardien sera sanctionnée d’un coup franc direct sur la ligne des 13 m, sans mur (ramené perpendiculairement au lieu de la faute). Tous les coups francs seront directs.",
    "Chaque équipe doit apporter ses propres ballons pour s’échauffer avant les matchs : l’organisation n’en fournira aucun.",
  ],
  warning: "Tout comportement antisportif d’une équipe sera sanctionné par son exclusion du tournoi, sur décision de l’organisation.",
  meals: { price: "8 €", includes: "Hamaiketako (en-cas de 11 h), assiette de pâtes (nature, à la tomate ou à la bolognaise), pain, eau et dessert.", contact: "Si cela vous intéresse, contactez le responsable du tournoi pour indiquer le nombre de repas." },
  bar: "Pour les familles, une buvette proposera un large choix de pintxos et de sandwichs pendant tout le tournoi.",
  parking: [
    { src: "/aparcamiento-1.webp", title: "Parking", alt: "Plan du parking à côté du stade d’Ibaiondo" },
    { src: "/aparcamiento-2.webp", title: "Parking de délestage", alt: "Plan du parking de délestage près d’Ibaiondo" },
  ],
};
const INFO_2017_FR: InfoSpec = {
  intro: "La Derio Cup est un tournoi de football des jeunes organisé par le CD Derio pour la catégorie Benjamín 2017 (enfants nés en 2017), saison 2026/27.",
  minutes: 20,
  penaltyRule: "En phases finales, en cas d’égalité, chaque équipe tente 3 tirs au but. Dans un premier temps, seuls les 7 joueurs qui ont terminé le match peuvent tirer, et le gardien qui l’a terminé doit rester dans les buts. Si l’égalité persiste, les joueurs du banc peuvent aussi tirer.",
  tiebreaks: ["Total des points", "Points en confrontations directes", "Différence de buts en confrontations directes", "Buts marqués en confrontations directes", "Différence de buts générale", "Total des buts marqués", "Séance de tirs au but"],
  rules: [
    "En cas de couleurs identiques, l’équipe désignée comme visiteuse devra changer de maillots. Chaque équipe doit obligatoirement venir avec un deuxième jeu de maillots.",
    "Hors-jeu à partir de la ligne des 13 m. La surface de réparation correspond à la petite surface tracée.",
    "La passe en retrait au gardien est sanctionnée d’un coup franc direct sur la ligne des 13 m, sans mur. Tous les coups francs sont directs.",
    "Chaque équipe doit apporter ses propres ballons pour s’échauffer.",
  ],
  warning: "Tout comportement antisportif peut entraîner l’exclusion du tournoi, sur décision de l’organisation.",
  meals: { price: "8 €", includes: "Hamaiketako (en-cas de 11 h), assiette de pâtes, pain, eau et dessert." },
  bar: "Pour les familles, une buvette proposera des pintxos et des sandwichs pendant tout le tournoi.",
  wc: "Les toilettes se trouvent à l’arrière de la tribune.",
  venueImage: { src: "/ibaiondo-campo.jpg", alt: "Vue aérienne des terrains d’Ibaiondo" },
};

export const TOURNAMENTS: Tournament[] = [
  {
    id: "2018", name: "Derio Cup", category: "2018", season: "2026/27", date: "2026-12-06",
    venue: VENUE, venueEu: VENUE_EU, venueFr: VENUE_FR, venueShort: "Ibaiondo", mapsUrl: MAPS, matchMinutes: 25, idPrefix: "2018-",
    teams: TEAMS_2018, schedule: SCHEDULE_2018,
    ko: { cf: ["15:15", "15:40", "16:05", "16:30"], sf: ["16:55", "17:20"], final: "17:45" },
    info: { ...INFO_2015, venueImage: { src: "/ibaiondo-campo.jpg", alt: "Plano aéreo de los campos de Ibaiondo" } },
    infoEu: { ...INFO_2015_EU, venueImage: { src: "/ibaiondo-campo.jpg", alt: "Ibaiondoko zelaien ikuspegi aireko planoa" } },
    infoFr: { ...INFO_2015_FR, venueImage: { src: "/ibaiondo-campo.jpg", alt: "Vue aérienne des terrains d’Ibaiondo" } },
  },
  {
    id: "2015", name: "Derio Cup", category: "2015", season: "2026/27", date: "2026-12-08",
    venue: VENUE, venueEu: VENUE_EU, venueFr: VENUE_FR, venueShort: "Ibaiondo", mapsUrl: MAPS, matchMinutes: 25, idPrefix: "2015-",
    teams: TEAMS_2015, schedule: SCHEDULE_2015,
    ko: { cf: ["15:15", "15:40", "16:05", "16:30"], sf: ["16:55", "17:20"], final: "17:45" },
    info: { ...INFO_2015, venueImage: { src: "/ibaiondo-campo.jpg", alt: "Plano aéreo de los campos de Ibaiondo" } },
    infoEu: { ...INFO_2015_EU, venueImage: { src: "/ibaiondo-campo.jpg", alt: "Ibaiondoko zelaien ikuspegi aireko planoa" } },
    infoFr: { ...INFO_2015_FR, venueImage: { src: "/ibaiondo-campo.jpg", alt: "Vue aérienne des terrains d’Ibaiondo" } },
  },
  {
    id: "2017", name: "Derio Cup", category: "Benjamín 2017", season: "2026/27", date: "2026-09-20",
    venue: VENUE, venueEu: VENUE_EU, venueFr: VENUE_FR, venueShort: "Ibaiondo", mapsUrl: MAPS, matchMinutes: 25, idPrefix: "",
    teams: TEAMS_2017, schedule: SCHEDULE_2017,
    ko: { cf: ["17:00", "17:25", "17:50", "18:15"], sf: ["18:40", "19:05"], final: "19:30" },
    info: INFO_2017,
    infoEu: INFO_2017_EU,
    infoFr: INFO_2017_FR,
  },
];

export const getTournament = (id: string | null | undefined) => TOURNAMENTS.find(t => t.id === id) ?? null;
