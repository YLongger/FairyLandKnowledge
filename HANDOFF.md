# HANDOFF

最後更新：2026-08-23（客戶端小地圖審計：10106 錯圖修復＋改版迷宮標註）

## 目前狀態

- 2026-08-23（下午）客戶端小地圖全面審計（使用者出示神燈沙漠/坦拉娜迷宮兩張詳圖與客戶端圖不符）：
  1. `minimap.lpq` 檔序對齊本身沒錯（634/660 符合 3.2×1.6 標準比例），但 **10106 神燈沙漠槽位
     裝的是一張 60×120 村莊圖（萵苣村變體），尺寸不可能是 80×120 的神燈沙漠**——官方封包錯置。
     真正的沙漠小圖藏在 `10106.adf` frame 10 內嵌 BMP（256×192），但原檔有 51.8% 黑塊缺損；
     `atlas/fix_10106_minimap.py` 抽出後用鄰近沙地紋理補洞，寫回 `site/htm/map/client/10106.png`。
  2. **坦拉娜迷宮 20088 / 糖果屋迷宮 21308：客戶端 ADF 走格與 LPQ 小圖互相一致（是本尊），
     但迷宮結構與玩家詳圖完全不同**——新版客戶端重做過配置，詳圖記的是舊版。全庫掃描確認
     詳圖那座迷宮不存在於現行 669 張小圖中。處理：`build_data.py` 的 `CLIENT_VER_DIFF` 加旗標，
     UI（地點卡＋客戶端卡）顯示「客戶端檔內是改版後的迷宮配置，實際走法以詳圖為準」（`.cap-warn`）。
  3. 常設審計腳本 `atlas/audit_client_imgs.py`：對 atlas 用到的全部編號做「BMP 尺寸 vs ADF 格數」
     與「走格拓撲 IoU」雙檢查；dims 不符即 exit 1。目前 134 編號僅 10106 一筆 dims 失敗（已修）。
     全 136 地點對照表眼看走查（`_audit_sheets.py` 產 `_evi/sheet_*.png`）其餘配對吻合。
  4. 驗證：本地 8788 與桌面 exe 都用 Playwright channel=chrome 實測（`_verify_places.py`），
     神燈沙漠顯示修復沙漠圖、兩迷宮顯示改版標註、無 JS 錯誤。exe 已重打並複製桌面。

- 地圖滾輪放大已改架構：底圖只改寬高、從原圖像素重採樣（主大陸 2920×2200、資料片 4000×2800），上限 1.0＝原圖像素，不再 CSS `scale`。地名／資料片卡片放在 `#marks` 螢幕層，字永遠原尺寸。平移用 `left/top` 整數像素，不要 `transform:translate`（縮回去會在圖跟米框之間出一條黑底線）。百分比仍相對全圖（全圖=100%）。
- 稀有寵手冊 65 隻全部用 `site/htm/huan/hq/` 生成圖，不再拿客戶端卡硬對名字。官方 21 隻身分：典藏 GIF 優先；缺圖且 LPQ 編號 ≥61461 才用客戶端卡當原圖再生成。`61001+檔序` 會對錯（雷爵獸變成寄居蟹），禁止再用。
- 主大陸針位名稱常駐顯示（`.pin-tip{opacity:1}`）。原版對照固定 `atlas/img/mainland-orig.jpg`（徐大少 749×564），不要換成生成圖。
- 九個資料片有對齊節點的華麗底圖 `atlas/img/{rid}.jpg`。打包：`python pack_atlas.py`（寫 `atlas_site.zip`，不碰典藏 `site.zip`）。忽略 `rare_src/`、`layout/`。
- 木頭貝貝典藏沒圖：依金貝貝／水貝貝同族圓殼再生成木紋版。其餘 8 隻缺典藏圖用可信客戶端卡。
- 火精靈身分：原頁 `gif/rx.gif` 紅龍寶寶（鬱金香島）。舊 HQ 誤用 `gif/fire.gif` 火力蟲。手冊用 110 版坐姿雙眼光亮 Q 圖 `htm/huan/hq/火精靈.png`。

## 證據位置

- 縮放：`shots/v_zoom_fit.png`、`v_zoom_in.png`（主大陸 302%、字 12px 不變、底圖=2920 原寬）、`v_zoom_mermaid.png`（人魚 384%、卡片字不變）、`v_zoom_click.png`（點吉恩村飛入＋側欄）。
- 火精靈：`shots/v_fire_rare.png`（手冊＋側欄是紅龍，出沒鬱金香島）。
- 瀏覽器實踏：`shots/v_mainland.png`（54 地名可見）、`v_old.png`（徐大少原圖）、`v_rare.png`（21 隻 Q 圖對名）、`v_mermaid.png`（人魚底圖+節點）。
- HQ 65 張在 `site/htm/huan/hq/`。



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
| 改世界地圖 | `atlas/*`（資料改 `build_data.py` 再跑） | `python pack_atlas.py`（寫 `atlas_site.zip`，不碰典藏版 `site.zip`） |
| 修回憶錄名單/文案 | `app/memory.js`（ROLL / TRIBUTE / STORY） | `build_modern.py` → 同上 |
| 加合照/影片 | `site/memory/` 放檔 + `memory.js` 的 SCENES/CLIPS | `build_modern.py` → 同上 |

## 已知未竟事項

- 回憶錄點名冊（63 人）由合照像素字辨識，個別名字可能有錯漏
  （把握較低：Wing 家族尾碼、晴嵐、斧頭綁姐、吞噬冒牛獸）；使用者回報後改 `app/memory.js` 的 ROLL 即可。
- 原站本來就死的連結列於 `mirror-failed.txt`，無需修。
- 地圖獨立包與典藏版是兩份產品。打地圖用 `pack_atlas.py`；打典藏版仍壓整份 `site.zip` + `launcher_modern.py`，別混用。

## 證據位置

- 審計：跑 `audit_all.py` 會產 `audit-report.json`（已 gitignore）。
- 建置輸出數字：`build_modern.py` 結尾印 `articles=1073 monsters=559 monster_parse_fail=0`。
