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
      ["地圖詳覽", "全地圖導覽", "#/p/" + idOf("地圖詳覽"), ""],
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
      '<span class="tc-d">規劃連環降級：選道具、填行情，馬上算出 80 等最終力量與總花費</span>' +
      "</span></a></div>";
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
    var a = byId[id];
    if (!a) { view.innerHTML = '<div class="art-head"><h1>找不到這一頁</h1></div><p>這份文獻不在典藏中，可能是原站已失效的頁面。</p>'; return; }
    view.innerHTML = '<div class="art-head"><div class="art-cat">' + esc(a.c) + "</div><h1>" + esc(a.t) + "</h1></div>" +
      '<div class="legacy">' + a.h + "</div>";
    crumb.innerHTML = esc(a.c) + " ／ <b>" + esc(a.t) + "</b>";
    window.scrollTo(0, 0);
  }

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

  /* ---------------- 寵物降級計算機(參考) ---------------- */
  var CALC_ITEMS = [
    { k: "milk", name: "降級牛奶", crystal: 20, custom: false, fdesc: "等級÷10＋力量÷10＋4", f: function (lv, s) { return Math.floor(lv / 10) + Math.floor(s / 10) + 4; } },
    { k: "juice", name: "降級果汁", crystal: 50, custom: false, fdesc: "等級÷8＋力量÷8＋6", f: function (lv, s) { return Math.floor(lv / 8) + Math.floor(s / 8) + 6; } },
    { k: "coffee", name: "降級咖啡", crystal: 100, custom: false, fdesc: "等級÷6＋力量÷6＋8", f: function (lv, s) { return Math.floor(lv / 6) + Math.floor(s / 6) + 8; } },
    { k: "soda", name: "降級汽水", crystal: 150, custom: false, fdesc: "等級÷5＋力量÷5＋10", f: function (lv, s) { return Math.floor(lv / 5) + Math.floor(s / 5) + 10; } },
    { k: "cola", name: "降級可樂", crystal: 200, custom: false, fdesc: "等級÷4＋力量÷4＋12", f: function (lv, s) { return Math.floor(lv / 4) + Math.floor(s / 4) + 12; } },
    { k: "champagne", name: "降級香檳", crystal: 300, custom: false, fdesc: "等級÷3＋力量÷3＋14", f: function (lv, s) { return Math.floor(lv / 3) + Math.floor(s / 3) + 14; } },
    { k: "water", name: "降級開水", crystal: 500, custom: false, fdesc: "等級÷2＋力量÷2＋16", f: function (lv, s) { return Math.floor(lv / 2) + Math.floor(s / 2) + 16; } },
    { k: "chicken", name: "降級雞精", crystal: 800, custom: true, fdesc: "等級÷1.5＋力量÷1.5＋22", f: function (lv, s) { return Math.floor(lv / 1.5) + Math.floor(s / 1.5) + 22; } },
    { k: "soup", name: "降級蔘湯", crystal: 1000, custom: true, fdesc: "等級×0.75＋力量×0.75＋32", f: function (lv, s) { return Math.floor(lv * 0.75) + Math.floor(s * 0.75) + 32; } }
  ];
  var itemByKey = {};
  CALC_ITEMS.forEach(function (it) { itemByKey[it.k] = it; });
  var GROWTH = 3.8, WILD80 = Math.floor(80 * GROWTH);

  var calcState = {
    count: 4, sel: 0,
    crystalPrice: 600000, gemPrice: 100000, stickPrice: 300000,
    stages: null
  };
  function defaultStages(n) {
    var arr = [];
    for (var i = 0; i < n; i++) {
      var last = (i === n - 1);
      arr.push({ lv: last ? 80 : 72, item: last ? "cola" : "coffee",
                 crystal: last ? 200 : 100, stick: last ? 15 : 10 });
    }
    return arr;
  }
  function fmt(n) { return Math.round(n).toLocaleString("zh-TW"); }

  function calcCompute() {
    var base = 0, total = 0, rows = [];
    calcState.stages.forEach(function (st) {
      var it = itemByKey[st.item];
      var before = base + st.lv * GROWTH;
      var after = it.f(st.lv, before);
      var cost = st.crystal * calcState.crystalPrice + calcState.gemPrice + st.stick * calcState.stickPrice;
      rows.push({ before: before, after: after, cost: cost });
      base = after;
      total += cost;
    });
    return { rows: rows, base: base, final: Math.floor(base + 80 * GROWTH), total: total };
  }

  function calcView() {
    if (!calcState.stages) calcState.stages = defaultStages(calcState.count);
    var h = '<div class="calc-head"><h1>寵物降級計算機<span class="ref-badge">參考</span></h1>' +
      "<p>規劃幻獸連環降級：選好每一階段用的道具，馬上看到練回 80 等的最終力量和總花費。照 1、2、3 三步設定即可。</p></div>";
    h += '<div class="calc-hero"><div><div class="ch-label">練回 80 等的最終力量</div>' +
      '<div class="ch-num" id="cFinal">0</div><div class="ch-unit">＝ Lv1 力量底子 <b id="cBase">0</b> ＋ 80 等自然成長 ' + WILD80 + "</div></div>" +
      '<div class="ch-items">' +
      '<div class="ch-box"><div class="k">比未降級野寵（' + WILD80 + ' 力）多出</div><div class="v gain" id="cGain">+0</div></div>' +
      '<div class="ch-box"><div class="k">全程總花費</div><div class="v" id="cTotal">0 可因</div></div>' +
      "</div></div>";
    // 步驟一：次數與範例
    h += '<div class="calc-sec"><h3>步驟一 · 要降幾次？</h3><div class="cs-hint">點數字選擇降級總次數，或直接套用玩家常用的組合範例。</div><div class="calc-row" id="cCnt">';
    for (var i = 1; i <= 8; i++)
      h += '<button class="cnt-chip' + (i === calcState.count ? " on" : "") + '" data-n="' + i + '">' + i + "</button>";
    h += "</div><div class=\"calc-row\">";
    [[3, "3 降（主流）", "咖啡×2＋可樂×1"], [4, "4 降（熱門）", "咖啡×3＋可樂×1"],
     [5, "5 降（極限）", "咖啡×4＋可樂×1"], [6, "6 降（神寵）", "咖啡×5＋可樂×1"]].forEach(function (p) {
      h += '<button class="preset-btn" data-preset="' + p[0] + '"><b>' + p[1] + "</b>" + p[2] + "</button>";
    });
    h += "</div></div>";
    // 步驟二：行情
    h += '<div class="calc-sec"><h3>步驟二 · 填市場行情</h3><div class="cs-hint">依目前伺服器物價填寫，花費全部換算成可因。</div><div class="calc-row">' +
      '<div class="price-field"><label>1 魔晶石 ＝</label><input type="number" id="cCrystalPrice" value="' + calcState.crystalPrice + '"><span>可因</span></div>' +
      '<div class="price-field"><label>紅玉髓每顆</label><input type="number" id="cGemPrice" value="' + calcState.gemPrice + '"><span>可因</span></div>' +
      '<div class="price-field"><label>超級加油棒每根</label><input type="number" id="cStickPrice" value="' + calcState.stickPrice + '"><span>可因</span></div>' +
      "</div></div>";
    // 步驟三：降級旅程（軌道 + 單一編輯面板 + 費用帳單）
    h += '<div class="calc-sec"><h3>步驟三 · 規劃降級旅程</h3>' +
      '<div class="cs-hint">下方軌道是整趟降級的路線圖，點任一站進行設定；右側帳單即時列出每一站的花費。</div>' +
      '<div class="journey" id="cRail"></div>' +
      '<div class="calc-duo"><div class="calc-editor" id="cEditor"></div>' +
      '<aside class="calc-bill" id="cBill"></aside></div></div>';
    h += '<div class="calc-note">計算依據（沿用原工具設定，僅供參考）：力量成長以每級 3.8 估算；降級前力量＝Lv1 底子＋等級×3.8；' +
      "每階段花費＝道具魔晶石×魔晶石價＋紅玉髓一顆＋加油棒數×單價。實際數值依伺服器版本可能略有出入。</div>";
    view.innerHTML = h;
    crumb.innerHTML = "實用工具 ／ <b>寵物降級計算機(參考)</b>";
    renderRail();
    renderEditor();
    bindCalc();
    refreshCalc();
    window.scrollTo(0, 0);
  }

  function itemShort(it) { return it.name.replace("降級", ""); }

  /* 旅程軌道：每一降是一個可點選的站點，最後接「成品」終點 */
  function renderRail() {
    if (calcState.sel == null || calcState.sel >= calcState.stages.length) calcState.sel = 0;
    var r = calcCompute(), h = "";
    calcState.stages.forEach(function (st, i) {
      var it = itemByKey[st.item];
      h += '<button class="jn' + (i === calcState.sel ? " on" : "") + '" data-i="' + i + '">' +
        '<span class="jn-no">' + (i + 1) + "</span>" +
        '<span class="jn-item">' + itemShort(it) + "</span>" +
        '<span class="jn-lv">Lv ' + st.lv + " 降</span>" +
        '<span class="jn-pow">底子 ' + fmt(r.rows[i].after) + "</span></button>" +
        '<span class="jn-link" aria-hidden="true"></span>';
    });
    h += '<div class="jn goal"><span class="jn-no">終</span><span class="jn-item">練回 80</span>' +
      '<span class="jn-lv">成品力量</span><span class="jn-pow">' + fmt(r.final) + "</span></div>";
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

  /* 編輯面板：一次只編輯軌道上選中的那一站 */
  function renderEditor() {
    var i = calcState.sel, st = calcState.stages[i];
    var last = (i === calcState.stages.length - 1);
    var it = itemByKey[st.item];
    var chips = CALC_ITEMS.map(function (o) {
      return '<button class="item-chip' + (o.k === st.item ? " on" : "") + '" data-k="' + o.k + '">' +
        "<b>" + itemShort(o) + "</b><i>魔晶石×" + o.crystal + (o.custom ? "（自訂）" : "") + "</i>" +
        "<em>" + o.fdesc + "</em></button>";
    }).join("");
    var box = document.getElementById("cEditor");
    box.innerHTML =
      '<div class="ed-head"><span class="ed-title">第 ' + (i + 1) + " 站</span>" +
      (last ? '<span class="ed-fin">最後一降，降完練到 80</span>' : "") + "</div>" +
      '<div class="ed-row"><label>降級前等級</label>' +
      '<div class="stepper"><button data-step="-1">−</button>' +
      '<input type="number" min="1" max="200" data-f="lv" value="' + st.lv + '">' +
      '<button data-step="1">＋</button></div></div>' +
      '<div class="ed-row"><label>降級道具（附降後 Lv1 力量公式）</label>' +
      '<div class="chip-grid">' + chips + "</div></div>" +
      '<div class="ed-row ed-2col">' +
      '<div><label>魔晶石數' + (it.custom ? "（自訂價道具）" : "（商城固定，不可改）") + "</label>" +
      '<input type="number" data-f="crystal" value="' + st.crystal + '"' + (it.custom ? "" : " disabled") + "></div>" +
      '<div><label>超級加油棒（根）</label><input type="number" data-f="stick" value="' + st.stick + '"></div></div>' +
      '<div class="flow"><span class="fl-a">降前 <b data-o="before">0</b> 力</span>' +
      '<span class="fl-arrow">' + itemShort(it) + " ➤</span>" +
      '<span class="fl-b">降後 Lv1 底子 <b data-o="after">0</b></span>' +
      '<span class="fl-cost">本站花費 <b data-o="cost">0</b></span></div>';
    box.querySelectorAll(".item-chip").forEach(function (c) {
      c.onclick = function () {
        var k = this.getAttribute("data-k");
        st.item = k;
        st.crystal = itemByKey[k].crystal;
        renderEditor();
        refreshCalc();
      };
    });
    box.querySelectorAll("[data-step]").forEach(function (b) {
      b.onclick = function () {
        st.lv = Math.max(1, Math.min(200, (st.lv || 0) + (+this.getAttribute("data-step"))));
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

  /* 費用帳單：收據式明細 */
  function renderBill() {
    var r = calcCompute();
    var crystals = 0, sticks = 0;
    var h = '<div class="bill-title">費用帳單</div><div class="bill-sub">全程 ' + calcState.stages.length + " 降 · 單位：可因</div>";
    calcState.stages.forEach(function (st, i) {
      var it = itemByKey[st.item];
      crystals += st.crystal; sticks += st.stick;
      h += '<div class="bill-row' + (i === calcState.sel ? " on" : "") + '"><span>第' + (i + 1) + "站 · " + itemShort(it) + "</span><i></i><b>" + fmt(r.rows[i].cost) + "</b></div>";
    });
    h += '<div class="bill-div"></div>' +
      '<div class="bill-row sub"><span>魔晶石 共 ' + fmt(crystals) + " 顆</span><i></i><b>" + fmt(crystals * calcState.crystalPrice) + "</b></div>" +
      '<div class="bill-row sub"><span>紅玉髓 共 ' + calcState.stages.length + " 顆</span><i></i><b>" + fmt(calcState.stages.length * calcState.gemPrice) + "</b></div>" +
      '<div class="bill-row sub"><span>加油棒 共 ' + fmt(sticks) + " 根</span><i></i><b>" + fmt(sticks * calcState.stickPrice) + "</b></div>" +
      '<div class="bill-total"><span>合計</span><b>' + fmt(r.total) + "</b></div>";
    document.getElementById("cBill").innerHTML = h;
  }
  function bindCalc() {
    document.querySelectorAll("#cCnt .cnt-chip").forEach(function (c) {
      c.onclick = function () {
        setStageCount(+this.getAttribute("data-n"));
      };
    });
    document.querySelectorAll(".preset-btn").forEach(function (b) {
      b.onclick = function () {
        calcState.stages = null;
        calcState.count = +this.getAttribute("data-preset");
        calcView();
      };
    });
    [["cCrystalPrice", "crystalPrice"], ["cGemPrice", "gemPrice"], ["cStickPrice", "stickPrice"]].forEach(function (p) {
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
    var r = calcCompute();
    document.getElementById("cFinal").textContent = fmt(r.final);
    document.getElementById("cBase").textContent = fmt(r.base);
    document.getElementById("cGain").textContent = "+" + fmt(r.base);
    document.getElementById("cTotal").textContent = fmt(r.total) + " 可因";
    var row = r.rows[calcState.sel], ed = document.getElementById("cEditor");
    if (row && ed) {
      ed.querySelector('[data-o="before"]').textContent = fmt(Math.floor(row.before));
      ed.querySelector('[data-o="after"]').textContent = fmt(row.after);
      ed.querySelector('[data-o="cost"]').textContent = fmt(row.cost);
    }
    renderRail();
    renderBill();
  }

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
    var mon = [], artT = [], artX = [];
    for (var i = 0; i < MON.length && mon.length < 8; i++) {
      var m = MON[i];
      if (m.n.indexOf(q) >= 0 || m.d.join(" ").indexOf(q) >= 0 || m.m.join(" ").indexOf(q) >= 0) mon.push(m);
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
    else if (h.indexOf("#/p/") === 0) artView(h.slice(4));
    else homeView();
    markNav(h.indexOf("#/p/") === 0 ? h : (h === "#/m" || h === "#/t/calc") ? h : "#/");
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
