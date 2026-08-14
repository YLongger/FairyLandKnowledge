# FairyLandKnowledge

童話資料網（dsps.case.eorz.net）整站離線鏡像 + 離線瀏覽 exe。

## 結構

- `mirror.py`：整站爬蟲。同站遞迴抓取，保留原始 Big5 位元組不轉碼；站方有 Referer 防盜連，抓圖必須帶站內 Referer。
- `site/`：鏡像結果（約 7000 檔、67MB）。查詢字串頁存成 `名稱__q_淨化後查詢` 檔。
- `site.zip`：`site/` 壓縮檔，打包進 exe 用。
- `launcher.py`：離線瀏覽器啟動器。從 exe 內嵌的 site.zip 直接記憶體服務（不解壓），127.0.0.1 隨機 port，自動開瀏覽器。
- `童話資料網離線版_交付包/` 與同名 `.zip`：1:1 原版交付成品，格式比照 `tai-tong-tools/成品`（exe + Big5 使用說明.txt）。
- `build_modern.py` + `app/`：現代版（典藏版）建置管線與 App 原始碼，輸出到 `site/modern/`。1110 篇文獻清洗重排 + 559 隻幻獸結構化資料庫。改 `app/` 後重跑 `python build_modern.py` 再重壓 site.zip。
- `launcher_modern.py`：典藏版啟動器（由 launcher.py 產生，起始頁 `/modern/index.html`）。
- `site/memory/` + `app/memory.js`：卷末「童話時分」致敬與回憶錄（`#/y`）——2026/08/13 台服大合照 5 照 4 影片、致敬書、鳴謝名牆、63 人點名冊（名單由合照辨識，改名單只需編輯 memory.js 的 ROLL）。
- `童話資料網典藏版_交付包/` 與同名 `.zip`：現代版交付成品。
- UI 驗證：`python shot.py`（需 `$env:PLAYWRIGHT_BROWSERS_PATH="$env:LOCALAPPDATA\ms-playwright"`，先起 `python -m http.server 8777 --directory site`），截圖在 `shots/`。
- 全站品質審計：`python audit_all.py`——1109 頁逐頁檢測隱形字（前景/背景對比 <1.8）、破圖（naturalWidth=0）、水平溢出，報告存 `audit-report.json`，交付前必須 0 缺陷。色板 class（cx-head/band/soft）只掛 td/th（建置時逐格解算 bgcolor），掛 table/tr 會因 color 繼承污染巢狀表格。

## 怎麼建

正式版必須用 Python 3.7 打（Win7 VM 相容，與 tai-tong-tools 成品同規格）：

```
& "C:\Users\user-66990\Desktop\TWlogin\.build\Python37\python.exe" -m PyInstaller --onefile --console --name "童話資料網離線版" --add-data "<絕對路徑>\site.zip;." --distpath dist37 --workpath build37 --specpath build37 -y launcher.py
python make_package.py
```

## 怎麼驗

啟動 exe 後 netstat 找 port，curl 驗證：`/index8.htm`、`/huanz/sh2.php?ac=a`（查詢字串頁）、`/htm/work/樂器105頭銜.JPG`（UTF-8 中文檔名）、`/news.gif`（原防盜連圖）都應 200。

## 坑

- 本機 Python 3.11 打的 exe 在 Win7 跑不動；一律用上面的 Python 3.7 路徑。
- `--add-data` 搭配 `--specpath` 時要用絕對路徑。
- 原站中文檔名要用 UTF-8 百分比編碼抓（Big5 編碼會 404）。
- `mirror-failed.txt` 內剩餘失敗均為原站本來就 404/500 的死連結。
