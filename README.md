# Derio Cup · app de torneos

Next.js + Supabase. La app muestra una lista de torneos próximos; cada torneo tiene su menú (inicio, partidos, clasificación, fases, más).

## Añadir un torneo
Edita `app/lib/editions.ts`: copia un bloque de `TOURNAMENTS` y cambia fecha, equipos, calendario (`SCHEDULE_*`), horarios de fases finales (`ko`) y textos (`info`).
El torneo se oculta solo al pasar su fecha (hora de Madrid). Usa un `idPrefix` único (p. ej. `"2016-"`) para separar sus resultados en Supabase.

## Escudos
Pásalos por el script; los deja en `public/escudos/` como WebP en la máxima calidad que quepa por debajo de 1 MB (sin pérdida si cabe) y actualiza el manifiesto:

```bash
npm run crests -- ruta/a/la/carpeta   # o uno o varios archivos
```

El **nombre del archivo es el nombre del club** (`Cultural Durango.png` → `cultural-durango.webp`). Cualquier torneo con un equipo de ese mismo nombre lo reutiliza automáticamente; un equipo «B» usa el escudo de su club si no tiene uno propio. Sin escudo se muestra un monograma.
