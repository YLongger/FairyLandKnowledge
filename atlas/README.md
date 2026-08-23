# 童話世界地圖 · 獨立離線本

對應原頁：https://www.geocities.ws/fairyland/worldmap.html

這不是原頁鏡像。原頁是一張圖加一長串熱區，靠 Ctrl+F 找地名。
本目錄把它重做成可離線打開的輿圖：在原圖上走相鄰、搜尋、資料片分冊、幻獸／掉寶。

主大陸用官方大地圖（徐大少／敗家一族補充），金線標相鄰。
點地名後右邊打開敗家一族手繪詳圖；詳圖底下的相鄰也是圖，點圖走到下一張。
資料片每一格都是原圖節點，不是純文字流程圖。

## 怎麼開

- 跟著典藏版：`python -m http.server 8777 --directory site` 之後開 `/atlas/`。
  詳圖路徑指到 `site/htm/map/`，一定要從站台開。
- 只開本目錄的 `index.html` 看得到主大陸總圖與字型；詳圖會缺。

## 怎麼打包分享（跟典藏版同一套）

在 Win7 虛擬機或本機（要有打典藏版那支 Python 3.7）跑：

    python pack_atlas.py

會同步 `atlas/` → `site/atlas/`、壓精簡 `site.zip`（地圖 + 敗家一族詳圖，不含整站）、
用 PyInstaller onefile 打出 `童話世界地圖.exe`（記憶體直服，不落地解壓），
再組成 `童話世界地圖_交付包/`（exe + Big5 使用說明.txt）與同名 zip。

雙擊 exe 即開。本機與虛擬機（Win7 以上）都一樣，只聽 127.0.0.1。

沒有 Python 3.7 時，這支腳本仍會壓好 `site.zip`，可先：

    python launcher_atlas.py


## 改資料

編 `build_data.py` 的地名表，再跑：

    python build_data.py

名單與分區對齊 ROSS 的 xFairyland；等級、掉寶、幻獸來自典藏數據（`data-tools.js`、`data-monsters.js`）。
主大陸針位對齊 `site/htm/map/test.htm` 的熱區。詳圖自動對 `site/htm/map/` 裡的 jpg／gif。
