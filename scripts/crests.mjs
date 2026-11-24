#!/usr/bin/env node
/* Convierte escudos a WebP de 1024 × 1024 px (siempre el mismo tamaño) en la máxima calidad
   que quepa por debajo de 1 MB. Quita el fondo liso (blanco o gris) si la imagen no es transparente.
   Uso:  npm run crests -- <archivo|carpeta> [...]
   El nombre del archivo es el nombre del club («Cultural Durango.png» → cultural-durango.webp).
   Los escudos se reutilizan solos en cualquier torneo cuyo equipo tenga ese mismo nombre. */
import sharp from "sharp";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

const LIMIT = 1_000_000; // bytes (< 1 MB)
const SIZE = 1024;       // lado del lienzo cuadrado, igual para todos
const PAD = 0.04;        // margen alrededor del escudo (fracción del lado)
const OUT = resolve("public/escudos");
const MANIFEST = resolve("app/lib/crests.generated.ts");
const INPUT_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".tif", ".tiff", ".gif", ".svg"]);

export const slugify = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function listInputs(paths) {
  const files = [];
  for (const p of paths) {
    const s = await stat(p);
    if (s.isDirectory()) for (const f of await readdir(p)) { if (INPUT_EXT.has(extname(f).toLowerCase())) files.push(join(p, f)); }
    else files.push(p);
  }
  return files;
}

/** Si la imagen no tiene transparencia, quita el fondo liso (blanco/gris/viñeta) que toca los bordes. */
async function removeBackground(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info, N = w * h;
  for (let p = 0; p < N; p++) if (data[p * 4 + 3] < 250) return buf; // ya es transparente
  const at = p => p * 4;
  const neutral = p => { const r = data[at(p)], g = data[at(p) + 1], b = data[at(p) + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx - mn <= 26 && (r + g + b) / 3 >= 100; };
  const seen = new Uint8Array(N), queue = new Int32Array(N); let qh = 0, qt = 0;
  const push = p => { if (!seen[p] && neutral(p)) { seen[p] = 1; queue[qt++] = p; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (qh < qt) { const p = queue[qh++], x = p % w; if (x > 0) push(p - 1); if (x < w - 1) push(p + 1); if (p >= w) push(p - w); if (p < N - w) push(p + w); }
  // Quita también el halo claro del borde (antialiasing contra el fondo).
  for (let pass = 0; pass < 2; pass++) {
    const halo = [];
    for (let p = 0; p < N; p++) {
      if (seen[p]) continue;
      const x = p % w, near = (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (p >= w && seen[p - w]) || (p < N - w && seen[p + w]);
      if (!near) continue;
      const r = data[at(p)], g = data[at(p) + 1], b = data[at(p) + 2];
      if (Math.max(r, g, b) - Math.min(r, g, b) <= 46 && (r + g + b) / 3 >= 150) halo.push(p);
    }
    for (const p of halo) seen[p] = 1;
  }
  for (let p = 0; p < N; p++) if (seen[p]) data[at(p) + 3] = 0;
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

/** Recorta márgenes vacíos, ajusta al lienzo SIZE × SIZE y centra con margen uniforme. */
async function prepare(buf) {
  let img = sharp(await removeBackground(await sharp(buf, { density: 600 }).rotate().ensureAlpha().png().toBuffer()));
  try { img = sharp(await img.trim({ threshold: 12 }).png().toBuffer()); } catch { /* imagen sin márgenes recortables */ }
  const inner = Math.round(SIZE * (1 - PAD * 2));
  const { data, info } = await img.resize({ width: inner, height: inner, fit: "inside", kernel: "lanczos3" }).png().toBuffer({ resolveWithObject: true });
  return sharp(data).extend({ top: Math.floor((SIZE - info.height) / 2), bottom: Math.ceil((SIZE - info.height) / 2), left: Math.floor((SIZE - info.width) / 2), right: Math.ceil((SIZE - info.width) / 2), background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

/** Sin pérdida si cabe; si no, la mayor calidad con pérdida que quepa (el tamaño nunca cambia). */
async function encode(png) {
  const lossless = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer();
  if (lossless.length <= LIMIT) return { buf: lossless, mode: "sin pérdida" };
  let lo = 1, hi = 100, best = null;
  while (lo <= hi) {
    const q = (lo + hi) >> 1, out = await sharp(png).webp({ quality: q, alphaQuality: 100, effort: 6, smartSubsample: true }).toBuffer();
    if (out.length <= LIMIT) { best = { buf: out, q }; lo = q + 1; } else hi = q - 1;
  }
  if (!best) throw new Error("No se pudo comprimir por debajo de 1 MB");
  return { buf: best.buf, mode: `calidad ${best.q}` };
}

/** Color dominante del escudo (tono real del club): ignora fondo, blanco y negro de contorno. */
async function dominantColor(file) {
  const { data, info } = await sharp(file).resize(64, 64, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = new Map();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx / 255, sat = mx ? (mx - mn) / mx : 0;
    if ((v > 0.9 && sat < 0.15) || v < 0.16) continue; // blanco de fondo / negro de contorno
    const key = [r, g, b].map(c => Math.round(c / 28)).join(",");
    const e = bins.get(key) ?? { w: 0, n: 0, r: 0, g: 0, b: 0 };
    e.w += 0.25 + sat; e.n++; e.r += r; e.g += g; e.b += b; bins.set(key, e);
  }
  const best = [...bins.values()].sort((x, y) => y.w - x.w)[0];
  if (!best) return "#3b4a63";
  return "#" + [best.r, best.g, best.b].map(c => Math.round(c / best.n).toString(16).padStart(2, "0")).join("");
}

async function writeManifest() {
  const slugs = (await readdir(OUT)).filter(f => f.endsWith(".webp")).map(f => f.slice(0, -5)).sort();
  const map = {};
  for (const slug of slugs) map[slug] = await dominantColor(join(OUT, slug + ".webp"));
  await writeFile(MANIFEST, `// Generado por scripts/crests.mjs — no editar a mano. Escudo → color dominante del club.\nexport const CRESTS: Readonly<Record<string, string>> = ${JSON.stringify(map, null, 2)};\n`);
  return slugs.length;
}

const args = process.argv.slice(2);
await mkdir(OUT, { recursive: true });
if (args.length) {
  for (const file of await listInputs(args)) {
    const slug = slugify(basename(file, extname(file)));
    if (!slug) { console.warn("Nombre no válido:", file); continue; }
    const { buf, mode } = await encode(await prepare(await readFile(file)));
    await writeFile(join(OUT, slug + ".webp"), buf);
    console.log(`✓ ${slug}.webp  ${(buf.length / 1024).toFixed(1)} KB  (${mode})`);
  }
}
console.log(`Manifiesto: ${await writeManifest()} escudos`);
