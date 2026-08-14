# -*- coding: utf-8 -*-
"""審計：來源頁 vs 產出文章的圖片數落差，找缺圖根因。"""
import re
import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).parent
SITE = ROOT / "site"

# 從產出的 data chunk 統計每篇文章 img 數
out_imgs = {}
for f in (SITE / "modern").glob("data-a*.js"):
    t = f.read_text(encoding="utf-8")
    arr = json.loads(t[t.index("(") + 1:t.rindex(")")])
    for a in arr:
        out_imgs[a["id"]] = (a["t"], a["c"], len(re.findall(r"<img ", a["h"])))

# 掃來源檔比較（重建 id 對應）
import build_modern as B

B.collect()
report = []
for path, page in B.pages.items():
    src = (SITE / path)
    n_out = out_imgs.get(page["id"], ("", "", 0))[2]
    # 來源 img 數（含 frameset 展開太複雜，只看非 frameset 主檔）
    raw = src.read_bytes().decode("big5", "replace")
    if "<frameset" in raw.lower():
        continue
    n_src = len(re.findall(r"<img\b", raw, re.I))
    if n_src - n_out >= 3:
        # 抓被丟掉的 src 樣本
        srcs = re.findall(r"<img[^>]*src=['\"]?([^'\" >]+)", raw, re.I)
        report.append((n_src - n_out, n_src, n_out, path, page["title"], srcs[:6]))

report.sort(reverse=True)
print("pages losing >=3 imgs:", len(report))
for d, s, o, p, t, srcs in report[:30]:
    print(f"  -{d} (src={s} out={o}) {p} [{t}]")
    print("     ", srcs)
