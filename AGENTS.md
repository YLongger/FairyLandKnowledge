# FairyLandKnowledge

同一 repo、**兩個產品**，打包互不覆蓋：
- 典藏版：文獻／幻獸庫／數據寶典 → `site.zip` + `launcher_modern.py`
- 世界地圖：地圖／稀有寵／客戶端小地圖 → `atlas_site.zip` + `pack_atlas.py`（**禁止改去寫 `site.zip`**）

接手前先讀本檔與 `HANDOFF.md`。

## 結構（全部都是必要檔案，沒有暫存物）

原始資料層：
- `site/`：原站完整鏡像（約 7000 檔，Big5 原始位元組不轉碼）。查詢字串頁存成 `名稱__q_淨化後查詢` 檔。**這是唯一資料源，不要手改內容**（`site/modern/` 與 `site/memory/` 除外）。
- `data/童话资料.xlsx`：老玩家整理的 23 張數據表（簡體），數據寶典與降級計算機的資料源。
- `ext_map.json`：Wayback 救回的外站圖片對應表，`build_modern.py` 讀取。
- `mirror-failed.txt`：鏡像時殘餘失敗清單（均為原站本來就 404/500 的死連結，留作紀錄）。

典藏版原始碼（改典藏功能改這裡）：
- `app/index.html|app.css|app.js`：SPA 骨架、全部樣式、路由／導覽／搜尋／幻獸資料庫／降級計算機。
- `app/tools.js`：數據寶典 19 頁互動圖表的渲染邏輯。
- `app/data-tools.js`：**產生檔**，由 `build_tools.py` 從 xlsx 產出，不要手改。先手敏捷表（出手順序頁上半）的資料不在 xlsx，是 `build_tools.py` 內的 FS_* 常數（來源截圖存 `data/先手敏捷表2023-02.png`，技能圖示裁在 `app/img/strike/`）。
- `app/official.js` + `app/data-official.js`：官方誌（`#/o`）——官方公告截圖典藏。data 檔由 `build_official.py` 產出，不要手改。
- `app/memory.js`：卷末「童話時分」致敬與回憶錄（`#/y`）。點名冊改 `ROLL` 陣列即可。
- `site/memory/`：回憶錄的 5 照 4 影片。
- `site/official/`：官方誌壓縮圖（42 篇公告 + 封面），由 `build_official.py` 產出。
- `site/lager/`：九個資料片官網（fairyland.lager.com.tw）整站鏡像（約 1770 檔含 8 支 SWF），由 `fetch_expac.py` 抓取。
- `site/ruffle/`：Ruffle Flash 模擬器（npm @ruffle-rs/ruffle，js+wasm 約 28MB），讓 SWF 頁離線重現；`inject_ruffle.py` 負責把載入標籤注入含 SWF 的鏡像頁。

世界地圖原始碼（改地圖改這裡，跟典藏版分開打包）：
- `atlas/`：獨立離線世界地圖。改完跑 `python atlas/build_data.py`，再用 `python pack_atlas.py`（複製到 `site/atlas/` 並打 `atlas_site.zip`）。
- 客戶端彩色小地圖：`atlas/extract_minimaps.py`（`maps/minimap.lpq` → `site/htm/map/client/`）。走格示意圖不要蓋過彩色圖。
- 稀有寵 HQ：`site/htm/huan/hq/`。名字以典藏 GIF 為準；客戶端卡只有檔名表編號 ≥61461 才可信。

