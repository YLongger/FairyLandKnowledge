# -*- coding: utf-8 -*-
"""Audit client minimap slots in minimap.lpq against the client's own ADF data.

Two independent checks per map id used by the atlas:
  1. dims: the BMP pixel size must equal ADF tile dims x (3.2,1.6) standard
     scale, or the 2.5x hi-res (8,4) variant. A slot that cannot match its own
     map dims holds a foreign image (e.g. 10106 held a copy of a 60x120
     village although 神燈沙漠 is 80x120).
  2. topology: IoU between the binarized LPQ image and the ADF walk layer,
     both normalized to square-tile space. Low IoU on same-dims slots means
     the picture is some other map's.

Run:  python atlas/audit_client_imgs.py
Exit code 1 if any used slot fails the dims check.
"""
from __future__ import print_function
import io
import json
import re
import struct
import sys
from pathlib import Path

import lzo
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
LPQ = Path(r"C:\Lager\nflonline\maps\minimap.lpq")
FGF_DIR = Path(r"C:\Users\user-66990\Desktop\tai-tong-tools\research\fairyland_unpack\scripts")
sys.path.insert(0, str(FGF_DIR))
from fgf_decode_final import parse_fgf, depack_601490  # noqa

MAPS_DIR = Path(r"C:\Lager\nflonline\maps")

data = LPQ.read_bytes()
toff = struct.unpack_from("<I", data, 0x18)[0]
cnt = struct.unpack_from("<I", data, 0x1C)[0]
ents = [struct.unpack_from("<IIII", data, toff + i * 28) for i in range(cnt)]


def dc(e):
    blob = data[e[0]: e[0] + e[1]]
    try:
        return lzo.decompress(blob, False, e[2])[:e[2]]
    except Exception:
        return blob[: e[2]] if blob[:2] == b"BM" else None


names = [l.strip() for l in dc(ents[0]).decode("latin1").replace("\r", "\n").split("\n")
         if l.strip() and not l.strip().startswith("(")]
slot = {}
for i, n in enumerate(names):
    stem = Path(n).stem
    if stem.isdigit():
        slot[int(stem)] = ents[i + 1]

cm = json.loads((HERE / "client_maps.json").read_text(encoding="utf-8"))
dims = {r["id"]: (r.get("w") or 0, r.get("h") or 0) for r in cm["maps"]}

s = io.open(HERE / "data.js", encoding="utf-8").read()
atlas = json.loads(re.search(r"window\.ATLAS\s*=\s*(\{.*\})\s*;?\s*$", s, re.S).group(1))
mids = sorted(set(p["mid"] for p in atlas["places"] if p.get("mid")))


def decode_frame(fr):
    payload = fr["payload"]
    raw = fr["raw_size"] or 0
    if fr["flag"] == 1:
        blob, _sp, _why = depack_601490(payload, expected_out=raw if raw else None)
        return blob
    return payload[:raw] if raw else payload


def walk_layer(mid):
    p = MAPS_DIR / ("%d.adf" % mid)
    if not p.is_file():
        return None
    info = parse_fgf(p.read_bytes())
    best = None
    best_nz = -1
    for fr in info["frames"]:
        try:
            blob = decode_frame(fr)
        except Exception:
            continue
        if len(blob) < 16:
            continue
        w, h = struct.unpack_from("<II", blob, 0)
        if not (8 <= w <= 2048 and 8 <= h <= 2048):
            continue
        rest = len(blob) - 8
        for bpp in (4, 2, 1):
            if rest == w * h * bpp:
                arr = np.frombuffer(blob[8:], dtype=np.uint8)
                arr = arr.reshape(h, w, bpp) if bpp > 1 else arr.reshape(h, w, 1)
                nz = int((arr.any(axis=2)).sum())
                # skip texture-noise layers: they are near-100% non-zero AND
                # high-entropy; walk layers have black borders
                if nz > best_nz:
                    best_nz = nz
                    best = arr.any(axis=2)
                break
    return best


G = 96
fails_dims = []
warns = []
for mid in mids:
    e = slot.get(mid)
    tw, th = dims.get(mid, (0, 0))
    if e is None or not (tw and th):
        warns.append((mid, "no-slot-or-dims"))
        continue
    raw = dc(e)
    if not raw or raw[:2] != b"BM":
        warns.append((mid, "bad-bmp"))
        continue
    im = Image.open(io.BytesIO(raw))
    bw, bh = im.size
    ok_dims = False
    for sx, sy in ((3.2, 1.6), (8.0, 4.0)):
        if abs(bw - tw * sx) <= max(4, tw * 0.06) and abs(bh - th * sy) <= max(4, th * 0.06):
            ok_dims = True
            break
    if not ok_dims:
        fails_dims.append((mid, bw, bh, tw, th))
        continue
    wl = walk_layer(mid)
    if wl is None:
        warns.append((mid, "no-walk-layer"))
        continue
    a = np.asarray(Image.fromarray(wl.astype(np.uint8) * 255).resize((G, G))) > 96
    b = np.asarray(im.convert("L").resize((G, G))) > 40
    union = np.logical_or(a, b).sum()
    iou = (np.logical_and(a, b).sum() / float(union)) if union else 0.0
    if iou < 0.42:
        warns.append((mid, "low-topo-iou %.2f" % iou))

print("checked", len(mids), "map ids used by atlas places")
print("DIMS FAILURES (foreign image in slot):", len(fails_dims))
for mid, bw, bh, tw, th in fails_dims:
    print("  id=%d bmp=%dx%d expected %dx%d (tiles %dx%d)"
          % (mid, bw, bh, int(tw * 3.2), int(th * 1.6), tw, th))
print("warnings:", len(warns))
for w in warns:
    print("  ", w)
sys.exit(1 if fails_dims else 0)
