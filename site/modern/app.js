/* 童話資料網 典藏版 App —— vanilla JS, hash routing, 離線可用 */
(function () {
  "use strict";
  var META = window.__META, ARTS = [], MON = window.__MON || [];
  (window.__ART || []).forEach(function (chunk) { ARTS = ARTS.concat(chunk); });
  var byId = {};
  ARTS.forEach(function (a) { byId[a.id] = a; });
  var titleIndex = {};
  ARTS.forEach(function (a) { if (!(a.t in titleIndex)) titleIndex[a.t] = a.id; });

  var view = document.getElementById("view");
  var crumb = document.getElementById("crumb");
  var nav = document.getElementById("nav");
  var side = document.getElementById("side");
  var mask = document.getElementById("sideMask");

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function idOf(title) { return titleIndex[title] || ""; }
  function linkOf(title) {
    var id = idOf(title);
    return id ? '<a href="#/p/' + id + '">' + esc(title) + "</a>" : "";
  }

  /* ---------------- 側欄 ---------------- */
  var CN = ["壹", "貳", "參", "肆", "伍", "陸"];
  function buildNav() {
    var h = "";
    h += '<div class="nav-cat"><span class="num">卷零</span>起始頁</div>';
    h += '<a class="nav-item" data-r="#/" href="#/">典藏首頁</a>';
    h += '<a class="nav-item special" data-r="#/m" href="#/m">⚔ 幻獸資料庫</a>';
    h += '<a class="nav-item special" data-r="#/t/calc" href="#/t/calc">🧮 寵物降級計算機(參考)</a>';
    META.nav.forEach(function (c, i) {
      h += '<div class="nav-cat"><span class="num">卷' + (CN[i] || i + 1) + "</span>" + esc(c.cat) + "</div>";
      c.items.forEach(function (it) {
        h += '<a class="nav-item" data-r="#/p/' + it.id + '" href="#/p/' + it.id + '">' + esc(it.t) + "</a>";
      });
    });
    if (window.OfficialUI && OfficialUI.groups.length) {
      h += '<div class="nav-cat"><span class="num">卷' + (CN[META.nav.length] || "伍") + "</span>官方誌</div>";
      h += '<a class="nav-item special" data-r="#/o" href="#/o">📜 官方誌總覽</a>';
      OfficialUI.groups.forEach(function (g) {
        h += '<a class="nav-item" data-r="#/o/' + g.id + '" href="#/o/' + g.id + '">' + esc(g.name) + "</a>";
      });
    }
    if (window.ToolsUI) {
      h += '<div class="nav-cat"><span class="num">卷' + (CN[META.nav.length + (window.OfficialUI ? 1 : 0)] || "陸") + "</span>數據寶典</div>";
      h += '<a class="nav-item special" data-r="#/g" href="#/g">📖 寶典總覽</a>';
      ToolsUI.pages.forEach(function (p) {
        h += '<a class="nav-item" data-r="#/g/' + p.id + '" href="#/g/' + p.id + '">' + esc(p.t) + "</a>";
      });
    }
    if (window.MemoryUI) {
      h += '<div class="nav-cat"><span class="num">卷末</span>童話時分</div>';
      h += '<a class="nav-item special" data-r="#/y" href="#/y">✦ 致敬與回憶錄</a>';
    }
    nav.innerHTML = h;
  }
  function markNav(route) {
    var els = nav.querySelectorAll(".nav-item");
    for (var i = 0; i < els.length; i++)
      els[i].classList.toggle("on", els[i].getAttribute("data-r") === route);
  }

  /* ---------------- 首頁 ---------------- */
  function homeView() {
    var stepDefs = [
      ["認識世界", "先弄懂這是個什麼樣的童話世界", ["故事簡介", "世界背景", "進入遊戲", "操作介面"]],
      ["建立角色", "選對職業，路才走得長遠", ["玩家角色", "職業分析", "技能詳解", "法術一覽"]],
      ["展開冒險", "帶上幻獸夥伴，出發！", ["初入家園", "幻獸介紹", "新手問答", "二轉新職"]],
    ];
    var quickDefs = [
      ["幻獸資料庫", "名字．地圖．掉寶．技能 即時查", "#/m", "gold"],
      ["掉寶資料", "誰掉什麼、在哪掉", "#/p/" + idOf("掉寶資料"), ""],
      ["任務攻略", "各地任務完整流程", "#/p/" + idOf("任務攻略"), ""],
      ["魔王攻略", "魔王打法與情報", "#/p/" + idOf("魔王攻略"), ""],
      ["特殊物品", "稀有物入手途徑", "#/p/" + idOf("特殊物品"), ""],
      ["地圖詳覽", "敗家一族各地詳圖", "#/p/" + idOf("地圖詳覽"), ""],
      ["工作技能", "生產製造全書", "#/p/" + idOf("工作技能"), ""],
      ["幻獸融合", "融合配方與心得", "#/p/" + idOf("幻獸融合"), ""],
    ];
    var h = '<div class="hero">' +
      '<div class="hero-kicker">FAIRYLAND ARCHIVE</div>' +
      "<h1>童話資料網</h1>" +
      '<div class="hero-sub">敗家一族 2004–2022 資料典藏．重新編排的離線知識庫</div>' +
      '<div class="hero-search" id="heroSearch"><span class="st-icon">⌕</span>' +
      '<span class="q">搜尋幻獸、物品、地圖、任務攻略…</span><kbd>Ctrl K</kbd></div>' +
      '<div class="hero-stats">' + ARTS.length + " 篇文獻 · " + MON.length + " 隻幻獸資料 · 全站離線可查</div>" +
      "</div>";
    h += '<a class="home-atlas" href="../atlas/index.html">' +
      '<div class="ha-k">STANDALONE ATLAS</div><h3>童話世界地圖</h3>' +
      "<p>ROSS／徐大少那張 geocities 世界地圖的獨立離線本。同一份名單，改成可搜、可走、可對照原版。</p></a>";
    h += '<div class="home-sec"><div class="sec-head"><h2>新手上路</h2><span class="en">三步走進童話世界</span></div><div class="steps">';
    stepDefs.forEach(function (s, i) {
      h += '<div class="step"><div class="step-num">' + "壹貳參"[i] + "</div><h3>" + s[0] + "</h3><p>" + s[1] + "</p>";
      s[2].forEach(function (t) { h += linkOf(t); });
      h += "</div>";
    });
    h += "</div></div>";
    h += '<div class="home-sec"><div class="sec-head"><h2>老手快查</h2><span class="en">最常翻的八本冊子</span></div><div class="quick">';
    quickDefs.forEach(function (q) {
      h += '<a href="' + q[2] + '" class="' + q[3] + '"><div class="qt">' + q[0] + '</div><div class="qd">' + q[1] + "</div></a>";
    });
    h += "</div></div>";
    h += '<div class="home-sec"><div class="sec-head"><h2>實用工具</h2><span class="en">互動計算</span></div>' +
      '<a class="tool-card" href="#/t/calc"><span class="tc-icon">🧮</span><span>' +
      '<span class="tc-t">寵物降級計算機（參考）</span>' +
      '<span class="tc-d">六屬性全支援：單次試算九種道具效果，或整趟連環降級一次規劃到位</span>' +
      "</span></a></div>";
    if (window.ToolsUI) {
      h += '<div class="home-sec"><div class="sec-head"><h2>數據寶典</h2><span class="en">' + ToolsUI.pages.length + " 份互動圖表</span></div>" +
        '<div class="quick">';
      [["幻獸技能一覽", "112 種幻獸能學什麼技能", "#/g/skills", "gold"],
       ["練級掉寶地圖", "各地區等級、屬性與掉寶", "#/g/dropexp", ""],
       ["幻獸成長偏向", "七系六偏向 升級素質", "#/g/growth", ""],
       ["武器製作", "七大類武器全配方", "#/g/weapons", ""],
       ["採集六藝", "伐木挖礦釣魚狩獵採集農事", "#/g/gather", ""],
       ["出手順序表", "誰先出手一目了然", "#/g/turnorder", ""],
       ["遊樂場攻略", "六關規則與全獎品", "#/g/playground", ""],
       ["寶典總覽", "全部 " + ToolsUI.pages.length + " 份指南", "#/g", ""]].forEach(function (q) {
        h += '<a href="' + q[2] + '" class="' + q[3] + '"><div class="qt">' + q[0] + '</div><div class="qd">' + q[1] + "</div></a>";
      });
      h += "</div></div>";
    }
    if (window.OfficialUI && OfficialUI.groups.length) {
      h += '<div class="home-sec"><div class="sec-head"><h2>官方誌</h2><span class="en">公告・活動・資料片</span></div><div class="home-of">';
      OfficialUI.groups.forEach(function (g) {
        h += '<a href="#/o/' + g.id + '"><b>' + esc(g.name) + "</b><span>" + g.items.length + " 篇官方公告</span></a>";
      });
      h += "</div></div>";
    }
    if (window.MemoryUI) {
      h += '<div class="home-sec"><a class="home-mem" href="#/y"><span class="hm-bg"></span><span class="hm-body">' +
        '<span class="hm-kicker">FAIRYLAND MOMENTS · 2026.08.13</span>' +
        "<h3>童話時分</h3>" +
        "<p>致敬每一位為童話鋪路的人；還有那一夜，陽光商人號召的台服集體大合照——有你有我。</p>" +
        '<span class="hm-go">翻開回憶錄 →</span></span></a></div>';
    }
    h += '<div class="home-sec"><div class="sec-head"><h2>全書目錄</h2><span class="en">五卷典藏</span></div><div class="chapters">';
    META.nav.forEach(function (c) {
      h += '<div class="chapter"><h3>' + esc(c.cat) + '</h3><div class="cd">' + esc(c.desc) + "</div>";
      c.items.forEach(function (it) { h += '<a href="#/p/' + it.id + '">' + esc(it.t) + "</a>"; });
      h += "</div>";
    });
    h += "</div></div>";
    view.innerHTML = h;
    crumb.innerHTML = "<b>典藏首頁</b>";
    document.getElementById("heroSearch").onclick = openPalette;
  }

  /* ---------------- 文章 ---------------- */
  function artView(id) {
    var frag = "";
    var at = id.indexOf("@");
    if (at > 0) { frag = id.slice(at + 1); id = id.slice(0, at); }
    try { frag = decodeURIComponent(frag); } catch (e) { /* 保持原樣 */ }
    var a = byId[id];
    if (!a) { view.innerHTML = '<div class="art-head"><h1>找不到這一頁</h1></div><p>這份文獻不在典藏中，可能是原站已失效的頁面。</p>'; return; }
    view.innerHTML = '<div class="art-head"><div class="art-cat">' + esc(a.c) + "</div><h1>" + esc(a.t) + "</h1></div>" +
      '<div class="legacy">' + a.h + "</div>";
    crumb.innerHTML = esc(a.c) + " ／ <b>" + esc(a.t) + "</b>";
    var target = frag && document.getElementById(frag);
    if (target) scrollToAnchor(target);
    else window.scrollTo(0, 0);
  }
  function scrollToAnchor(el) {
    var y = el.getBoundingClientRect().top + window.pageYOffset - 64;
    window.scrollTo(0, Math.max(0, y));
    /* 短暫高亮所在區塊，讓使用者知道跳到哪裡 */
    var row = el.closest("td,tr,p,div") || el;
    row.classList.add("anch-hit");
    setTimeout(function () { row.classList.remove("anch-hit"); }, 1600);
  }
  /* 同頁錨點連結（建置時標成 data-anchor） */
  view.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[data-anchor]") : null;
    if (!a) return;
    e.preventDefault();
    var el = document.getElementById(a.getAttribute("data-anchor"));
    if (el) scrollToAnchor(el);
  });

  /* ---------------- 幻獸資料庫 ---------------- */
  var monState = { q: "", e: "", r: "" };
  var ELEMS = [], REGS = [];
  MON.forEach(function (m) {
    if (ELEMS.indexOf(m.e) < 0) ELEMS.push(m.e);
    if (REGS.indexOf(m.r) < 0) REGS.push(m.r);
  });

  function monFilter() {
    var q = monState.q.trim();
    return MON.filter(function (m) {
      if (monState.e && m.e !== monState.e) return false;
      if (monState.r && m.r !== monState.r) return false;
      if (!q) return true;
      if (m.n.indexOf(q) >= 0) return true;
      if (m.m.join(" ").indexOf(q) >= 0) return true;
      if (m.d.join(" ").indexOf(q) >= 0) return true;
      if (m.k.join(" ").indexOf(q) >= 0) return true;
      if (m.note && m.note.indexOf(q) >= 0) return true;
      return false;
    });
  }
  function chipRow(label, opts, cur, key) {
    var h = '<div class="chip-row"><span class="chip-label">' + label + "</span>";
    h += '<button class="chip' + (cur === "" ? " on" : "") + '" data-k="' + key + '" data-v="">全部</button>';
    opts.forEach(function (o) {
      h += '<button class="chip' + (cur === o ? " on" : "") + '" data-k="' + key + '" data-v="' + esc(o) + '">' + esc(o) + "</button>";
    });
    return h + "</div>";
  }
  function monView() {
    var h = '<div class="mon-head"><h1>幻獸資料庫</h1>' +
      "<p>輸入任何線索：幻獸名、出沒地圖、掉落物品、技能名、備註關鍵字，結果即時呈現。</p></div>" +
      '<div class="mon-tools">' +
      '<input class="mon-search" id="monQ" type="text" placeholder="例：雪怪 ／ 神燈沙漠 ／ 玻璃種子 ／ 吸血…" value="' + esc(monState.q) + '">' +
      chipRow("系別", ELEMS, monState.e, "e") +
      chipRow("大陸", REGS, monState.r, "r") +
      "</div>" +
      '<div class="mon-count" id="monCount"></div><div class="mon-grid" id="monGrid"></div>';
    view.innerHTML = h;
    crumb.innerHTML = "幻獸大全 ／ <b>幻獸資料庫</b>";
    var inp = document.getElementById("monQ");
    inp.oninput = function () { monState.q = this.value; renderMon(); };
    view.querySelectorAll(".chip").forEach(function (c) {
      c.onclick = function () {
        monState[this.getAttribute("data-k")] = this.getAttribute("data-v");
        monView();
        document.getElementById("monQ").focus();
      };
    });
    renderMon();
    if (monState.focus !== false) inp.focus();
  }
  function renderMon() {
    var list = monFilter();
    document.getElementById("monCount").textContent =
      "共 " + list.length + " 隻幻獸" + (monState.q ? "（關鍵字：" + monState.q + "）" : "");
    var h = "";
    list.forEach(function (m, i) {
      h += '<div class="mon-card" data-i="' + MON.indexOf(m) + '">' +
        '<img src="' + esc(m.img) + '" loading="lazy" alt="">' +
        '<div class="mn">' + esc(m.n) + "</div>" +
        '<div class="mi">' + lvText(m) + '<span class="badge">' + esc(m.e) + "系</span>" +
        '<span class="badge">' + esc(m.r) + "</span></div></div>";
    });
    var grid = document.getElementById("monGrid");
    grid.innerHTML = h || '<div class="pr-empty">沒有符合的幻獸，換個關鍵字試試。</div>';
    grid.querySelectorAll(".mon-card").forEach(function (c) {
      c.onclick = function () { openMon(+this.getAttribute("data-i")); };
    });
  }
  var monPanel = document.getElementById("monPanel");
  function lvText(m) {
    var v = String(m.s["等級"] || "").trim();
    return (!v || /^[?？\s／]+$/.test(v)) ? "等級不詳" : "Lv " + esc(v);
  }
  function openMon(i) {
    var m = MON[i];
    if (!m) return;
    var statKeys = ["力量", "體質", "敏捷", "智慧", "幸運", "魅力", "等級", "生命", "技能數", "偏向"];
    var h = '<div class="mp-card"><button class="mp-close" id="mpClose">✕ 關閉</button>' +
      '<div class="mp-top"><img src="' + esc(m.img) + '" alt=""><h2>' + esc(m.n) + "</h2>" +
      '<div class="mp-tags"><span class="badge">' + esc(m.e) + '系</span><span class="badge">' + esc(m.r) + "大陸區</span></div></div>";
    h += '<div class="mp-sec"><h4>能力數值</h4><div class="stat-grid">';
    statKeys.forEach(function (k) {
      if (m.s[k] === undefined) return;
      var v = String(m.s[k]).trim();
      var missing = !v || /^[?？\s／]+$/.test(v);
      h += '<div class="stat"><div class="sv' + (missing ? " nodata" : "") + '">' +
        (missing ? "資料不足" : esc(v)) + '</div><div class="sk">' + k + "</div></div>";
    });
    h += "</div></div>";
    if (m.m.length) {
      h += '<div class="mp-sec"><h4>出沒地圖</h4>';
      m.m.forEach(function (x) { h += '<span class="tag map" data-q="' + esc(x) + '">' + esc(x) + "</span>"; });
      h += "</div>";
    }
    if (m.d.length) {
      h += '<div class="mp-sec"><h4>掉寶資料 <small>（點一下可反查誰還會掉）</small></h4>';
      m.d.forEach(function (x) { h += '<span class="tag" data-q="' + esc(x) + '">' + esc(x) + "</span>"; });
      h += "</div>";
    }
    if (m.k.length) {
      h += '<div class="mp-sec"><h4>可學技能</h4>';
      m.k.forEach(function (x) { h += '<span class="tag" data-q="' + esc(x) + '">' + esc(x) + "</span>"; });
      h += "</div>";
    }
    if (m.note) h += '<div class="mp-sec"><h4>站長備註</h4><div class="mp-note">' + esc(m.note) + "</div></div>";
    h += "</div>";
    monPanel.innerHTML = h;
    monPanel.hidden = false;
    document.getElementById("mpClose").onclick = closeMon;
    monPanel.onclick = function (e) { if (e.target === monPanel) closeMon(); };
    monPanel.querySelectorAll(".tag").forEach(function (t) {
      t.onclick = function () {
        closeMon();
        monState.q = this.getAttribute("data-q");
        monState.e = ""; monState.r = "";
        if (location.hash === "#/m") monView(); else location.hash = "#/m";
      };
    });
  }
  function closeMon() { monPanel.hidden = true; monPanel.innerHTML = ""; }

  /* ---------------- 寵物降級計算機（依玩家整理的降級公式表重製，全屬性） ----------------
     公式來源：童话资料.xlsx「降级公式」分頁——
       有寶石：降後值 = (等級＋數值) ÷ 道具係數 ＋ 常數
       無寶石：降後值 = (等級＋數值) ÷ 20 ＋ 常數（蔘湯、雞精必吃寶石）
       官方降級費 = 2000 ＋ 等級 × 級距費率；一般降級 = 數值÷20＋2；融合 = (雙寵數值和)÷20＋2 */
  var CALC_ATTRS = [
    { k: "力量", gem: "紅玉髓" }, { k: "敏捷", gem: "藍玉髓" }, { k: "體質", gem: "綠玉髓" },
    { k: "智慧", gem: "神秘石" }, { k: "幸運", gem: "黃玉髓" }, { k: "魅力", gem: "青玉髓" }
  ];
  var CALC_ITEMS = [
    { k: "soup", n: "蔘湯", div: 1.3, add: 28, nog: null },
    { k: "chicken", n: "雞精", div: 1.5, add: 22, nog: null },
    { k: "water", n: "開水", div: 2, add: 16, nog: 54 },
    { k: "champagne", n: "香檳", div: 3, add: 14, nog: 41 },
    { k: "cola", n: "可樂", div: 4, add: 12, nog: 28 },
    { k: "soda", n: "汽水", div: 5, add: 10, nog: 20 },
    { k: "coffee", n: "咖啡", div: 6, add: 8, nog: 16 },
    { k: "juice", n: "果汁", div: 8, add: 6, nog: 12 },
    { k: "milk", n: "牛奶", div: 10, add: 4, nog: 8 }
  ];
  var itemByKey = {};
  CALC_ITEMS.forEach(function (it) { itemByKey[it.k] = it; });
  function withGem(it, lv, s) { return (lv + s) / it.div + it.add; }
  function noGem(it, lv, s) { return it.nog == null ? null : (lv + s) / 20 + it.nog; }
  function feeOf(lv) {
    if (lv < 1 || lv > 100) return null;
    var rate = lv <= 20 ? 1000 : 1000 + Math.ceil((Math.min(lv, 100) - 20) / 10) * 500;
    return 2000 + lv * rate;
  }
  function fdesc(it) {
    return "(等級＋數值)÷" + it.div + "＋" + it.add;
  }
  function fmt(n) { return Math.round(n).toLocaleString("zh-TW"); }
  function fmt1(n) { return (Math.round(n * 10) / 10).toLocaleString("zh-TW"); }

  var calcState = {
    mode: "once", attr: 0,
    lv: 72, val: 311, val2: 311,           // 單次試算
    count: 4, sel: 0, stages: null,        // 連環規劃
    growth: 4, target: 80, gemPrice: 100000
  };
  function defaultStages(n) {
    var arr = [];
    for (var i = 0; i < n; i++) {
      var last = (i === n - 1);
      arr.push({ lv: last ? 80 : 72, item: last ? "cola" : "coffee", gem: true });
    }
    return arr;
  }
  function calcAttr() { return CALC_ATTRS[calcState.attr]; }

  function calcView() {
    var a = calcAttr();
    var h = '<div class="calc-head"><h1>寵物降級計算機<span class="ref-badge">參考</span></h1>' +
      "<p>依老玩家整理的降級公式表重製：六種屬性都能算。先選要降的屬性，再挑「單次試算」快查一次降級，或用「連環規劃」排整趟神寵路線。</p></div>";
    h += '<div class="calc-sec"><h3>要降哪一種屬性？</h3><div class="cs-hint">吃對應寶石再降，效果比無寶石好一大截——每種屬性對應的寶石不同。</div>' +
      '<div class="calc-row" id="cAttr">';
    CALC_ATTRS.forEach(function (at, i) {
      h += '<button class="attr-chip' + (i === calcState.attr ? " on" : "") + '" data-i="' + i + '"><b>' + at.k + "</b><i>" + at.gem + "</i></button>";
    });
    h += '</div><div class="attr-now">目前試算：<b>' + a.k + '</b> 屬性 · 有寶石降級需吃 <b>' + a.gem + "</b>（<a href=\"#/g/dropore\">原石哪裡掉</a>）</div></div>";
    h += '<div class="calc-mode"><button class="md' + (calcState.mode === "once" ? " on" : "") + '" data-m="once">單次試算</button>' +
      '<button class="md' + (calcState.mode === "plan" ? " on" : "") + '" data-m="plan">連環規劃</button></div>';
    h += '<div id="calcBody"></div>';
    view.innerHTML = h;
    crumb.innerHTML = "實用工具 ／ <b>寵物降級計算機(參考)</b>";
    view.querySelectorAll("#cAttr .attr-chip").forEach(function (c) {
      c.onclick = function () { calcState.attr = +this.getAttribute("data-i"); calcView(); };
    });
    view.querySelectorAll(".calc-mode .md").forEach(function (b) {
      b.onclick = function () { calcState.mode = this.getAttribute("data-m"); calcView(); };
    });
    if (calcState.mode === "once") onceView(); else planView();
    window.scrollTo(0, 0);
  }

  /* ---- 單次試算：完整重現公式表 ---- */
  function onceView() {
    var a = calcAttr();
    var box = document.getElementById("calcBody");
    box.innerHTML =
      '<div class="calc-sec"><h3>填寵物現況</h3><div class="cs-hint">數值請填未加玩具、配件、推車的原始' + a.k + '。</div>' +
      '<div class="calc-row">' +
      '<div class="price-field"><label>寵物等級</label><input type="number" id="oLv" min="1" max="100" value="' + calcState.lv + '"></div>' +
      '<div class="price-field"><label>目前' + a.k + '數值</label><input type="number" id="oVal" min="0" value="' + calcState.val + '"></div>' +
      '<div class="price-field"><label>第二隻寵數值（算融合用）</label><input type="number" id="oVal2" min="0" value="' + calcState.val2 + '"></div>' +
      "</div></div>" +
      '<div id="onceOut"></div>';
    function rerender() {
      var lv = calcState.lv, s = calcState.val, fee = feeOf(lv);
      var h = '<div class="calc-sec"><h3>九種道具降級結果</h3><div class="cs-hint">降級後寵物回到 Lv 1，' + a.k + '底子變成表中數值（未滿一點的小數遊戲內無條件捨去）。</div>' +
        '<div class="tl-tablewrap"><table class="tl-table once"><thead><tr><th>道具</th><th>有寶石（吃' + a.gem + '）</th><th>無寶石</th><th>公式（有寶石）</th></tr></thead><tbody>';
      var best = -1;
      CALC_ITEMS.forEach(function (it) { best = Math.max(best, withGem(it, lv, s)); });
      CALC_ITEMS.forEach(function (it) {
        var g = withGem(it, lv, s), n = noGem(it, lv, s);
        h += "<tr><td><b>" + it.n + "</b></td>" +
          '<td class="num"><b class="' + (g === best ? "best" : "") + '">' + fmt1(g) + "</b></td>" +
          '<td class="num">' + (n == null ? '<span class="tl-dim">必吃寶石</span>' : fmt1(n)) + "</td>" +
          '<td class="tl-dim">' + fdesc(it) + "</td></tr>";
      });
      h += "</tbody></table></div></div>";
      h += '<div class="once-cards">' +
        '<div class="oc"><i>本次官方降級費</i><b>' + (fee == null ? "等級超出表列" : fmt(fee) + " 可因") + '</b><span>2000＋等級×級距費率</span></div>' +
        '<div class="oc"><i>一般降級（不吃道具）</i><b>' + fmt1(s / 20 + 2) + '</b><span>數值÷20＋2</span></div>' +
        '<div class="oc"><i>寵物融合（雙寵合一）</i><b>' + fmt1((s + calcState.val2) / 20 + 2) + '</b><span>(' + fmt(s) + "＋" + fmt(calcState.val2) + ")÷20＋2 · 費用 5000</span></div></div>";
      document.getElementById("onceOut").innerHTML = h;
    }
    [["oLv", "lv"], ["oVal", "val"], ["oVal2", "val2"]].forEach(function (p) {
      document.getElementById(p[0]).addEventListener("input", function () {
        calcState[p[1]] = parseFloat(this.value) || 0;
        rerender();
      });
    });
    rerender();
  }

  /* ---- 連環規劃 ---- */
  function planCompute() {
    var base = 0, total = 0, gems = 0, rows = [];
    calcState.stages.forEach(function (st) {
      var it = itemByKey[st.item];
      var useGem = st.gem || it.nog == null;
      var before = base + st.lv * calcState.growth;
      var after = useGem ? withGem(it, st.lv, before) : noGem(it, st.lv, before);
      var fee = feeOf(st.lv) || 0;
      var cost = fee + (useGem ? calcState.gemPrice : 0);
      rows.push({ before: before, after: after, fee: fee, gem: useGem, cost: cost });
      base = after;
      total += cost;
      if (useGem) gems++;
    });
    return { rows: rows, base: base, gems: gems,
             final: Math.floor(base + calcState.target * calcState.growth), total: total };
  }

  function planView() {
    if (!calcState.stages) calcState.stages = defaultStages(calcState.count);
    var a = calcAttr();
    var wild = Math.floor(calcState.target * calcState.growth);
    var box = document.getElementById("calcBody");
    var h = '<div class="calc-hero"><div><div class="ch-label">練回 ' + calcState.target + " 等的最終" + a.k + '</div>' +
      '<div class="ch-num" id="cFinal">0</div><div class="ch-unit">＝ Lv1 底子 <b id="cBase">0</b> ＋ ' + calcState.target + " 等自然成長 " + wild + "</div></div>" +
      '<div class="ch-items">' +
      '<div class="ch-box"><div class="k">比未降級野寵（' + wild + "）多出</div><div class=\"v gain\" id=\"cGain\">+0</div></div>" +
      '<div class="ch-box"><div class="k">官方費＋寶石總花費</div><div class="v" id="cTotal">0 可因</div></div>' +
      "</div></div>";
    h += '<div class="calc-sec"><h3>步驟一 · 成長設定</h3><div class="cs-hint">每級成長依幻獸「系別×偏向」而定（例：火系力量偏向＝每級+4），可查 <a href="#/g/growth">成長偏向表</a>。</div>' +
      '<div class="calc-row">' +
      '<div class="price-field"><label>每級成長</label><input type="number" id="pGrowth" step="0.5" min="1" max="6" value="' + calcState.growth + '"><span>點/級</span></div>' +
      '<div class="price-field"><label>目標等級</label><input type="number" id="pTarget" min="1" max="100" value="' + calcState.target + '"></div>' +
      '<div class="price-field"><label>' + a.gem + '市價</label><input type="number" id="pGem" min="0" value="' + calcState.gemPrice + '"><span>可因/顆</span></div>' +
      "</div></div>";
    h += '<div class="calc-sec"><h3>步驟二 · 要降幾次？</h3><div class="cs-hint">點數字選擇降級總次數，或套用玩家常用組合。</div><div class="calc-row" id="cCnt">';
    for (var i = 1; i <= 8; i++)
      h += '<button class="cnt-chip' + (i === calcState.count ? " on" : "") + '" data-n="' + i + '">' + i + "</button>";
    h += "</div><div class=\"calc-row\">";
    [[3, "3 降（主流）", "咖啡×2＋可樂×1"], [4, "4 降（熱門）", "咖啡×3＋可樂×1"],
     [5, "5 降（極限）", "咖啡×4＋可樂×1"], [6, "6 降（神寵）", "咖啡×5＋可樂×1"]].forEach(function (p) {
      h += '<button class="preset-btn" data-preset="' + p[0] + '"><b>' + p[1] + "</b>" + p[2] + "</button>";
    });
    h += "</div></div>";
    h += '<div class="calc-sec"><h3>步驟三 · 規劃降級旅程</h3>' +
      '<div class="cs-hint">下方軌道是整趟路線圖，點任一站設定等級、道具與寶石；右側帳單即時結算。</div>' +
      '<div class="journey" id="cRail"></div>' +
      '<div class="calc-duo"><div class="calc-editor" id="cEditor"></div>' +
      '<aside class="calc-bill" id="cBill"></aside></div></div>';
    h += '<div class="calc-note">計算依據（公式表原文）：降級前數值＝Lv1 底子＋等級×每級成長；有寶石降後值＝(等級＋數值)÷道具係數＋常數；' +
      "無寶石＝(等級＋數值)÷20＋常數；官方降級費＝2000＋等級×級距費率（71~80 等為每級 4000）。花費未含道具本身取得成本與練級費用。</div>";
    box.innerHTML = h;
    renderRail();
    renderEditor();
    bindPlan();
    refreshCalc();
  }

  function renderRail() {
    if (calcState.sel == null || calcState.sel >= calcState.stages.length) calcState.sel = 0;
    var r = planCompute(), h = "";
    calcState.stages.forEach(function (st, i) {
      var it = itemByKey[st.item];
      h += '<button class="jn' + (i === calcState.sel ? " on" : "") + '" data-i="' + i + '">' +
        '<span class="jn-no">' + (i + 1) + "</span>" +
        '<span class="jn-item">' + it.n + (r.rows[i].gem ? "＋寶石" : "") + "</span>" +
        '<span class="jn-lv">Lv ' + st.lv + " 降</span>" +
        '<span class="jn-pow">底子 ' + fmt1(r.rows[i].after) + "</span></button>" +
        '<span class="jn-link" aria-hidden="true"></span>';
    });
    h += '<div class="jn goal"><span class="jn-no">終</span><span class="jn-item">練回 ' + calcState.target + '</span>' +
      '<span class="jn-lv">成品' + calcAttr().k + '</span><span class="jn-pow">' + fmt(r.final) + "</span></div>";
    var rail = document.getElementById("cRail");
    rail.innerHTML = h;
    rail.querySelectorAll(".jn[data-i]").forEach(function (n) {
      n.onclick = function () {
        calcState.sel = +this.getAttribute("data-i");
        renderRail();
        renderEditor();
      };
    });
  }

  function renderEditor() {
    var i = calcState.sel, st = calcState.stages[i];
    var last = (i === calcState.stages.length - 1);
    var it = itemByKey[st.item];
    var mustGem = it.nog == null;
    var chips = CALC_ITEMS.map(function (o) {
      return '<button class="item-chip' + (o.k === st.item ? " on" : "") + '" data-k="' + o.k + '">' +
        "<b>" + o.n + "</b><i>" + (o.nog == null ? "必吃寶石" : "可免寶石") + "</i>" +
        "<em>" + fdesc(o) + "</em></button>";
    }).join("");
    var box = document.getElementById("cEditor");
    box.innerHTML =
      '<div class="ed-head"><span class="ed-title">第 ' + (i + 1) + " 站</span>" +
      (last ? '<span class="ed-fin">最後一降，降完練到 ' + calcState.target + "</span>" : "") + "</div>" +
      '<div class="ed-row"><label>降級前等級</label>' +
      '<div class="stepper"><button data-step="-1">−</button>' +
      '<input type="number" min="1" max="100" data-f="lv" value="' + st.lv + '">' +
      '<button data-step="1">＋</button></div></div>' +
      '<div class="ed-row"><label>降級道具（附有寶石公式）</label>' +
      '<div class="chip-grid">' + chips + "</div></div>" +
      '<div class="ed-row"><label>這一站吃' + calcAttr().gem + "嗎？" + (mustGem ? "（此道具必吃）" : "") + "</label>" +
      '<div class="gem-toggle"><button class="gt' + ((st.gem || mustGem) ? " on" : "") + '" data-g="1">有寶石</button>' +
      '<button class="gt' + (!(st.gem || mustGem) ? " on" : "") + (mustGem ? " off" : "") + '" data-g="0">無寶石</button></div></div>' +
      '<div class="flow"><span class="fl-a">降前 <b data-o="before">0</b></span>' +
      '<span class="fl-arrow">' + it.n + " ➤</span>" +
      '<span class="fl-b">降後 Lv1 底子 <b data-o="after">0</b></span>' +
      '<span class="fl-cost">本站花費 <b data-o="cost">0</b></span></div>';
    box.querySelectorAll(".item-chip").forEach(function (c) {
      c.onclick = function () {
        st.item = this.getAttribute("data-k");
        renderEditor();
        refreshCalc();
      };
    });
    box.querySelectorAll(".gem-toggle .gt").forEach(function (b) {
      b.onclick = function () {
        if (mustGem) return;
        st.gem = this.getAttribute("data-g") === "1";
        renderEditor();
        refreshCalc();
      };
    });
    box.querySelectorAll("[data-step]").forEach(function (b) {
      b.onclick = function () {
        st.lv = Math.max(1, Math.min(100, (st.lv || 0) + (+this.getAttribute("data-step"))));
        box.querySelector('[data-f="lv"]').value = st.lv;
        refreshCalc();
      };
    });
    box.querySelectorAll("input[data-f]").forEach(function (el) {
      el.addEventListener("input", function () {
        st[this.getAttribute("data-f")] = parseFloat(this.value) || 0;
        refreshCalc();
      });
    });
  }

  function renderBill() {
    var r = planCompute();
    var fees = 0;
    var h = '<div class="bill-title">費用帳單</div><div class="bill-sub">全程 ' + calcState.stages.length + " 降 · 單位：可因</div>";
    calcState.stages.forEach(function (st, i) {
      var it = itemByKey[st.item];
      fees += r.rows[i].fee;
      h += '<div class="bill-row' + (i === calcState.sel ? " on" : "") + '"><span>第' + (i + 1) + "站 · " + it.n +
        (r.rows[i].gem ? "＋寶石" : "") + "</span><i></i><b>" + fmt(r.rows[i].cost) + "</b></div>";
    });
    h += '<div class="bill-div"></div>' +
      '<div class="bill-row sub"><span>官方降級費合計</span><i></i><b>' + fmt(fees) + "</b></div>" +
      '<div class="bill-row sub"><span>' + calcAttr().gem + " 共 " + r.gems + " 顆</span><i></i><b>" + fmt(r.gems * calcState.gemPrice) + "</b></div>" +
      '<div class="bill-total"><span>合計</span><b>' + fmt(r.total) + "</b></div>";
    document.getElementById("cBill").innerHTML = h;
  }
  function bindPlan() {
    document.querySelectorAll("#cCnt .cnt-chip").forEach(function (c) {
      c.onclick = function () { setStageCount(+this.getAttribute("data-n")); };
    });
    document.querySelectorAll(".preset-btn").forEach(function (b) {
      b.onclick = function () {
        calcState.stages = null;
        calcState.count = +this.getAttribute("data-preset");
        calcView();
      };
    });
    [["pGrowth", "growth"], ["pTarget", "target"], ["pGem", "gemPrice"]].forEach(function (p) {
      document.getElementById(p[0]).addEventListener("input", function () {
        calcState[p[1]] = parseFloat(this.value) || 0;
        refreshCalc();
      });
    });
  }
  function setStageCount(n) {
    var old = calcState.stages;
    calcState.count = n;
    calcState.stages = defaultStages(n);
    for (var i = 0; i < Math.min(old.length, n); i++) calcState.stages[i] = old[i];
    calcState.sel = Math.min(calcState.sel, n - 1);
    calcView();
  }
  function refreshCalc() {
    var r = planCompute();
    var el = document.getElementById("cFinal");
    if (!el) return;
    el.textContent = fmt(r.final);
    document.getElementById("cBase").textContent = fmt1(r.base);
    document.getElementById("cGain").textContent = "+" + fmt(r.base);
    document.getElementById("cTotal").textContent = fmt(r.total) + " 可因";
    var row = r.rows[calcState.sel], ed = document.getElementById("cEditor");
    if (row && ed) {
      ed.querySelector('[data-o="before"]').textContent = fmt1(row.before);
      ed.querySelector('[data-o="after"]').textContent = fmt1(row.after);
      ed.querySelector('[data-o="cost"]').textContent = fmt(row.cost);
    }
    renderRail();
    renderBill();
  }

  /* ---------------- 數據寶典 ---------------- */
  function toolsView(id) {
    if (!window.ToolsUI) { homeView(); return; }
    ToolsUI.render(id, view);
    crumb.innerHTML = id
      ? '<a href="#/g" style="color:inherit">數據寶典</a> ／ <b>' + esc(ToolsUI.title(id)) + "</b>"
      : "<b>數據寶典</b>";
    window.scrollTo(0, 0);
  }
  /* ---------------- 官方誌 ---------------- */
  function offView(gid) {
    if (!window.OfficialUI) { homeView(); return; }
    if (gid) {
      OfficialUI.group(view, gid);
      var g = null;
      OfficialUI.groups.forEach(function (x) { if (x.id === gid) g = x; });
      crumb.innerHTML = '官方誌 ／ <b>' + esc(g ? g.name : "") + "</b>";
    } else {
      OfficialUI.hub(view);
      crumb.innerHTML = "<b>官方誌</b>";
    }
    window.scrollTo(0, 0);
  }

  /* ---------------- 童話時分 ---------------- */
  function memView() {
    if (!window.MemoryUI) { homeView(); return; }
    MemoryUI.render(view);
    crumb.innerHTML = "卷末 ／ <b>童話時分・致敬與回憶錄</b>";
    window.scrollTo(0, 0);
  }

  /* 寶典各頁的幻獸名連結 → 幻獸資料庫搜尋 */
  window.__gotoMon = function (q) {
    monState.q = q || "";
    monState.e = "";
    monState.r = "";
    if (location.hash === "#/m") monView();
    else location.hash = "#/m";
  };

  /* ---------------- 全站搜尋 ---------------- */
  var palette = document.getElementById("palette");
  var palInput = document.getElementById("palInput");
  var palResults = document.getElementById("palResults");
  var palSel = 0, palItems = [];

  function openPalette() {
    palette.hidden = false;
    palInput.value = "";
    palResults.innerHTML = '<div class="pr-empty">打幾個字，馬上找到你要的。</div>';
    palItems = []; palSel = 0;
    setTimeout(function () { palInput.focus(); }, 0);
  }
  function closePalette() { palette.hidden = true; }

  function snippet(text, q) {
    var i = text.indexOf(q);
    if (i < 0) return esc(text.slice(0, 60));
    var s = Math.max(0, i - 24);
    var frag = text.slice(s, i + q.length + 40);
    return (s > 0 ? "…" : "") + esc(frag).replace(new RegExp(esc(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "<mark>" + esc(q) + "</mark>") + "…";
  }
  function doSearch(q) {
    q = q.trim();
    if (q.length < 1) { palResults.innerHTML = '<div class="pr-empty">打幾個字，馬上找到你要的。</div>'; palItems = []; return; }
    var mon = [], artT = [], artX = [], tools = [];
    for (var i = 0; i < MON.length && mon.length < 8; i++) {
      var m = MON[i];
      if (m.n.indexOf(q) >= 0 || m.d.join(" ").indexOf(q) >= 0 || m.m.join(" ").indexOf(q) >= 0) mon.push(m);
    }
    if (window.ToolsUI) {
      if (!doSearch._tix) doSearch._tix = ToolsUI.searchIndex();
      var tix = doSearch._tix;
      for (var k = 0; k < tix.length && tools.length < 6; k++) {
        if (tix[k].t.indexOf(q) >= 0 || tix[k].d.indexOf(q) >= 0) tools.push(k);
      }
    }
    var offs = [];
    if (window.OfficialUI) {
      if (!doSearch._oix) doSearch._oix = OfficialUI.searchIndex();
      for (var o = 0; o < doSearch._oix.length && offs.length < 5; o++) {
        if (doSearch._oix[o].t.indexOf(q) >= 0) offs.push(o);
      }
    }
    for (var j = 0; j < ARTS.length; j++) {
      var a = ARTS[j];
      if (a.t.indexOf(q) >= 0) { if (artT.length < 8) artT.push(a); }
      else if (a.x.indexOf(q) >= 0) { if (artX.length < 14) artX.push(a); }
      if (artT.length >= 8 && artX.length >= 14) break;
    }
    var h = ""; palItems = [];
    if (mon.length) {
      h += '<div class="pr-group">幻獸</div>';
      mon.forEach(function (m) {
        var act = "mon:" + MON.indexOf(m);
        h += '<a class="pr-item" data-act="' + act + '"><span class="pt">' + esc(m.n) +
          ' <span class="badge">' + esc(m.e) + "系 " + lvText(m) + "</span></span>" +
          '<div class="px">' + esc(m.m.join("、")) + "</div></a>";
        palItems.push(act);
      });
    }
    if (tools.length) {
      h += '<div class="pr-group">數據寶典</div>';
      tools.forEach(function (k) {
        var it = doSearch._tix[k], act = "tool:" + k;
        h += '<a class="pr-item" data-act="' + act + '"><span class="pt">' + esc(it.t) +
          ' <span class="badge">寶典</span></span>' +
          '<div class="px">' + esc(it.d) + "</div></a>";
        palItems.push(act);
      });
    }
    if (offs.length) {
      h += '<div class="pr-group">官方誌</div>';
      offs.forEach(function (k) {
        var it = doSearch._oix[k], act = "off:" + k;
        h += '<a class="pr-item" data-act="' + act + '"><span class="pt">' + esc(it.t) +
          '</span><span class="ps">' + esc(it.sub) + "</span></a>";
        palItems.push(act);
      });
    }
    var arts = artT.concat(artX);
    if (arts.length) {
      h += '<div class="pr-group">文獻</div>';
      arts.forEach(function (a) {
        var act = "art:" + a.id;
        h += '<a class="pr-item" data-act="' + act + '"><span class="pt">' + esc(a.t) +
          ' <span class="badge">' + esc(a.c) + "</span></span>" +
          '<div class="px">' + snippet(a.x, q) + "</div></a>";
        palItems.push(act);
      });
    }
    palResults.innerHTML = h || '<div class="pr-empty">找不到「' + esc(q) + '」，試試別的說法？</div>';
    palSel = 0;
    updateSel();
    palResults.querySelectorAll(".pr-item").forEach(function (el, i2) {
      el.onclick = function () { runAct(this.getAttribute("data-act")); };
      el.onmouseenter = function () { palSel = i2; updateSel(); };
    });
  }
  function updateSel() {
    var els = palResults.querySelectorAll(".pr-item");
    for (var i = 0; i < els.length; i++) els[i].classList.toggle("sel", i === palSel);
    if (els[palSel]) els[palSel].scrollIntoView({ block: "nearest" });
  }
  function runAct(act) {
    closePalette();
    if (act.indexOf("mon:") === 0) {
      var i = +act.slice(4);
      if (location.hash !== "#/m") location.hash = "#/m";
      setTimeout(function () { openMon(i); }, 60);
    } else if (act.indexOf("art:") === 0) {
      location.hash = "#/p/" + act.slice(4);
    } else if (act.indexOf("tool:") === 0) {
      var it = doSearch._tix[+act.slice(5)];
      if (it.q) ToolsUI.setQuery(it.page, it.q);
      if (location.hash === it.hash) route();
      else location.hash = it.hash;
    } else if (act.indexOf("off:") === 0) {
      var oi = doSearch._oix[+act.slice(4)];
      if (location.hash === oi.r) route();
      else location.hash = oi.r;
    }
  }
  var palTimer = null;
  palInput.addEventListener("input", function () {
    clearTimeout(palTimer);
    var v = this.value;
    palTimer = setTimeout(function () { doSearch(v); }, 90);
  });
  palInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { palSel = Math.min(palSel + 1, palItems.length - 1); updateSel(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { palSel = Math.max(palSel - 1, 0); updateSel(); e.preventDefault(); }
    else if (e.key === "Enter") { if (palItems[palSel]) runAct(palItems[palSel]); }
    else if (e.key === "Escape") closePalette();
  });
  palette.addEventListener("click", function (e) { if (e.target === palette) closePalette(); });
  document.getElementById("searchBtn").onclick = openPalette;
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
    else if (e.key === "Escape") { closePalette(); closeMon(); }
    else if (e.key === "/" && palette.hidden && document.activeElement.tagName !== "INPUT") { e.preventDefault(); openPalette(); }
  });

  /* ---------------- 路由 ---------------- */
  function route() {
    var h = location.hash || "#/";
    closeMon();
    side.classList.remove("open");
    mask.classList.remove("show");
    if (h === "#/" || h === "#") homeView();
    else if (h === "#/m") { monState.focus = false; monView(); monState.focus = true; }
    else if (h === "#/t/calc") calcView();
    else if (h === "#/g") toolsView(null);
    else if (h.indexOf("#/g/") === 0) toolsView(h.slice(4));
    else if (h === "#/o") offView(null);
    else if (h.indexOf("#/o/") === 0) offView(h.slice(4));
    else if (h === "#/y") memView();
    else if (h.indexOf("#/p/") === 0) artView(h.slice(4));
    else homeView();
    markNav(h.indexOf("#/p/") === 0 || h.indexOf("#/g") === 0 || h.indexOf("#/o") === 0 ? h.split("@")[0] : (h === "#/m" || h === "#/t/calc" || h === "#/y") ? h : "#/");
    view.style.animation = "none";
    void view.offsetWidth;
    view.style.animation = "";
  }
  window.addEventListener("hashchange", route);

  document.getElementById("menuBtn").onclick = function () {
    side.classList.add("open"); mask.classList.add("show");
  };
  mask.onclick = function () { side.classList.remove("open"); mask.classList.remove("show"); };

  buildNav();
  route();
})();
