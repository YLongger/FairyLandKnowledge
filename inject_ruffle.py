# -*- coding: utf-8 -*-
"""給 site/lager/ 內含 SWF 的頁面注入 Ruffle（Flash 模擬器），離線重現動畫。

只插 ASCII 標籤，不動頁面其餘位元組（Big5 安全）。可重複執行（已注入者跳過）。
"""
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

TAG = (b'<script>window.RufflePlayer={config:{autoplay:"on",unmuteOverlay:"hidden",'
       b'splashScreen:false,contextMenu:"off"}};</script>'
       b'<script src="/ruffle/ruffle.js"></script>')

n = 0
for f in Path("site/lager").rglob("*"):
    if f.suffix.lower() not in (".htm", ".html", ".shtml"):
        continue
    data = f.read_bytes()
    if b".swf" not in data.lower() or b"ruffle.js" in data:
        continue
    m = re.search(rb"<head[^>]*>", data, re.I)
    if m:
        data = data[:m.end()] + TAG + data[m.end():]
    else:
        data = TAG + data
    f.write_bytes(data)
    n += 1
print("injected:", n)
