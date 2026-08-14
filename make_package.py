# -*- coding: utf-8 -*-
"""組交付包：資料夾 + 使用說明.txt(Big5) + zip，比照 tai-tong-tools/成品 慣例。"""
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).parent
NAME = "童話資料網離線版"
PKG = ROOT / f"{NAME}_交付包"

README = """童話資料網 敗家一族 離線版
==============================

【功能】
  將 dsps.case.eorz.net 童話資料網整站完整封裝為離線版，
  內含全站 6900+ 個頁面與圖片，不需網路即可瀏覽。

【使用方式】
  1. 直接雙擊「童話資料網離線版.exe」
  2. 會自動開啟瀏覽器顯示網站首頁
  3. 若瀏覽器沒有自動開啟，請看黑窗上顯示的網址，
     自行複製到瀏覽器開啟（例如 http://127.0.0.1:12345/index8.htm）

【關閉方式】
  關閉黑色視窗即可結束程式。

【注意事項】
  - 單一執行檔，免安裝、免網路，本機與虛擬機（Win7 以上）皆可直接使用。
  - 程式只在本機 127.0.0.1 開一個隨機連接埠供瀏覽器讀取，不對外連線。
  - 網站內容鏡像自 2019 年最後更新版本，原站部分本來就壞掉的
    連結（原站 404）在離線版中會顯示 404，屬正常現象。
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
