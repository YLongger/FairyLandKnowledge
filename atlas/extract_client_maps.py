# -*- coding: utf-8 -*-
"""Decode 2026 client maps\\*.adf (FGF300 map packs) into names, warps, NPCs, tiles.

Map files are NOT pictures. Each .adf is a multi-frame FGF container:
  MAPNAME / NPC / MOB text (Big5), warp scripts `//id\\tx\\ty\\tdir`,
  and a walkable/tile layer we render as a layout PNG.

Does not need Ghidra. Run:
  python atlas/extract_client_maps.py
"""
from __future__ import print_function
import json, re, struct, sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIENT = Path(r"C:\Lager\nflonline")
FGF_DIR = Path(r"C:\Users\user-66990\Desktop\tai-tong-tools\research\fairyland_unpack\scripts")
OUT_JSON = Path(__file__).resolve().parent / "client_maps.json"
IMG_DIR = ROOT / "site" / "htm" / "map" / "client"

sys.path.insert(0, str(FGF_DIR))
from fgf_decode_final import parse_fgf, depack_601490  # noqa

try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw

SKIP_NPC = {
    "雞", "乳牛", "牛", "羊咩咩", "小黃狗", "小黃貓", "小黑貓", "小黃", "小黑",
    "小藍喵", "波波", "Vendor_1", "Vendor_2", "Vendor_3",
}


def dec(blob):
    if not blob:
        return ""
    for enc in ("big5", "cp950", "gbk"):
        try:
            return blob.decode(enc)
        except Exception:
            continue
    return blob.decode("big5", errors="replace")


def decode_frame(fr):
    payload = fr["payload"]
    raw_size = fr["raw_size"] or 0
    if fr["flag"] == 1:
        blob, _sp, why = depack_601490(payload, expected_out=raw_size if raw_size else None)
        return blob, why
    return payload[:raw_size] if raw_size else payload, "raw"


def looks_text(blob):
    if not blob:
        return False
    sample = blob[: min(80, len(blob))]
    if b"MAPNAME:" in blob or b"NAME:" in blob or b"CNAME:" in blob:
        return True
    if sample.startswith(b"//") or sample.startswith(b"OUP") or sample.startswith(b"OUF"):
        return True
    if sample[:1].isdigit() and b"\t" in sample[:20]:
        return True
    # mostly printable / CR LF
    ok = sum(1 for b in sample if b in (9, 10, 13) or 32 <= b < 127 or b >= 0x80)
    return ok >= len(sample) * 0.85


def parse_meta(text):
    name = ""
    m = re.search(r"MAPNAME:([^\r\n]+)", text)
    if m:
        name = m.group(1).strip()
    return name


def parse_npcs(text):
    npcs = []
    blocks = re.split(r"\r?\n(?=X:)", text)
    for b in blocks:
        xm = re.search(r"X:(\d+)", b)
        ym = re.search(r"Y:(\d+)", b)
        nm = re.search(r"NAME:([^\r\n]+)", b)
        if not (xm and ym and nm):
            continue
        n = nm.group(1).strip()
        if not n or n in SKIP_NPC or n.startswith("Vendor"):
            continue
        if n.startswith("幻獸"):
            continue
        if not any("\u4e00" <= c <= "\u9fff" for c in n):
            continue
        npcs.append({"n": n, "x": int(xm.group(1)), "y": int(ym.group(1))})
    # unique by name+pos
    seen = set()
    out = []
    for a in npcs:
        k = (a["n"], a["x"], a["y"])
        if k in seen:
            continue
        seen.add(k)
        out.append(a)
    return out


def parse_mobs(text):
    """MOB blocks: NAME:/LEVEL:/MODEL:/CNAME:  (CNAME is the Chinese display name)."""
    by_name = {}
    chunks = re.split(r"\r?\n(?=NAME:)", text)
    for ch in chunks:
        cm = re.search(r"CNAME:([^\r\n]+)", ch)
        if not cm:
            continue
        n = cm.group(1).strip()
        if not n or not any("\u4e00" <= c <= "\u9fff" for c in n):
            continue
        lv = None
        lm = re.search(r"LEVEL:(\d+)", ch)
        if lm:
            lv = int(lm.group(1))
        model = None
        mm = re.search(r"MODEL:(\d+)", ch)
        if mm:
            model = int(mm.group(1))
        prev = by_name.get(n)
        if not prev:
            by_name[n] = {"n": n, "lv": lv, "lv2": lv, "model": model}
        else:
            if lv is not None:
                if prev["lv"] is None or lv < prev["lv"]:
                    prev["lv"] = lv
                if prev["lv2"] is None or lv > prev["lv2"]:
                    prev["lv2"] = lv
            if model and not prev.get("model"):
                prev["model"] = model
    return list(by_name.values())[:40]


