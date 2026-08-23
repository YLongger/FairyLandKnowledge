(function () {
  "use strict";
  var D = window.ATLAS;
  if (!D) { document.body.innerHTML = "<p style='padding:40px'>找不到 data.js</p>"; return; }

  var places = D.places;
  var byId = {};
  places.forEach(function (p) { byId[p.id] = p; });
  var regions = D.regions;
  var byR = {};
  regions.forEach(function (r) { byR[r.id] = r; });
  var client = D.client || [];
  var cmapBy = {};
  client.forEach(function (m) { cmapBy[m.id] = m; });
  function spriteOf(n) {
    if (!n) return "";
    if (D.sprite && D.sprite[n]) return D.sprite[n];
    return "";
  }

  var monByName = {};
  var monIndex = [];
  places.forEach(function (p) {
    (p.mons || []).forEach(function (m) {
      var rec = monByName[m.n];
      if (!rec) {
        rec = { n: m.n, e: m.e || "", lv: m.lv || "", places: [], cplaces: [] };
        monByName[m.n] = rec;
        monIndex.push(rec);
      }
      if (rec.places.indexOf(p.id) === -1) rec.places.push(p.id);
    });
  });
  client.forEach(function (cm) {
    (cm.mobs || []).forEach(function (m) {
      var rec = monByName[m.n];
      if (!rec) {
        rec = { n: m.n, e: "", lv: "", places: [], cplaces: [] };
        monByName[m.n] = rec;
        monIndex.push(rec);
      }
      rec.cplaces = rec.cplaces || [];
      if (rec.cplaces.indexOf(cm.id) === -1) rec.cplaces.push(cm.id);
      if (cm.pid && rec.places.indexOf(cm.pid) === -1) rec.places.push(cm.pid);
      if (!rec.lv && (m.lv || m.lv2)) {
        rec.lv = (m.lv2 && m.lv2 !== m.lv) ? (m.lv + "–" + m.lv2) : String(m.lv || m.lv2);
      }
    });
  });

  var S = {
    view: "map",
    region: "mainland",
    q: "",
    sel: null,
    rareTag: "稀有種",
    selRare: null,
    cmap: null,
    cband: "world",
    bookBand: "all",
    selBook: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    liston: false,
    cw: 1168,
    ch: 880,
    fitZ: 1,
    userCam: false
  };

  var builtKey = null;
  var lastSel = null;
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var els = {
    app: document.getElementById("app"),
    chips: document.getElementById("chips"),
    sub: document.getElementById("sub"),
    listBtn: document.getElementById("listBtn"),
    rail: document.getElementById("rail"),
    stage: document.getElementById("stage"),
    sheet: document.getElementById("sheet"),
    work: document.getElementById("work"),
    q: document.getElementById("q"),
    views: document.getElementById("views"),
    suggest: document.getElementById("suggest"),
    findbar: document.getElementById("findbar"),
    lite: document.getElementById("lite"),
    liteImg: document.getElementById("liteImg"),
    liteCap: document.getElementById("liteCap")
  };

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function norm(s) {
    return String(s || "").toLowerCase()
      .replace(/祕/g, "秘").replace(/沈/g, "沉").replace(/來/g, "萊")
      .replace(/喫/g, "吃").replace(/巖/g, "岩").replace(/碗豆/g, "豌豆")
      .replace(/\s+/g, "");
  }
  function hit(q, parts) {
    if (!q) return true;
    var n = norm(q);
    for (var i = 0; i < parts.length; i++) {
      if (norm(parts[i]).indexOf(n) !== -1) return true;
    }
    return false;
  }
  function hay(p) {
    var a = [p.n, p.kz, p.blurb, p.lv, p.elem, p.mid].concat(p.aka || []).concat(p.cnpcs || []);
    (p.mons || []).forEach(function (m) { a.push(m.n); });
    (p.drops || []).forEach(function (d) { a.push(d); });
    (p.floors || []).forEach(function (f) { a.push(f.a, f.m, f.d); });
    (p.gather || []).forEach(function (g) { a.push(g.n); });
    (p.cto || []).forEach(function (t) { a.push(t.n, t.id); });
    return a;
  }
  function filtered() {
    return places.filter(function (p) {
      if (S.q) return hit(S.q, hay(p));
      if (S.region !== "all" && p.r !== S.region) return false;
      return true;
    });
  }
  function matchedMons(p, q) {
    if (!q) return [];
    var n = norm(q);
    return (p.mons || []).filter(function (m) { return norm(m.n).indexOf(n) !== -1; });
  }
  function monsterHits(q) {
    if (!q) return [];
    var n = norm(q);
    return monIndex.filter(function (m) { return norm(m.n).indexOf(n) !== -1; })
      .sort(function (a, b) {
        var ae = norm(a.n) === n ? 0 : 1;
        var be = norm(b.n) === n ? 0 : 1;
        return ae - be || a.n.localeCompare(b.n, "zh-Hant");
      });
  }
  function counts() {
    var c = { all: 0 };
    regions.forEach(function (r) { c[r.id] = 0; });
    places.forEach(function (p) {
      if (!hit(S.q, hay(p))) return;
      c.all++;
      c[p.r]++;
    });
    return c;
  }
  function ridNow() {
    return S.region === "all" ? "mainland" : S.region;
  }
  function canvasOf(rid) {
    if (rid === "mainland") return { w: 1168, h: 880 };
    if (rid === "clothes") return { w: 1200, h: 800 };
    return { w: 2000, h: 1400 };
  }
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function hash() {
    var h = "#/" + S.view;
    if (S.view === "map") h += "/" + S.region;
    if (S.view === "rare" && S.rareTag && S.rareTag !== "稀有種") h += "/" + encodeURIComponent(S.rareTag);
    if (S.view === "book") {
      h += "/" + (S.bookBand || "all");
      if (S.selBook) h += "/p/" + encodeURIComponent(S.selBook);
    }
    if (S.view === "client") {
      h += "/" + (S.cband || "world");
      if (S.cmap) h += "/" + S.cmap;
    }
    if (S.sel) h += "/p/" + S.sel;
    if (S.view === "rare" && S.selRare) h += "/pet/" + encodeURIComponent(S.selRare);
    return h;
  }
  function syncHash() {
    var h = hash();
    if (location.hash !== h) history.replaceState(null, "", h);
  }
  function readHash() {
    var raw = decodeURIComponent((location.hash || "#/").replace(/^#\/?/, ""));
    var parts = raw.split("/").filter(Boolean);
    S.view = "map";
    S.region = "mainland";
    S.sel = null;
    S.cmap = null;
    if (parts[0] === "list" || parts[0] === "ledger") S.view = "list";
    else if (parts[0] === "old" || parts[0] === "original") S.view = "old";
    else if (parts[0] === "rare" || parts[0] === "hunt") S.view = "rare";
    else if (parts[0] === "book" || parts[0] === "dex") S.view = "book";
    else if (parts[0] === "client" || parts[0] === "cmap") S.view = "client";
    else if (parts[0] === "map" || parts[0] === "p" || !parts[0]) S.view = "map";
    if (S.view === "book") {
      var bb = { all: 1, client: 1, "金": 1, "木": 1, "水": 1, "火": 1, "光": 1, "闇": 1, "稀": 1 };
      if (parts[1] && bb[parts[1]]) S.bookBand = parts[1];
      for (var bi = 0; bi < parts.length; bi++) {
        if (parts[bi] === "p" && parts[bi + 1]) S.selBook = decodeURIComponent(parts[bi + 1]);
      }
    }
    if (S.view === "client") {
      var bands = { world: 1, room: 1, maze: 1, island: 1, all: 1 };
      if (parts[1] && bands[parts[1]]) S.cband = parts[1];
      var last = parts[parts.length - 1];
      if (/^\d+$/.test(last)) S.cmap = parseInt(last, 10);
    }
    for (var ri = 0; ri < parts.length; ri++) {
      if (parts[ri] === "pet" && parts[ri + 1]) S.selRare = decodeURIComponent(parts[ri + 1]);
    }
    for (var i = 0; i < parts.length; i++) {
      if (byR[parts[i]]) S.region = parts[i];
      if (parts[i] === "p" && parts[i + 1] && byId[parts[i + 1]]) S.sel = parts[i + 1];
      if (byId[parts[i]] && parts[i - 1] !== "map") S.sel = parts[i];
    }
    if (S.sel && S.view === "map") S.region = byId[S.sel].r;
  }

  function asset(rel) {
    if (!rel) return "";
    if (/^https?:/i.test(rel)) return rel;
    return "../" + rel;
  }

  function go(id, keepView) {
    var p = byId[id];
    if (!p) return;
    S.sel = id;
    S.region = p.r;
    if (!keepView) S.view = "map";
    if (els.suggest) els.suggest.hidden = true;
    render();
    var el = document.getElementById("card-" + id);
    if (el) el.scrollIntoView({ block: "nearest" });
  }
  function goCmap(id, keepBand) {
    var n = parseInt(id, 10);
    if (!cmapBy[n]) return;
    S.cmap = n;
    if (!keepBand) S.view = "client";
    if (els.suggest) els.suggest.hidden = true;
    render();
  }
  function setView(v) {
    S.view = v;
    if (v === "old") S.sel = null;
    if (v !== "rare") S.selRare = null;
    if (v !== "book") S.selBook = null;
    if (v !== "client") S.cmap = null;
    if (v !== "map") builtKey = null;
    render();
  }
  function setRegion(id) {
    S.region = id;
    if (S.sel && byId[S.sel].r !== id && id !== "all") S.sel = null;
    if (S.view === "old") S.view = "map";
    S.userCam = false;
    builtKey = null;
    lastSel = null;
    render();
  }

  function applyCam() {
    var inner = document.getElementById("minner");
    if (!inner) return;
    inner.style.transform = "translate(" + S.panX + "px," + S.panY + "px) scale(" + S.zoom + ")";
    inner.style.setProperty("--z", String(S.zoom));
    var zb = document.querySelector(".zoom b");
    if (zb) zb.textContent = Math.round(S.zoom * 100) + "%";
  }
  function fitCam() {
    var vp = document.getElementById("mvp");
    if (!vp) return;
    var r = vp.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) return;
    var pad = 24;
    var z = Math.min((r.width - pad * 2) / S.cw, (r.height - pad * 2) / S.ch);
    if (!isFinite(z) || z <= 0) z = 1;
    S.fitZ = z;
    S.zoom = z;
    S.panX = (r.width - S.cw * z) / 2;
    S.panY = (r.height - S.ch * z) / 2;
    S.userCam = false;
    applyCam();
    window.requestAnimationFrame(layoutPinTips);
  }
  function zoomAt(mx, my, factor) {
    var lo = (S.fitZ || 0.6) * 0.7;
    var hi = 4.2;
    var next = clamp(S.zoom * factor, lo, hi);
    var cx = (mx - S.panX) / S.zoom;
    var cy = (my - S.panY) / S.zoom;
    S.panX = mx - cx * next;
    S.panY = my - cy * next;
    S.zoom = next;
    S.userCam = true;
    applyCam();
  }
  function flyTo(id) {
    var p = byId[id];
    var vp = document.getElementById("mvp");
    if (!p || !vp) return;
    var r = vp.getBoundingClientRect();
    var z = clamp((S.fitZ || 1) * (S.cw > 1000 ? 1.45 : 1.7), (S.fitZ || 1), 2.8);
    var px = p.x / 100 * S.cw;
    var py = p.y / 100 * S.ch;
    var left = (S.liston && S.view === "map") ? 270 : 0;
    var right = S.sel ? Math.min(420, r.width * 0.38) + 16 : 0;
    var cx = left + (r.width - left - right) / 2;
    var cy = r.height * 0.48;
    S.zoom = z;
    S.panX = cx - px * z;
    S.panY = cy - py * z;
    S.userCam = true;
    var inner = document.getElementById("minner");
    if (inner && !reduceMotion) inner.style.transition = "transform .32s ease";
    applyCam();
    if (inner && !reduceMotion) {
      window.setTimeout(function () { inner.style.transition = "none"; }, 340);
    }
  }

  function render() {
    syncHash();
    els.app.dataset.view = S.view;
    els.app.classList.toggle("liston", S.liston);
    els.work.classList.toggle("old", S.view === "old");
    els.work.classList.toggle("ledger", S.view === "list");
    els.work.classList.toggle("rare", S.view === "rare");
    els.work.classList.toggle("book", S.view === "book");
    els.work.classList.toggle("client", S.view === "client");
    els.work.classList.toggle("liston", S.liston);
    els.work.classList.toggle("nrail", !S.liston || S.view !== "map");
    els.work.classList.toggle("nosheet", S.view === "rare" ? !S.selRare : (S.view === "book" ? !S.selBook : (S.view === "client" ? !S.cmap : (!S.sel || S.view !== "map"))));
    if (els.listBtn) els.listBtn.classList.toggle("on", S.liston);
    renderViews();
    renderChips();
    renderFindbar();
    renderSub();
    if (S.view === "old") {
      els.rail.innerHTML = "";
      els.sheet.hidden = true;
      els.sheet.innerHTML = "";
      builtKey = null;
      renderOld();
      return;
    }
    if (S.view === "rare") {
      els.rail.innerHTML = "";
      builtKey = null;
      renderRare();
      els.sheet.hidden = !S.selRare;
      if (S.selRare) renderRareSheet();
      else els.sheet.innerHTML = "";
      return;
    }
    if (S.view === "book") {
      els.rail.innerHTML = "";
      builtKey = null;
      renderBook();
      els.sheet.hidden = !S.selBook;
      if (S.selBook) renderBookSheet();
      else els.sheet.innerHTML = "";
      return;
    }
    if (S.view === "client") {
      els.rail.innerHTML = "";
      builtKey = null;
      renderClient();
      els.sheet.hidden = !S.cmap;
      if (S.cmap) renderClientSheet();
      else els.sheet.innerHTML = "";
      return;
    }
    renderRail();
    els.sheet.hidden = !S.sel;
    if (S.sel) renderSheet();
    else els.sheet.innerHTML = "";
    if (S.view === "list") {
      builtKey = null;
      renderLedger();
      return;
    }
    renderMap();
  }

  function renderViews() {
    var vs = [
      ["map", "地圖"],
      ["list", "名冊"],
      ["book", "圖鑑"],
      ["client", "客戶端"],
      ["rare", "稀有寵"],
      ["old", "原版對照"]
    ];
    els.views.innerHTML = vs.map(function (v) {
      return "<button type='button' data-v='" + v[0] + "' class='" + (S.view === v[0] ? "on" : "") + "'>" + v[1] + "</button>";
    }).join("");
  }

  function renderSub() {
    if (!els.sub) return;
    if (S.view !== "list") { els.sub.innerHTML = ""; return; }
    var rid = ridNow();
    var r = byR[rid] || byR.mainland;
    var n = S.region === "all" ? filtered().length : (counts()[rid] || 0);
    els.sub.innerHTML = "<span class='sk'>" + esc(r.en) + "</span><h2>" + esc(S.region === "all" ? "全圖" : r.n) + "</h2><p>" +
      esc(S.region === "all" ? "十個分冊、同一份名單。" : r.d) + " · " + n + " 處</p>";
  }

  function renderFindbar() {
    if (!els.findbar) return;
    if (!S.q) { els.findbar.hidden = true; els.findbar.innerHTML = ""; return; }
    var list = filtered();
    var mons = monsterHits(S.q);
    var exact = mons.filter(function (m) { return norm(m.n) === norm(S.q); });
    var html = "<b>找到 " + list.length + " 處</b>";
    if (exact.length) {
      html += " · 幻獸「" + esc(exact[0].n) + "」出現在 ";
      var locBtns = exact[0].places.map(function (id) {
        var p = byId[id];
        return p ? "<button type='button' data-id='" + p.id + "'>" + esc(p.n) + "</button>" : "";
      });
      (exact[0].cplaces || []).forEach(function (cid) {
        var cm = cmapBy[cid];
        if (!cm || cm.pid) return;
        if (cid >= 62000 && cid < 63000) return;
        locBtns.push("<button type='button' data-cid='" + cid + "'>" + esc(cm.n) + "</button>");
      });
      html += locBtns.filter(Boolean).join("、");
    } else if (mons.length) {
      html += " · 幻獸 " + mons.slice(0, 4).map(function (m) {
        return "<button type='button' data-q='" + esc(m.n) + "'>" + esc(m.n) + "</button>";
      }).join("、");
      if (mons.length > 4) html += " 等 " + mons.length + " 種";
    } else if (!list.length) {
      html = "<b>沒有符合的地名或幻獸</b> · 試試「吉恩」「窩捲蟲」「娃娃盒」";
    }
    els.findbar.innerHTML = html;
    els.findbar.hidden = false;
  }

  function renderSuggest() {
    if (!els.suggest) return;
    var q = S.q;
    if (!q) { els.suggest.hidden = true; els.suggest.innerHTML = ""; return; }
    var rows = [];
    monsterHits(q).slice(0, 6).forEach(function (m) {
      var maps = m.places.map(function (id) { return byId[id] ? byId[id].n : ""; }).filter(Boolean);
      var extra = (m.cplaces || []).map(function (cid) { return cmapBy[cid] && !cmapBy[cid].pid ? cmapBy[cid].n : ""; }).filter(Boolean);
      maps = maps.concat(extra);
      rows.push({
        k: "幻獸", q: m.n, id: m.places[0] || "", cid: extra.length && !m.places[0] ? (m.cplaces || [])[0] : "",
        t: m.n, s: maps.slice(0, 3).join("、") + (maps.length > 3 ? " 等 " + maps.length + " 張地圖" : " · " + maps.length + " 張地圖")
      });
    });
    places.filter(function (p) { return hit(q, [p.n].concat(p.aka || [])); }).slice(0, 5).forEach(function (p) {
      rows.push({ k: "地圖", q: p.n, id: p.id, t: p.n, s: (byR[p.r] ? byR[p.r].n + " · " : "") + p.kz });
    });
    client.filter(function (m) { return hit(q, [m.n, String(m.id)]); }).slice(0, 4).forEach(function (m) {
      rows.push({ k: "編號", q: m.n, cid: m.id, t: m.n, s: "地圖 " + m.id + (m.mobs && m.mobs.length ? " · " + m.mobs.length + " 種出沒" : "") });
    });
    if (!rows.length) { els.suggest.hidden = true; els.suggest.innerHTML = ""; return; }
    els.suggest.innerHTML = rows.slice(0, 8).map(function (r) {
      var attr = (r.id ? " data-id='" + r.id + "'" : "") + (r.cid ? " data-cid='" + r.cid + "'" : "") + " data-q='" + esc(r.q) + "'";
      return "<button type='button'" + attr + "><i>" + esc(r.k) + "</i><span><b>" + esc(r.t) + "</b><em>" + esc(r.s) + "</em></span></button>";
    }).join("");
    els.suggest.hidden = false;
  }

  function rares() {
    return D.rares || [];
  }
  function rareFiltered() {
    var list = rares();
    var q = S.q;
    return list.filter(function (m) {
      if (S.rareTag && S.rareTag !== "all" && (m.tags || []).indexOf(S.rareTag) === -1) return false;
      if (!q) return true;
      var parts = [m.n, m.e, m.lv, m.note].concat(m.tags || []).concat(m.k || []);
      (m.maps || []).forEach(function (x) { parts.push(x.n); });
      return hit(q, parts);
    });
  }
  function rareByName(n) {
    for (var i = 0; i < rares().length; i++) {
      if (rares()[i].n === n) return rares()[i];
    }
    return null;
  }

  function renderChips() {
    if (S.view === "book") {
      var book = D.book || [];
      var cards = D.cards || [];
      var tags = [["all", "全部"], ["金", "金"], ["木", "木"], ["水", "水"], ["火", "火"], ["光", "光"], ["闇", "闇"], ["稀", "稀有"], ["client", "客戶端圖卡"]];
      var html = "";
      tags.forEach(function (t) {
        var n;
        if (t[0] === "client") n = cards.length;
        else if (t[0] === "all") n = book.length;
        else n = book.filter(function (m) { return (m.e || "") === t[0]; }).length;
        html += "<button type='button' class='chip" + (S.bookBand === t[0] ? " on" : "") + "' data-book='" + t[0] + "'><b>" + t[1] + "</b><i>" + n + "</i></button>";
      });
      els.chips.innerHTML = html;
      return;
    }
    if (S.view === "client") {
      var bands = [["world", "野外"], ["room", "室內"], ["maze", "迷宮"], ["island", "島嶼"], ["all", "全部"]];
      var html = "";
      bands.forEach(function (t) {
        var n = client.filter(function (m) { return t[0] === "all" ? true : m.b === t[0]; }).length;
        html += "<button type='button' class='chip" + (S.cband === t[0] ? " on" : "") + "' data-cband='" + t[0] + "'><b>" + t[1] + "</b><i>" + n + "</i></button>";
      });
      els.chips.innerHTML = html;
      return;
    }
    if (S.view === "rare") {
      var tags = [["稀有種", "稀有種"], ["推薦抓", "推薦抓"], ["可封印", "可封印"], ["all", "全部"]];
      var html = "";
      tags.forEach(function (t) {
        var n = rares().filter(function (m) {
          return t[0] === "all" ? true : (m.tags || []).indexOf(t[0]) !== -1;
        }).length;
        html += "<button type='button' class='chip" + (S.rareTag === t[0] ? " on" : "") + "' data-rare='" + t[0] + "'><b>" + t[1] + "</b><i>" + n + "</i></button>";
      });
      els.chips.innerHTML = html;
      return;
    }
    var c = counts();
    var html = "<button type='button' class='chip" + (S.region === "all" ? " on" : "") + "' data-r='all'><b>全部</b><i>" + c.all + "</i></button>";
    regions.forEach(function (r) {
      html += "<button type='button' class='chip" + (S.region === r.id ? " on" : "") + "' data-r='" + r.id + "'><b>" + esc(r.n) + "</b><i>" + (c[r.id] || 0) + "</i></button>";
    });
    els.chips.innerHTML = html;
  }

  function clientFiltered() {
    return client.filter(function (m) {
      if (S.cband && S.cband !== "all" && m.b !== S.cband) return false;
      if (!S.q) return true;
      var parts = [m.n, String(m.id)].concat(m.npcs || []);
      (m.mobs || []).forEach(function (x) { parts.push(x.n); });
      return hit(S.q, parts);
    });
  }
  function lvText(m) {
    if (!m) return "";
    if (m.lv2 && m.lv2 !== m.lv) return "Lv " + m.lv + "–" + m.lv2;
    if (m.lv) return "Lv " + m.lv;
    return "";
  }
  function renderClient() {
    var list = clientFiltered();
    var h = "<div class='ledger rarebook'><div class='ledger-lead'><div class='k'>CLIENT 2026</div><h2>客戶端地圖</h2>" +
      "<p>這是遊戲裡那張有顏色的地圖，從 2026 客戶端 maps\\minimap.lpq 原檔抽出來，不是走格示意圖。點一張看連到哪裡、誰站在哪、哪種幻獸會跳出來。</p></div>";
    if (!list.length) h += "<div class='empty'>沒有符合的地圖。換上面分類，或搜名字／編號／幻獸。</div>";
    h += "<div class='grid cgrid'>";
    list.forEach(function (m) {
      h += "<button type='button' class='card ccard" + (S.cmap === m.id ? " on" : "") + "' data-cid='" + m.id + "'>";
      if (m.img) h += "<span class='c-spr'><img src='" + esc(asset(m.img)) + "' alt='" + esc(m.n) + "'></span>";
      else h += "<span class='c-spr empty'>?</span>";
      h += "<div class='pad'><div class='meta'>" + m.id + (m.mobs && m.mobs.length ? " · " + m.mobs.length + " 種出沒" : "") + "</div>";
      h += "<b>" + esc(m.n) + "</b>";
      h += "<div class='ms'>" + esc((m.mobs || []).slice(0, 3).map(function (x) { return x.n; }).join("、") || (m.npcs || []).slice(0, 2).join("、") || "室內／無遇敵") + "</div></div></button>";
    });
    h += "</div></div>";
    els.stage.className = "ledger";
    els.stage.innerHTML = h;
  }
  function renderClientSheet() {
    var m = cmapBy[S.cmap];
    if (!m) { els.sheet.innerHTML = ""; return; }
    var h = "<button type='button' class='sheet-x' data-close='1' title='關閉'>×</button>";
    h += "<div class='sh-k'>2026 客戶端 · 地圖 " + m.id + "</div>";
    h += "<h2 class='sh-n'>" + esc(m.n) + "</h2>";
    h += "<div class='sh-meta'><span class='tag'>編號 " + m.id + "</span>";
    if (m.w && m.h) h += "<span class='tag'>" + m.w + "×" + m.h + "</span>";
    if (m.mobs && m.mobs.length) h += "<span class='tag'>" + m.mobs.length + " 種出沒</span>";
    h += "</div>";
    var place = m.pid && byId[m.pid] ? byId[m.pid] : null;
    var detailImg = place && place.img && place.img !== m.img ? place.img : "";
    h += "<div class='pair-maps" + (m.img && detailImg ? "" : " one") + "'>";
    if (m.img) {
      h += "<figure><img src='" + esc(asset(m.img)) + "' alt='" + esc(m.n) + "' data-lite='" + esc(asset(m.img)) + "' data-cap='" + esc(m.n + " · 客戶端地圖 " + m.id) + "'><figcaption>客戶端地圖 · " + m.id + "</figcaption></figure>";
    }
    if (detailImg) {
      h += "<figure><img src='" + esc(asset(detailImg)) + "' alt='" + esc(place.n) + " 詳圖' data-lite='" + esc(asset(detailImg)) + "' data-cap='" + esc(place.n + " · 詳圖") + "'><figcaption>詳圖</figcaption></figure>";
    }
    h += "</div>";
    if (place) {
      h += "<p><button type='button' class='hexit' data-id='" + esc(place.id) + "'><b>在地圖上看 " + esc(place.n) + "</b></button></p>";
    }
    if (m.to && m.to.length) {
      h += "<div class='sh-h'>連到 · 點編號走進下一張</div><div class='exits'>";
      m.to.forEach(function (tid) {
        var d = cmapBy[tid];
        h += "<button type='button' class='exit' data-cid='" + tid + "'>";
        if (d && d.img) h += "<img src='" + esc(asset(d.img)) + "' alt=''>";
        h += "<span><b>" + esc(d ? d.n : ("地圖 " + tid)) + "</b><i>" + tid + (d && d.pid ? " · 地圖有點" : "") + "</i></span></button>";
      });
      h += "</div>";
    }
    if (m.npcs && m.npcs.length) {
      h += "<div class='sh-h'>站在這裡的人</div><div class='chips'>";
      m.npcs.forEach(function (n) { h += "<span>" + esc(n) + "</span>"; });
      h += "</div>";
    }
    if (m.mobs && m.mobs.length) {
      h += "<div class='sh-h'>會跳出來的幻獸 · 點名字看照片</div><div class='mons'>";
      m.mobs.forEach(function (x) {
        var sp = spriteOf(x.n);
        h += "<button type='button' class='mon'" + (sp ? " data-lite='" + esc(asset(sp)) + "' data-cap='" + esc(x.n) + "'" : " data-q='" + esc(x.n) + "'") + ">";
        if (sp) h += "<img src='" + esc(asset(sp)) + "' alt=''>";
        h += "<span><b>" + esc(x.n) + "</b><i>" + esc(lvText(x)) + "</i></span></button>";
      });
      h += "</div>";
    }
    h += "<p class='hint'>連線來自地圖檔裡的傳送腳本；出沒來自同一份檔的遇敵表。室內店家通常不會遇敵。</p>";
    els.sheet.innerHTML = h;
  }
  function renderRare() {
    var list = rareFiltered();
    var h = "<div class='ledger rarebook'><div class='ledger-lead'><div class='k'>TAMER</div><h2>稀有寵手冊</h2>" +
      "<p>給魔獸使看的。稀有種是官方 21 隻（雷爵獸、木頭貝貝、小木魚…），黑暗儀式招不出來。推薦抓是五顆星／冠軍，可封印會掉娃娃盒。點卡片看出沒，點地圖就飛過去。</p></div>";
    if (!list.length) h += "<div class='empty'>沒有符合的寵。換上面的分類，或搜名字／地圖。</div>";
    h += "<div class='grid petgrid'>";
    list.forEach(function (m) {
      var maps = (m.maps || []).map(function (x) { return x.n; }).slice(0, 3).join("、") || (m.qcard ? "Q 卡抽獎" : "地圖未對上");
      h += "<button type='button' class='card petcard" + (S.selRare === m.n ? " on" : "") + "' data-rarepet='" + esc(m.n) + "'>";
      if (m.img) h += "<span class='pet-spr'><img src='" + esc(asset(m.img)) + "' alt=''></span>";
      else h += "<span class='pet-spr empty'>?</span>";
      h += "<div class='pad'><div class='meta'>" + esc((m.tags || []).join(" · ")) + (m.e ? " · " + esc(m.e) : "") + "</div>";
      h += "<b>" + esc(m.n) + "</b>";
      if (m.lv) h += "<div class='lv'>Lv " + esc(m.lv) + "</div>";
      h += "<div class='ms'>" + esc(maps) + "</div></div></button>";
    });
    h += "</div></div>";
    els.stage.className = "ledger";
    els.stage.innerHTML = h;
  }

  function renderRareSheet() {
    var m = rareByName(S.selRare);
    if (!m) { els.sheet.innerHTML = ""; return; }
    var h = "<button type='button' class='sheet-x' data-close='1' title='關閉'>×</button>";
    h += "<div class='sh-k'>魔獸使 · " + esc((m.tags || []).join(" · ")) + "</div>";
    h += "<h2 class='sh-n'>" + esc(m.n) + "</h2>";
    if (m.img) h += "<div class='pet-hero'><img src='" + esc(asset(m.img)) + "' alt='" + esc(m.n) + "'></div>";
    h += "<div class='sh-meta'>";
    if (m.e) h += "<span class='tag'>" + esc(m.e) + "</span>";
    if (m.lv) h += "<span class='tag'>Lv " + esc(m.lv) + "</span>";
    if (m.catch) h += "<span class='tag'>可封印</span>";
    if (m.qcard) h += "<span class='tag'>Q 卡</span>";
    h += "</div>";
    if (m.note) h += "<p class='sh-blurb'>" + esc(m.note) + "</p>";
    if (m.k && m.k.length) {
      h += "<div class='sh-h'>技能</div><div class='chips'>";
      m.k.forEach(function (s) { h += "<span>" + esc(s) + "</span>"; });
      h += "</div>";
    }
    h += "<div class='sh-h'>出沒地圖 · 點了就飛過去</div>";
    if (m.maps && m.maps.length) {
      h += "<div class='exits'>";
      m.maps.forEach(function (x) {
        var p = byId[x.id];
        h += "<button type='button' class='exit' data-id='" + esc(x.id) + "'>";
        if (p && p.img) h += "<img src='" + esc(asset(p.img)) + "' alt=''>";
        h += "<span><b>" + esc(x.n) + "</b><i>" + esc(p && byR[p.r] ? byR[p.r].n : "") + "</i></span></button>";
      });
      h += "</div>";
    } else {
      h += "<p class='sh-note'>" + (m.qcard ? "這隻是 Q 卡抽獎，不是地圖上抓的。" : "典藏數據沒寫地圖。") + "</p>";
    }
    h += "<p class='hint'>資料來自敗家一族幻獸頁。點地圖會切回地圖並打開那一張。</p>";
    els.sheet.innerHTML = h;
  }

  function bookList() {
    if (S.bookBand === "client") {
      var cards = D.cards || [];
      if (!S.q) return cards;
      return cards.filter(function (c) { return hit(S.q, [c.n, String(c.id)]); });
    }
    var list = D.book || [];
    return list.filter(function (m) {
      if (S.bookBand && S.bookBand !== "all" && (m.e || "") !== S.bookBand) return false;
      if (!S.q) return true;
      return hit(S.q, [m.n, m.e, m.lv, m.note].concat(m.m || []).concat(m.k || []));
    });
  }
  function renderBook() {
    var list = bookList();
    var h;
    if (S.bookBand === "client") {
      h = "<div class='ledger rarebook'><div class='ledger-lead'><div class='k'>CLIENT DEX</div><h2>客戶端圖鑑卡</h2>" +
        "<p>從 2026 客戶端寵物圖鑑抽出來的彩圖。每張都有中文名字，編號是遊戲裡的圖鑑號。可搜名字。</p></div>";
      if (!list.length) h += "<div class='empty'>還沒抽出圖卡，或編號對不上。</div>";
      h += "<div class='grid bookgrid'>";
      list.forEach(function (c) {
        var nm = c.n || ("編號 " + c.id);
        h += "<button type='button' class='card bookcard" + (S.selBook === String(c.id) ? " on" : "") + "' data-bookid='" + c.id + "'>";
        h += "<span class='book-spr'><img src='" + esc(asset(c.img)) + "' alt='" + esc(nm) + "'></span>";
        h += "<div class='pad'><div class='meta'>圖鑑 " + c.id + "</div><b>" + esc(c.n || ("編號 " + c.id)) + "</b></div></button>";
      });
      h += "</div></div>";
    } else {
      h = "<div class='ledger rarebook'><div class='ledger-lead'><div class='k'>MONSTER DEX</div><h2>全怪獸圖鑑</h2>" +
        "<p>敗家一族那 559 隻都在這裡，圖是原站幻獸頁的照片。搜名字或技能即可。客戶端自己的彩繪圖卡按上面「客戶端圖卡」。</p></div>";
      if (!list.length) h += "<div class='empty'>沒有符合的幻獸。換屬性，或搜名字。</div>";
      h += "<div class='grid bookgrid'>";
      list.forEach(function (m) {
        h += "<button type='button' class='card bookcard" + (S.selBook === m.n ? " on" : "") + "' data-bookpet='" + esc(m.n) + "'>";
        if (m.img) h += "<span class='book-spr'><img src='" + esc(asset(m.img)) + "' alt='" + esc(m.n) + "'></span>";
        else h += "<span class='book-spr empty'>?</span>";
        h += "<div class='pad'><div class='meta'>" + esc(m.e || "") + (m.lv ? " · Lv " + esc(m.lv) : "") + "</div>";
        h += "<b>" + esc(m.n) + "</b>";
        h += "<div class='ms'>" + esc((m.m || []).slice(0, 2).join("、") || "") + "</div></div></button>";
      });
      h += "</div></div>";
    }
    els.stage.className = "ledger";
    els.stage.innerHTML = h;
  }
  function renderBookSheet() {
    var key = S.selBook;
    if (!key) { els.sheet.innerHTML = ""; return; }
    if (S.bookBand === "client" || /^\d+$/.test(key)) {
      var cards = D.cards || [];
      var c = null;
      var id = parseInt(key, 10);
      for (var i = 0; i < cards.length; i++) if (cards[i].id === id) { c = cards[i]; break; }
      if (!c) { els.sheet.innerHTML = ""; return; }
      var h = "<button type='button' class='sheet-x' data-close='1' title='關閉'>×</button>";
      h += "<div class='sh-k'>客戶端圖鑑卡 · " + c.id + "</div><h2 class='sh-n'>" + esc(c.n || String(c.id)) + "</h2>";
      h += "<div class='pet-hero tall'><img src='" + esc(asset(c.img)) + "' alt='" + esc(c.n || String(c.id)) + "' data-lite='" + esc(asset(c.img)) + "' data-cap='" + esc((c.n || "") + " · " + c.id) + "'></div>";
      h += "<p class='hint'>這張是客戶端寵物圖鑑原圖，中文名來自遊戲內圖鑑表。</p>";
      els.sheet.innerHTML = h;
      return;
    }
    var list = D.book || [];
    var m = null;
    for (var j = 0; j < list.length; j++) if (list[j].n === key) { m = list[j]; break; }
    if (!m) { els.sheet.innerHTML = ""; return; }
    var h2 = "<button type='button' class='sheet-x' data-close='1' title='關閉'>×</button>";
    h2 += "<div class='sh-k'>幻獸圖鑑" + (m.r ? " · " + esc(m.r) : "") + "</div>";
    h2 += "<h2 class='sh-n'>" + esc(m.n) + "</h2>";
    if (m.img) h2 += "<div class='pet-hero tall'><img src='" + esc(asset(m.img)) + "' alt='" + esc(m.n) + "' data-lite='" + esc(asset(m.img)) + "' data-cap='" + esc(m.n) + "'></div>";
    h2 += "<div class='sh-meta'>";
    if (m.e) h2 += "<span class='tag'>" + esc(m.e) + "</span>";
    if (m.lv) h2 += "<span class='tag'>Lv " + esc(m.lv) + "</span>";
    h2 += "</div>";
    if (m.note) h2 += "<p class='sh-blurb'>" + esc(m.note) + "</p>";
    if (m.k && m.k.length) {
      h2 += "<div class='sh-h'>技能</div><div class='chips'>";
      m.k.forEach(function (s) { h2 += "<span>" + esc(s) + "</span>"; });
      h2 += "</div>";
    }
    if (m.m && m.m.length) {
      h2 += "<div class='sh-h'>出沒</div><div class='chips'>";
      m.m.forEach(function (n) { h2 += "<button type='button' data-q='" + esc(n) + "'>" + esc(n) + "</button>"; });
      h2 += "</div>";
    }
    h2 += "<p class='hint'>圖來自敗家一族幻獸頁。搜地圖名可跳去地圖。</p>";
    els.sheet.innerHTML = h2;
  }

  function renderRail() {
    var list = filtered();
    var groups = [];
    var last = "";
    list.forEach(function (p) {
      if (p.r !== last) { groups.push({ r: p.r, items: [] }); last = p.r; }
      groups[groups.length - 1].items.push(p);
    });
    var h = "<div class='rail-h'><h2>地名</h2><span>" + list.length + " 處</span></div>";
    if (!list.length) h += "<div class='empty'>沒有符合的地名。試試「吉恩」「史萊姆」「娃娃盒」。</div>";
    groups.forEach(function (g) {
      if (S.region === "all") h += "<div class='rg'>" + esc(byR[g.r].n) + "</div>";
      g.items.forEach(function (p) {
        h += "<button type='button' class='li" + (S.sel === p.id ? " on" : "") + "' id='card-" + p.id + "' data-id='" + p.id + "'>";
        if (p.img) h += "<img class='li-th' src='" + esc(asset(p.img)) + "' alt=''>";
        else h += "<span class='dot' style='background:" + pinColor(p.k) + "'></span>";
        h += "<span><b>" + esc(p.n) + "</b><em>" + esc(p.kz) + (p.lv ? " · " + esc(p.lv) : "") + "</em></span></button>";
      });
    });
    h += "<p class='credit'>" + esc(D.credit) + "<br><br>" + esc(D.note) + "</p>";
    els.rail.innerHTML = h;
  }

  function pinColor(k) {
    return ({
      village: "#c9a24a", city: "#b85a28", field: "#3d6b45", lake: "#2d5f86",
      mountain: "#6a5340", island: "#2a6e6e", port: "#7a4a2a", dungeon: "#6a4a78",
      sky: "#7aa0b8", sea: "#2d5f86", desert: "#9a6b32", temple: "#8a6420", forest: "#2f5a38"
    })[k] || "#3d6b45";
  }

  function routePath(a, b, w, h) {
    var x1 = a.x / 100 * w, y1 = a.y / 100 * h;
    var x2 = b.x / 100 * w, y2 = b.y / 100 * h;
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var dx = x2 - x1, dy = y2 - y1;
    var nx = -dy * 0.14, ny = dx * 0.14;
    return "M" + x1.toFixed(1) + " " + y1.toFixed(1) + " Q" + (mx + nx).toFixed(1) + " " + (my + ny).toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1);
  }

  function routesSvg(inR, rid, w, h) {
    var lines = "";
    inR.forEach(function (p) {
      (p.links || []).forEach(function (id) {
        var q = byId[id];
        if (!q || q.r !== rid || p.id > id) return;
        lines += "<path class='route' data-a='" + p.id + "' data-b='" + id + "' d='" + routePath(p, q, w, h) + "'/>";
      });
    });
    return "<svg class='routes' viewBox='0 0 " + w + " " + h + "' preserveAspectRatio='none'>" + lines + "</svg>";
  }

  function mapBar(r, n) {
    return "<div class='map-bar'><div class='map-title'><div class='k'>" + esc(r.en) + "</div><h2>" + esc(r.n) + "</h2><p>" +
      esc(r.d) + " · " + n + " 處 · 拖曳移動、滾輪對準游標縮放</p></div><div class='zoom'>" +
      "<button type='button' data-z='-' title='縮小'>−</button>" +
      "<b>100%</b>" +
      "<button type='button' data-z='0' title='重設'>⊙</button>" +
      "<button type='button' data-z='+' title='放大'>+</button></div></div>";
  }

  function renderMap() {
    var rid = ridNow();
    var key = rid;
    if (builtKey === key) {
      paintMap();
      if (S.sel && S.sel !== lastSel) flyTo(S.sel);
      lastSel = S.sel;
      return;
    }
    buildMap(rid);
    builtKey = key;
    lastSel = null;
    if (S.sel && byId[S.sel] && byId[S.sel].r === rid) {
      window.requestAnimationFrame(function () { flyTo(S.sel); lastSel = S.sel; });
    } else {
      lastSel = S.sel;
    }
  }

  function buildMap(rid) {
    var r = byR[rid] || byR.mainland;
    var inR = places.filter(function (p) { return p.r === rid; });
    var size = canvasOf(rid);
    S.cw = size.w;
    S.ch = size.h;
    els.stage.className = "";
    if (rid === "mainland") {
      els.stage.innerHTML = mapBar(r, inR.length) +
        "<div class='map-vp' id='mvp'><div class='map-inner' id='minner'>" +
        "<div class='frame land' id='frame' style='width:" + size.w + "px;height:" + size.h + "px'>" +
        "<img class='map-art' id='mapimg' src='img/mainland.jpg' width='" + size.w + "' height='" + size.h + "' alt='主大陸大地圖' draggable='false'>" +
        routesSvg(inR, rid, size.w, size.h) +
        "<div class='pins'>" + inR.map(pinHtml).join("") + "</div></div></div></div>" +
        "<div class='legend'><b>圓點</b>是地名。金線是選中地的相鄰走法。</div>";
    } else {
      els.stage.innerHTML = mapBar(r, inR.length) +
        "<div class='map-vp' id='mvp'><div class='map-inner' id='minner'>" +
        "<div class='frame board' data-tone='" + esc(r.tone || "pine") + "' id='frame' style='width:" + size.w + "px;height:" + size.h + "px'>" +
        "<img class='map-art' id='mapimg' src='img/" + rid + ".jpg' width='" + size.w + "' height='" + size.h + "' alt='" + esc(r.n) + "' draggable='false'>" +
        routesSvg(inR, rid, size.w, size.h) +
        "<div class='pins'>" + inR.map(nodeHtml).join("") + "</div></div></div></div>" +
        "<div class='legend'><b>底圖</b>對齊節點與路線。點卡片看那一張。</div>";
    }
    paintMap();
    bindCam();
    var img = document.getElementById("mapimg");
    if (img) {
      if (img.complete && img.naturalWidth) {
        S.cw = img.naturalWidth;
        S.ch = img.naturalHeight;
        fitCam();
      } else {
        img.onload = function () {
          S.cw = img.naturalWidth || 749;
          S.ch = img.naturalHeight || 564;
          var frame = document.getElementById("frame");
          if (frame) {
            frame.style.width = S.cw + "px";
            frame.style.height = S.ch + "px";
          }
          if (!S.userCam) fitCam();
          if (S.sel) flyTo(S.sel);
        };
        window.requestAnimationFrame(fitCam);
      }
    } else {
      window.requestAnimationFrame(fitCam);
    }
  }

  function pinHtml(p) {
    return "<button type='button' class='pin' data-k='" + p.k + "' data-id='" + p.id +
      "' style='left:" + p.x + "%;top:" + p.y + "%'><span class='pin-tip' data-slot='n'>" + esc(p.n) + "</span></button>";
  }

  function layoutPinTips() {
    var frame = document.getElementById("frame");
    if (!frame || !frame.classList.contains("land")) return;
    var pins = frame.querySelectorAll(".pin");
    if (!pins.length) return;
    var z = S.fitZ || S.zoom || 1;
    var fw = S.cw || frame.clientWidth || 1168;
    var fh = S.ch || frame.clientHeight || 880;
    var items = [];
    var i, j, it, tip;
    for (i = 0; i < pins.length; i++) {
      tip = pins[i].querySelector(".pin-tip");
      if (!tip) continue;
      items.push({
        el: pins[i],
        tip: tip,
        x: parseFloat(pins[i].style.left) || 0,
        y: parseFloat(pins[i].style.top) || 0,
        tw: Math.max(tip.offsetWidth, (tip.textContent || "").length * 11 + 14),
        th: Math.max(tip.offsetHeight, 18),
        near: 0
      });
    }
    for (i = 0; i < items.length; i++) {
      for (j = i + 1; j < items.length; j++) {
        var dx = items[i].x - items[j].x;
        var dy = items[i].y - items[j].y;
        if (dx * dx + dy * dy < 140) {
          items[i].near++;
          items[j].near++;
        }
      }
    }
    items.sort(function (a, b) { return b.near - a.near; });
    function pctW(px) { return (px / z) / fw * 100; }
    function pctH(px) { return (px / z) / fh * 100; }
    var gapX = pctW(8);
    var gapY = pctH(8);
    var pad = pctW(4);
    var slots = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
    function boxOf(it, slot) {
      var lw = pctW(it.tw);
      var lh = pctH(it.th);
      var b = { w: lw, h: lh };
      if (slot === "n") { b.x = it.x - lw / 2; b.y = it.y - gapY - lh; }
      else if (slot === "s") { b.x = it.x - lw / 2; b.y = it.y + gapY; }
      else if (slot === "e") { b.x = it.x + gapX; b.y = it.y - lh / 2; }
      else if (slot === "w") { b.x = it.x - gapX - lw; b.y = it.y - lh / 2; }
      else if (slot === "ne") { b.x = it.x + gapX * 0.35; b.y = it.y - gapY - lh; }
      else if (slot === "nw") { b.x = it.x - gapX * 0.35 - lw; b.y = it.y - gapY - lh; }
      else if (slot === "se") { b.x = it.x + gapX * 0.35; b.y = it.y + gapY; }
      else { b.x = it.x - gapX * 0.35 - lw; b.y = it.y + gapY; }
      return b;
    }
    function hits(a, b) {
      return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x &&
        a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
    }
    function inMap(b) {
      return b.x > 0.4 && b.y > 0.4 && b.x + b.w < 99.6 && b.y + b.h < 99.6;
    }
    var placed = [];
    var dots = items.map(function (p) {
      return { x: p.x - 1.2, y: p.y - 1.6, w: 2.4, h: 3.2, self: p };
    });
    for (i = 0; i < items.length; i++) {
      it = items[i];
      var best = "n";
      var bestScore = 1e9;
      for (j = 0; j < slots.length; j++) {
        var slot = slots[j];
        var b = boxOf(it, slot);
        var score = inMap(b) ? 0 : 40;
        var k;
        for (k = 0; k < placed.length; k++) {
          if (hits(b, placed[k])) score += 80;
        }
        for (k = 0; k < dots.length; k++) {
          if (dots[k].self === it) continue;
          if (hits(b, dots[k])) score += 50;
        }
        if (score < bestScore) {
          bestScore = score;
          best = slot;
          if (score === 0) break;
        }
      }
      it.tip.setAttribute("data-slot", best);
      placed.push(boxOf(it, best));
    }
  }
  function nodeHtml(p) {
    var img = p.img ? "<img src='" + esc(asset(p.img)) + "' alt='" + esc(p.n) + "'>" : "";
    return "<button type='button' class='node" + (p.img ? "" : " plain") + "' data-id='" + p.id +
      "' style='left:" + p.x + "%;top:" + p.y + "%'>" + img +
      "<span class='cap'><span class='nk'>" + esc(p.kz) + "</span><b>" + esc(p.n) + "</b></span></button>";
  }

  function paintMap() {
    var qset = {};
    filtered().forEach(function (p) { qset[p.id] = 1; });
    var hasQ = !!S.q;
    var near = {};
    if (S.sel && byId[S.sel]) {
      (byId[S.sel].links || []).forEach(function (id) { near[id] = 1; });
    }
    var marks = els.stage.querySelectorAll(".pin, .node");
    for (var i = 0; i < marks.length; i++) {
      var el = marks[i];
      var id = el.getAttribute("data-id");
      el.classList.toggle("on", S.sel === id);
      el.classList.toggle("near", !!near[id]);
      el.classList.toggle("dim", hasQ && !qset[id]);
    }
    var routes = els.stage.querySelectorAll(".route");
    for (var j = 0; j < routes.length; j++) {
      var a = routes[j].getAttribute("data-a");
      var b = routes[j].getAttribute("data-b");
      routes[j].classList.toggle("on", !!(S.sel && (a === S.sel || b === S.sel)));
    }
  }

  function bindCam() {
    var vp = document.getElementById("mvp");
    var inner = document.getElementById("minner");
    if (!vp || !inner) return;
    applyCam();
    var drag = null;
    vp.onpointerdown = function (e) {
      if (e.target.closest(".pin, .node, .zoom, .map-title, .legend")) return;
      inner.style.transition = "none";
      drag = { x: e.clientX, y: e.clientY, px: S.panX, py: S.panY };
      vp.classList.add("drag");
      try { vp.setPointerCapture(e.pointerId); } catch (err) {}
    };
    vp.onpointermove = function (e) {
      if (!drag) return;
      S.panX = drag.px + (e.clientX - drag.x);
      S.panY = drag.py + (e.clientY - drag.y);
      S.userCam = true;
      applyCam();
    };
    vp.onpointerup = function (e) {
      var was = drag;
      drag = null;
      vp.classList.remove("drag");
      if (was && !e.target.closest(".pin, .node, .zoom, .map-title, button") &&
          Math.abs(e.clientX - was.x) + Math.abs(e.clientY - was.y) < 4) {
        if (S.sel) { S.sel = null; render(); }
      }
    };
    vp.onpointercancel = function () { drag = null; vp.classList.remove("drag"); };
    vp.onwheel = function (e) {
      e.preventDefault();
      var rect = vp.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY > 0 ? 0.9 : 1.11);
    };
  }

  function renderLedger() {
    els.stage.className = "ledger";
    var list = filtered();
    var h = "<div class='ledger'><div class='ledger-lead'><div class='k'>GAZETTEER</div><h2>地名名冊</h2>" +
      "<p>同一份 ROSS 世界地圖名單，改按資料片分冊。卡片上的圖是敗家一族原圖，點進去地圖會飛到那一點。</p></div>";
    var last = "";
    list.forEach(function (p, idx) {
      if (p.r !== last) {
        last = p.r;
        h += "<div class='lg'>" + esc(byR[p.r].n) + "</div><div class='grid'>";
      }
      var ms = (p.mons || []).slice(0, 3).map(function (m) { return m.n; }).join("、");
      var why = matchedMons(p, S.q).map(function (m) { return m.n; }).slice(0, 3).join("、");
      h += "<button type='button' class='card' data-id='" + p.id + "'>";
      if (p.img) h += "<img src='" + esc(asset(p.img)) + "' alt=''>";
      h += "<div class='pad'><div class='meta'>" + esc(p.kz) + "</div><b>" + esc(p.n) + "</b>" +
        (p.lv ? "<div class='lv'>Lv " + esc(p.lv) + "</div>" : "") +
        "<div class='ms'>" + esc(why ? "幻獸 " + why : (ms || "—")) + "</div></div></button>";
      var nxt = list[idx + 1];
      if (!nxt || nxt.r !== p.r) h += "</div>";
    });
    if (!list.length) h += "<div class='empty'>沒有符合的地名。</div>";
    h += "</div>";
    els.stage.innerHTML = h;
  }

  function renderOld() {
    els.stage.className = "old";
    var h = "<div class='oldpage'><div class='old-banner'><span>這是原頁的資訊架構重建：一張圖、一長串藍字、靠瀏覽器 Ctrl+F 找路。進典藏地圖看同一份名單被重排之後的落差。</span>" +
      "<button type='button' data-v='map'>進入典藏地圖 →</button></div><div class='old-inner'>" +
      "<h1>xFairyland | World Map</h1>" +
      "<div class='src'>geocities.ws/fairyland/worldmap.html　·　支援 Ctrl+F 搜尋地圖名</div>" +
      "<img class='old-shot' src='img/mainland-orig.jpg' alt='主大陸大地圖原圖'>" +
      "<div class='old-cloud'>";
    D.order.forEach(function (id) {
      var p = byId[id];
      if (!p) return;
      h += "<a href='#/map/" + p.r + "/p/" + p.id + "'>" + esc(p.n) + "</a>";
    });
    h += "</div><p class='old-credit'>" + esc(D.credit) + "</p></div></div>";
    els.stage.innerHTML = h;
  }

  function renderSheet() {
    var p = byId[S.sel];
    if (!p) { els.sheet.innerHTML = ""; return; }
    var h = "<button type='button' class='sheet-x' data-close='1' title='關閉'>×</button>";
    h += "<div class='sh-k'>" + esc(byR[p.r].n) + " · " + esc(p.kz) + "</div>";
    h += "<h2 class='sh-n'>" + esc(p.n) + "</h2>";
    h += "<div class='sh-meta'>";
    if (p.lv) h += "<span class='tag'>Lv " + esc(p.lv) + "</span>";
    if (p.elem) h += "<span class='tag'>" + esc(p.elem) + "</span>";
    if (p.mons && p.mons.length) h += "<span class='tag'>" + p.mons.length + " 種幻獸</span>";
    h += "</div>";
    var detailImg = (p.img && p.img !== p.cimg) ? p.img : "";
    if (!detailImg && p.gallery) {
      for (var gi = 0; gi < p.gallery.length; gi++) {
        var g0 = p.gallery[gi];
        if (g0.img && g0.img !== p.cimg && g0.n !== "客戶端地圖") { detailImg = g0.img; break; }
      }
    }
    if (p.cimg || detailImg) {
      h += "<div class='pair-maps" + (p.cimg && detailImg ? "" : " one") + "'>";
      if (p.cimg) {
        h += "<figure><img src='" + esc(asset(p.cimg)) + "' alt='" + esc(p.n) + " 客戶端地圖' data-lite='" + esc(asset(p.cimg)) + "' data-cap='" + esc(p.n + " · 客戶端地圖") + "'><figcaption>客戶端地圖" + (p.mid ? " · " + p.mid : "") + "</figcaption></figure>";
      }
      if (detailImg) {
        h += "<figure><img src='" + esc(asset(detailImg)) + "' alt='" + esc(p.n) + " 詳圖' data-lite='" + esc(asset(detailImg)) + "' data-cap='" + esc(p.n + " · 詳圖") + "'><figcaption>詳圖</figcaption></figure>";
      }
      h += "</div>";
    }
    if (p.page) h += "<p><a href='" + esc(asset(p.page)) + "' target='_blank' rel='noreferrer'>打開敗家一族原頁 ↗</a></p>";
    if (p.mid) h += "<div class='sh-meta'><span class='tag'>地圖編號 " + esc(p.mid) + "</span>" +
      (p.cimg ? "<button type='button' class='tag asbtn' data-cid='" + p.mid + "'>打開客戶端檔</button>" : "") + "</div>";
    if (p.note) h += "<p class='sh-note'>" + esc(p.note) + "</p>";
    if (p.signs && p.signs.length) {
      h += "<div class='sh-h'>官方路牌（2026 客戶端）</div><div class='signs'>";
      p.signs.forEach(function (s) {
        h += "<div class='sign'>" + esc(s.t) + "</div>";
      });
      h += "</div>";
    }
    if (p.blurb) h += "<p class='sh-blurb'>" + esc(p.blurb) + "</p>";
    if (p.gallery && p.gallery.length) {
      var extra = p.gallery.filter(function (g) {
        return g.img && g.img !== p.cimg && g.img !== detailImg && g.n !== "客戶端地圖" && g.n !== "詳圖";
      });
      if (extra.length) {
        h += "<div class='sh-h'>其他分層 · 點圖放大</div><div class='gal'>";
        extra.forEach(function (g) {
          h += "<button type='button' class='gal-i' data-lite='" + esc(asset(g.img)) + "' data-cap='" + esc(p.n + " · " + g.n) + "'>";
          h += "<img src='" + esc(asset(g.img)) + "' alt='" + esc(g.n) + "'><span>" + esc(g.n) + "</span></button>";
        });
        h += "</div>";
      }
    }

    if (p.links && p.links.length) {
      h += "<div class='sh-h'>相鄰 · 點圖走過去</div><div class='exits'>";
      p.links.forEach(function (id) {
        var q = byId[id];
        if (!q) return;
        h += "<button type='button' class='exit' data-id='" + q.id + "'>";
        if (q.img) h += "<img src='" + esc(asset(q.img)) + "' alt=''>";
        h += "<span><b>" + esc(q.n) + "</b><i>" + esc(q.kz) + (q.r !== p.r ? " · " + esc(byR[q.r].n) : "") + "</i></span></button>";
      });
      h += "</div>";
    }

    if (p.floors && p.floors.length > 1) {
      h += "<div class='sh-h'>分層</div><table class='floors'><thead><tr><th>地區</th><th>等級</th><th>屬性</th></tr></thead><tbody>";
      p.floors.forEach(function (f) {
        h += "<tr><td>" + esc(f.a) + "</td><td>" + esc(f.lv || "—") + "</td><td>" + esc(f.e || "—") + "</td></tr>";
      });
      h += "</tbody></table>";
    }

    if (p.cto && p.cto.length) {
      h += "<div class='sh-h'>客戶端連線 · 走進下一張</div><div class='exits'>";
      p.cto.forEach(function (t) {
        var d = cmapBy[t.id];
        h += "<button type='button' class='exit' data-cid='" + t.id + "'>";
        if (d && d.img) h += "<img src='" + esc(asset(d.img)) + "' alt=''>";
        h += "<span><b>" + esc(t.n) + "</b><i>" + t.id + "</i></span></button>";
      });
      h += "</div>";
    }

    if (p.mons && p.mons.length) {
      var hitn = {};
      matchedMons(p, S.q).forEach(function (m) { hitn[m.n] = 1; });
      h += "<div class='sh-h'>出沒幻獸 · 點名字看照片</div><div class='mons'>";
      p.mons.forEach(function (m) {
        var sp = spriteOf(m.n);
        h += "<button type='button' class='mon" + (hitn[m.n] ? " hit" : "") + "'" + (sp ? " data-lite='" + esc(asset(sp)) + "' data-cap='" + esc(m.n) + "'" : " data-q='" + esc(m.n) + "'") + ">";
        if (sp) h += "<img src='" + esc(asset(sp)) + "' alt=''>";
        h += "<span><b>" + esc(m.n) + "</b><i>" + esc((m.cs ? "客戶端 · " : "") + (m.e ? m.e + " · " : "") + (m.lv || "")) + "</i></span></button>";
      });
      h += "</div>";
    }

    if (p.drops && p.drops.length) {
      h += "<div class='sh-h'>掉寶</div><div class='chips'>";
      p.drops.forEach(function (d) { h += "<span>" + esc(d) + "</span>"; });
      h += "</div>";
    }

    if (p.gather && p.gather.length) {
      h += "<div class='sh-h'>採集</div><div class='chips'>";
      p.gather.forEach(function (g) { h += "<span>" + esc(g.n) + " · " + esc(g.sk) + " " + esc(g.lv || "") + "</span>"; });
      h += "</div>";
    }

    h += "<p class='hint'>等級、掉寶來自敗家一族。地圖編號、連線與出沒來自 2026 客戶端地圖檔。地名對齊 xFairyland 世界地圖。</p>";
    els.sheet.innerHTML = h;
  }

  if (els.listBtn) {
    els.listBtn.addEventListener("click", function () {
      S.liston = !S.liston;
      render();
    });
  }
  document.getElementById("brand").addEventListener("click", function () {
    S.view = "map"; S.region = "mainland"; S.sel = null; S.q = "";
    els.q.value = ""; S.userCam = false; builtKey = null; lastSel = null;
    render();
  });
  els.views.addEventListener("click", function (e) {
    var b = e.target.closest("[data-v]");
    if (b) setView(b.getAttribute("data-v"));
  });
  els.chips.addEventListener("click", function (e) {
    var bb = e.target.closest("[data-book]");
    if (bb) { S.bookBand = bb.getAttribute("data-book"); S.selBook = null; render(); return; }
    var rb = e.target.closest("[data-rare]");
    if (rb) { S.rareTag = rb.getAttribute("data-rare"); render(); return; }
    var cb = e.target.closest("[data-cband]");
    if (cb) { S.cband = cb.getAttribute("data-cband"); S.cmap = null; render(); return; }
    var b = e.target.closest("[data-r]");
    if (b) setRegion(b.getAttribute("data-r"));
  });
  els.rail.addEventListener("click", function (e) {
    var b = e.target.closest("[data-id]");
    if (b) go(b.getAttribute("data-id"), true);
  });
  els.stage.addEventListener("click", function (e) {
    var v = e.target.closest("[data-v]");
    if (v) { setView(v.getAttribute("data-v")); return; }
    var z = e.target.closest("[data-z]");
    if (z) {
      var k = z.getAttribute("data-z");
      var vp = document.getElementById("mvp");
      if (!vp) return;
      if (k === "0") { fitCam(); return; }
      var rect = vp.getBoundingClientRect();
      zoomAt(rect.width / 2, rect.height / 2, k === "+" ? 1.18 : 1 / 1.18);
      return;
    }
    var rp = e.target.closest("[data-rarepet]");
    if (rp) { S.selRare = rp.getAttribute("data-rarepet"); render(); return; }
    var bp = e.target.closest("[data-bookpet]");
    if (bp) { S.selBook = bp.getAttribute("data-bookpet"); render(); return; }
    var bc = e.target.closest("[data-bookid]");
    if (bc) { S.selBook = bc.getAttribute("data-bookid"); S.bookBand = "client"; render(); return; }
    var cid = e.target.closest("[data-cid]");
    if (cid) { goCmap(cid.getAttribute("data-cid"), true); return; }
    var b = e.target.closest("[data-id]");
    if (b) go(b.getAttribute("data-id"), true);
  });
  els.sheet.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) {
      if (S.view === "rare") S.selRare = null;
      else if (S.view === "book") S.selBook = null;
      else if (S.view === "client") S.cmap = null;
      else S.sel = null;
      render();
      return;
    }
    var lite = e.target.closest("[data-lite]");
    if (lite && lite.getAttribute("data-lite") !== "x") {
      openLite(lite.getAttribute("data-lite"), lite.getAttribute("data-cap") || "");
      return;
    }
    var qb = e.target.closest("[data-q]");
    if (qb && qb.getAttribute("data-q")) {
      els.q.value = qb.getAttribute("data-q");
      S.q = els.q.value;
      render();
      return;
    }
    var cid = e.target.closest("[data-cid]");
    if (cid) { goCmap(cid.getAttribute("data-cid"), true); return; }
    var b = e.target.closest("[data-id]");
    if (b) go(b.getAttribute("data-id"), S.view !== "rare" && S.view !== "client");
  });
  els.q.addEventListener("input", function () {
    S.q = els.q.value;
    renderSuggest();
    render();
  });
  els.q.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      if (els.suggest && !els.suggest.hidden) {
        var first = els.suggest.querySelector("button");
        if (first) { first.click(); return; }
      }
      var list = filtered();
      if (list[0]) go(list[0].id, true);
      if (els.suggest) els.suggest.hidden = true;
    }
    if (e.key === "Escape") { els.q.value = ""; S.q = ""; renderSuggest(); render(); }
  });
  if (els.suggest) {
    els.suggest.addEventListener("mousedown", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      e.preventDefault();
      var qv = b.getAttribute("data-q") || "";
      var id = b.getAttribute("data-id");
      var cid = b.getAttribute("data-cid");
      els.q.value = qv;
      S.q = qv;
      els.suggest.hidden = true;
      if (id && byId[id]) go(id, true);
      else if (cid) goCmap(cid, true);
      else render();
    });
  }
  if (els.findbar) {
    els.findbar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-id],[data-q],[data-cid]");
      if (!b) return;
      if (b.getAttribute("data-q") && !b.getAttribute("data-id")) {
        els.q.value = b.getAttribute("data-q");
        S.q = els.q.value;
        render();
        return;
      }
      if (b.getAttribute("data-cid")) { goCmap(b.getAttribute("data-cid"), true); return; }
      if (b.getAttribute("data-id")) go(b.getAttribute("data-id"), true);
    });
  }
  function openLite(src, cap) {
    if (!els.lite) return;
    els.liteImg.src = src;
    els.liteCap.textContent = cap || "";
    els.lite.hidden = false;
  }
  function closeLite() {
    if (!els.lite) return;
    els.lite.hidden = true;
    els.liteImg.src = "";
  }
  if (els.lite) {
    els.lite.addEventListener("click", function (e) {
      if (e.target === els.lite || e.target.closest("[data-lite='x']")) closeLite();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== els.q) {
      e.preventDefault(); els.q.focus(); els.q.select();
    }
    if (e.key === "Escape" && els.lite && !els.lite.hidden) { closeLite(); return; }
    if (e.key === "Escape" && S.sel) { S.sel = null; render(); }
  });
  window.addEventListener("hashchange", function () {
    builtKey = null;
    lastSel = null;
    readHash();
    render();
  });
  window.addEventListener("resize", function () {
    if (S.view === "map" && !S.userCam) fitCam();
  });

  document.addEventListener("click", function (e) {
    if (els.suggest && !e.target.closest("#searchWrap")) els.suggest.hidden = true;
  });

  readHash();
  els.q.value = S.q;
  render();
})();
