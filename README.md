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

Los originales de los escudos se guardan en `assets/escudos-originales/` para poder regenerarlos. Si un escudo tiene un hueco cerrado de fondo liso (p. ej. entre dos bandas), añade un punto dentro de él en `scripts/crest-fixes.json` (coordenadas del archivo original) y vuelve a ejecutar el script.
