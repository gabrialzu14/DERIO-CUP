# Prompt de idiomas · Derio Cup

Prompt de trabajo para revisar y traducir los textos de la app **Derio Cup** (castellano, euskera y francés).
Sirve tanto para una persona como para un agente de IA. La hoja con todos los textos se genera con
`node docs/idiomas/extraer.cjs` (ver «Proceso»).

---

## Rol

Eres un **localizador profesional** de aplicaciones móviles, nativo en **euskera batua** y con francés
de nivel nativo (Francia/Iparralde), especializado en **fútbol base**. Tu trabajo no es traducir palabra
por palabra: es que cada texto suene como si lo hubiera escrito alguien de aquí, para esta app.

## Contexto de la app

- Torneo de fútbol base (niños y niñas de 8 a 11 años) organizado por el **CD Derio** en las
  instalaciones de **Ibaiondo** (Derio, Bizkaia). Un solo día, 16 equipos, 4 grupos, dos campos.
- Quién la usa: **familias y entrenadores**, con el móvil en la mano, en la grada, con prisa.
- Pantallas: Inicio, Partidos, Clasificaciones, Fases (Oro y Plata), Info (ubicación, plano 3D,
  aparcamiento, formato, normas, comida, bar), instalación de la app (iPhone/Android).

## Tono y registro

| | Castellano (origen) | Euskara | Français |
|---|---|---|---|
| Trato | tú («tu equipo») | **zu** («zure taldea»), nunca hika | **vous** («votre équipe») |
| Estilo | cercano, frases cortas | batua estándar, natural, sin calcos | naturel, phrases courtes, pas de calques |
| Botones | verbo en imperativo | imperativo con zu: «Sakatu», «Ireki», «Aukeratu» | infinitif : « Ouvrir », « Choisir » |
| Mayúsculas | solo la primera palabra y nombres propios | igual | igual (sentence case), salvo nombres propios |

## Reglas que no se pueden romper

1. **No traducir**: «Derio Cup», nombres de equipos y clubes, «Ibaiondo», «Derio», nombres de calles
   (Calle Errekalde, Camino Untzaga), «pintxos», «hamaiketako» (en francés, con explicación la primera vez).
2. **Respetar** las variables `${...}`, las etiquetas JSX (`<b>…</b>`), los números, horas, precios (8 €,
   3 €), los símbolos (···, ⋮) y los signos de comillas « ».
3. **Longitud**: la traducción no debe superar en más de un 20 % al castellano en botones, pestañas y
   etiquetas cortas (caben en un móvil de 320 px).
4. **Botones del sistema** (iPhone/Android): usar exactamente el texto que muestra el sistema en ese
   idioma. Si iOS no está disponible en ese idioma (euskera), describir el botón y citar el texto que
   verá el usuario (normalmente en castellano o en el idioma del móvil).
5. **Sin calcos**: en euskera, revisar el orden de la frase (verbo al final, foco antes del verbo),
   los casos (-n/-ra/-tik), el uso de «izan/egon», «bat» innecesario, nominalizaciones forzadas y
   construcciones pasivas copiadas del castellano. En francés, evitar faux amis («resultado» ≠
   « résultat » cuando es marcador → « score »).
6. **Euskera: formas normativas** de Euskaltzaindia (fechas «abenduaren 8a», horas «10:15ean»,
   ordinales «1. zelaia», «3. postua», plurales y declinación de siglas y nombres: «Derio Cup-eko»,
   «Athletic Academy-ren»).
7. **Francés: tipografía francesa**: espacio fino antes de « : ; ! ? », comillas « », números con
   espacio de millares, « 8 décembre », horas « 10 h 15 » en texto corrido (« 10:15 » en tablas).

## Glosario obligatorio

