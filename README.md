# FairyLandKnowledge 童話資料網典藏

《童話 Online》老牌資料站「童話資料網（敗家一族）」的完整離線典藏計畫。
原站 `dsps.case.eorz.net` 自 2019 年後未再更新，本專案將全站資料保存下來，
並重新設計了一套現代化的離線知識庫，打包成免安裝的單一 exe。

## 內容

| 目錄／檔案 | 說明 |
|---|---|
| `site/` | 原站完整鏡像（約 7000 檔，Big5 原始位元組保存） |
| `site/modern/` | 典藏版（現代化重製）建置輸出 |
| `app/` | 典藏版前端原始碼（index.html / app.css / app.js） |
| `mirror.py` | 整站爬蟲（含 Referer 防盜連處理、UTF-8 中文檔名） |
| `build_modern.py` | 典藏版建置管線：1073 篇文獻清洗重排＋559 隻幻獸結構化資料庫 |
| `launcher.py` / `launcher_modern.py` | 離線瀏覽啟動器（記憶體直服 site.zip，不落地解壓） |
| `audit_all.py` | 全站逐頁品質審計（隱形字對比、破圖、版面溢出），交付前需 0 缺陷 |
| `make_package.py` / `make_package_modern.py` | 交付包組裝 |

## 典藏版特色

- 全站導覽重新編排：新手上路、攻略集、幻獸大全、裝備產物
- 幻獸資料庫：559 隻幻獸即時篩選（名稱／地圖／掉寶／技能），掉寶可反查
- 幻獸解析 75 頁全部重製為統一卡片版式，原站未收錄數值標示「資料不足」
- 魔王攻略重製為檔案卡、任務表格語意配色
- 寵物降級計算機：旅程軌道＋單站編輯＋收據式費用帳單
- 全站搜尋（Ctrl+K），左側目錄可切回 2019 原版網站

## 怎麼建

```powershell
python build_modern.py                # 產出 site/modern/
# 壓 site.zip（site/ 內容置於 zip 根層）後，用 Python 3.7 打 exe（Win7 相容）：
py -3.7 -m PyInstaller --onefile --console --name "童話資料網典藏版" `
  --add-data "<絕對路徑>\site.zip;." launcher_modern.py
python make_package_modern.py         # 組交付包
```

## 怎麼驗

```powershell
python -m http.server 8777 --directory site   # 預覽
python audit_all.py                           # 全站 0 缺陷才算通過
```

## 授權與致謝

原站內容由「敗家一族」站長與眾多玩家於 2004–2019 年間整理，版權歸原作者。
本專案僅作遊戲文化保存用途；程式碼部分以 MIT 授權開源。
