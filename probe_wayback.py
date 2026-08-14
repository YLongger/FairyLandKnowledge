# -*- coding: utf-8 -*-
"""序列探查 Wayback 失敗原因。"""
import json
import sys
import time
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).parent
ext_map = json.loads((ROOT / "ext_map.json").read_text(encoding="utf-8"))
urls = [u for u in (ROOT / "ext_urls.txt").read_text(encoding="utf-8").splitlines()
        if u and "dsps.case.eorz.net" not in u and u not in ext_map]

for u in urls[:8]:
    wb = "https://web.archive.org/web/2010id_/" + u
    try:
        req = urllib.request.Request(wb, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=45) as r:
            data = r.read()
        print("OK", len(data), data[:4], u)
    except urllib.error.HTTPError as e:
        print("HTTP", e.code, u)
    except Exception as e:
        print("ERR", type(e).__name__, str(e)[:80], u)
    time.sleep(1)
