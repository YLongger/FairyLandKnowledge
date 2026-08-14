# -*- coding: utf-8 -*-
"""組「典藏版」交付包：資料夾 + 使用說明.txt(Big5) + zip。"""
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
NAME = "童話資料網典藏版"
PKG = ROOT / f"{NAME}_交付包"

README = """童話資料網 敗家一族 典藏版（全新重製介面）
============================================

【這是什麼】
  以 dsps.case.eorz.net 童話資料網全站資料重新設計的離線知識庫。
  1110 篇文獻重新排版，559 隻幻獸解析成可即時查詢的資料庫。

【使用方式】
  1. 直接雙擊「童話資料網典藏版.exe」
  2. 自動開啟瀏覽器顯示典藏版首頁

【功能導覽】
  - 新手上路：首頁「三步走進童話世界」照順序看即可上手
  - 老手快查：首頁八本冊子直達最常用的資料
  - 幻獸資料庫：輸入幻獸名／地圖／掉寶物品／技能名即時篩選，
    點幻獸看完整數值，點掉寶物品可反查還有誰會掉
  - 全站搜尋：按 Ctrl+K（或按「/」）任何頁面都能搜
  - 左側目錄最下方可切回 2019 年原版網站

【關閉方式】
  關閉黑色視窗即可結束程式。

【注意事項】
  - 單一執行檔，免安裝、免網路，本機與虛擬機（Win7 以上）皆可使用。
  - 只在本機 127.0.0.1 開隨機連接埠，不對外連線。
"""

if PKG.exists():
    shutil.rmtree(PKG)
PKG.mkdir()
shutil.copy2(ROOT / "dist37" / f"{NAME}.exe", PKG / f"{NAME}.exe")
(PKG / "使用說明.txt").write_bytes(README.replace("\n", "\r\n").encode("big5"))

zip_path = ROOT / f"{NAME}_交付包.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for f in PKG.rglob("*"):
        zf.write(f, f"{PKG.name}/{f.relative_to(PKG)}")

print("PKG OK")
for f in PKG.iterdir():
    print(" ", f.name, f.stat().st_size)
print("zip:", zip_path.name, zip_path.stat().st_size)
