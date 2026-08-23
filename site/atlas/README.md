# 童話世界地圖 · 獨立離線本

對應原頁：https://www.geocities.ws/fairyland/worldmap.html

這不是原頁鏡像。原頁是一張圖加一長串熱區，靠 Ctrl+F 找地名。
本目錄把它重做成可離線打開的輿圖：搜尋、資料片分冊、相鄰、幻獸／掉寶、原版對照。

## 怎麼開

- 單獨：用瀏覽器打開 `index.html`（字型與主大陸圖都在本目錄）。
- 跟著典藏版：`python -m http.server 8777 --directory site` 之後開 `/atlas/`。
- 詳圖（敗家一族手繪）要從站台進，路徑才指得到 `site/htm/map/`。

## 改資料

編 `build_data.py` 的地名表，再跑：

    python build_data.py

名單與分區對齊 ROSS 的 xFairyland；等級、掉寶、幻獸來自典藏數據（`data-tools.js`、`data-monsters.js`）。
主大陸針位對齊 `site/htm/map/test.htm` 的熱區。
