# -*- coding: utf-8 -*-
"""排版審計截圖：先前有問題的頁面 + 計算機。"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
OUT = Path(__file__).parent / "shots2"
OUT.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:8777/modern/index.html"

PAGES = [
    ("a-shin", "#/p/htm-shin-shin-htm"),          # 仙人指路(舊) 1.gif 內容圖
    ("b-train", "#/p/copy-train-htm"),            # 職業分析 arrow.gif
    ("c-s72", "#/p/htm-huan-s72-htm"),            # 闇系 b1.gif 幻獸圖
    ("d-mapp", "#/p/htm-map-mapp-htm"),           # 地圖詳覽
    ("e-marry2", "#/p/htm-marry-2-htm"),          # 結婚三步曲
    ("f-ben2", "#/p/htm-bow-ben2-htm"),           # 變色參考
    ("g-allgif", "#/p/htm-allgif-image-htm"),     # 幻獸圖鑑
    ("h-tu", "#/p/htm-tu-htm"),                   # 特殊物品
    ("i-db", "#/p/htm-db-htm"),                   # 掉寶資料
    ("j-nnn", "#/p/htm-teach-nnn-htm"),           # 新手問答
    ("k-calc", "#/t/calc"),                       # 計算機
    ("l-bad2", "#/p/htm-bad-bad2-htm"),           # 商場騙術標題
]

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    for name, route in PAGES:
        pg.goto(BASE + route)
        pg.wait_for_timeout(800)
        pg.screenshot(path=str(OUT / f"{name}.png"))
    # 計算機互動測試：切 6 降 + 改行情
    pg.goto(BASE + "#/t/calc")
    pg.wait_for_timeout(500)
    pg.click('.preset-btn[data-preset="6"]')
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "m-calc6.png"))
    final = pg.text_content("#cFinal")
    total = pg.text_content("#cTotal")
    print("calc 6-down final:", final, "total:", total)
    # 手機版計算機
    pg2 = b.new_page(viewport={"width": 375, "height": 720})
    pg2.goto(BASE + "#/t/calc")
    pg2.wait_for_timeout(700)
    pg2.screenshot(path=str(OUT / "n-calc-mobile.png"))
    b.close()
    print("console errors:", len(errors))
    for e in errors[:8]:
        print("  ", e[:200])
    print("done")
