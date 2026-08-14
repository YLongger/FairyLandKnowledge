# -*- coding: utf-8 -*-
"""看 sux.htm 原始碼與找出含幻獸解析的所有頁面。"""
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
SITE = Path("site")
t = (SITE / "htm/huan/sux.htm").read_bytes().decode("big5", "replace")
print("--- sux.htm head ---")
print(t[:600])
print("--- 所有含〈幻獸解析〉表格的頁面 ---")
hits = []
for f in SITE.rglob("*.htm*"):
    if "modern" in f.parts:
        continue
    try:
        d = f.read_bytes().decode("big5", "replace")
    except Exception:
        continue
    if "幻獸解析" in d and "幻獸名" in d:
        hits.append(str(f.relative_to(SITE)).replace("\\", "/"))
print(len(hits))
for h in sorted(hits):
    print(" ", h)
