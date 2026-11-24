#!/usr/bin/env python3
"""Amplía con superresolución (EDSR ×4) los escudos de baja resolución antes de convertirlos.

  pip install "opencv-contrib-python-headless==4.10.0.84" "numpy<2.1"
  python3 scripts/upscale-crests.py                 # assets/escudos-originales → assets/escudos-ampliados
  python3 scripts/upscale-crests.py Leioa Derio     # solo esos clubes (nombre de archivo sin extensión)
  npm run crests -- assets/escudos-ampliados        # → public/escudos/*.webp (1024 × 1024)

Los escudos que ya miden ≥ 1000 px se copian tal cual. El modelo (38 MB) se descarga una vez a ~/.cache.
"""
import sys, shutil, urllib.request
from pathlib import Path
import cv2, numpy as np

SRC, DST = Path("assets/escudos-originales"), Path("assets/escudos-ampliados")
MODEL = Path.home() / ".cache/derio-cup/EDSR_x4.pb"
MODEL_URL = "https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x4.pb"
TARGET_MIN = 600   # se repite la ampliación hasta que el escudo mida al menos esto (máx. 2 pasadas)

def load_model():
    if not MODEL.exists():
        MODEL.parent.mkdir(parents=True, exist_ok=True)
        print("Descargando modelo EDSR…"); urllib.request.urlretrieve(MODEL_URL, MODEL)
    sr = cv2.dnn_superres.DnnSuperResImpl_create(); sr.readModel(str(MODEL)); sr.setModel("edsr", 4); return sr

def fill_transparent(rgb, alpha):
    """Propaga el color opaco hacia lo transparente para que no aparezcan halos oscuros al ampliar."""
    mask = (alpha > 8).astype(np.uint8)
    if mask.all(): return rgb
    _, labels = cv2.distanceTransformWithLabels(1 - mask, cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL)
    ys, xs = np.nonzero(mask); idx = np.zeros(labels.max() + 1, dtype=np.int64); idx[labels[ys, xs]] = np.arange(len(ys))
    return rgb[ys[idx[labels]], xs[idx[labels]]]

def upscale(sr, im):
    has_alpha = im.shape[2] == 4
    if has_alpha:
        ys, xs = np.nonzero(im[..., 3] > 8)                       # recorta al escudo: todos los píxeles cuentan
        m = 2; y0, y1, x0, x1 = max(ys.min() - m, 0), ys.max() + 1 + m, max(xs.min() - m, 0), xs.max() + 1 + m
        im = im[y0:y1, x0:x1]
    rgb = np.ascontiguousarray(im[..., :3]); alpha = im[..., 3] if has_alpha else None
    if has_alpha: rgb = fill_transparent(rgb, alpha)
    for _ in range(2):
        rgb = sr.upsample(rgb)
        if has_alpha:
            a = sr.upsample(cv2.cvtColor(alpha, cv2.COLOR_GRAY2BGR))[..., 0]
            alpha = np.clip((a.astype(np.float32) / 255 - 0.5) * 2.2 + 0.5, 0, 1)  # silueta nítida
            alpha = (alpha * 255).astype(np.uint8)
        if max(rgb.shape[:2]) >= TARGET_MIN: break
    return np.dstack([rgb, alpha]) if has_alpha else rgb

def main():
    DST.mkdir(parents=True, exist_ok=True); sr = None
    only = {a.lower() for a in sys.argv[1:]}
    for f in sorted(SRC.iterdir()):
        if f.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}: continue
        if only and f.stem.lower() not in only: continue
        im = cv2.imread(str(f), cv2.IMREAD_UNCHANGED)
        if im is None: print("No se pudo leer", f); continue
        if im.ndim == 2: im = cv2.cvtColor(im, cv2.COLOR_GRAY2BGR)
        out = DST / (f.stem + ".png")
        if max(im.shape[:2]) >= 1000: shutil.copy(f, DST / f.name); print("=", f.name, "ya es grande"); continue
        sr = sr or load_model()
        res = upscale(sr, im); cv2.imwrite(str(out), res); print("↑", f.name, im.shape[1::-1], "→", res.shape[1::-1])

if __name__ == "__main__": main()
