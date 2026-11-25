#!/usr/bin/env python3
"""Añade un contorno fino de color al contorno de un escudo ya convertido (webp con transparencia).

  python3 scripts/crest-outline.py bge-aiboa            # contorno negro de 1,1 % del lado
  python3 scripts/crest-outline.py bge-aiboa "#000000" 0.011

Actúa sobre public/escudos/<slug>.webp y su versión ligera public/escudos/m/<slug>.webp. Se puede repetir sin acumular grosor
(parte siempre del escudo sin contorno guardado en assets/escudos-sin-contorno/).
"""
import sys, shutil
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

slug = sys.argv[1]; color = sys.argv[2] if len(sys.argv) > 2 else "#000000"; frac = float(sys.argv[3]) if len(sys.argv) > 3 else 0.011
rgb = tuple(int(color.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4))
big, small = Path(f"public/escudos/{slug}.webp"), Path(f"public/escudos/m/{slug}.webp")
backup = Path("assets/escudos-sin-contorno"); backup.mkdir(parents=True, exist_ok=True)

def outline(src: Path):
    keep = backup / (src.parent.name + "-" + src.name)
    if not keep.exists(): shutil.copy(src, keep)          # original sin contorno
    im = Image.open(keep).convert("RGBA"); a = np.array(im); alpha = a[:, :, 3] > 20
    px = max(1, round(im.width * frac))
    yy, xx = np.ogrid[-px:px + 1, -px:px + 1]; disk = (xx * xx + yy * yy) <= px * px
    ring = ndi.binary_dilation(alpha, structure=disk) & ~alpha
    out = a.copy(); out[ring] = (*rgb, 255)
    # suaviza el borde exterior con un poco de antialiasing
    soft = ndi.gaussian_filter(ring.astype(float), .7); edge = (soft > 0) & ~alpha & ~ring
    out[edge] = (*rgb, 0); out[edge, 3] = (soft[edge] * 255).astype(np.uint8)
    Image.fromarray(out).save(src, "WEBP", lossless=True, quality=100, method=6)
    print("✓", src, f"contorno {px}px")

outline(big); outline(small)
