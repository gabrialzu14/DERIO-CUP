#!/usr/bin/env node
/* Convierte escudos a WebP en la máxima calidad que quepa por debajo de 1 MB.
   Uso:  npm run crests -- <archivo|carpeta> [...]
   El nombre del archivo es el nombre del club («Cultural Durango.png» → cultural-durango.webp).
   Los escudos se reutilizan solos en cualquier torneo cuyo equipo tenga ese mismo nombre. */
import sharp from "sharp";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";

const LIMIT = 1_000_000; // bytes (< 1 MB)
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

/** Recorta márgenes vacíos y centra en un lienzo cuadrado transparente. */
async function prepare(buf) {
  let img = sharp(buf, { density: 600 }).rotate().ensureAlpha();
  try { img = sharp(await img.trim({ threshold: 12 }).png().toBuffer()); } catch { /* imagen sin márgenes recortables */ }
  const { data, info } = await img.png().toBuffer({ resolveWithObject: true });
  const side = Math.max(info.width, info.height), pad = Math.round(side * 0.04), canvas = side + pad * 2;
  return sharp(data).extend({ top: Math.floor((canvas - info.height) / 2), bottom: Math.ceil((canvas - info.height) / 2), left: Math.floor((canvas - info.width) / 2), right: Math.ceil((canvas - info.width) / 2), background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

/** Sin pérdida si cabe; si no, la mayor calidad con pérdida que quepa; si aún no, reduce el tamaño. */
async function encode(png) {
  let work = png;
  for (let round = 0; round < 12; round++) {
    const lossless = await sharp(work).webp({ lossless: true, effort: 6 }).toBuffer();
    if (lossless.length <= LIMIT) return { buf: lossless, mode: "sin pérdida" };
    let lo = 1, hi = 100, best = null;
    while (lo <= hi) {
      const q = (lo + hi) >> 1, out = await sharp(work).webp({ quality: q, alphaQuality: 100, effort: 6, smartSubsample: true }).toBuffer();
      if (out.length <= LIMIT) { best = { buf: out, q }; lo = q + 1; } else hi = q - 1;
    }
    if (best && best.q >= 60) return { buf: best.buf, mode: `calidad ${best.q}` };
    const { width } = await sharp(work).metadata();
    work = await sharp(work).resize({ width: Math.round(width * 0.85) }).png().toBuffer();
  }
  throw new Error("No se pudo comprimir por debajo de 1 MB");
}

async function writeManifest() {
  const slugs = (await readdir(OUT)).filter(f => f.endsWith(".webp")).map(f => f.slice(0, -5)).sort();
  await writeFile(MANIFEST, `// Generado por scripts/crests.mjs — no editar a mano.\nexport const CRESTS: ReadonlySet<string> = new Set(${JSON.stringify(slugs, null, 2)});\n`);
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
