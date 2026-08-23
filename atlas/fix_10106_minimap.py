# -*- coding: utf-8 -*-
"""Rebuild the 神燈沙漠 (10106) client minimap.

minimap.lpq's 10106 slot holds a copy of a 60x120 village map (wrong picture,
dims can never fit 80x120). The real desert minimap IS embedded in 10106.adf
frame 10, but with rectangular black dropouts. This script extracts it and
patches the holes by quilting nearby intact sand texture, then saves through
the same polish pipeline the other minimaps use.
"""
from __future__ import print_function
import io
import sys
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
OUT = ROOT / "site" / "htm" / "map" / "client" / "10106.png"
FGF_DIR = Path(r"C:\Users\user-66990\Desktop\tai-tong-tools\research\fairyland_unpack\scripts")
sys.path.insert(0, str(FGF_DIR))
from fgf_decode_final import parse_fgf, depack_601490  # noqa

data = Path(r"C:\Lager\nflonline\maps\10106.adf").read_bytes()
info = parse_fgf(data)
bmp = None
for fr in info["frames"]:
    try:
        blob = (depack_601490(fr["payload"], expected_out=fr["raw_size"] or None)[0]
                if fr["flag"] == 1 else fr["payload"][: fr["raw_size"]])
    except Exception:
        continue
    if blob[:2] == b"BM":
        bmp = blob
        break
assert bmp, "no embedded BMP found in 10106.adf"
im = Image.open(io.BytesIO(bmp)).convert("RGB")
arr = np.array(im)
h, w, _ = arr.shape
print("embedded minimap", im.size)

dark = arr.max(axis=2) <= 10
print("hole fraction %.1f%%" % (100.0 * dark.mean()))

# Quilt: fill each hole pixel from the nearest intact pixel in the same row
# scanned from both sides, alternating with column fill, then repeat with a
# texture offset copy so large holes keep sand grain instead of smears.
rng = np.random.RandomState(10106)
filled = arr.copy()
mask = dark.copy()
for _ in range(6):
    if not mask.any():
        break
    ys, xs = np.where(mask)
    # candidate offsets: nearby intact texture blocks
    offs = [(-13, -7), (11, 9), (-17, 12), (19, -11), (7, 15), (-9, -19)]
    done = np.zeros(len(ys), dtype=bool)
    for dy, dx in offs:
        sy = ys + dy
        sx = xs + dx
        ok = (~done) & (sy >= 0) & (sy < h) & (sx >= 0) & (sx < w)
        ok_idx = np.where(ok)[0]
        if not len(ok_idx):
            continue
        src_ok = ~mask[sy[ok_idx], sx[ok_idx]]
        take = ok_idx[src_ok]
        filled[ys[take], xs[take]] = filled[sy[take], sx[take]]
        done[take] = True
    mask = filled.max(axis=2) <= 10
print("remaining dark after quilting %.2f%%" % (100.0 * mask.mean()))

img = Image.fromarray(filled)
# same polish as extract_minimaps.py: outdoor map -> no crop; upscale small
mside = max(img.size)
if mside < 280:
    k = max(2, int((280 + mside - 1) / mside))
    img = img.resize((img.size[0] * k, img.size[1] * k), Image.NEAREST)
img.save(OUT, optimize=True)
print("saved", OUT, img.size)