建置管線（依序）：
- `build_tools.py`：xlsx → `app/data-tools.js`（簡轉繁、結構化）。只有 xlsx 變了才需要跑。
- `build_official.py <來源資料夾>`：官方公告 JPG → `site/official/` 壓縮圖 + `app/data-official.js`。來源結構＝三個子資料夾（资料片介绍／官方活动玩法／新功能以及调整），有新公告丟同結構重跑即可（檔名取內容 MD5，重跑不會重複）。
- `fetch_mission.py`：從原站補抓任務攻略地區頁（藏在下拉選單、爬蟲跟不到的 33 頁）。已抓齊，只在原站更新時才需要重跑。
- `fetch_expac.py` + `fetch_rollover.py` + `inject_ruffle.py`：鏡像九個資料片官網到 `site/lager/`，補抓藏在 JS 字串裡的 rollover 換圖（MM_swapImage 等，首輪只掃 HTML 屬性會漏），再給含 SWF 的頁面注入 Ruffle。已抓齊，只在原站更新時才需要重跑（三支都可重複執行）。
- `build_modern.py`：`site/` 原始頁 + `app/` → `site/modern/`。1073 篇文獻清洗重排 + 559 隻幻獸結構化。**改了 `app/` 任何檔都要重跑**（它會把 app/ 複製進 modern/）。
- `launcher.py` / `launcher_modern.py`：離線瀏覽啟動器，從 exe 內嵌 site.zip 記憶體直服（不落地解壓），127.0.0.1 隨機 port。
- `launcher_atlas.py`：世界地圖獨立包啟動器，開 `/atlas/index.html`。
- `make_package.py` / `make_package_modern.py` / `make_package_atlas.py`：組交付包（exe + Big5 使用說明.txt + zip）。
- `pack_atlas.py`：地圖獨立包一鍵打包（`atlas/` + `htm/map` + `copy` + `cimage` + `htm/huan` → `atlas_site.zip`）。**不寫 `site.zip`**。
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

# 世界地圖獨立包（只要地圖、要分享給人雙擊就開；跟典藏版是兩份產品）：
python pack_atlas.py
# 有 Win7 用的 Python 3.7 時會打出 童話世界地圖.exe 並組 童話世界地圖_交付包/
# 沒有 3.7 也會壓好 atlas_site.zip，可先 python launcher_atlas.py 試開
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
- 錨點：建置把 `<a name>` 轉成 `<span id="anch-*">`，跨頁連結格式 `#/p/<id>@anch-*`；改 clean() 時別把含 id 的空列刪掉。中文錨點會被瀏覽器百分比編碼，artView 有 decodeURIComponent。
- 原站有些頁藏在 `<select onChange>` 下拉選單裡（如任務攻略 32 地區頁），爬蟲只跟 `<a href>` 會漏抓；發現缺頁先查是不是這種。
- 鏡像 `.php` 檔是 HTML 內容，launcher 要標 `text/html`，否則瀏覽器跳下載框（banner.php 事件）。
- 原站內容筆誤用 `build_modern.py` 的 `CONTENT_FIXES` 勘誤（不動 site/ 原始位元組）。
- 審計的對比檢測讀 backgroundColor，純 gradient 背景會誤判成透明——深色區塊要留純色 fallback。
- 交付包 exe 若在跑會鎖檔，重打前先關掉。
- `pack_atlas.py` 只壓 `atlas/` + `htm/map/` + `copy/` 到 `atlas_site.zip`，不要改回寫 `site.zip`（會把典藏版整站包蓋成地圖精簡包）。
- PowerShell 5 不支援 `&&`；跨程序用 `;` 串接。
- launcher 的 MIME 要含 `.shtml`→text/html、`.wasm`→application/wasm、`.swf`→application/x-shockwave-flash，缺了 Ruffle 或資料片鏡像頁會壞（瀏覽器跳下載框）。本地預覽用 `python -m http.server` 沒有 .shtml 對應，驗資料片頁要另起有註冊 MIME 的伺服器。
- 資料片官網少數中文檔名是 Big5 百分比編碼（如 間距.gif），與主站的 UTF-8 相反；`fetch_expac.py` 兩種都會試。
- 走路用地圖編號在 `C:\Lager\nflonline\maps\NNNNN.adf`（FGF300 多層：MAPNAME／傳送／NPC／出沒），**不是**海報庫 `01_素材庫`，也不是 PE 裡的中文。彩色地圖在 `maps\minimap.lpq`（LPQ\\x1a + LZO 0.22），用 `python atlas/extract_minimaps.py` 抽到 `site/htm/map/client/{id}.png`。禁止把走格示意圖蓋上去。listfile 是 names[0] 對 ents[1]，差一格會把吉恩圖寫成別張。室內圖黑邊要裁掉並把純黑打成透明，卡片才不會變成小黑塊。
- `pack_atlas.py` 同步 atlas 時忽略 `*.py`、`_rev`、`client_maps.json`（資料已編進 `data.js`）。
