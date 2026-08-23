# HANDOFF

最後更新：2026-08-23

## 目前狀態

- 2026-08-23 新增獨立離線「童話世界地圖」：`atlas/`（建置後複製到 `site/atlas/`）。
  來源是 geocities.ws/fairyland/worldmap.html（徐大少原圖、ROSS 整合）。
  輿圖／名冊／原版對照三視圖，搜尋地名與幻獸掉寶；主大陸用官方大地圖針位。
  典藏版首頁與側欄有入口。單獨打開 `atlas/index.html` 即可，不必進 SPA。

- 典藏版功能齊備並已交付：五卷文獻（1104 頁）、幻獸資料庫（559 隻）、
  數據寶典 19 頁互動圖表、全屬性寵物降級計算機、官方誌（`#/o`，42 篇官方公告）、
  卷末「童話時分」致敬與回憶錄（`#/y`）。
- 2026-08-15 依使用者（KK 等人）回報完成：
  1. 任務攻略補全——原站 32 個地區任務頁＋進階技能任務藏在下拉選單、鏡像漏抓，
     已用 `fetch_mission.py` 補抓並重構為任務攻略 hub（`#/p/htm-mission-gn-htm`）。
  2. 獸王劈任務 NPC 座標勘誤（萵苣村迪雷爾 8.16→8.160，`CONTENT_FIXES`）。
  3. 原版鏡像點任務攻略跳 banner.php 下載框——launcher 補 .php→text/html（兩個 launcher 都改了，兩個 exe 都重打了）。
  4. 官方誌新卷：KK 蒐集的 42 張官方公告截圖（資料片3／活動24／系統14）
     壓縮收納＋9 個資料片官網連結（2 個 FLASH 標註無法保存）＋AI 生成風格封面。
  5. 彩蛋：艾爾菲斯「打爆你屁股哦～」進了童話時分對話區。
- 2026-08-15（下午）FLASH 復活工程：九個資料片官網（fairyland.lager.com.tw，原來全都還活著）
  整站鏡像進 `site/lager/`（約 1770 檔含 8 支 SWF，39MB），站內收納 Ruffle Flash 模擬器
  （`site/ruffle/`，28MB），含 SWF 的頁面已注入自動播放標籤——桃太郎、糖果屋這兩個
  純 FLASH 官網離線完整重現。官方誌資料片頁的九個連結全部改指本地鏡像（FLASH 者標 ✦）。
  launcher 補 .shtml/.wasm/.swf MIME。兩支 exe 重打（各約 140MB，+47MB 為鏡像＋Ruffle）。
- 2026-08-15（傍晚）使用者回報滑鼠懸停連結出現破圖框——是 rollover 換圖（MM_swapImage）
  藏在 JS 字串裡、首輪爬蟲漏抓。`fetch_rollover.py` 掃全部鏡像頁補回 152 張；
  另 10 張是原站 JS 筆誤（寫 .jpg 實檔是 .gif，原站 hover 本來就壞），已在鏡像頁勘誤修好；
  4 張原站真死（bandb 下載頁 3 張＋拇指姑娘 1 張），維持原樣。
- 2026-08-15（傍晚）出手順序頁升級：整合彩虹城 Starryyy「先手敏捷表」（2023-02 版，
  使用者提供截圖，存 `data/先手敏捷表2023-02.png`）。新增「先手敏捷速查」——11 個 BOSS
  戰場切換、十職業 34 招含技能圖示（自截圖裁切至 `app/img/strike/`）、黑暗儀式後最低敏捷。
  數據以「同係數必同值」交叉驗證無誤；舊表「流星爆擊(?)」存疑處由新表確認為 20 檔 0.7。
  資料寫在 `build_tools.py` 的 FS_* 常數（非 xlsx）。2019 全技能表保留在頁面下半。
- 品質：`audit_all.py` 全站 1130 頁 0 缺陷；exe 煙霧測試全端點 200（含 /lager/ 各站、
  /ruffle/ruffle.js、SWF 正確 MIME、rollover 圖），headless 瀏覽器實測 exe 內 Flash 由
  Ruffle 成功演出、全站 rollover hover 觸發後 0 破圖（2026-08-15）。
- 成品：`童話資料網典藏版_交付包/`（現代版）與 `童話資料網離線版_交付包/`（1:1 原版），
  各有同名 .zip。GitHub Release 另存有這兩包。
- 版控：GitHub `YLongger/FairyLandKnowledge`，main 分支與本地同步。
- `site.zip`、`build*/`、`dist*/`、`shots/` 均為可重建產物，已清掉；重建指令見 `AGENTS.md`。

## 常見接手任務怎麼做

| 任務 | 改哪裡 | 之後 |
|---|---|---|
| 補充/修正文獻內容 | 特例走 `build_modern.py` 的 `TITLE_OVERRIDES` 或 clean() | 重跑 build → 審計 → 重壓 zip → 重打 exe |
| 原站內容筆誤勘誤 | `build_modern.py` 的 `CONTENT_FIXES` | 同上 |
| 新官方公告截圖 | 丟三資料夾結構，跑 `build_official.py <資料夾>` | `build_modern.py` → 同上 |
| 更新數據表 | 換 `data/童话资料.xlsx` | `build_tools.py` → `build_modern.py` → 同上 |
| 改介面/樣式 | `app/*.css|js|html` | `build_modern.py` → 同上 |
| 修回憶錄名單/文案 | `app/memory.js`（ROLL / TRIBUTE / STORY） | `build_modern.py` → 同上 |
| 加合照/影片 | `site/memory/` 放檔 + `memory.js` 的 SCENES/CLIPS | `build_modern.py` → 同上 |

## 已知未竟事項

- 回憶錄點名冊（63 人）由合照像素字辨識，個別名字可能有錯漏
  （把握較低：Wing 家族尾碼、晴嵐、斧頭綁姐、吞噬冒牛獸）；使用者回報後改 `app/memory.js` 的 ROLL 即可。
- 原站本來就死的連結列於 `mirror-failed.txt`，無需修。

## 證據位置

- 審計：跑 `audit_all.py` 會產 `audit-report.json`（已 gitignore）。
- 建置輸出數字：`build_modern.py` 結尾印 `articles=1073 monsters=559 monster_parse_fail=0`。
