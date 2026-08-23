# -*- coding: utf-8 -*-
"""Extract colourful minimaps from maps/minimap.lpq (LPQ\\x1a + LZO 0.22).

Indoor maps sit on a black canvas — crop that padding so the page shows the
actual coloured room, not a black stamp. Tiny maps are nearest-neighbour
scaled so they stay readable next to 詳圖.
"""
from __future__ import print_function
import io, struct
from pathlib import Path

import lzo
from PIL import Image

CLIENT = Path(r"C:\Lager\nflonline\maps\minimap.lpq")
OUT = Path(__file__).resolve().parents[1] / "site" / "htm" / "map" / "client"

# 官方封包錯置的槽位：LPQ 內的圖不是這張地圖（audit_client_imgs.py 抓的）。
# 10106 神燈沙漠裝的是萵苣村變體；正確圖由 fix_10106_minimap.py 從 ADF 內嵌 BMP 修復。
BAD_SLOTS = {10106}


def parse_lpq(data):
    if data[:4] != b"LPQ\x1a":
        raise ValueError("not LPQ")
    table_off = struct.unpack_from("<I", data, 0x18)[0]
    count = struct.unpack_from("<I", data, 0x1C)[0]
    ents = []
    for i in range(count):
        o = table_off + i * 28
        off, csz, usz, flg = struct.unpack_from("<IIII", data, o)
        ents.append({"off": off, "csz": csz, "usz": usz, "flg": flg})
    return ents


def decomp(data, ent):
    blob = data[ent["off"] : ent["off"] + ent["csz"]]
    usz = ent["usz"]
    if usz <= 0 or usz > 8_000_000:
        raise ValueError("bad usize")
    try:
        out = lzo.decompress(blob, False, usz)
        return out[:usz]
    except Exception:
        if blob[:2] == b"BM":
            return blob[:usz] if usz <= len(blob) else blob
        raise


def _dark_frac(im, thresh=12):
    pix = list(im.getdata())
    if not pix:
        return 1.0
    return sum(1 for p in pix if max(p) <= thresh) / float(len(pix))


def crop_letterbox(img, thresh=16, pad=4):
    """Drop unused black canvas. Leave outdoor maps (green/dirt edges) alone."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    if w < 8 or h < 8:
        return img
    top = rgb.crop((0, 0, w, 2))
    bot = rgb.crop((0, h - 2, w, h))
    lef = rgb.crop((0, 0, 2, h))
    rig = rgb.crop((w - 2, 0, w, h))
    edge = (_dark_frac(top) + _dark_frac(bot) + _dark_frac(lef) + _dark_frac(rig)) / 4.0
    if edge < 0.82:
        return img
    mask = rgb.convert("L").point(lambda p: 255 if p > thresh else 0)
    bbox = mask.getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(w, x1 + pad)
    y1 = min(h, y1 + pad)
    if (x1 - x0) * (y1 - y0) > 0.92 * w * h:
        return img
    return img.crop((x0, y0, x1, y1))


def upscale_small(img, min_side=280):
    w, h = img.size
    m = max(w, h)
    if m >= min_side:
        return img
    scale = max(2, int((min_side + m - 1) / m))
    return img.resize((w * scale, h * scale), Image.NEAREST)


def punch_black(img, thresh=8, min_frac=0.18):
    """Indoor maps keep black corners after crop — punch to alpha so the UI parchment shows through."""
    rgba = img.convert("RGBA")
    try:
        import numpy as np
        arr = np.array(rgba)
        dark = arr[:, :, :3].max(axis=2) <= thresh
        if dark.mean() < min_frac:
            return img.convert("RGB") if img.mode != "RGBA" else img
        arr[:, :, 3] = np.where(dark, 0, arr[:, :, 3])
        return Image.fromarray(arr)
    except ImportError:
        return img


def polish(img):
    out = upscale_small(crop_letterbox(img.convert("RGB")))
    return punch_black(out)


def main():
    data = CLIENT.read_bytes()
    ents = parse_lpq(data)
    print("entries", len(ents))
    names_blob = decomp(data, ents[0]).decode("latin1", "replace")
    names = [ln.strip() for ln in names_blob.replace("\r", "\n").split("\n") if ln.strip() and not ln.startswith("(")]
    print("names", len(names), names[:8])
    OUT.mkdir(parents=True, exist_ok=True)
    ok = 0
    fail = 0
    cropped = 0
    for i, ent in enumerate(ents[1:]):
        name = names[i] if i < len(names) else ("%d.bmp" % (i + 1))
        stem = Path(name).stem
        if not stem.isdigit():
            fail += 1
            continue
        if int(stem) in BAD_SLOTS:
            print("skip bad slot", stem, "(LPQ image is a foreign map; see fix_%s_minimap.py)" % stem)
            continue
        try:
            raw = decomp(data, ent)
        except Exception as e:
            print("fail", name, e)
            fail += 1
            continue
        if raw[:2] != b"BM":
            print("not bmp", name, raw[:8])
            fail += 1
            continue
        img = Image.open(io.BytesIO(raw))
        src_size = img.size
        out = polish(img)
        if out.size != src_size:
            cropped += 1
        out.save(OUT / (stem + ".png"), optimize=True)
        ok += 1
        if ok <= 3 or int(stem) in (10001, 10009, 10058, 40003, 20001, 30001):
            print("ok", name, src_size, "->", out.size)
    print("saved", ok, "cropped_or_scaled", cropped, "fail", fail, "dir", OUT)


if __name__ == "__main__":
    main()
