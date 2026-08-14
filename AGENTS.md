# FairyLandKnowledge

童話資料網（dsps.case.eorz.net）整站離線鏡像 + 現代化重製「典藏版」，各打包成免安裝離線 exe。
接手前先讀本檔與 `HANDOFF.md`。

## 結構（全部都是必要檔案，沒有暫存物）

原始資料層：
- `site/`：原站完整鏡像（約 7000 檔，Big5 原始位元組不轉碼）。查詢字串頁存成 `名稱__q_淨化後查詢` 檔。**這是唯一資料源，不要手改內容**（`site/modern/` 與 `site/memory/` 除外）。
- `data/童话资料.xlsx`：老玩家整理的 23 張數據表（簡體），數據寶典與降級計算機的資料源。
- `ext_map.json`：Wayback 救回的外站圖片對應表，`build_modern.py` 讀取。
- `mirror-failed.txt`：鏡像時殘餘失敗清單（均為原站本來就 404/500 的死連結，留作紀錄）。

典藏版原始碼（改功能改這裡）：
- `app/index.html|app.css|app.js`：SPA 骨架、全部樣式、路由／導覽／搜尋／幻獸資料庫／降級計算機。
- `app/tools.js`：數據寶典 19 頁互動圖表的渲染邏輯。
- `app/data-tools.js`：**產生檔**，由 `build_tools.py` 從 xlsx 產出，不要手改。
- `app/memory.js`：卷末「童話時分」致敬與回憶錄（`#/y`）。點名冊改 `ROLL` 陣列即可。
- `site/memory/`：回憶錄的 5 照 4 影片。

建置管線（依序）：
- `build_tools.py`：xlsx → `app/data-tools.js`（簡轉繁、結構化）。只有 xlsx 變了才需要跑。
- `build_modern.py`：`site/` 原始頁 + `app/` → `site/modern/`。1073 篇文獻清洗重排 + 559 隻幻獸結構化。**改了 `app/` 任何檔都要重跑**（它會把 app/ 複製進 modern/）。
- `launcher.py` / `launcher_modern.py`：離線瀏覽啟動器，從 exe 內嵌 site.zip 記憶體直服（不落地解壓），127.0.0.1 隨機 port。
- `make_package.py` / `make_package_modern.py`：組交付包（exe + Big5 使用說明.txt + zip）。
- `audit_all.py`：全站品質審計（見「怎麼驗」）。
- `shot.py`：Playwright 截圖抽查。

## 怎麼建（完整流程）

```powershell
pip install -r requirements.txt          # bs4 / openpyxl / opencc / playwright
python build_tools.py                    # 僅 xlsx 變更時
python build_modern.py                   # app/ 或 site/ 變更後必跑
# 重壓 site.zip（site/ 內容置於 zip 根層）：
python -c "import zipfile,pathlib;root=pathlib.Path('site');zf=zipfile.ZipFile('site.zip','w',zipfile.ZIP_DEFLATED);[zf.write(p,p.relative_to(root).as_posix()) for p in root.rglob('*') if p.is_file()];zf.close()"
# 正式 exe 必須用 Python 3.7 打（Win7 VM 相容）；--add-data 要絕對路徑：
& "C:\Users\user-66990\Desktop\TWlogin\.build\Python37\python.exe" -m PyInstaller --onefile --console --name "童話資料網典藏版" --add-data "<絕對路徑>\site.zip;." --distpath dist37 --workpath build37 --specpath build37 -y launcher_modern.py
python make_package_modern.py            # 組交付包（1:1 原版則用 launcher.py + make_package.py）
```

## 怎麼驗（交付前全部要過）

1. `python -m http.server 8777 --directory site` 起本地預覽。
2. `$env:PLAYWRIGHT_BROWSERS_PATH="$env:LOCALAPPDATA\ms-playwright"; python audit_all.py`
   ——1095 頁逐頁檢測隱形字（對比 <1.8）、破圖、水平溢出，**必須 0 缺陷**。
3. exe 煙霧測試：啟動後找子行程的監聽 port（PyInstaller onefile 是父殼+子服務，解壓要等幾秒），
   curl `/modern/index.html`、`/index8.htm`、`/huanz/sh2.php?ac=a`、`/htm/work/樂器105頭銜.JPG`、`/memory/photo1.png` 都應 200。

## 坑（前人踩過的，別再踩）

- 本機 Python 3.11 打的 exe 在 Win7 跑不動；一律用上面的 Python 3.7 路徑。
- `--add-data` 搭配 `--specpath` 時必須用絕對路徑。
- 原站中文檔名要用 UTF-8 百分比編碼抓（Big5 編碼會 404）。
- 色板 class（cx-head/band/soft）只掛 td/th（建置時逐格解算 bgcolor），掛 table/tr 會因 color 繼承污染巢狀表格。
- 錨點：建置把 `<a name>` 轉成 `<span id="anch-*">`，跨頁連結格式 `#/p/<id>@anch-*`；改 clean() 時別把含 id 的空列刪掉。
- 審計的對比檢測讀 backgroundColor，純 gradient 背景會誤判成透明——深色區塊要留純色 fallback。
- 交付包 exe 若在跑會鎖檔，重打前先關掉。
- PowerShell 5 不支援 `&&`；跨程序用 `;` 串接。
