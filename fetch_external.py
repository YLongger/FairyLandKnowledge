# -*- coding: utf-8 -*-
"""從 Wayback Machine 救援原站盜連的官網圖片。

輸出 site/ext/<path>，映射寫入 ext_map.json（原網址 -> site 相對路徑）。
"""
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).parent
SITE = ROOT / "site"
MAP_FILE = ROOT / "ext_map.json"

MAGIC = (b"GIF8", b"\x89PNG", b"\xff\xd8\xff", b"BM", b"RIFF")

urls = [u for u in (ROOT / "ext_urls.txt").read_text(encoding="utf-8").splitlines()
        if u and "dsps.case.eorz.net" not in u]

ext_map = {}
if MAP_FILE.exists():
    ext_map = json.loads(MAP_FILE.read_text(encoding="utf-8"))


def local_rel(url):
    p = re.sub(r"^https?://", "", url)
    host, _, path = p.partition("/")
    path = re.sub(r"[^A-Za-z0-9_./-]", "_", path)
    return "ext/" + path


def fetch(url):
    if url in ext_map:
        return url, ext_map[url], "cached"
    rel = local_rel(url)
    dest = SITE / rel
    if dest.exists():
        return url, rel, "exists"
    wb = "https://web.archive.org/web/2010id_/" + url
    try:
        req = urllib.request.Request(wb, headers={"User-Agent": "Mozilla/5.0 ArchiveRecover/1.0"})
        with urllib.request.urlopen(req, timeout=45) as r:
            data = r.read()
        if not data[:4].startswith(MAGIC) and data[:4] not in MAGIC:
            return url, None, "not-image"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
        return url, rel, "ok"
    except Exception as e:
        return url, None, type(e).__name__ + ":" + str(e)[:60]


ok = fail = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    futs = [ex.submit(fetch, u) for u in urls]
    for i, f in enumerate(as_completed(futs), 1):
        url, rel, status = f.result()
        if rel:
            ext_map[url] = rel
            ok += 1
        else:
            fail += 1
        if i % 20 == 0:
            print(f"[{i}/{len(urls)}] ok={ok} fail={fail}", flush=True)
            MAP_FILE.write_text(json.dumps(ext_map, ensure_ascii=False, indent=0), encoding="utf-8")

MAP_FILE.write_text(json.dumps(ext_map, ensure_ascii=False, indent=0), encoding="utf-8")
print(f"DONE recovered={ok} failed={fail} total={len(urls)}")
