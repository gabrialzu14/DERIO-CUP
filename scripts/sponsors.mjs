#!/usr/bin/env node
/* Convierte los logos de patrocinadores a una máscara monocolor (blanco sobre transparente, WebP sin pérdida).
   La app los tiñe según el tema: azul en claro, rojo en oscuro.
   Uso:  npm run sponsors            (procesa assets/patrocinadores-originales/)
   Modo por logo (segundo bloque «MODES»):
     alpha → la silueta es el canal alfa del archivo (logos con fondo transparente, SVG)
     dark  → la silueta es lo oscuro del logo (lo claro se vacía): p. ej. insignia oscura con letras blancas
     ink   → logo oscuro sobre fondo claro (sin transparencia): la silueta es la tinta, con bordes suaves */
import sharp from "sharp";
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { extname, join, resolve, basename } from "node:path";

const IN = resolve("assets/patrocinadores-originales"), OUT = resolve("public/patrocinadores"), MANIFEST = resolve("app/lib/sponsors.generated.ts");
const MODES = { "dimension-football": "dark", "restaurante-la-ofi": "dark", adidas: "ink" }; // el resto: alpha
const MAX = 720;

const slugify = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function mask(file, mode) {
  const ext = extname(file).toLowerCase();
  const { data, info } = await sharp(file, ext === ".svg" ? { density: 600 } : {}).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let p = 0; p < info.width * info.height; p++) {
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2], a = data[p * 4 + 3] / 255;
    let alpha = a;
    if (mode === "ink") { const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; alpha = a * Math.min(1, Math.max(0, (1 - L - 0.04) / 0.92)); }
    if (mode === "dark") { const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; alpha = a * Math.min(1, Math.max(0, (0.62 - L) / 0.15)); }
    out[p * 4] = out[p * 4 + 1] = out[p * 4 + 2] = 255; out[p * 4 + 3] = Math.round(alpha * 255);
  }
  let img = sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } });
  img = sharp(await img.png().toBuffer()).trim({ threshold: 8 });
  return img.resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: ext !== ".svg" }).webp({ lossless: true, effort: 6 }).toBuffer({ resolveWithObject: true });
}

await mkdir(OUT, { recursive: true });
const manifest = {};
for (const f of (await readdir(IN)).sort()) {
  if (![".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(extname(f).toLowerCase())) continue;
  const slug = slugify(basename(f, extname(f))), { data, info } = await mask(join(IN, f), MODES[slug] ?? "alpha");
  await writeFile(join(OUT, slug + ".webp"), data);
  manifest[slug] = { w: info.width, h: info.height };
  console.log(`✓ ${slug}.webp  ${info.width}×${info.height}  ${(data.length / 1024).toFixed(1)} KB`);
}
await writeFile(MANIFEST, `// Generado por scripts/sponsors.mjs — no editar a mano. Medidas (px) de cada logo para mantener su proporción.\nexport const SPONSOR_ASSETS: Readonly<Record<string, { w: number; h: number }>> = ${JSON.stringify(manifest, null, 2)};\n`);
