/* 童話時分 —— 致敬與回憶錄（#/y） */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------------- 內容 ---------------- */
  var TRIBUTE = [
    "這一座典藏，說到底，是借花獻佛。",
    "二十多年來，是無數玩家一筆一筆寫下攻略、一張一張畫出地圖、一格一格整理出數據，才拼出今天這片童話大陸的完整樣貌。小弟只是幸運，能移花接木、站在巨人的肩膀上眺望——把前人留下的花重新插瓶，獻回給大家。",
    "起心動念，是波叔看見靜心在私服那邊默默整理資料。我們想：台服這邊，也該有一份整理好、能傳下去的版本，給後來的人一個參考。於是，有了這個典藏版。",
    "若這座典藏幫上了你，請把感謝留給那些真正鋪路的人。",
  ];
  var CREDITS = [
    ["童話遊戲官方", "這個世界的造夢者——地圖、幻獸與所有的童話"],
    ["敗家一族站長", "dsps.case.eorz.net，2004 年起十八年如一日的資料典藏"],
    ["遊戲基地精華區前輩", "天之子、Kidlee、Epyonmk3、Platon 等眾多版友的攻略與自製地圖"],
    ["數據整理前輩", "降級公式、掉寶、配方、技能……23 張數據表背後的無名英雄"],
    ["靜心", "私服資料整理的先行者，這份心意的啟發之源"],
    ["波叔", "看見了火種，促成了這一切的人"],
    ["陽光商人", "2026 台服集體大合照的號召人，帶著大家創造回憶"],
    ["每一位玩家", "曾經或正在為童話提供資料與經驗的你——這一頁，獻給你"],
  ];
  var STORY = [
    "2026 年 8 月 13 日，晚上九點半。",
    "由陽光商人號召，大夥兒從四面八方趕來——有人騎著幻獸，有人帶著整窩寵物，有人已經很多年沒有上線，這一晚，都回來了。",
    "從雪原的音樂石碑出發，一路走過地城迴廊、綠野長椅、王宮大廳，最後停在雪城門前。每到一站，隊伍重新排好，快門按下——二十年的時光，就這樣擠進同一個畫面裡。",
  ];
  var QUOTES = [
    ["就是你了", "要拍照記得倒數"],
    ["嘴甜技師", "趁機告白？"],
  ];
  var SCENES = [
    ["photo1", "第一幕・雪原音樂石碑", "集合完畢，先來一張。石碑上刻著的音符，像在替我們配樂。"],
    ["photo2", "第二幕・地城迴廊", "磚道上列隊完成，石碑見證。"],
    ["photo3", "第三幕・綠野長椅", "草地最綠的地方，留給最熱鬧的一群人。"],
    ["photo4", "第四幕・王宮大廳", "王座前，大家把彼此擠進同一個畫面。"],
    ["photo5", "第五幕・雪城門前", "最終大合照。晚安，童話。"],
  ];
  var CLIPS = [
    ["clip1", "現場花絮・其一"],
    ["clip2", "現場花絮・其二"],
    ["clip3", "現場花絮・其三"],
    ["clip4", "現場花絮・其四"],
  ];
  /* 到場名冊：由五張合照逐一辨識整理（暱稱以照片顯示為準） */
  var ROLL = [
    "0o陽光商人o0", "嘴甜技師", "就是你了", "玫瑰茉莉", "善甲郎566/101",
    "桃郎郎", "Yu兒跳", "冷翎玥", "翎", "某秘郎", "某少女", "多卡畢",
    "畢卡多", "被選中的孩子", "樹懶懶的樹", "花醉三千客", "落霞星辰",
    "晴嵐", "艾盈", "艾靈", "艾爾菲斯", "無間商人", "回鍋木頭俠",
    "996", "Dearest", "紫雯飛雪", "聖人勿近", "海賊王索隆", "女神一號",
    "Colored", "Jett", "HemYe", "DXbiu", "維權老闆", "BOYE", "xiaocao",
    "小神", "小狸", "金多Bo", "暴力小鬼", "真童話傳說", "飄楓月凜",
    "御手洗", "Hikari587", "改名很易", "噩夢神", "奶茶o熊", "啪的小老妹",
    "啪的小商人", "亞夢神", "全都好吃", "就是狂戰士", "青菜乾炒",
    "0o寧夏o0", "WingBB", "WingAS", "WingCS", "奧古斯都", "恩司", "姍妍",
    "遠方的祝福", "斧頭綁姐", "吞噬冒牛獸",
  ];

  var M = "../memory/";

  /* ---------------- 渲染 ---------------- */
  function render(view) {
    var h = "";
    /* 開場 */
    h += '<div class="mem-hero">' +
      '<div class="mh-kicker">FAIRYLAND MOMENTS · 2004–2026</div>' +
      "<h1>童話時分</h1>" +
      '<div class="mh-sub">有你有我</div>' +
      '<div class="mh-line"></div>' +
      '<div class="mh-note">獻給每一位曾為童話鋪路的人，以及 2026 年夏天那一夜回家的大家。</div>' +
      "</div>";
    /* 致敬書 */
    h += '<div class="mem-sec"><div class="mem-sec-head"><h2>致敬書</h2><span class="en">A LETTER OF GRATITUDE</span></div>' +
      '<div class="mem-letter">';
    TRIBUTE.forEach(function (p) { h += "<p>" + esc(p) + "</p>"; });
    h += '<div class="ml-sign">——小弟 YL 敬上</div></div></div>';
    /* 鳴謝名牆 */
    h += '<div class="mem-sec"><div class="mem-sec-head"><h2>鳴謝名牆</h2><span class="en">SHOUT OUT</span></div><div class="mem-credits">';
    CREDITS.forEach(function (c) {
      h += '<div class="mc-card"><b>' + esc(c[0]) + "</b><span>" + esc(c[1]) + "</span></div>";
    });
    h += "</div></div>";
    /* 那一夜 */
    h += '<div class="mem-sec night"><div class="mem-sec-head"><h2>那一夜・台服集體大合照</h2><span class="en">2026.08.13 21:30</span></div>' +
      '<div class="mem-story">';
    STORY.forEach(function (p) { h += "<p>" + esc(p) + "</p>"; });
    h += "</div>";
    h += '<div class="mem-quotes">';
    QUOTES.forEach(function (q) {
      h += '<div class="mq"><i>「' + esc(q[1]) + "」</i><b>—— " + esc(q[0]) + "</b></div>";
    });
    h += "</div>";
    /* 五幕合照 */
    h += '<div class="mem-scenes">';
    SCENES.forEach(function (s, i) {
      h += '<figure class="mem-shot r' + (i % 3) + '" data-full="' + M + s[0] + '.png">' +
        '<img src="' + M + s[0] + '.png" loading="lazy" alt="' + esc(s[1]) + '">' +
        "<figcaption><b>" + esc(s[1]) + "</b><span>" + esc(s[2]) + "</span></figcaption></figure>";
    });
    h += "</div><div class=\"mem-hint\">點任一張照片可放大細看——找找自己在哪裡。</div>";
    /* 影片 */
    h += '<div class="mem-clips">';
    CLIPS.forEach(function (c) {
      h += '<div class="mem-clip"><video src="' + M + c[0] + '.mp4" controls preload="metadata"></video><span>' + esc(c[1]) + "</span></div>";
    });
    h += "</div></div>";
    /* 點名冊 */
    h += '<div class="mem-sec"><div class="mem-sec-head"><h2>那一夜的點名冊</h2><span class="en">' + ROLL.length + " 位到場夥伴</span></div>" +
      '<div class="mem-roll">';
    ROLL.forEach(function (n) { h += '<span class="mr-chip">' + esc(n) + "</span>"; });
    h += "</div>" +
      '<div class="mem-hint">名單由合照逐一辨識整理，若有錯漏，請告訴站長補正——每個名字都不該被漏掉。</div></div>';
    /* 收尾 */
    h += '<div class="mem-end"><div class="me-quote">童話時分，有你有我。</div>' +
      '<div class="me-sub">下一個二十年，再一起拍一張。</div></div>';
    view.innerHTML = h;

    /* 燈箱 */
    view.querySelectorAll(".mem-shot").forEach(function (f) {
      f.onclick = function () { openLightbox(this.getAttribute("data-full")); };
    });
  }

  function openLightbox(src) {
    var lb = document.getElementById("memLightbox");
    if (!lb) {
      lb = document.createElement("div");
      lb.id = "memLightbox";
      lb.innerHTML = '<img alt=""><div class="lb-hint">點任意處關閉</div>';
      lb.onclick = function () { lb.classList.remove("show"); };
      document.body.appendChild(lb);
    }
    lb.querySelector("img").src = src;
    lb.classList.add("show");
  }

  window.MemoryUI = { render: render };
})();
