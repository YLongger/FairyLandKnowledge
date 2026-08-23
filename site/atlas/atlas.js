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

  var S = {
    view: "map",
    region: "mainland",
    q: "",
    sel: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    liston: false,
    cw: 749,
    ch: 564,
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
    views: document.getElementById("views")
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
    var a = [p.n, p.kz, p.blurb, p.lv, p.elem].concat(p.aka || []);
    (p.mons || []).forEach(function (m) { a.push(m.n); });
    (p.drops || []).forEach(function (d) { a.push(d); });
    (p.floors || []).forEach(function (f) { a.push(f.a, f.m, f.d); });
    (p.gather || []).forEach(function (g) { a.push(g.n); });
    return a;
  }
  function filtered() {
    return places.filter(function (p) {
      if (S.region !== "all" && p.r !== S.region) return false;
      return hit(S.q, hay(p));
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
    if (rid === "mainland") return { w: 749, h: 564 };
    if (rid === "clothes") return { w: 1200, h: 800 };
    return { w: 2000, h: 1400 };
  }
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function hash() {
    var h = "#/" + S.view;
    if (S.view === "map") h += "/" + S.region;
    if (S.sel) h += "/p/" + S.sel;
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
    if (parts[0] === "list" || parts[0] === "ledger") S.view = "list";
    else if (parts[0] === "old" || parts[0] === "original") S.view = "old";
    else if (parts[0] === "map" || parts[0] === "p" || !parts[0]) S.view = "map";
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
    render();
    var el = document.getElementById("card-" + id);
    if (el) el.scrollIntoView({ block: "nearest" });
  }
  function setView(v) {
    S.view = v;
    if (v === "old") S.sel = null;
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
    els.work.classList.toggle("liston", S.liston);
    els.work.classList.toggle("nrail", !S.liston || S.view !== "map");
    els.work.classList.toggle("nosheet", !S.sel || S.view !== "map");
    if (els.listBtn) els.listBtn.classList.toggle("on", S.liston);
    renderViews();
    renderChips();
    renderSub();
    if (S.view === "old") {
      els.rail.innerHTML = "";
      els.sheet.hidden = true;
      els.sheet.innerHTML = "";
      builtKey = null;
      renderOld();
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
      ["map", "輿圖"],
      ["list", "名冊"],
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

  function renderChips() {
    var c = counts();
    var html = "<button type='button' class='chip" + (S.region === "all" ? " on" : "") + "' data-r='all'><b>全部</b><i>" + c.all + "</i></button>";
    regions.forEach(function (r) {
      html += "<button type='button' class='chip" + (S.region === r.id ? " on" : "") + "' data-r='" + r.id + "'><b>" + esc(r.n) + "</b><i>" + (c[r.id] || 0) + "</i></button>";
    });
    els.chips.innerHTML = html;
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
        "<div class='frame land' id='frame' style='width:749px;height:564px'>" +
        "<img class='map-art' id='mapimg' src='img/mainland.jpg' width='749' height='564' alt='主大陸大地圖，官方原圖、敗家一族補充' draggable='false'>" +
        routesSvg(inR, rid, 749, 564) +
        "<div class='pins'>" + inR.map(pinHtml).join("") + "</div></div></div></div>" +
        "<div class='legend'><b>空心圈</b>對準原圖地名，避免蓋字。金線是選中地的相鄰走法。</div>";
    } else {
      els.stage.innerHTML = mapBar(r, inR.length) +
        "<div class='map-vp' id='mvp'><div class='map-inner' id='minner'>" +
        "<div class='frame board' data-tone='" + esc(r.tone || "pine") + "' id='frame' style='width:" + size.w + "px;height:" + size.h + "px'>" +
        routesSvg(inR, rid, size.w, size.h) +
        "<div class='pins'>" + inR.map(nodeHtml).join("") + "</div></div></div></div>" +
        "<div class='legend'><b>原圖節點</b>是敗家一族手繪。點圖走相鄰，不要只靠文字名單。</div>";
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
      "' style='left:" + p.x + "%;top:" + p.y + "%'><span class='pin-tip'>" + esc(p.n) + "</span></button>";
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
      h += "<button type='button' class='card' data-id='" + p.id + "'>";
      if (p.img) h += "<img src='" + esc(asset(p.img)) + "' alt=''>";
      h += "<div class='pad'><div class='meta'>" + esc(p.kz) + "</div><b>" + esc(p.n) + "</b>" +
        (p.lv ? "<div class='lv'>Lv " + esc(p.lv) + "</div>" : "") +
        "<div class='ms'>" + esc(ms || "—") + "</div></div></button>";
      var nxt = list[idx + 1];
      if (!nxt || nxt.r !== p.r) h += "</div>";
    });
    if (!list.length) h += "<div class='empty'>沒有符合的地名。</div>";
    h += "</div>";
    els.stage.innerHTML = h;
  }

  function renderOld() {
    els.stage.className = "old";
    var h = "<div class='oldpage'><div class='old-banner'><span>這是原頁的資訊架構重建：一張圖、一長串藍字、靠瀏覽器 Ctrl+F 找路。進典藏輿圖看同一份名單被重排之後的落差。</span>" +
      "<button type='button' data-v='map'>進入典藏輿圖 →</button></div><div class='old-inner'>" +
      "<h1>xFairyland | World Map</h1>" +
      "<div class='src'>geocities.ws/fairyland/worldmap.html　·　支援 Ctrl+F 搜尋地圖名</div>" +
      "<img class='old-shot' src='img/mainland.jpg' alt='主大陸大地圖原圖'>" +
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
    if (p.img) {
      h += "<figure class='hero'><img src='" + esc(asset(p.img)) + "' alt='" + esc(p.n) + " 原圖'>";
      if (p.links && p.links.length) {
        h += "<div class='hero-exits'>";
        p.links.forEach(function (id) {
          var q = byId[id];
          if (!q) return;
          h += "<button type='button' class='hexit' data-id='" + q.id + "'>";
          if (q.img) h += "<img src='" + esc(asset(q.img)) + "' alt=''>";
          h += "<b>" + esc(q.n) + "</b></button>";
        });
        h += "</div>";
      }
      if (p.page) h += "<a href='" + esc(asset(p.page)) + "' target='_blank' rel='noreferrer'>打開敗家一族原頁 ↗</a>";
      h += "</figure>";
    } else if (p.page) {
      h += "<p><a href='" + esc(asset(p.page)) + "' target='_blank' rel='noreferrer'>打開敗家一族原頁 ↗</a></p>";
    }
    if (p.blurb) h += "<p class='sh-blurb'>" + esc(p.blurb) + "</p>";

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

    if (p.mons && p.mons.length) {
      h += "<div class='sh-h'>出沒幻獸</div><div class='mons'>";
      p.mons.forEach(function (m) {
        h += "<div class='mon'><b>" + esc(m.n) + "</b><i>" + esc((m.e ? m.e + " · " : "") + (m.lv || "")) + "</i></div>";
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

    h += "<p class='hint'>等級、掉寶、幻獸來自敗家一族典藏數據。地名與分區對齊 xFairyland 世界地圖。</p>";
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
    var b = e.target.closest("[data-id]");
    if (b) go(b.getAttribute("data-id"), true);
  });
  els.sheet.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { S.sel = null; render(); return; }
    var b = e.target.closest("[data-id]");
    if (b) go(b.getAttribute("data-id"), true);
  });
  els.q.addEventListener("input", function () {
    S.q = els.q.value;
    render();
  });
  els.q.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var list = filtered();
      if (list[0]) go(list[0].id, true);
    }
    if (e.key === "Escape") { els.q.value = ""; S.q = ""; render(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== els.q) {
      e.preventDefault(); els.q.focus(); els.q.select();
    }
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

  readHash();
  els.q.value = S.q;
  render();
})();
