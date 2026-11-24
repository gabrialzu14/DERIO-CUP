# Derio Cup · app de torneos

Next.js + Supabase. La app muestra una lista de torneos próximos; cada torneo tiene su menú (inicio, partidos, clasificación, fases, más).

## Añadir un torneo
Edita `app/lib/editions.ts`: copia un bloque de `TOURNAMENTS` y cambia fecha, equipos, calendario (`SCHEDULE_*`), horarios de fases finales (`ko`) y textos (`info`).
El torneo se oculta solo al pasar su fecha (hora de Madrid). Usa un `idPrefix` único (p. ej. `"2016-"`) para separar sus resultados en Supabase.

## Escudos
Pásalos por el script; los deja en `public/escudos/` como WebP de **1024 × 1024 px** (todos iguales, con el escudo centrado y margen uniforme) en la máxima calidad que quepa por debajo de 1 MB (sin pérdida si cabe). Si la imagen tiene fondo liso (blanco o gris) lo quita solo. Actualiza también el manifiesto:

```bash
npm run crests -- ruta/a/la/carpeta   # o uno o varios archivos
```

El **nombre del archivo es el nombre del club** (`Cultural Durango.png` → `cultural-durango.webp`). Cualquier torneo con un equipo de ese mismo nombre lo reutiliza automáticamente; un equipo «B» usa el escudo de su club si no tiene uno propio. Sin escudo se muestra un monograma. En la app se sirven reducidos (`next/image`), así que los originales de 1024 px no pesan en el móvil.

Los originales de los escudos se guardan en `assets/escudos-originales/` para poder regenerarlos. Si un escudo es de baja resolución, `python3 scripts/upscale-crests.py` lo amplía con superresolución (IA, EDSR ×4) a `assets/escudos-ampliados/` (no se sube al repo) y después `npm run crests -- assets/escudos-ampliados` genera los WebP. Con un original grande (≥ 1000 px) no hace falta ese paso. Siempre es mejor pasar el escudo en la mayor resolución posible. Si es un PDF vectorial: `pdftocairo -png -transp -r 80 -singlefile escudo.pdf` y se deja el PNG en `assets/escudos-originales/` (el PDF se guarda en `vectoriales/`). Si un escudo tiene un hueco cerrado de fondo liso (p. ej. entre dos bandas), añade un punto dentro de él en `scripts/crest-fixes.json` (coordenadas del archivo original) y vuelve a ejecutar el script.

## Patrocinadores
Se muestran en la pantalla de inicio bajo los torneos, en monocolor (azul en modo claro, rojo en oscuro). La lista y el orden están en `app/lib/sponsors.ts`.
Para añadir uno: deja su logo (PNG con fondo transparente o SVG) en `assets/patrocinadores-originales/` y ejecuta `npm run sponsors`, que genera la máscara en `public/patrocinadores/`. Sin logo, se puede mostrar solo el nombre con el campo `text`.

## App móvil (iOS y Android)
- **Sin arrastre de página:** `html`/`body` no hacen scroll; todo el desplazamiento ocurre dentro de `#scroller` (sin rebote, sin pull-to-refresh, sin arrastre horizontal). La selección de texto y el arrastre de imágenes están desactivados salvo en los textos informativos (`.prose`) y los campos.
- **Atrás del móvil:** cada pantalla y cada diálogo es un paso del historial; Atrás cierra el diálogo o vuelve a la pantalla anterior sin salir de la app.
- **Sin conexión:** `public/sw.js` guarda la app, los escudos y las imágenes; los últimos resultados se guardan en el dispositivo.
- **Pantallas:** probado de 280 px (plegable cerrado) a tablet, vertical y apaisado, con márgenes de seguridad (notch, barra de gestos).

### Pruebas automáticas
Con la app compilada y en marcha (`npm run build && npx next start -p 3100`) y Playwright instalado:
```bash
node scripts/qa/dispositivos.cjs   # 10 móviles × claro/oscuro: desbordes, barra inferior, scroll
node scripts/qa/navegacion.cjs     # flujos, historial, diálogos, gestos, sin conexión, tema
node scripts/qa/sin-conexion.cjs   # service worker y modo sin conexión
node scripts/qa/instalacion.cjs    # guion de bienvenida e instalación (iOS / Android)
```

## Guion de instalación
Antes de elegir torneo, en el navegador y la primera vez: bienvenida → «¿Sabes cómo se instala?» → («Sí» va a elegir torneo; «No» pregunta iPhone o Android y enseña los pasos) → «busca Derio Cup en el menú principal de tu móvil». La app ya instalada salta el guion y abre directamente la elección de torneo. Se puede volver a abrir desde Más → «Instalar la app». Los textos están en `app/components/Onboarding.tsx`.
