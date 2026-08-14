# -*- coding: utf-8 -*-
"""看幻獸數值頁的卡片大小問題。"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
OUT = Path(__file__).parent / "shots2"
BASE = "http://127.0.0.1:8777/modern/index.html"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 960})
    pg.goto(BASE + "#/p/htm-huan-sux-htm")
    pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT / "sux-top.png"))
    pg.evaluate("window.scrollBy(0, 1000)")
    pg.wait_for_timeout(300)
    pg.screenshot(path=str(OUT / "sux-mid.png"))
    # 也看一個重製的元素頁的卡片尺寸一致性
    pg.goto(BASE + "#/p/htm-huan-s2-htm")
    pg.wait_for_timeout(800)
    pg.screenshot(path=str(OUT / "s2-cards.png"))
    b.close()
    print("done")
