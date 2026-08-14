# -*- coding: utf-8 -*-
"""傾印 index2.htm 選單樹與內容頁統計。"""
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
SITE = Path(__file__).parent / "site"
t = (SITE / "index2.htm").read_bytes().decode("big5", "replace")

pat = re.compile(
    r'class="menutitle"[^>]*>(?:<img[^>]*>)?([^<]+)</div>'
    r"|<a href=['\"]([^'\"]+)['\"][^>]*>([^<]+)</a>"
)
for m in pat.finditer(t):
    if m.group(1):
        print()
        print("##", m.group(1).strip())
    else:
        print("  ", (m.group(3) or "").strip(), "->", m.group(2))
