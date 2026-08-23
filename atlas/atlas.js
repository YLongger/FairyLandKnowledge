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
    liston: false
  };

  var els = {
    chips: document.getElementById("chips"),
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
    render();
  }
  function setRegion(id) {
    S.region = id;
    if (S.sel && byId[S.sel].r !== id && id !== "all") S.sel = null;
    if (S.view === "old") S.view = "map";
    resetCam();
    render();
  }

  function resetCam() {
    S.zoom = 1;
    S.panX = 0;
    S.panY = 0;
  }

  function render() {
    syncHash();
    document.getElementById("app").dataset.view = S.view;
    els.work.classList.toggle("nosheet", !S.sel || S.view === "old");
    els.work.classList.toggle("old", S.view === "old");
    els.work.classList.toggle("liston", S.liston);
    renderViews();
    renderChips();
    if (S.view === "old") {
      els.rail.innerHTML = "";
      els.sheet.hidden = true;
      renderOld();
      return;
    }
    renderRail();
    els.sheet.hidden = !S.sel;
    if (S.sel) renderSheet();
    else els.sheet.innerHTML = "";
    if (S.view === "list") renderLedger();
    else renderMap();
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
    if (!list.length) h += "<div class='empty'>沒有符合的地名。試試「吉恩」「史萊姆」「娃娃盒」。 </div>";
    groups.forEach(function (g) {
      if (S.region === "all") h += "<div class='rg'>" + esc(byR[g.r].n) + "</div>";
      g.items.forEach(function (p) {
        h += "<button type='button' class='li" + (S.sel === p.id ? " on" : "") + "' id='card-" + p.id + "' data-id='" + p.id + "'>" +
          "<span class='dot' style='background:" + pinColor(p.k) + "'></span>" +
          "<span><b>" + esc(p.n) + "</b><em>" + esc(p.kz) + (p.lv ? " · " + esc(p.lv) : "") + "</em></span></button>";
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

  function renderMap() {
    var rid = S.region === "all" ? "mainland" : S.region;
    var r = byR[rid] || byR.mainland;
    var inR = places.filter(function (p) { return p.r === rid; });
    var qset = {};
    filtered().forEach(function (p) { qset[p.id] = 1; });
    var hasQ = !!S.q;

    var bar = "<div class='map-bar'><div class='map-title'><div class='k'>" + esc(r.en) + "</div>" +
      "<h2>" + esc(r.n) + "</h2><p>" + esc(r.d) + "</p></div>" +
      "<div class='zoom'><button type='button' data-z='-' title='縮小'>−</button>" +
      "<button type='button' data-z='0' title='重設'>⊙</button>" +
      "<button type='button' data-z='+' title='放大'>+</button></div></div>";

    if (rid === "mainland") {
      els.stage.className = "";
      els.stage.innerHTML = bar + "<div class='map-vp' id='mvp'><div class='map-inner' id='minner'>" +
        "<div class='frame'><img src='img/mainland.jpg' alt='主大陸大地圖，官方原圖、敗家一族補充' draggable='false'>" +
        "<div class='pins'>" + inR.map(function (p) {
          var dim = hasQ && !qset[p.id] ? " dim" : "";
          var on = S.sel === p.id ? " on" : "";
          return "<button type='button' class='pin" + dim + on + "' data-k='" + p.k + "' data-id='" + p.id +
            "' style='left:" + p.x + "%;top:" + p.y + "%'><span class='pin-tip'>" + esc(p.n) + "</span></button>";
        }).join("") + "</div></div></div></div>";
      bindCam();
    } else {
      els.stage.className = "";
      var w = 1000, h = 620;
      var lines = "";
      inR.forEach(function (p) {
        (p.links || []).forEach(function (id) {
          var q = byId[id];
          if (!q || q.r !== rid || p.id > id) return;
          lines += "<line x1='" + (p.x / 100 * w) + "' y1='" + (p.y / 100 * h) +
            "' x2='" + (q.x / 100 * w) + "' y2='" + (q.y / 100 * h) +
            "' stroke='#8a6420' stroke-width='1.2' stroke-dasharray='5 6' opacity='.45'/>";
        });
      });
      els.stage.innerHTML = bar + "<div class='board'><svg viewBox='0 0 " + w + " " + h + "' preserveAspectRatio='none'>" + lines + "</svg>" +
        inR.map(function (p) {
          var dim = hasQ && !qset[p.id] ? " dim" : "";
          var on = S.sel === p.id ? " on" : "";
          return "<button type='button' class='node" + dim + on + "' data-id='" + p.id +
            "' style='left:" + p.x + "%;top:" + p.y + "%'><span class='nk'>" + esc(p.kz) + "</span><b>" + esc(p.n) + "</b></button>";
        }).join("") + "</div>";
    }
  }

  function bindCam() {
    var vp = document.getElementById("mvp");
    var inner = document.getElementById("minner");
    if (!vp || !inner) return;
    function apply() {
      inner.style.transform = "translate(calc(-50% + " + S.panX + "px), calc(-50% + " + S.panY + "px)) scale(" + S.zoom + ")";
    }
    apply();
    var drag = null;
    vp.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".pin")) return;
      drag = { x: e.clientX, y: e.clientY, px: S.panX, py: S.panY };
      vp.classList.add("drag");
      vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener("pointermove", function (e) {
      if (!drag) return;
      S.panX = drag.px + (e.clientX - drag.x);
      S.panY = drag.py + (e.clientY - drag.y);
      apply();
    });
    vp.addEventListener("pointerup", function () { drag = null; vp.classList.remove("drag"); });
    vp.addEventListener("wheel", function (e) {
      e.preventDefault();
      var next = S.zoom * (e.deltaY > 0 ? 0.9 : 1.1);
      S.zoom = Math.max(0.7, Math.min(2.8, next));
      apply();
    }, { passive: false });
  }

  function renderLedger() {
    els.stage.className = "ledger";
    var list = filtered();
    var h = "<div class='ledger'><div class='ledger-lead'><div class='k'>GAZETTEER</div><h2>地名名冊</h2>" +
      "<p>同一份 ROSS 世界地圖名單，改按資料片分冊。每張卡片能直接看到等級帶與出沒幻獸，不必先跳進另一頁。</p></div>";
    var last = "";
    list.forEach(function (p) {
      if (p.r !== last) {
        last = p.r;
        h += "<div class='lg'>" + esc(byR[p.r].n) + "</div><div class='grid'>";
      }
      var ms = (p.mons || []).slice(0, 3).map(function (m) { return m.n; }).join("、");
      h += "<button type='button' class='card' data-id='" + p.id + "'><div class='meta'>" + esc(p.kz) +
        "</div><b>" + esc(p.n) + "</b>" + (p.lv ? "<div class='lv'>Lv " + esc(p.lv) + "</div>" : "") +
        "<div class='ms'>" + esc(ms || "—") + "</div></button>";
      var nxt = list[list.indexOf(p) + 1];
      if (!nxt || nxt.r !== p.r) h += "</div>";
    });
    if (!list.length) h += "<div class='empty'>沒有符合的地名。</div>";
    h += "</div>";
    els.stage.innerHTML = h;
  }

  function renderOld() {
    els.stage.className = "old";
    var h = "<div class='oldpage'><div class='old-banner'><span>這是原頁的資訊架構重建：一張圖、一長串藍字、靠瀏覽器 Ctrl+F 找路。右邊進典藏輿圖看同一份名單被重排之後的落差。</span>" +
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
    h += "<p class='sh-blurb'>" + esc(p.blurb) + "</p>";

    if (p.img) {
      h += "<figure class='thumb'><img src='" + esc(asset(p.img)) + "' alt='" + esc(p.n) + " 詳圖'>" +
        (p.page ? "<a href='" + esc(asset(p.page)) + "' target='_blank' rel='noreferrer'>打開敗家一族原頁 ↗</a>" : "") +
        "</figure>";
    } else if (p.page) {
      h += "<p><a href='" + esc(asset(p.page)) + "' target='_blank' rel='noreferrer'>打開敗家一族原頁 ↗</a></p>";
    }

    if (p.links && p.links.length) {
      h += "<div class='sh-h'>相鄰</div><div class='adj'>";
      p.links.forEach(function (id) {
        var q = byId[id];
        if (q) h += "<button type='button' data-id='" + q.id + "'>" + esc(q.n) + "</button>";
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

  document.getElementById("brand").addEventListener("click", function () {
    S.view = "map"; S.region = "mainland"; S.sel = null; S.q = ""; els.q.value = ""; resetCam(); render();
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
      if (k === "+") S.zoom = Math.min(2.8, S.zoom * 1.15);
      else if (k === "-") S.zoom = Math.max(0.7, S.zoom / 1.15);
      else resetCam();
      var inner = document.getElementById("minner");
      if (inner) inner.style.transform = "translate(calc(-50% + " + S.panX + "px), calc(-50% + " + S.panY + "px)) scale(" + S.zoom + ")";
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
  window.addEventListener("hashchange", function () { readHash(); render(); });

  readHash();
  els.q.value = S.q;
  render();
})();
