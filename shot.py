# -*- coding: utf-8 -*-
"""現代版 UI 截圖驗證。"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
OUT = Path(__file__).parent / "shots"
OUT.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:8777/modern/index.html"

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1440, "height": 900})
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))

    pg.goto(BASE + "#/")
    pg.wait_for_timeout(900)
    pg.screenshot(path=str(OUT / "1-home.png"))
    pg.screenshot(path=str(OUT / "1-home-full.png"), full_page=True)

    pg.goto(BASE + "#/m")
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / "2-monsters.png"))

    pg.fill("#monQ", "雪怪")
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "3-monster-search.png"))

    cards = pg.locator(".mon-card")
    if cards.count() > 0:
        cards.first.click()
        pg.wait_for_timeout(400)
        pg.screenshot(path=str(OUT / "4-monster-detail.png"))
        pg.keyboard.press("Escape")

    # 文章頁：掉寶資料
    pg.goto(BASE + "#/")
    pg.wait_for_timeout(300)
    pg.click("text=掉寶資料")
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / "5-article.png"))

    # 新手文章
    pg.goto(BASE + "#/")
    pg.wait_for_timeout(300)
    pg.click(".step a >> text=職業分析")
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(OUT / "6-article2.png"))

    # 搜尋面板
    pg.keyboard.press("Control+k")
    pg.wait_for_timeout(200)
    pg.fill("#palInput", "玻璃種子")
    pg.wait_for_timeout(500)
    pg.screenshot(path=str(OUT / "7-search.png"))
    pg.keyboard.press("Escape")

    # 手機版
    pg2 = b.new_page(viewport={"width": 375, "height": 720})
    pg2.goto(BASE + "#/")
    pg2.wait_for_timeout(700)
    pg2.screenshot(path=str(OUT / "8-mobile-home.png"))
    pg2.goto(BASE + "#/m")
    pg2.wait_for_timeout(500)
    pg2.screenshot(path=str(OUT / "9-mobile-mon.png"))

    b.close()
    print("console errors:", len(errors))
    for e in errors[:10]:
        print("  ", e[:200])
    print("done")