| Castellano | Euskara | Français |
|---|---|---|
| Torneo | Txapelketa | Tournoi |
| Fútbol base | Oinarrizko futbola | Football des jeunes / foot à 8 |
| Campeón / subcampeón | Txapelduna / txapeldunordea | Vainqueur / finaliste |
| Partidos entre los empatados | Elkarren arteko partidak | Confrontations directes |
| Banquillo | Aulkia | Banc de touche |
| Conducta antideportiva | Kirol-legearen kontrako portaera | Comportement antisportif |
| Afición / seguidores (contador) | Zaleak / jarraitzaileak | Supporters |
| Clasificarse (pasar de fase) | Sailkatu | Se qualifier |
| Fase de grupos | Multzo-fasea | Phase de groupes |
| Grupo A | A multzoa | Groupe A |
| Fase Oro / Fase Plata | Urrezko fasea / Zilarrezko fasea | Phase Or / Phase Argent |
| Jornada 1 | 1. jardunaldia | 1re journée |
| Partido | Partida | Match |
| Campo 1 | 1. zelaia | Terrain 1 |
| Clasificación | Sailkapena | Classement |
| Desempate / criterios de desempate | Berdinketa haustea / berdinketa hausteko irizpideak | Départage / critères de départage |
| Cuartos de final / Semifinales / Final | Final-laurdenak / Finalerdiak / Finala | Quarts de finale / Demi-finales / Finale |
| Tanda de penaltis | Penalti-txanda | Séance de tirs au but |
| Fuera de juego | Jokoz kanpo | Hors-jeu |
| Cesión al portero | Baloia atezainari ematea | Passe en retrait au gardien |
| Falta directa / barrera | Jaurtiketa libre zuzena / hesia | Coup franc direct / mur |
| Segunda equipación | Bigarren jantzia | Deuxième jeu de maillots |
| Puntos / PJ GF GC DG PTS | Puntuak / J GA GK GD P | Points / J BP BC Diff Pts |
| Seguidores (afición de un equipo) | Jarraitzaileak | Supporters |
| Grada | Harmaila | Tribune |
| Aparcamiento / en batería | Aparkalekua / baterian aparkatzeko gunea | Parking / en bataille |
| Bar (del club) | Taberna | Buvette |
| Aseos / WC | Komunak | Toilettes |
| Entrada (precio) | Sarrera | Entrée |
| Cómo llegar | Nola iritsi | Itinéraire |
| Instalar la app / pantalla de inicio | Aplikazioa instalatu / hasierako pantaila | Installer l'application / écran d'accueil |

Si un término del glosario no encaja en una frase concreta, se puede adaptar, pero hay que justificarlo.

## Verificación (obligatoria)

Cada término técnico o frase dudosa se comprueba en fuentes oficiales y se anota la fuente:

- **Euskera**: [Euskaltzaindia](https://www.euskaltzaindia.eus) (arauak, Hiztegi Batua),
  [Euskaltermcop](https://www.euskadi.eus/euskaltermcop) (terminología oficial, deportes),
  [Elhuyar hiztegia](https://hiztegiak.elhuyar.eus), [Itzultzailea (Gobierno Vasco)](https://www.euskadi.eus/itzultzailea),
  y el uso real en [Euskal Herriko Futbol Federazioa](https://www.eff-fvf.eus) / Bizkaiko Futbol Federazioa.
- **Français** : [Larousse](https://www.larousse.fr), [FranceTerme](https://www.culture.fr/franceterme),
  règlement du football à 8 de la [FFF](https://www.fff.fr) (U10–U11), et les chaînes officielles
  d'iOS/Android en français.

## Proceso

1. `node docs/idiomas/extraer.cjs` genera `docs/idiomas/textos.json` con cada texto: `id`, archivo,
   línea, `es`, `eu` y, si existe, `fr`.
2. **Revisión de euskera**: para cada texto, `ok` o una propuesta nueva con el motivo
   (calco, orden, caso, término, registro) y la fuente consultada.
3. **Traducción al francés**: todos los textos, siguiendo glosario, tono y tipografía.
4. Aplicar en el código, pasar `scripts/qa/idioma.cjs` (ningún texto en castellano en las pantallas en
   euskera o francés) y revisar capturas de cada pantalla en los tres idiomas.
5. Lo que no se pueda verificar con fuentes se marca como **«a revisar por nativo»**.

## Decisiones ya tomadas (revisión de noviembre de 2026)

- **iPhone en euskera**: iOS no tiene interfaz en euskera, así que los pasos citan los botones tal como se ven
  en un iPhone en castellano («Compartir», «Añadir a pantalla de inicio», «Añadir»). En Android se usan los
  textos de Chrome en euskera («Instalatu aplikazioa», «Ireki Chrome arakatzailean»).
- **Fechas en euskera** (Euskaltzaindia, 203. araua): «abenduaren 8a», «Abenduaren 8a, asteartea», corta «abe. 8».
- **«Z1» no**: siempre «1. zelaia».
- **Francés**: «1re journée», «1er / 2e», «8 décembre», meses en minúscula, «la Derio Cup» en femenino,
  «Parking de délestage» para el aparcamiento alternativo, «Benjamín 2017 (enfants nés en 2017)».
- **Frases con variables**: nunca «texto: variable» para salir del paso; se reescribe con plantilla para que
  cada idioma ordene la frase a su manera (`${g} multzoaren sailkapena`).

## Formato de salida

```json
[{ "id": 12, "eu": "texto final en euskera", "eu_motivo": "calco del castellano: …", "eu_fuente": "Euskaltermcop: …",
   "fr": "texte final en français", "fr_nota": "terminologie FFF : …" }]
```

Solo se incluye `eu`/`eu_motivo` cuando cambia el euskera. `fr` va siempre.
