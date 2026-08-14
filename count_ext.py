# -*- coding: utf-8 -*-
"""統計全站引用的外部圖片網址。"""
import re
import sys
from collections import Counter
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
SITE = Path(__file__).parent / "site"

urls = set()
hosts = Counter()
for f in SITE.rglob("*"):
    if not f.is_file() or f.suffix.lower() not in (".htm", ".html") and "__q_" not in f.name:
        continue
    try:
        t = f.read_bytes().decode("big5", "replace")
    except Exception:
        continue
    for m in re.finditer(r"<img[^>]*src=['\"]?(https?://[^'\" >]+)", t, re.I):
        u = m.group(1)
        urls.add(u)
        hosts[u.split("/")[2]] += 1

print("unique external img urls:", len(urls))
for h, c in hosts.most_common(10):
    print(f"  {h}: {c}")
Path("ext_urls.txt").write_text("\n".join(sorted(urls)), encoding="utf-8")
print("written ext_urls.txt")
