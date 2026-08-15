# -*- coding: utf-8 -*-
"""補抓 rollover（滑鼠懸停換圖）圖片：藏在 JS 字串（MM_swapImage 等）裡，
首輪爬蟲只抓 HTML 屬性所以漏了。掃全部鏡像頁的引號字串，缺檔就抓。"""
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
HOST = "https://fairyland.lager.com.tw/"
DEST = Path("site/lager")
IMG_RE = re.compile(r"""['"]([^'"<>\r\n]+?\.(?:gif|jpg|jpeg|png|swf))['"]""", re.I)


def fetch_path(path):
    for enc in ("utf-8", "big5"):
        q = urllib.parse.quote(path.encode(enc), safe="/.-_~")
        try:
            req = urllib.request.Request(HOST + q, headers={
                "User-Agent": "Mozilla/5.0", "Referer": HOST})
            return urllib.request.urlopen(req, timeout=25).read()
        except Exception:
            continue
    return None


need = {}
for f in DEST.rglob("*"):
    if f.suffix.lower() not in (".htm", ".html", ".shtml", ".js", ".css"):
        continue
    rel_dir = f.parent.relative_to(DEST).as_posix()
    text = f.read_bytes().decode("big5", "replace")
    for m in IMG_RE.finditer(text):
        ref = m.group(1).strip().replace("\\", "/")
        if ref.startswith(("http://", "https://")):
            u = urllib.parse.urlparse(ref)
            if u.netloc.lower() != "fairyland.lager.com.tw":
                continue
            p = urllib.parse.unquote(u.path.lstrip("/"))
        elif ref.startswith("/lager/"):
            p = ref[len("/lager/"):]
        elif ref.startswith("/"):
            p = ref.lstrip("/")
        else:
            p = urllib.parse.urljoin("https://x/" + rel_dir + "/", ref)
            p = urllib.parse.unquote(urllib.parse.urlparse(p).path.lstrip("/"))
        if not p or (DEST / p).exists():
            continue
        need.setdefault(p, rel_dir)

print("missing:", len(need))
ok = dead = 0
for p in sorted(need):
    d = fetch_path(p)
    if d is None:
        print("DEAD", p, "(ref by", need[p] + ")")
        dead += 1
        continue
    lp = DEST / p
    lp.parent.mkdir(parents=True, exist_ok=True)
    lp.write_bytes(d)
    ok += 1
    time.sleep(0.08)
print(f"fetched={ok} dead={dead}")
