# HANDOFF

最後更新：2026-08-14

## 目前狀態

- 典藏版功能齊備並已交付：五卷文獻（1073 頁）、幻獸資料庫（559 隻）、
  數據寶典 19 頁互動圖表、全屬性寵物降級計算機、卷末「童話時分」致敬與回憶錄（`#/y`）。
- 品質：`audit_all.py` 全站 1095 頁 0 缺陷；exe 煙霧測試全端點 200（2026-08-14）。
- 成品：`童話資料網典藏版_交付包/`（現代版）與 `童話資料網離線版_交付包/`（1:1 原版），
  各有同名 .zip。GitHub Release 另存有這兩包。
- 版控：GitHub `YLongger/FairyLandKnowledge`，main 分支與本地同步。
- `site.zip`、`build*/`、`dist*/`、`shots/` 均為可重建產物，已清掉；重建指令見 `AGENTS.md`。

## 常見接手任務怎麼做

| 任務 | 改哪裡 | 之後 |
|---|---|---|
| 補充/修正文獻內容 | 特例走 `build_modern.py` 的 `TITLE_OVERRIDES` 或 clean() | 重跑 build → 審計 → 重壓 zip → 重打 exe |
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
