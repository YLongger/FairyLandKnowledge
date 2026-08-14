# -*- coding: utf-8 -*-
"""慢速單線重試 Wayback 救援（避開限流），確認哪些是真佚失。"""
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).parent
SITE = ROOT / "site"
MAP_FILE = ROOT / "ext_map.json"
MAGIC = (b"GIF8", b"\x89PNG", b"\xff\xd8\xff")

ext_map = json.loads(MAP_FILE.read_text(encoding="utf-8"))
urls = [u for u in (ROOT / "ext_urls.txt").read_text(encoding="utf-8").splitlines()
        if u and "dsps.case.eorz.net" not in u and u not in ext_map]
print("to retry:", len(urls))


def local_rel(url):
    p = re.sub(r"^https?://", "", url)
    host, _, path = p.partition("/")
    return "ext/" + re.sub(r"[^A-Za-z0-9_./-]", "_", path)


ok = miss = err = 0
for i, u in enumerate(urls, 1):
    wb = "https://web.archive.org/web/2010id_/" + u
    for attempt in range(3):
        try:
            req = urllib.request.Request(wb, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=45) as r:
                data = r.read()
            if data[:4].startswith(MAGIC) or data[:4] in MAGIC:
                rel = local_rel(u)
                dest = SITE / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                ext_map[u] = rel
                ok += 1
            else:
                miss += 1
            break
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(20)
                continue
            miss += 1
            break
        except Exception:
            time.sleep(8)
    else:
        err += 1
    time.sleep(0.8)
    if i % 25 == 0:
        print(f"[{i}/{len(urls)}] ok={ok} miss={miss} err={err}", flush=True)
        MAP_FILE.write_text(json.dumps(ext_map, ensure_ascii=False, indent=0), encoding="utf-8")

MAP_FILE.write_text(json.dumps(ext_map, ensure_ascii=False, indent=0), encoding="utf-8")
print(f"DONE ok={ok} miss={miss} err={err} total_map={len(ext_map)}")