def parse_warps(text):
    """Feng Script comments: //dest\\tx\\ty\\tdir  (x,y are ON THE DESTINATION)."""
    warps = []
    for m in re.finditer(r"//(\d{4,6})\t(\d+)\t(\d+)\t(\d+)", text):
        dest = int(m.group(1))
        if dest < 10000 or dest > 80000:
            continue
        warps.append({"t": dest, "x": int(m.group(2)), "y": int(m.group(3)), "d": int(m.group(4))})
    seen = set()
    out = []
    for w in warps:
        k = (w["t"], w["x"], w["y"], w["d"])
        if k in seen:
            continue
        seen.add(k)
        out.append(w)
    return out


def parse_local_warps(text, w, h):
    """Tile cells on THIS map: x\\ty\\tindex."""
    cells = []
    for m in re.finditer(r"(?m)^(\d+)\t(\d+)\t(\d+)\s*$", text):
        x, y = int(m.group(1)), int(m.group(2))
        if w and h and (x >= w or y >= h):
            continue
        if x > 2000 or y > 2000:
            continue
        cells.append((x, y))
    return cells[:80]


def parse_wh_tiles(blob):
    """Frame that starts with u32 w,h then w*h pixels (2 or 4 bytes)."""
    if len(blob) < 16:
        return None
    w, h = struct.unpack_from("<II", blob, 0)
    if not (8 <= w <= 2048 and 8 <= h <= 2048):
        return None
    rest = len(blob) - 8
    n = w * h
    if rest == n * 4:
        return w, h, 4, blob[8:]
    if rest == n * 2:
        return w, h, 2, blob[8:]
    if rest == n:
        return w, h, 1, blob[8:]
    return None


def render_tiles(w, h, bpp, pix, local_warps, npcs, dest):
    img = Image.new("RGB", (w, h), (18, 28, 22))
    px = img.load()
    if bpp == 4:
        step = 4
    elif bpp == 2:
        step = 2
    else:
        step = 1
    for y in range(h):
        row = y * w
        for x in range(w):
            o = (row + x) * step
            if o + step > len(pix):
                break
            if step == 4:
                v = pix[o]
                g = pix[o + 1]
                b = pix[o + 2]
                if v == 0 and g == 0 and b == 0:
                    col = (22, 24, 28)
                else:
                    col = (40 + (v % 80), 70 + (g % 90), 50 + (b % 70))
            elif step == 2:
                v = pix[o] | (pix[o + 1] << 8)
                if v == 0:
                    col = (22, 24, 28)
                elif v == 1:
                    col = (70, 120, 78)
                else:
                    col = (50 + (v * 17) % 140, 80 + (v * 13) % 100, 60)
            else:
                v = pix[o]
                col = (30 + v % 180, 50 + (v * 3) % 140, 40)
            px[x, y] = col
    draw = ImageDraw.Draw(img)
    for x, y in local_warps:
        if 0 <= x < w and 0 <= y < h:
            draw.rectangle((x - 1, y - 1, x + 1, y + 1), fill=(220, 72, 64))
    for n in npcs:
        x, y = n["x"], n["y"]
        if 0 <= x < w and 0 <= y < h:
            draw.rectangle((x, y, x, y), fill=(240, 210, 80))
    # scale so short side >= 160, long side <= 640
    side = max(w, h)
    if side < 160:
        scale = max(2, 160 // side)
        img = img.resize((w * scale, h * scale), Image.NEAREST)
    elif side > 640:
        scale = 640 / float(side)
        img = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.NEAREST)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "PNG", optimize=True)


