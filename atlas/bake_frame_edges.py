# -*- coding: utf-8 -*-
"""Bake cream frame color into the outer edges of every atlas base map.

Why: the artwork's outer rows (deep sea etc.) are dark. When the map is
zoomed out, that dark border compresses into a hard "black line" against
the cream mat (.map-inner #efe6cf). CSS overlays (.frame-edge) proved
fragile across Windows DPI 125%/150% because the overlay and the img can
round to different device pixels, exposing a 1px dark seam. Baking the
fade into the pixels themselves is immune to CSS, zoom, DPI and rounding.

Idempotent-ish: re-running re-blends already-cream edges toward the same
cream, so output converges. Originals are backed up once into
atlas/_rev/prebake/ (pack_atlas.py ignores _rev).

Usage:  python atlas/bake_frame_edges.py
"""
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
IMG = HERE / "img"
BACKUP = HERE / "_rev" / "prebake"
CREAM = np.array([239.0, 230.0, 207.0])  # .map-inner / frame #efe6cf
SKIP = {"mainland-orig.jpg"}  # untouchable original reference art
SOLID = 4  # outermost rows forced to pure cream (img overscans -3px in CSS)


def profile(band, length):
    """alpha per distance-from-edge: 1.0 at edge -> 0.0 at band (smoothstep)."""
    d = np.arange(length, dtype=np.float64)
    t = np.clip(1.0 - d / float(band), 0.0, 1.0)
    a = t * t * (3.0 - 2.0 * t)
    a[:SOLID] = 1.0
    return a


def bake(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    band = int(round(min(w, h) * 0.03))
    band = max(48, min(band, 96))
    band_bottom = int(round(band * 1.25))
    px = np.asarray(im, dtype=np.float64)

    ay = np.zeros(h)
    ay = np.maximum(ay, np.concatenate([profile(band, h)]))                    # top
    ay = np.maximum(ay, profile(band_bottom, h)[::-1])                         # bottom
    ax = np.zeros(w)
    ax = np.maximum(ax, profile(band, w))                                      # left
    ax = np.maximum(ax, profile(band, w)[::-1])                                # right

    a = np.maximum(ay[:, None], ax[None, :])[:, :, None]
    out = px * (1.0 - a) + CREAM[None, None, :] * a
    res = Image.fromarray(np.clip(out + 0.5, 0, 255).astype(np.uint8), "RGB")
    res.save(path, quality=93, subsampling=1)
    print("baked %-18s %dx%d band=%d bottom=%d" % (path.name, w, h, band, band_bottom))


def main():
    BACKUP.mkdir(parents=True, exist_ok=True)
    for p in sorted(IMG.glob("*.jpg")):
        if p.name in SKIP:
            print("skip ", p.name)
            continue
        bak = BACKUP / p.name
        if not bak.exists():
            shutil.copy2(p, bak)
        bake(p)


if __name__ == "__main__":
    main()
