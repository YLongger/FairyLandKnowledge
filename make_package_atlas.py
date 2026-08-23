# -*- coding: utf-8 -*-
"""組「童話世界地圖」交付包：資料夾 + 使用說明.txt(Big5) + zip。"""
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
NAME = "童話世界地圖"
PKG = ROOT / (NAME + "_交付包")

README = """童話世界地圖（獨立離線本）
================================

【這是什麼】
  徐大少／敗家一族世界地圖的獨立離線重製。
  主大陸用官方大地圖走針，資料片用原圖節點，
  點開後用敗家一族手繪詳圖走到相鄰地圖。

【使用方式】
  1. 直接雙擊「童話世界地圖.exe」
  2. 自動開啟瀏覽器顯示世界地圖
  3. 若瀏覽器沒有自動開啟，請看黑窗上的網址，
     自行複製到瀏覽器（例如 http://127.0.0.1:12345/atlas/index.html）

【怎麼看】
  - 輿圖：在圖上點地名。金線是相鄰走法。
  - 點開後右邊是原圖，底下的小圖可以走到下一張。
  - 上方可切資料片（愛麗絲、一千零一夜…）
  - 搜尋框可找地名、幻獸、掉寶。按 / 聚焦。
  - 「名冊」用卡片看全部地名；「原版對照」是當年那一長串藍字。

【關閉方式】
  關閉黑色視窗即可結束程式。

【注意事項】
  - 單一執行檔，免安裝、免網路，本機與虛擬機（Win7 以上）皆可使用。
  - 只在本機 127.0.0.1 開隨機連接埠，不對外連線。
  - 這是獨立地圖包，不是整站典藏版。
"""

if PKG.exists():
    shutil.rmtree(PKG)
PKG.mkdir()
exe = ROOT / "dist37" / (NAME + ".exe")
if not exe.is_file():
    raise SystemExit("missing " + str(exe) + " — run pack_atlas.py on the Win7 Python 3.7 first")
shutil.copy2(exe, PKG / (NAME + ".exe"))
(PKG / "使用說明.txt").write_bytes(README.replace("\n", "\r\n").encode("big5"))

zip_path = ROOT / (NAME + "_交付包.zip")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for f in PKG.rglob("*"):
        if f.is_file():
            zf.write(f, PKG.name + "/" + f.relative_to(PKG).as_posix())

print("PKG OK")
for f in PKG.iterdir():
    print(" ", f.name, f.stat().st_size)
print("zip:", zip_path.name, zip_path.stat().st_size)