def extract_one(path, known_ids):
    data = path.read_bytes()
    rec = {
        "id": None,
        "file": path.name,
        "n": "",
        "w": 0,
        "h": 0,
        "warps": [],
        "to": [],
        "npcs": [],
        "mobs": [],
        "img": None,
        "frames": 0,
    }
    m = re.fullmatch(r"(\d+)(?:_(\d+))?\.adf", path.name, re.I)
    if not m:
        return None
    rec["id"] = int(m.group(1))
    rec["layer"] = m.group(2)
    if rec["layer"]:
        # seasonal/time variants — skip, base file is enough
        return None
    try:
        info = parse_fgf(data)
    except Exception as ex:
        rec["err"] = str(ex)
        return rec
    rec["frames"] = info["count"]
    texts = []
    tiles = None
    for fr in info["frames"]:
        blob, _why = decode_frame(fr)
        if looks_text(blob):
            texts.append(dec(blob))
            continue
        tw = parse_wh_tiles(blob)
        if tw and (tiles is None or tw[0] * tw[1] > tiles[0] * tiles[1]):
            tiles = tw
    all_txt = "\n".join(texts)
    rec["n"] = parse_meta(all_txt)
    rec["npcs"] = parse_npcs(all_txt)[:40]
    rec["mobs"] = parse_mobs(all_txt)[:24]
    warps = [w for w in parse_warps(all_txt) if w["t"] in known_ids]
    rec["warps"] = warps[:24]
    rec["to"] = sorted(set(w["t"] for w in warps))
    if tiles:
        rec["w"], rec["h"] = tiles[0], tiles[1]
        rel = "htm/map/client/%d.png" % rec["id"]
        dest = IMG_DIR / ("%d.png" % rec["id"])
        # Colourful minimaps live in this folder. Never overwrite them with walk-grids.
        if dest.exists():
            rec["img"] = rel
        else:
            local = parse_local_warps(all_txt, rec["w"], rec["h"])
            try:
                render_tiles(tiles[0], tiles[1], tiles[2], tiles[3], local, rec["npcs"], dest)
                rec["img"] = rel
            except Exception as ex:
                rec["img_err"] = str(ex)
    return rec


def try_lpq(known_ids):
    """Best-effort: Storm-like LPQ (magic LPQ\\x1a). Returns count extracted."""
    lpq = CLIENT / "maps" / "minimap.lpq"
    if not lpq.is_file():
        print("no minimap.lpq")
        return 0
    d = lpq.read_bytes()
    print("LPQ magic", d[:4], "size", len(d))
    # try decompress (listfile) with FGF aPLib
    off = d.find(b"(listfile)")
    print(" (listfile) at", off)
    got = 0
    if off >= 0:
        try:
            blob, sp, why = depack_601490(d[off : off + 400000], expected_out=200000)
            text = blob.decode("latin1", "replace")
            print(" listfile depack", why, "len", len(blob), "head", text[:200].replace("\n", "|"))
            names = re.findall(r"(\d{4,6})\.bmp", text, re.I)
            print(" listfile names", len(names), names[:12])
        except Exception as ex:
            print(" listfile aplib fail", type(ex).__name__, ex)
    # try zlib at first-file payload
    import zlib
    for start in (49, 48, 50, 32, 64):
        for wbits in (15, -15):
            try:
                out = zlib.decompress(d[start : start + 400000], wbits)
                if out[:2] == b"BM":
                    print(" zlib BM at", start, "wbits", wbits, "len", len(out))
                    got += 1
            except Exception:
                pass
    return got


def main():
    maps_dir = CLIENT / "maps"
    files = sorted(p for p in maps_dir.glob("*.adf") if re.fullmatch(r"\d+(?:_\d+)?\.adf", p.name, re.I))
    known = set()
    for p in files:
        m = re.fullmatch(r"(\d+)", p.stem.split("_")[0])
        if m:
            known.add(int(m.group(1)))
    print("adf", len(files), "unique ids", len(known))
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    rows = []
    named = 0
    imaged = 0
    for i, p in enumerate(files, 1):
        rec = extract_one(p, known)
        if rec is None:
            continue
        rows.append(rec)
        if rec.get("n"):
            named += 1
        if rec.get("img"):
            imaged += 1
        if i % 40 == 0 or i == len(files):
            print("  %d/%d named=%d img=%d last=%s %s" % (i, len(files), named, imaged, rec.get("id"), rec.get("n")))
    rows.sort(key=lambda r: r["id"])
    payload = {
        "source": str(maps_dir),
        "count": len(rows),
        "named": named,
        "imaged": imaged,
        "maps": rows,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT_JSON, "bytes", OUT_JSON.stat().st_size)
    print("named", named, "imaged", imaged, "rows", len(rows))
    # sample
    for rec in rows:
        if rec["id"] in (10001, 10009, 10058, 40003, 10405, 40301):
            print(" ", rec["id"], rec["n"], "w", rec["w"], "h", rec["h"], "warps", len(rec["warps"]), "npcs", len(rec["npcs"]), "img", rec.get("img"))
    print("---- lpq ----")
    try_lpq(known)


if __name__ == "__main__":
    main()
