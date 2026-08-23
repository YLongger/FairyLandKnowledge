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

  var MAP_W = 749, MAP_H = 564, BOARD_W = 1600, BOARD_H = 1000;

  var S = {
    view: "map",
    region: "mainland",
    q: "",
    sel: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    liston: false,
    mapKey: ""
  };

  var els = {
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
  function neighbors(p) {
    if (!p) return [];
    var out = [], seen = {};
    (p.links || []).forEach(function (id) {
      if (byId[id] && !seen[id]) { seen[id] = 1; out.push(byId[id]); }
    });
    return out;
  }
  function asset(rel) {
    if (!rel) return "";
    if (/^https?:/i.test(rel)) return rel;
    return "../" + rel;
  }
  function pinColor(k) {
    return ({
      village: "#c9a24a", city: "#b85a28", field: "#3d6b45", lake: "#2d5f86",
      mountain: "#6a5340", island: "#2a6e6e", port: "#7a4a2a", dungeon: "#6a4a78",
      sky: "#7aa0b8", sea: "#2d5f86", desert: "#9a6b32", temple: "#8a6420", forest: "#2f5a38"
    })[k] || "#3d6b45";
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

  function mapRid() {
    return S.region === "all" ? "mainland" : S.region;
  }
  function contentSize() {
    return mapRid() === "mainland" ? { w: MAP_W, h: MAP_H } : { w: BOARD_W, h: BOARD_H };
  }
  function applyCam() {
    var inner = document.getElementById("minner");
    if (!inner) return;
    inner.style.transform = "translate(" + S.panX + "px," + S.panY + "px) scale(" + S.zoom + ")";
    var zr = document.getElementById("zoomRead");
    if (zr) zr.textContent = Math.round(S.zoom * 100) + "%";
  }
  function fitMap() {
    var vp = document.getElementById("mvp");
    if (!vp) return;
    var c = contentSize();
    var pad = 28;
    var z = Math.min((vp.clientWidth - pad * 2) / c.w, (vp.clientHeight - pad * 2) / c.h);
    S.zoom = Math.max(0.28, Math.min(2.8, z));
    S.panX = (vp.clientWidth - c.w * S.zoom) / 2;
    S.panY = (vp.clientHeight - c.h * S.zoom) / 2;
    applyCam();
  }
  function flyTo(p) {
    if (!p || p.x == null) return;
    var vp = document.getElementById("mvp");
    if (!vp) return;
    var c = contentSize();
    var z = mapRid() === "mainland" ? 1.75 : 1.05;
    z = Math.max(S.zoom, z);
    z = Math.min(2.6, z);
    var px = p.x / 100 * c.w;
    var py = p.y / 100 * c.h;
    var inset = (S.sel && vp.clientWidth > 1100) ? Math.min(440, vp.clientWidth * 0.38) : 0;
    S.zoom = z;
    S.panX = (vp.clientWidth - inset) * 0.5 - px * z;
    S.panY = vp.clientHeight * 0.46 - py * z;
    applyCam();
  }
  function worldFromEvent(ev) {
    var vp = document.getElementById("mvp").getBoundingClientRect();
    var sx = ev.clientX - vp.left;
    var sy = ev.clientY - vp.top;
    return { x: (sx - S.panX) / S.zoom, y: (sy - S.panY) / S.zoom, sx: sx, sy: sy };
  }
  function zoomAt(ev, factor) {
    var w = worldFromEvent(ev);
    var next = Math.max(0.28, Math.min(4.2, S.zoom * factor));
    S.panX = w.sx - w.x * next;
    S.panY = w.sy - w.y * next;
    S.zoom = next;
    applyCam();
  }

  function go(id, opts) {
    opts = opts || {};
    var p = byId[id];
    if (!p) return;
    var prevR = S.region;
    S.sel = id;
    if (S.region !== "all") S.region = p.r;
    if (!opts.keepView) S.view = "map";
    render({
      rebuild: S.view !== "map" || (S.region !== "all" && prevR !== p.r && prevR !== "all"),
      fly: !opts.skipFly
    });
    var el = document.getElementById("card-" + id);
    if (el) el.scrollIntoView({ block: "nearest" });
  }
  function setView(v) {
    S.view = v;
    if (v === "old") S.sel = null;
    S.mapKey = "";
    render({ rebuild: true, fit: v === "map" });
  }
  function setRegion(id) {
    S.region = id;
    if (S.sel && byId[S.sel].r !== id && id !== "all") S.sel = null;
    if (S.view === "old") S.view = "map";
    S.mapKey = "";
    render({ rebuild: true, fit: true });
  }

  function render(opts) {
    opts = opts || {};
    syncHash();
    document.getElementById("app").dataset.view = S.view;
    els.work.classList.toggle("nosheet", !S.sel || S.view !== "map");
    els.work.classList.toggle("nrail", S.view !== "map");
    els.work.classList.toggle("old", S.view === "old");
    els.work.classList.toggle("liston", S.liston);
    renderViews();
    renderChips();
    renderSub();
    if (S.view === "old") {
      els.rail.innerHTML = "";
      els.sheet.hidden = true;
      renderOld();
      return;
    }
    if (S.view === "map") renderRail();
    else els.rail.innerHTML = "";
    els.sheet.hidden = !(S.sel && S.view === "map");
    if (S.sel && S.view === "map") renderSheet();
    else els.sheet.innerHTML = "";
    if (S.view === "list") renderLedger();
    else {
      var key = mapRid();
      if (opts.rebuild || S.mapKey !== key) renderMap();
      else updateMapState();
      if (opts.fit) requestAnimationFrame(function () { fitMap(); });
      if (opts.fly && S.sel) requestAnimationFrame(function () { flyTo(byId[S.sel]); });
    }
  }

  function renderViews() {
    var vs = [["map", "輿圖"], ["list", "名冊"], ["old", "原版對照"]];
    els.views.innerHTML = vs.map(function (v) {
      return "<button type='button' data-v='" + v[0] + "' class='" + (S.view === v[0] ? "on" : "") + "'>" + v[1] + "</button>";
    }).join("");
  }
  function renderSub() {
    if (!els.sub) return;
    var rid = mapRid();
    var r = byR[rid] || byR.mainland;
    var n = S.region === "all" ? filtered().length : (counts()[rid] || 0);
    els.sub.innerHTML = "<span class='sk'>" + esc(r.en) + "</span><h2>" + esc(S.region === "all" ? "全圖" : r.n) + "</h2><p>" +
      esc(S.region === "all" ? "十個分冊、同一份名單。點資料片看那一區的走法。" : r.d) + " · " + n + " 處</p>";
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

  function routeSvg(inR, w, h) {
    var lines = "";
    inR.forEach(function (p) {
      (p.links || []).forEach(function (id) {
        var q = byId[id];
        if (!q || q.r !== p.r || p.id > id) return;
        if (q.x == null || p.x == null) return;
        var on = (S.sel === p.id || S.sel === q.id) ? " on" : "";
        lines += "<line class='route" + on + "' data-a='" + p.id + "' data-b='" + q.id +
          "' x1='" + (p.x / 100 * w) + "' y1='" + (p.y / 100 * h) +
          "' x2='" + (q.x / 100 * w) + "' y2='" + (q.y / 100 * h) + "'/>";
      });
    });
    return "<svg class='routes' viewBox='0 0 " + w + " " + h + "' preserveAspectRatio='none'>" + lines + "</svg>";
  }

  function pinCls(p, qset, hasQ, near) {
    var cls = "";
    if (S.sel === p.id) cls += " on";
    if (near[p.id]) cls += " near";
    if (hasQ && !qset[p.id]) cls += " dim";
    return cls;
  }

  function renderMap() {
    var rid = mapRid();
    var r = byR[rid] || byR.mainland;
    var inR = places.filter(function (p) { return p.r === rid; });
    var qset = {};
    filtered().forEach(function (p) { qset[p.id] = 1; });
    var hasQ = !!S.q;
    var near = {};
    if (S.sel && byId[S.sel]) neighbors(byId[S.sel]).forEach(function (n) { near[n.id] = 1; });

    S.mapKey = rid;
    els.stage.className = "";
    var bar = "<div class='map-bar'><div class='map-title'><div class='k'>" + esc(r.en) + "</div><h2>" +
      esc(r.n) + "</h2><p>" + esc(r.d) + "</p></div><div class='zoom'>" +
      "<button type='button' data-z='-' title='縮小'>−</button>" +
      "<b id='zoomRead'>100%</b>" +
      "<button type='button' data-z='+' title='放大'>+</button>" +
      "<button type='button' data-z='0' title='整圖'>⊙</button></div></div>";

    if (rid === "mainland") {
      els.stage.innerHTML = bar +
        "<div class='map-vp' id='mvp'><div class='map-inner' id='minner'>" +
        "<div class='frame land'>" +
        "<img class='map-art' src='img/mainland.jpg' width='749' height='564' alt='主大陸大地圖' draggable='false'>" +
        routeSvg(inR, MAP_W, MAP_H) +
        "<div class='pins'>" + inR.map(function (p) {
          return "<button type='button' class='pin" + pinCls(p, qset, hasQ, near) +
            "' data-k='" + p.k + "' data-id='" + p.id +
            "' style='left:" + p.x + "%;top:" + p.y + "%'><span class='pin-tip'>" + esc(p.n) + "</span></button>";
        }).join("") + "</div></div></div></div>" +
        "<div class='legend'><b>在圖上走</b>　金線是相鄰。點地名看敗家一族原圖，再點相鄰圖走到下一張。</div>";
    } else {
      els.stage.innerHTML = bar +
        "<div class='map-vp' id='mvp'><div class='map-inner' id='minner'>" +
        "<div class='frame board' data-tone='" + (r.tone || "pine") + "'>" +
        routeSvg(inR, BOARD_W, BOARD_H) +
        inR.map(function (p) {
          var pic = p.img ? "<img src='" + esc(asset(p.img)) + "' alt='" + esc(p.n) + "'>" : "";
          return "<button type='button' class='node" + (p.img ? "" : " plain") + pinCls(p, qset, hasQ, near) +
            "' data-id='" + p.id + "' style='left:" + p.x + "%;top:" + p.y + "%'>" + pic +
            "<span class='cap'><span class='nk'>" + esc(p.kz) + "</span><b>" + esc(p.n) + "</b></span></button>";
        }).join("") + "</div></div></div>" +
        "<div class='legend'><b>原圖節點</b>　每張是敗家一族手繪／截圖。金線是走法，點圖走進詳圖。</div>";
    }
    bindCam();
    applyCam();
  }

  function updateMapState() {
    var qset = {};
    filtered().forEach(function (p) { qset[p.id] = 1; });
    var hasQ = !!S.q;
    var near = {};
    if (S.sel && byId[S.sel]) neighbors(byId[S.sel]).forEach(function (n) { near[n.id] = 1; });
    Array.prototype.forEach.call(els.stage.querySelectorAll(".pin, .node"), function (el) {
      var id = el.getAttribute("data-id");
      el.classList.toggle("on", S.sel === id);
      el.classList.toggle("near", !!near[id]);
      el.classList.toggle("dim", hasQ && !qset[id]);
    });
    Array.prototype.forEach.call(els.stage.querySelectorAll(".route"), function (ln) {
      var a = ln.getAttribute("data-a"), b = ln.getAttribute("data-b");
      ln.classList.toggle("on", !!(S.sel && (S.sel === a || S.sel === b)));
    });
  }

  function bindCam() {
    var vp = document.getElementById("mvp");
    if (!vp) return;
    var drag = null;
    vp.onpointerdown = function (e) {
      if (e.target.closest(".pin, .node, .zoom, .map-title")) return;
      drag = { x: e.clientX, y: e.clientY, px: S.panX, py: S.panY, moved: false };
      vp.classList.add("drag");
      vp.setPointerCapture(e.pointerId);
    };
    vp.onpointermove = function (e) {
      if (!drag) return;
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 3) drag.moved = true;
      S.panX = drag.px + (e.clientX - drag.x);
      S.panY = drag.py + (e.clientY - drag.y);
      applyCam();
    };
    vp.onpointerup = function (e) {
      var was = drag;
      drag = null;
      vp.classList.remove("drag");
      if (was && !was.moved && !e.target.closest(".pin, .node, .zoom, button")) {
        S.sel = null;
        render();
      }
    };
    vp.onwheel = function (e) {
      e.preventDefault();
      zoomAt(e, e.deltaY > 0 ? 0.9 : 1.11);
    };
  }

  function renderLedger() {
    els.stage.className = "ledger";
    S.mapKey = "";
    var list = filtered();
    var h = "<div class='ledger'><div class='ledger-lead'><div class='k'>GAZETTEER</div><h2>地名名冊</h2>" +
      "<p>同一份 ROSS 世界地圖名單。卡片上就是敗家一族原圖，點進去會回到輿圖並飛到那個點。</p></div>";
    var last = "";
    list.forEach(function (p, i) {
      if (p.r !== last) {
        last = p.r;
        h += "<div class='lg'>" + esc(byR[p.r].n) + "</div><div class='grid'>";
      }
      var ms = (p.mons || []).slice(0, 3).map(function (m) { return m.n; }).join("、");
      h += "<button type='button' class='card' data-id='" + p.id + "'>";
      if (p.img) h += "<img src='" + esc(asset(p.img)) + "' alt='" + esc(p.n) + "'>";
      h += "<div class='pad'><div class='meta'>" + esc(p.kz) + "</div><b>" + esc(p.n) + "</b>" +
        (p.lv ? "<div class='lv'>Lv " + esc(p.lv) + "</div>" : "") +
        "<div class='ms'>" + esc(ms || "—") + "</div></div></button>";
      var nxt = list[i + 1];
      if (!nxt || nxt.r !== p.r) h += "</div>";
    });
    if (!list.length) h += "<div class='empty'>沒有符合的地名。</div>";
    h += "</div>";
    els.stage.innerHTML = h;
  }

  function renderOld() {
    els.stage.className = "old";
    S.mapKey = "";
    var h = "<div class='oldpage'><div class='old-banner'><span>這是原頁的資訊架構重建：一張圖、一長串藍字、靠瀏覽器 Ctrl+F 找路。</span>" +
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
    if (p.mons.length) h += "<span class='tag'>" + p.mons.length + " 種幻獸</span>";
    h += "</div>";

    if (p.img) {
      h += "<figure class='hero'><img src='" + esc(asset(p.img)) + "' alt='" + esc(p.n) + " 原圖'>";
      if (p.page) h += "<a href='" + esc(asset(p.page)) + "' target='_blank' rel='noreferrer'>打開敗家一族原頁 ↗</a>";
      h += "</figure>";
    } else if (p.page) {
      h += "<p><a href='" + esc(asset(p.page)) + "' target='_blank' rel='noreferrer'>打開敗家一族原頁 ↗</a></p>";
    }

    var nei = neighbors(p);
    if (nei.length) {
      h += "<div class='sh-h'>從這張圖可以走到</div><div class='exits'>";
      nei.forEach(function (q) {
        h += "<button type='button' class='exit' data-id='" + q.id + "'>";
        if (q.img) h += "<img src='" + esc(asset(q.img)) + "' alt='" + esc(q.n) + "'>";
        h += "<span><b>" + esc(q.n) + "</b><i>" + esc(q.kz) + (q.lv ? " · " + esc(q.lv) : "") + "</i></span></button>";
      });
      h += "</div>";
    }

    if (p.blurb) h += "<p class='sh-blurb'>" + esc(p.blurb) + "</p>";

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
    h += "<p class='hint'>主大陸用官方大地圖走針；點開後右邊是敗家一族原圖。資料片每一格也是原圖，金線是相鄰走法。</p>";
    els.sheet.innerHTML = h;
  }

  if (els.listBtn) els.listBtn.addEventListener("click", function () { S.liston = !S.liston; render(); });
  document.getElementById("brand").addEventListener("click", function () {
    S.view = "map"; S.region = "mainland"; S.sel = null; S.q = ""; els.q.value = ""; S.mapKey = "";
    render({ rebuild: true, fit: true });
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
    if (b) go(b.getAttribute("data-id"));
  });
  els.stage.addEventListener("click", function (e) {
    var v = e.target.closest("[data-v]");
    if (v) { setView(v.getAttribute("data-v")); return; }
    var z = e.target.closest("[data-z]");
    if (z) {
      var k = z.getAttribute("data-z");
      var vp = document.getElementById("mvp");
      if (k === "0" || !vp) { fitMap(); return; }
      var box = vp.getBoundingClientRect();
      zoomAt({ clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 }, k === "+" ? 1.18 : 1 / 1.18);
      return;
    }
    var b = e.target.closest("[data-id]");
    if (b) go(b.getAttribute("data-id"));
  });
  els.sheet.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) { S.sel = null; render(); return; }
    var b = e.target.closest("[data-id]");
    if (b) go(b.getAttribute("data-id"));
  });
  els.q.addEventListener("input", function () {
    S.q = els.q.value;
    render();
    var list = filtered().filter(function (p) { return p.x != null; });
    if (S.q && list[0] && S.view === "map") flyTo(list[0]);
  });
  els.q.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      var list = filtered();
      if (list[0]) go(list[0].id);
    }
    if (e.key === "Escape") { els.q.value = ""; S.q = ""; render(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && document.activeElement !== els.q) {
      e.preventDefault(); els.q.focus(); els.q.select();
    }
    if (e.key === "Escape" && S.sel) { S.sel = null; render(); }
  });
  window.addEventListener("hashchange", function () { readHash(); S.mapKey = ""; render({ rebuild: true, fit: true, fly: !!S.sel }); });
  window.addEventListener("resize", function () {
    if (S.view === "map" && !S.sel) fitMap();
  });

  readHash();
  els.q.value = S.q;
  render({ rebuild: true, fit: true, fly: !!S.sel });
  setTimeout(function () { if (S.view === "map" && !S.sel) fitMap(); }, 80);
  setTimeout(function () { if (S.view === "map" && !S.sel) fitMap(); }, 400);
})();
