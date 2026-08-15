# -*- coding: utf-8 -*-
"""補抓任務攻略地區頁：area.htm 下拉選單裡的 32 頁 + skill.htm 及其圖片。

原鏡像爬蟲只跟 <a href>，這批頁面藏在 <select> onChange 裡所以漏抓。
比照 mirror.py：保留 Big5 原始位元組、抓圖帶站內 Referer。
"""
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = "https://dsps.case.eorz.net/htm/mission/"
DEST = Path("site/htm/mission")
PAGES = [
    "gn2.htm", "green.htm", "move-easy.htm", "rainbow.htm", "bird.htm",
    "gold-city.htm", "smile.htm", "legume.htm", "headgear.htm", "swan.htm",
    "rose.htm", "candy.htm", "north.htm", "west.htm", "frog.htm",
    "lettuce.htm", "pineapples.htm", "sleep-village.htm", "afaird.htm",
    "puppet.htm", "g1h.htm", "moon.htm", "babe.htm", "sea.htm",
    "alice.htm", "88.htm", "lul.htm", "muz.htm", "menuu.htm",
    "toutt.htm", "canndd.htm", "1234.htm", "skill.htm",
]


def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://dsps.case.eorz.net/index8.htm",
    })
    return urllib.request.urlopen(req, timeout=25).read()


ok = fail = imgs = 0
img_seen = set()
for name in PAGES:
    dest = DEST / name
    try:
        data = fetch(BASE + name)
    except Exception as e:
        print("PAGE FAIL", name, e)
        fail += 1
        continue
    dest.write_bytes(data)
    ok += 1
    # 頁內圖片（相對路徑）
    html = data.decode("big5", "replace")
    for m in re.finditer(r'(?:src|SRC)\s*=\s*["\']?([^"\'> ]+\.(?:gif|jpg|jpeg|png|GIF|JPG|PNG))', html):
        ref = m.group(1)
        if ref.startswith(("http://", "https://")):
            continue
        rel = urllib.parse.urljoin("htm/mission/" + name, ref)
        if rel in img_seen:
            continue
        img_seen.add(rel)
        local = Path("site") / rel
        if local.exists():
            continue
        try:
            q = urllib.parse.quote(rel, safe="/.-_")
            d = fetch("https://dsps.case.eorz.net/" + q)
            local.parent.mkdir(parents=True, exist_ok=True)
            local.write_bytes(d)
            imgs += 1
        except Exception as e:
            print("IMG FAIL", rel, e)
    time.sleep(0.15)

print(f"pages ok={ok} fail={fail} new_imgs={imgs}")
