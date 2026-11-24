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
