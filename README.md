# FairyLandKnowledge 童話資料網典藏

《童話 Online》老牌資料站「童話資料網（敗家一族）」的完整離線典藏計畫。
原站 `dsps.case.eorz.net` 自 2019 年後未再更新，本專案將全站資料保存下來，
並重新設計了一套現代化的離線知識庫。同一份 repo 裡是**兩個獨立產品**，打包互不覆蓋：

| 產品 | 給誰用 | 怎麼打 | 產出 |
|---|---|---|---|
| 童話資料網典藏版 | 要文獻、幻獸庫、數據寶典、官方誌 | `launcher_modern.py` + `site.zip` | `童話資料網典藏版.exe` |
| 童話世界地圖 | 只要地圖、稀有寵、客戶端小地圖 | `python pack_atlas.py`（寫 `atlas_site.zip`，**不碰** `site.zip`） | `童話世界地圖.exe` |

## 內容

| 目錄／檔案 | 說明 |
|---|---|
| `site/` | 原站完整鏡像（約 7000 檔，Big5 原始位元組保存） |
| `site/modern/` | 典藏版（現代化重製）建置輸出 |
| `site/memory/` | 「童話時分」回憶錄照片與影片素材 |
| `app/` | 典藏版前端原始碼（app.js／tools.js／memory.js…） |
| `atlas/` | **產品 2** 世界地圖原始碼（改地圖改這裡） |
| `pack_atlas.py` | 地圖獨立包一鍵打包，不寫典藏版 `site.zip` |
| `data/童话资料.xlsx` | 老玩家整理的 23 張數據表，數據寶典的資料源 |
| `mirror.py` | 整站爬蟲（含 Referer 防盜連處理、UTF-8 中文檔名） |
| `build_tools.py` | xlsx → 結構化資料（簡轉繁），產出 `app/data-tools.js` |
| `build_modern.py` | 典藏版建置管線：1073 篇文獻清洗重排＋559 隻幻獸結構化資料庫 |
| `launcher.py` / `launcher_modern.py` | 離線瀏覽啟動器（記憶體直服 site.zip，不落地解壓） |
| `audit_all.py` | 全站逐頁品質審計（隱形字對比、破圖、版面溢出），交付前需 0 缺陷 |
| `make_package.py` / `make_package_modern.py` | 交付包組裝 |

## 典藏版特色

- 全站導覽重新編排：新手上路、攻略集、幻獸大全、裝備產物
- 任務攻略總覽：32 個地區任務＋二轉九職業進階技能任務，一頁直達
- 幻獸資料庫：559 隻幻獸即時篩選（名稱／地圖／掉寶／技能），掉寶可反查
- 數據寶典：19 頁互動圖表——技能矩陣、掉寶地圖、武器配方、成長傾向、出手順序…
- 寵物降級計算機：全屬性支援、寶石對應、官方費率帳單
- 官方誌：42 篇官方公告典藏（資料片／活動玩法／系統調整）＋九個資料片官網整站離線鏡像，FLASH 動畫由內建 Ruffle 模擬器離線重現
- 童話時分：卷末致敬書、鳴謝名牆，與 2026/08/13 台服集體大合照回憶錄
- 全站搜尋（Ctrl+K），左側目錄可切回 2019 原版網站
- 世界地圖是另一份產品，見下方「地圖獨立包」

## 怎麼建（典藏版）

```powershell
pip install -r requirements.txt
python build_tools.py                 # 僅 data/童话资料.xlsx 變更時
python build_modern.py                # 產出 site/modern/
# 壓 site.zip（site/ 內容置於 zip 根層）後，用 Python 3.7 打 exe（Win7 相容）：
py -3.7 -m PyInstaller --onefile --console --name "童話資料網典藏版" `
  --add-data "<絕對路徑>\site.zip;." launcher_modern.py
python make_package_modern.py         # 組交付包
```

## 怎麼建（地圖獨立包）

```powershell
python pack_atlas.py
# 打出 童話世界地圖.exe，組 童話世界地圖_交付包/
# 預覽：python launcher_atlas.py  或  python -m http.server 8788 --directory site
```

## 怎麼驗

```powershell
python -m http.server 8777 --directory site   # 預覽
python audit_all.py                           # 全站 0 缺陷才算通過
```

維護細節與踩坑紀錄見 `AGENTS.md`；接手狀態與常見任務對照見 `HANDOFF.md`。

## 授權與致謝

原站內容由「敗家一族」站長與眾多玩家於 2004–2019 年間整理，版權歸原作者。
本專案僅作遊戲文化保存用途；程式碼部分以 MIT 授權開源。
