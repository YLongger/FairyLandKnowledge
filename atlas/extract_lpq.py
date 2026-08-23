# -*- coding: utf-8 -*-
"""Generic Fairyland LPQ\\x1a + LZO extractor (same layout as maps/minimap.lpq)."""
from __future__ import print_function
import io, struct
from pathlib import Path

import lzo
from PIL import Image


def parse_lpq(data):
    if data[:4] != b"LPQ\x1a":
        raise ValueError("not LPQ")
    table_off = struct.unpack_from("<I", data, 0x18)[0]
    count = struct.unpack_from("<I", data, 0x1C)[0]
    if table_off <= 0 or count <= 0 or count > 20000:
        raise ValueError("bad lpq table %s %s" % (table_off, count))
    ents = []
    for i in range(count):
        o = table_off + i * 28
        off, csz, usz, flg = struct.unpack_from("<IIII", data, o)
        ents.append({"off": off, "csz": csz, "usz": usz, "flg": flg})
    return ents


def decomp(data, ent):
    blob = data[ent["off"] : ent["off"] + ent["csz"]]
    usz = ent["usz"]
    if usz <= 0 or usz > 12_000_000:
        raise ValueError("bad usize")
    try:
        out = lzo.decompress(blob, False, usz)
        return out[:usz]
    except Exception:
        if blob[:2] == b"BM":
            return blob[:usz] if usz <= len(blob) else blob
        raise


def extract_lpq(path, dest, limit=0, magenta_key=True):
    data = Path(path).read_bytes()
    ents = parse_lpq(data)
    names_blob = decomp(data, ents[0])
    try:
        names_txt = names_blob.decode("latin1")
    except Exception:
        names_txt = names_blob.decode("ascii", "replace")
    names = [ln.strip() for ln in names_txt.replace("\r", "\n").split("\n") if ln.strip() and not ln.startswith("(")]
    dest = Path(dest)
    dest.mkdir(parents=True, exist_ok=True)
    ok = 0
    fail = 0
    kept = []
    for i, ent in enumerate(ents[1:]):
        if limit and ok >= limit:
            break
        name = names[i] if i < len(names) else ("file_%d.bin" % i)
        try:
            raw = decomp(data, ent)
        except Exception as e:
            fail += 1
            continue
        if raw[:2] != b"BM":
            fail += 1
            continue
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGBA")
        except Exception:
            fail += 1
            continue
        if magenta_key:
            import numpy as np
            arr = np.array(img)
            mag = (arr[:, :, 0] > 240) & (arr[:, :, 1] < 20) & (arr[:, :, 2] > 240)
            arr[mag, 3] = 0
            img = Image.fromarray(arr)
        stem = Path(name.replace("\\", "_").replace("/", "_")).stem
        outp = dest / (stem + ".png")
        img.save(outp)
        kept.append(stem)
        ok += 1
    return {"ok": ok, "fail": fail, "names": names[:20], "kept": kept, "n_names": len(names)}
