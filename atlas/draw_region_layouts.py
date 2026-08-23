# -*- coding: utf-8 -*-
"""Draw locked geography diagrams for expansion maps (node % + links)."""
from __future__ import print_function
import json, re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "img" / "layout"
REPO = ROOT.parent

SIZES = {
    "clothes": (1200, 800),
    "mainland": (1168, 880),
}
DEFAULT = (2000, 1400)

TONES = {
    "mermaid": (40, 90, 120),
    "alice": (120, 70, 90),
    "nights": (150, 120, 70),
    "clothes": (140, 110, 50),
    "oz": (70, 120, 70),
    "thumb": (80, 110, 60),
    "beast": (110, 70, 55),
    "momo": (160, 110, 100),
    "candy": (120, 150, 170),
}


def load():
    t = (ROOT / "data.js").read_text(encoding="utf-8")
    return json.loads(re.search(r"window.ATLAS=(.*);?\s*$", t, re.S).group(1).rstrip().rstrip(";"))


def draw_region(D, rid):
    r = [x for x in D["regions"] if x["id"] == rid][0]
    places = [p for p in D["places"] if p["r"] == rid]
    w, h = SIZES.get(rid, DEFAULT)
    bg = TONES.get(rid, (90, 90, 80))
    img = Image.new("RGB", (w, h), tuple(min(255, c + 50) for c in bg))
    d = ImageDraw.Draw(img)
    # vignette-ish border
    d.rectangle((8, 8, w - 9, h - 9), outline=(240, 220, 170), width=6)
    by = {p["id"]: p for p in places}
    # links first
    seen = set()
    for p in places:
        x1, y1 = p["x"] / 100.0 * w, p["y"] / 100.0 * h
        for lid in p.get("links") or []:
            q = by.get(lid)
            if not q:
                continue
            key = tuple(sorted((p["id"], lid)))
            if key in seen:
                continue
            seen.add(key)
            x2, y2 = q["x"] / 100.0 * w, q["y"] / 100.0 * h
            d.line((x1, y1, x2, y2), fill=(210, 170, 70), width=14)
            d.line((x1, y1, x2, y2), fill=(250, 230, 150), width=6)
    colors = [
        (220, 80, 70), (70, 140, 90), (70, 110, 190), (200, 150, 40),
        (160, 80, 160), (40, 150, 150), (200, 100, 50), (90, 90, 90),
        (180, 60, 100), (80, 170, 70), (50, 80, 140), (170, 170, 60),
    ]
    for i, p in enumerate(places):
        x, y = p["x"] / 100.0 * w, p["y"] / 100.0 * h
        col = colors[i % len(colors)]
        rad = 34 if len(places) < 8 else 26
        d.ellipse((x - rad - 4, y - rad - 4, x + rad + 4, y + rad + 4), outline=(255, 245, 210), width=4)
        d.ellipse((x - rad, y - rad, x + rad, y + rad), fill=col, outline=(30, 24, 16), width=2)
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / ("%s.png" % rid)
    img.save(dest, "PNG")
    print("wrote", dest, img.size, "places", len(places), "routes", len(seen))


def main():
    D = load()
    for r in D["regions"]:
        if r["id"] == "mainland":
            continue
        draw_region(D, r["id"])


if __name__ == "__main__":
    main()
