/* 數據寶典 —— 由玩家整理的 23 分頁攻略數據重製的互動圖鑑（window.__TOOLS） */
(function () {
  "use strict";
  var D = window.__TOOLS || {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function fmt(n) { return Math.round(n).toLocaleString("zh-TW"); }

  /* 頁面定義：id、標題、副標、分組（寶典總覽用） */
  var PAGES = [
    { id: "skills", t: "幻獸技能一覽", d: "112 種幻獸可學技能矩陣", g: "幻獸養成", ico: "✦" },
    { id: "obgem", t: "寶石技能對照", d: "23 種寶石各教什麼技能", g: "幻獸養成", ico: "◆" },
    { id: "growth", t: "幻獸成長偏向", d: "七系 × 六偏向 升級素質分配", g: "幻獸養成", ico: "↗" },
    { id: "toys", t: "幻獸玩具圖鑑", d: "105 件玩具的材料、卡片與上限", g: "幻獸養成", ico: "🧸" },
    { id: "monid", t: "幻獸序號速查", d: "670 筆序號 ⇄ 名稱對照", g: "幻獸養成", ico: "№" },
    { id: "dropexp", t: "練級掉寶地圖", d: "八大資料片 各地區等級、屬性與掉寶", g: "尋寶指南", ico: "🗺" },
    { id: "dropspecial", t: "特殊物品掉寶", d: "56 種特殊物品 誰掉、在哪掉", g: "尋寶指南", ico: "🎁" },
    { id: "dropore", t: "原石掉寶", d: "29 種寶石原石的入手來源", g: "尋寶指南", ico: "💎" },
    { id: "gather", t: "採集六藝", d: "伐木．挖礦．釣魚．狩獵．採集．農事", g: "生產製造", ico: "⛏" },
    { id: "craft", t: "進階製作配方", d: "釀酒．調配．烹飪．紡織．冶煉．研磨", g: "生產製造", ico: "⚗" },
    { id: "weapons", t: "武器製作", d: "七大類武器全配方（含特殊屬性）", g: "生產製造", ico: "⚔" },
    { id: "armor", t: "防具製作", d: "防具、飾品、書籍、樂器全配方", g: "生產製造", ico: "🛡" },
    { id: "attrs", t: "裝備特殊屬性", d: "特殊裝備會附什麼效果、數值多少", g: "生產製造", ico: "✧" },
    { id: "process", t: "武器加工與精煉", d: "輸入武器等級查加工上限．精煉傾向", g: "生產製造", ico: "🔨" },
    { id: "cart", t: "推車製作", d: "五級推車的材料、加成與製作地點", g: "生產製造", ico: "🛒" },
    { id: "loc", t: "技能學習地點", d: "去哪學、去哪做、工會在哪＋職業頭銜", g: "生產製造", ico: "🏠" },
    { id: "family", t: "家族升級指南", d: "二至九級集卡冊與新增功能", g: "江湖百事", ico: "🏯" },
    { id: "playground", t: "遊樂場攻略", d: "六關挑戰規則與全獎品清單", g: "江湖百事", ico: "🎡" },
    { id: "turnorder", t: "出手順序表", d: "先手敏捷速查＋21 檔全技能先後", g: "江湖百事", ico: "⚡" },
  ];
  var GROUPS = ["幻獸養成", "尋寶指南", "生產製造", "江湖百事"];
  var byId = {};
  PAGES.forEach(function (p) { byId[p.id] = p; });

  /* 每頁的篩選狀態（切頁保留） */
  var S = {};
  function st(id) { if (!S[id]) S[id] = { q: "", tab: 0, chip: "" }; return S[id]; }

  /* ---------------- 共用元件 ---------------- */
  function head(p, extra) {
    return '<div class="tl-head"><div class="tl-kicker">數據寶典 · ' + esc(p.g) + "</div><h1>" +
      esc(p.t) + "</h1><p>" + esc(extra || p.d) + "</p></div>";
  }
  function searchBox(id, ph) {
    return '<input class="tl-search" id="tlQ" type="text" placeholder="' + esc(ph) + '" value="' + esc(st(id).q) + '">';
  }
  function tabsRow(id, names) {
    var cur = st(id).tab;
    var h = '<div class="tl-tabs">';
    names.forEach(function (n, i) {
      h += '<button class="tl-tab' + (i === cur ? " on" : "") + '" data-tab="' + i + '">' + esc(n) + "</button>";
    });
    return h + "</div>";
  }
  function bindCommon(id, rerender) {
    var q = document.getElementById("tlQ");
    if (q) q.oninput = function () { st(id).q = this.value; rerender(); };
    document.querySelectorAll(".tl-tab").forEach(function (b) {
      b.onclick = function () { st(id).tab = +this.getAttribute("data-tab"); render(id); };
    });
  }
  function bodyEl() { return document.getElementById("tlBody"); }
  function hit(q, parts) {
    if (!q) return true;
    for (var i = 0; i < parts.length; i++)
      if (parts[i] && String(parts[i]).indexOf(q) >= 0) return true;
    return false;
  }
  function monLink(name) {
    return '<a class="tl-mon" data-mon="' + esc(name) + '">' + esc(name) + "</a>";
  }
  function bindMonLinks(root) {
    root.querySelectorAll(".tl-mon").forEach(function (a) {
      a.onclick = function () {
        if (window.__gotoMon) window.__gotoMon(this.getAttribute("data-mon"));
      };
    });
  }
  function matChips(mats) {
    return mats.map(function (m) {
      return '<span class="mat">' + esc(m[0]) + (m[1] ? '<b>×' + esc(m[1]) + "</b>" : "") + "</span>";
    }).join("");
  }
  var ELEM_ORDER = "金木水火土光暗";
  function elemBadges(str) {
    return String(str).split(/[、,，\s]+/).filter(Boolean).map(function (e) {
      var k = e.charAt(0);
      return '<span class="el el-' + (ELEM_ORDER.indexOf(k) >= 0 ? k : "x") + '">' + esc(e) + "</span>";
    }).join("");
  }
  function countBar(n, unit, q) {
    return '<div class="tl-count">共 ' + n + " " + unit + (q ? "（關鍵字：" + esc(q) + "）" : "") + "</div>";
  }

  /* ---------------- 寶典總覽 hub ---------------- */
  function hubView(view) {
    var h = '<div class="tl-head"><div class="tl-kicker">FAIRYLAND HANDBOOK</div><h1>數據寶典</h1>' +
      "<p>老玩家整理多年的實戰數據，重新編排成 19 本可搜尋、可互查的互動圖鑑。</p></div>";
    GROUPS.forEach(function (g) {
      h += '<div class="tl-group-head">' + esc(g) + "</div>" + '<div class="tl-hub">';
      PAGES.filter(function (p) { return p.g === g; }).forEach(function (p) {
        h += '<a class="tl-hub-card" href="#/g/' + p.id + '"><span class="ico">' + p.ico + "</span>" +
          "<span><b>" + esc(p.t) + "</b><i>" + esc(p.d) + "</i></span></a>";
      });
      if (g === "幻獸養成")
        h += '<a class="tl-hub-card gold" href="#/t/calc"><span class="ico">🧮</span>' +
          "<span><b>寵物降級計算機</b><i>全屬性降級試算 + 連環降級規劃</i></span></a>";
      h += "</div>";
    });
    view.innerHTML = h;
  }

  /* ---------------- 幻獸技能一覽 ---------------- */
  function skillsView(view) {
    var id = "skills", p = byId[id];
    var exps = [];
    D.skills.forEach(function (m) { if (exps.indexOf(m.e) < 0) exps.push(m.e); });
    var h = head(p, "點技能篩出「誰學得會」，點資料片縮小範圍；每列列出該幻獸全部可學技能。") +
      searchBox(id, "搜幻獸名，例：史來姆 ／ 鳳凰 ／ 河童…") +
      '<div class="tl-chiprow" id="tlExp"><span class="lb">資料片</span><button class="chip' + (st(id).chip === "" ? " on" : "") + '" data-v="">全部</button>' +
      exps.map(function (e) {
        return '<button class="chip' + (st(id).chip === e ? " on" : "") + '" data-v="' + esc(e) + '">' + esc(e) + "</button>";
      }).join("") + "</div>" +
      '<div class="tl-chiprow" id="tlSk"><span class="lb">會的技能</span><button class="chip' + (!st(id).sk ? " on" : "") + '" data-v="">不限</button>' +
      D.skillCols.map(function (s) {
        return '<button class="chip' + (st(id).sk === s ? " on" : "") + '" data-v="' + esc(s) + '">' + esc(s) + "</button>";
      }).join("") + "</div><div id=\"tlBody\"></div>";
    view.innerHTML = h;
    function rerender() {
      var s0 = st(id), q = s0.q.trim();
      var list = D.skills.filter(function (m) {
        if (s0.chip && m.e !== s0.chip) return false;
        if (s0.sk && !m.s[D.skillCols.indexOf(s0.sk)]) return false;
        return hit(q, [m.n]);
      });
      var h2 = countBar(list.length, "種幻獸", q);
      list.forEach(function (m) {
        var chips = "";
        D.skillCols.forEach(function (s, i) {
          if (m.s[i]) chips += '<span class="skc' + (s0.sk === s ? " hl" : "") + '">' + esc(s) + "</span>";
        });
        h2 += '<div class="sk-row">' + monLink(m.n) +
          '<span class="badge">' + esc(m.g) + " 格</span>" +
          '<span class="badge dir">' + esc(m.d) + " 偏向</span>" +
          '<span class="badge dim">' + esc(m.e) + "</span>" +
          '<div class="skl">' + (chips || '<span class="tl-dim">尚無技能資料</span>') + "</div></div>";
      });
      bodyEl().innerHTML = h2;
      bindMonLinks(bodyEl());
    }
    bindCommon(id, rerender);
    view.querySelectorAll("#tlExp .chip").forEach(function (c) {
      c.onclick = function () { st(id).chip = this.getAttribute("data-v"); render(id); };
    });
    view.querySelectorAll("#tlSk .chip").forEach(function (c) {
      c.onclick = function () { st(id).sk = this.getAttribute("data-v"); render(id); };
    });
    rerender();
  }

  /* ---------------- 寶石技能對照 ---------------- */
  function obgemView(view) {
    var p = byId.obgem;
    var h = head(p, "幫幻獸開技能格、學技能前，先查這顆寶石教的是什麼。") + '<div class="gem-grid">';
    D.obgem.forEach(function (g) {
      h += '<div class="gem-card"><span class="gname">' + esc(g[0]) + '</span><span class="arrow">➜</span><span class="gskill">' + esc(g[1]) + "</span></div>";
    });
    h += "</div>" +
      '<div class="tl-note">寶石可由「原石」研磨而來——原石哪裡掉，見 <a href="#/g/dropore">原石掉寶</a>；研磨等級需求見 <a href="#/g/craft">進階製作配方</a>。</div>';
    view.innerHTML = h;
  }

  /* ---------------- 成長偏向 ---------------- */
  function growthView(view) {
    var p = byId.growth;
    var h = head(p, "幻獸每升 1 級，依「系別 × 成長偏向」自動分配素質點。表格讀法：3體2力＝每級+3體質+2力量。");
    h += '<div class="tl-tablewrap"><table class="tl-table growth"><thead><tr><th>系別＼偏向</th>';
    D.growth.head.forEach(function (c) { h += "<th>" + esc(c) + "</th>"; });
    h += "</tr></thead><tbody>";
    D.growth.rows.forEach(function (r) {
      h += '<tr><th class="rowh">' + elemBadges(r[0].replace("系", "")) + "</th>";
      for (var i = 1; i < r.length; i++) h += "<td>" + esc(r[i] || "—") + "</td>";
      h += "</tr>";
    });
    h += "</tbody></table></div>" +
      '<div class="tl-note">想知道自己幻獸的偏向？<a href="#/g/skills">幻獸技能一覽</a> 每隻都標了成長方向；' +
      "規劃降級神寵時，這張表就是「每級成長」的依據（例：火系力量偏向＝每級 +4 力）。</div>";
    view.innerHTML = h;
  }

  /* ---------------- 幻獸玩具 ---------------- */
  function toysView(view) {
    var id = "toys", p = byId.toys;
    var tiers = ["5", "6", "7", "8", "9", "10"];
    var h = head(p, "玩具＝幻獸的裝備。做一件要：特殊材料＋產物材料＋對應卡片與娃娃；娃娃上限決定能塞幾隻、屬性上限決定加多少。") +
      searchBox(id, "搜玩具、卡片、娃娃或材料，例：黃金 ／ 布丁 ／ 龍鱗…") +
      '<div class="tl-chiprow" id="tlTier"><span class="lb">娃娃上限</span><button class="chip' + (st(id).chip === "" ? " on" : "") + '" data-v="">全部</button>' +
      tiers.map(function (t2) {
        return '<button class="chip' + (st(id).chip === t2 ? " on" : "") + '" data-v="' + t2 + '">' + t2 + " 隻</button>";
      }).join("") + "</div><div id=\"tlBody\"></div>";
    view.innerHTML = h;
    function rerender() {
      var s0 = st(id), q = s0.q.trim();
      var list = D.toys.filter(function (t2) {
        if (s0.chip && t2.dmax !== s0.chip) return false;
        return hit(q, [t2.n, t2.sp, t2.mat, t2.card, t2.doll]);
      });
      var h2 = countBar(list.length, "件玩具", q) +
        '<div class="tl-tablewrap"><table class="tl-table"><thead><tr>' +
        "<th>玩具</th><th>特殊材料</th><th>產物材料</th><th>所需卡片／娃娃</th><th>娃娃上限</th><th>屬性上限</th><th>裝備門檻</th></tr></thead><tbody>";
      list.forEach(function (t2) {
        h2 += "<tr><td><b>" + esc(t2.n) + "</b></td><td>" + esc(t2.sp) + "</td><td>" + esc(t2.mat) + "</td>" +
          "<td>" + esc(t2.card) + "<br><span class='tl-dim'>" + esc(t2.doll) + "</span></td>" +
          '<td class="num">' + esc(t2.dmax || "—") + '</td><td class="num">' + esc(t2.amax || "—") + "</td>" +
          "<td>" + (t2.lv ? '<span class="badge">' + esc(t2.lv) + "</span>" : "—") + "</td></tr>";
      });
      h2 += "</tbody></table></div>";
      bodyEl().innerHTML = h2;
    }
    bindCommon(id, rerender);
    view.querySelectorAll("#tlTier .chip").forEach(function (c) {
      c.onclick = function () { st(id).chip = this.getAttribute("data-v"); render(id); };
    });
    rerender();
  }

  /* ---------------- 幻獸序號 ---------------- */
  function monidView(view) {
    var id = "monid", p = byId.monid;
    view.innerHTML = head(p, "融合、卡片、程式輸出常用序號講幻獸——輸入序號或名字即刻對照。") +
      searchBox(id, "輸入序號或幻獸名，例：409 ／ 神燈精靈…") + '<div id="tlBody"></div>';
    function rerender() {
      var q = st(id).q.trim();
      var list = D.monid.filter(function (m) {
        return !q || String(m[0]) === q || m[1].indexOf(q) >= 0 || String(m[0]).indexOf(q) === 0;
      });
      var h2 = countBar(list.length, "筆", q) + '<div class="mid-grid">';
      list.forEach(function (m) {
        h2 += '<div class="mid"><i>' + m[0] + "</i>" + monLink(m[1]) + "</div>";
      });
      bodyEl().innerHTML = h2 + "</div>";
      bindMonLinks(bodyEl());
    }
    bindCommon(id, rerender);
    rerender();
  }

  /* ---------------- 掉寶（特殊物品／原石） ---------------- */
  function dropsView(view, id, data, note) {
    var p = byId[id];
    view.innerHTML = head(p) + searchBox(id, "搜物品、幻獸或地圖，例：娃娃盒 ／ 企鵝 ／ 遺蹟地下…") +
      '<div id="tlBody"></div>' + (note || "");
    function rerender() {
      var q = st(id).q.trim();
      var list = data.filter(function (it) {
        if (!q) return true;
        if (it.n.indexOf(q) >= 0) return true;
        return it.src.some(function (s) {
          return s[0].indexOf(q) >= 0 || s[1].join(" ").indexOf(q) >= 0;
        });
      });
      var h2 = countBar(list.length, "種物品", q);
      list.forEach(function (it) {
        h2 += '<div class="drop-card"><div class="dc-name">' + esc(it.n) + "</div>";
        if (!it.src.length) {
          h2 += '<div class="tl-dim" style="padding:4px 0 2px">來源不詳（原整理者也沒找到穩定掉落）</div>';
        }
        it.src.forEach(function (s) {
          h2 += '<div class="dc-row">' + monLink(s[0]) + '<span class="dc-locs">' +
            s[1].map(function (l) { return '<span class="loc">' + esc(l) + "</span>"; }).join("") +
            "</span></div>";
        });
        h2 += "</div>";
      });
      bodyEl().innerHTML = h2 || '<div class="tl-empty">找不到，換個關鍵字試試。</div>';
      bindMonLinks(bodyEl());
    }
    bindCommon(id, rerender);
    rerender();
  }

  /* ---------------- 資料片掉寶地圖 ---------------- */
  function dropexpView(view) {
    var id = "dropexp", p = byId.dropexp;
    var names = D.dropExp.map(function (e) { return e.n; });
    view.innerHTML = head(p, "照資料片練級路線走：每個地區的幻獸等級帶、出沒屬性、會掉的好東西一目瞭然。") +
      tabsRow(id, names) + searchBox(id, "搜地區、掉寶或幻獸，例：遺蹟 ／ 娃娃盒 ／ 企鵝…") + '<div id="tlBody"></div>';
    function rerender() {
      var s0 = st(id), q = s0.q.trim();
      var exp = D.dropExp[Math.min(s0.tab, D.dropExp.length - 1)];
      var list = exp.areas.filter(function (a) { return hit(q, [a.a, a.d, a.m, a.lv]); });
      var h2 = countBar(list.length, "個地區", q) +
        '<div class="tl-tablewrap"><table class="tl-table"><thead><tr>' +
        "<th>地區</th><th>幻獸等級</th><th>出沒屬性</th><th>掉寶</th><th>出沒幻獸</th></tr></thead><tbody>";
      list.forEach(function (a) {
        var mons = a.m ? a.m.split(/[、,，]/).filter(Boolean).map(function (m2) {
          return monLink(m2.replace(/\d+$/, "")) + (/\d+$/.test(m2) ? '<sup class="tl-dim">' + m2.match(/\d+$/)[0] + "</sup>" : "");
        }).join("、") : "—";
        h2 += "<tr><td><b>" + esc(a.a) + '</b></td><td class="num">' + esc(a.lv || "—") + "</td>" +
          "<td>" + (a.e ? elemBadges(a.e) : "—") + "</td><td>" + esc(a.d || "—") + "</td><td>" + mons + "</td></tr>";
      });
      h2 += "</tbody></table></div>";
      if (exp.n === "糖果屋") h2 += '<div class="tl-note">糖果屋各區（登山小徑、葛雷夏村郊外、艾司伍林地、楓果森林、寧靜凍原、冰原洞窟）除卡片與娃娃外不掉其他物品。</div>';
      bodyEl().innerHTML = h2;
      bindMonLinks(bodyEl());
    }
    bindCommon(id, rerender);
    rerender();
  }

  /* ---------------- 採集六藝 ---------------- */
  function gatherView(view) {
    var id = "gather", p = byId.gather;
    var names = ["伐木", "挖礦", "釣魚", "狩獵", "採集", "農事"];
    view.innerHTML = head(p, "六種基本生產技能：什麼等級能採什麼、去哪裡採，照表升級不迷路。") +
      tabsRow(id, names) + searchBox(id, "搜產物或地點，例：龍鱗 ／ 迦蘭谷地…") + '<div id="tlBody"></div>';
    function rerender() {
      var s0 = st(id), q = s0.q.trim();
      var list = (D.gather[names[s0.tab]] || []).filter(function (g) {
        return hit(q, [g.n, g.loc.join(" ")]);
      });
      var h2 = countBar(list.length, "種產物", q) + '<div class="ga-grid">';
      list.forEach(function (g) {
        h2 += '<div class="ga-card"><div class="ga-top"><b>' + esc(g.n) + '</b><span class="badge">技能 Lv ' + esc(g.lv) + "</span></div>" +
          '<div class="ga-locs">' + g.loc.map(function (l) { return '<span class="loc">' + esc(l) + "</span>"; }).join("") + "</div></div>";
      });
      bodyEl().innerHTML = h2 + "</div>";
    }
    bindCommon(id, rerender);
    rerender();
  }

  /* ---------------- 進階製作 ---------------- */
  function craftView(view) {
    var id = "craft", p = byId.craft;
    var names = D.craft.map(function (g) { return g.n; });
    view.innerHTML = head(p, "六種進階技能全配方：成品、需求等級、材料用量；藥水食物同時標效果。") +
      tabsRow(id, names) + searchBox(id, "搜成品或材料，例：清酒 ／ 龍骨 ／ HP3000…") + '<div id="tlBody"></div>';
    function rerender() {
      var s0 = st(id), q = s0.q.trim();
      var grp = D.craft[Math.min(s0.tab, D.craft.length - 1)];
      var list = grp.items.filter(function (it) {
        return hit(q, [it.n, it.fx, it.m.map(function (m) { return m[0]; }).join(" ")]);
      });
      var h2 = countBar(list.length, "個配方", q);
      list.forEach(function (it) {
        h2 += '<div class="rc-row"><span class="rc-lv">Lv ' + esc(it.lv) + '</span><b class="rc-name">' + esc(it.n) + "</b>" +
          '<span class="rc-mats">' + matChips(it.m) + "</span>" +
          (it.fx ? '<span class="rc-fx">' + esc(it.fx) + "</span>" : "") + "</div>";
      });
      bodyEl().innerHTML = h2;
    }
    bindCommon(id, rerender);
    rerender();
  }

  /* ---------------- 武器 / 防具 ---------------- */
  function equipView(view, id, data, blurb) {
    var p = byId[id];
    var names = data.map(function (g) { return g.n; });
    view.innerHTML = head(p, blurb) + tabsRow(id, names) +
      searchBox(id, "搜名稱或材料，例：屠龍 ／ 泰坦金屬 ／ 鳳凰…") + '<div id="tlBody"></div>';
    function rerender() {
      var s0 = st(id), q = s0.q.trim();
      var grp = data[Math.min(s0.tab, data.length - 1)];
      var list = grp.items.filter(function (it) {
        return hit(q, [it.n, it.m.map(function (m) { return m[0]; }).join(" ")]);
      });
      var norm = list.filter(function (i) { return !i.sp; });
      var spec = list.filter(function (i) { return i.sp; });
      var h2 = countBar(list.length, "件", q);
      function rows(arr, cls) {
        var s = "";
        arr.forEach(function (it) {
          s += '<div class="rc-row' + (cls ? " " + cls : "") + '"><span class="rc-lv">Lv ' + esc(it.lv) + "</span>" +
            '<b class="rc-name">' + esc(it.n) + "</b>" +
            (cls ? '<a class="sp-tag" href="#/g/attrs" data-q="' + esc(it.n) + '">特殊屬性</a>' : "") +
            '<span class="rc-mats">' + matChips(it.m) + "</span></div>";
        });
        return s;
      }
      if (norm.length) h2 += '<div class="tl-sub">一般' + esc(grp.n) + "</div>" + rows(norm, "");
      if (spec.length) h2 += '<div class="tl-sub gold">有特殊屬性的' + esc(grp.n) + '<i>（點「特殊屬性」看會附什麼效果）</i></div>' + rows(spec, "sp");
      bodyEl().innerHTML = h2;
      bodyEl().querySelectorAll(".sp-tag").forEach(function (a) {
        a.onclick = function () { st("attrs").q = this.getAttribute("data-q"); };
      });
    }
    bindCommon(id, rerender);
    rerender();
  }

  /* ---------------- 裝備特殊屬性 ---------------- */
  function attrsView(view) {
    var id = "attrs", p = byId.attrs;
    var names = D.attrs.map(function (g) { return g.n; });
    view.innerHTML = head(p, "特殊裝備出貨會隨機附掛效果——這裡列出每件可能附的效果與最大數值。") +
      tabsRow(id, names) + searchBox(id, "搜裝備名或效果，例：屠龍 ／ 生命點數 ／ 隨機屬性…") + '<div id="tlBody"></div>';
    function rerender() {
      var s0 = st(id), q = s0.q.trim();
      var pool = [];
      if (q) {
        D.attrs.forEach(function (g) {
          g.items.forEach(function (it) {
            if (hit(q, [it.n, it.fx.map(function (f) { return f[0]; }).join(" ")]))
              pool.push({ g: g.n, it: it });
          });
        });
      } else {
        var grp = D.attrs[Math.min(s0.tab, D.attrs.length - 1)];
        grp.items.forEach(function (it) { pool.push({ g: grp.n, it: it }); });
      }
      var h2 = countBar(pool.length, "件裝備", q) + (q ? '<div class="tl-dim" style="margin:-6px 0 10px">搜尋時跨全部種類比對。</div>' : "");
      pool.forEach(function (x) {
        var it = x.it;
        h2 += '<div class="rc-row"><span class="rc-lv">Lv ' + esc(it.lv) + '</span><b class="rc-name">' + esc(it.n) + "</b>" +
          (q ? '<span class="badge dim">' + esc(x.g) + "</span>" : "") +
          (it.cnt ? '<span class="badge">屬性 ' + esc(it.cnt) + " 條</span>" : "") +
          '<span class="rc-mats">' +
          (it.fx.length ? it.fx.map(function (f) {
            return '<span class="fx">' + esc(f[0]) + (f[1] ? "<b>" + esc(f[1]) + "</b>" : "") + "</span>";
          }).join("") : '<span class="tl-dim">數值未整理（高等裝備原表留白）</span>') +
          "</span></div>";
      });
      bodyEl().innerHTML = h2;
    }
    bindCommon(id, rerender);
    rerender();
  }

  /* ---------------- 武器加工與精煉 ---------------- */
  function processView(view) {
    var id = "process", p = byId.process;
    if (!st(id).lv) st(id).lv = 80;
    var h = head(p, "拖動或輸入武器等級，即刻查該等級各項加工的最大值；下方另附各類武器精煉傾向。") +
      '<div class="pc-ctl"><label>武器等級</label>' +
      '<input type="range" id="pcRange" min="1" max="135" value="' + st(id).lv + '">' +
      '<input type="number" id="pcNum" min="1" max="135" value="' + st(id).lv + '"></div>' +
      '<div id="tlBody"></div>' +
      '<div class="tl-sub">武器精煉傾向</div>' +
      '<div class="tl-tablewrap"><table class="tl-table refine"><thead><tr><th>種類</th><th>命中類</th><th>傷害力</th><th>耐用度</th></tr></thead><tbody>';
    D.refine.forEach(function (r) {
      h += '<tr><th class="rowh">' + esc(r[0]) + "</th>" + [1, 2, 3].map(function (i) {
        var v = r[i];
        var cls = v.indexOf("極高") >= 0 ? "vh" : v === "高" ? "hi" : v === "中" ? "md" : v.indexOf("極低") >= 0 ? "vl" : "lo";
        return '<td><span class="rf ' + cls + '">' + esc(v) + "</span></td>";
      }).join("") + "</tr>";
    });
    h += "</tbody></table></div>" +
      '<div class="tl-note">精煉傾向表示該類武器精煉時各項成長的相對高低：例如斧類傷害成長「極高」但命中「極低」。</div>';
    view.innerHTML = h;
    function rerender() {
      var lv = Math.max(1, Math.min(135, st(id).lv));
      var row = null;
      D.process.rows.forEach(function (r) { if (+r[0] === lv) row = r; });
      if (!row) { bodyEl().innerHTML = ""; return; }
      var h2 = '<div class="pc-grid">';
      // head[0] 是「武器等級」欄本身，數值從第 1 欄起與 head 同索引對齊
      D.process.head.forEach(function (c, i) {
        if (i === 0) return;
        h2 += '<div class="pc-cell"><b>' + esc(row[i]) + "</b><i>" + esc(c) + "</i></div>";
      });
      bodyEl().innerHTML = h2 + "</div>";
    }
    var rg = document.getElementById("pcRange"), num = document.getElementById("pcNum");
    rg.oninput = function () { st(id).lv = +this.value; num.value = this.value; rerender(); };
    num.oninput = function () { st(id).lv = +this.value || 1; rg.value = st(id).lv; rerender(); };
    rerender();
  }

  /* ---------------- 推車 ---------------- */
  function cartView(view) {
    var p = byId.cart;
    var h = head(p, "推車是幻獸的載具裝備：每級推車固定加成一種屬性，材料越高級加得越多。");
    D.cart.forEach(function (tier) {
      h += '<div class="ct-tier"><div class="ct-head"><h3>' + esc(tier.n) + "</h3>" +
        '<span class="badge">' + esc(tier.req) + "</span>" +
        '<span class="badge dim">' + esc(tier.place) + "</span>" +
        '<span class="badge gold">' + esc(tier.fee) + "</span></div><div class=\"ct-grid\">";
      tier.items.forEach(function (c) {
        h += '<div class="ct-card"><div class="ct-top"><b>' + esc(c.n) + '</b><span class="buff">' + esc(c.buff) + "</span></div>" +
          '<div class="ct-mats">' + matChips(c.m) + "</div></div>";
      });
      h += "</div></div>";
    });
    view.innerHTML = h;
  }

  /* ---------------- 技能學習地點 ---------------- */
  function locView(view) {
    var p = byId.loc;
    var h = head(p, "30 種技能去哪學、要帶什麼材料、在哪工作、工會在哪座城。") +
      '<div class="tl-tablewrap"><table class="tl-table"><thead><tr>' +
      "<th>技能</th><th>學習地點</th><th>學習材料</th><th>工作地點</th><th>工會位置</th></tr></thead><tbody>";
    D.loc.skills.forEach(function (s) {
      h += "<tr><td><b>" + esc(s.n) + "</b></td><td>" + s.learn.map(esc).join("<br>") + "</td>" +
        "<td>" + esc(s.mat || "——") + "</td><td>" + esc(s.work || "——") + "</td><td>" + esc(s.guild || "——") + "</td></tr>";
    });
    h += "</tbody></table></div>" +
      '<div class="tl-sub">職業頭銜（找工會購買）</div><div class="tt-grid">';
    D.loc.titles.forEach(function (t2) {
      h += '<div class="tt-card"><i>' + esc(t2[0]) + "</i><b>" + esc(t2[1]) + "</b><span>" + esc(t2[2]) + "</span></div>";
    });
    view.innerHTML = h + "</div>";
  }

  /* ---------------- 家族 ---------------- */
  function familyView(view) {
    var p = byId.family;
    var h = head(p, "家族從二級升到九級，每級要收集整本幻獸卡片；升級後解鎖的功能整理如下。") + '<div class="fm-line">';
    D.family.forEach(function (lv) {
      h += '<div class="fm-node"><div class="fm-title">' + esc(lv.n) + "</div>" +
        '<div class="fm-feat">' + esc(lv.feat) + "</div>" +
        '<div class="fm-cards">' +
        lv.cards.map(function (c) {
          return '<div class="fm-card"><b>' + esc(c.n) + "</b>" +
            (c.lv ? '<span class="badge">Lv ' + esc(c.lv) + "</span>" : "") +
            '<span class="dc-locs">' + c.loc.map(function (l) { return '<span class="loc">' + esc(l) + "</span>"; }).join("") + "</span></div>";
        }).join("") + "</div></div>";
    });
    view.innerHTML = h + "</div>";
  }

  /* ---------------- 遊樂場 ---------------- */
  function playgroundView(view) {
    var p = byId.playground;
    var flow = [
      ["不挑戰", ["游樂券→六獎領獎單", "第2關券→五獎", "第3關券→四獎", "第4關券→三獎", "第5關券→二獎", "第6關券→頭獎"]],
      ["挑戰失敗", ["→安慰獎領獎單", "→六獎領獎單", "→五獎領獎單", "→四獎領獎單", "→三獎領獎單", "→二獎領獎單"]],
      ["挑戰成功", ["得第2關游樂券", "得第3關游樂券", "得第4關游樂券", "得第5關游樂券", "得第6關游樂券", "特獎領獎單（6 獎全得）"]],
    ];
    var h = head(p, "拿著游樂券一路往上闖：每一關都可以選擇收手換獎、或繼續挑戰搏更大的。") +
      '<div class="tl-tablewrap"><table class="tl-table pg"><thead><tr><th></th>';
    for (var i = 1; i <= 6; i++) h += "<th>第 " + i + " 關</th>";
    h += "</tr></thead><tbody>";
    flow.forEach(function (row) {
      h += '<tr><th class="rowh">' + row[0] + "</th>" + row[1].map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>";
    });
    h += "</tbody></table></div><div class=\"tl-sub\">獎品清單</div><div class=\"pg-grid\">";
    var order = ["安慰獎", "六獎", "五獎", "四獎", "三獎", "二獎", "頭獎", "第一特獎"];
    var sorted = D.playground.slice().sort(function (a, b) {
      function k(x) { for (var i2 = 0; i2 < order.length; i2++) if (x.n.indexOf(order[i2]) === 0) return i2; return 99; }
      return k(a) - k(b);
    });
    sorted.forEach(function (t2) {
      h += '<div class="pg-card"><div class="pg-name">' + esc(t2.n) + "</div>" +
        t2.items.map(function (x) { return '<span class="mat">' + esc(x) + "</span>"; }).join("") + "</div>";
    });
    view.innerHTML = h + "</div>" +
      '<div class="tl-note">頭獎與特獎裡的「寵物降級咖啡」等道具，正是 <a href="#/t/calc">寵物降級計算機</a> 用得到的降級道具來源之一。</div>';
  }

  /* ---------------- 出手順序 ---------------- */
  function turnorderView(view) {
    var id = "turnorder", p = byId.turnorder;
    var FS = D.firststrike;
    var s0 = st(id);
    if (s0.boss === undefined) s0.boss = 0;

    view.innerHTML = head(p, "戰鬥出手先後＝技能的敏捷系數 × 角色敏捷。系數越高越先動；同檔比敏捷。") +
      searchBox(id, "搜職業或技能，例：地裂閃 ／ 巫師 ／ 拉拉舞…") +
      '<div id="fsWrap"></div>' +
      '<h3 class="fs-h3">全技能出手順序（2019-07-10 版）</h3>' +
      '<p class="fs-note">上表未列的技能（一轉、輔助、幻獸、拉拉舞…）依此表比較先後。</p>' +
      '<div id="tlBody"></div>';

    function fsRender() {
      var q = st(id).q.trim();
      var bi = st(id).boss;
      var h = '<div class="fs-head"><div><h3>先手敏捷速查</h3>' +
        '<p>選一個 BOSS 戰場，看每招在<b>使用黑暗儀式後</b>要多少敏捷才能先出手。</p></div>' +
        '<span class="fs-src">' + esc(FS.src) + "</span></div>";
      h += '<div class="fs-bosses">' + FS.bosses.map(function (b, i) {
        return '<button class="fs-boss' + (i === bi ? " on" : "") + '" data-b="' + i + '">' + esc(b) + "</button>";
      }).join("") + "</div>";
      h += '<div class="fs-grid">';
      FS.jobs.forEach(function (jb) {
        var list = q ? jb.s.filter(function (s) {
          return s.n.indexOf(q) >= 0 || jb.j.indexOf(q) >= 0;
        }) : jb.s;
        if (!list.length) return;
        h += '<div class="fs-job"><h4>' + esc(jb.j) + "</h4>";
        list.forEach(function (s) {
          h += '<div class="fs-skill"><img src="img/strike/s' +
            (s.i < 10 ? "0" + s.i : s.i) + '.png" alt="" loading="lazy">' +
            '<div class="fs-sk-txt"><b>' + esc(s.n) + "</b>" +
            "<i>第 " + s.o + " 檔・係數 " + esc(s.k) + "</i></div>" +
            '<div class="fs-req"><b>' + s.v[bi] + "</b><i>敏捷</i></div></div>";
        });
        h += "</div>";
      });
      h += "</div>";
      h += '<p class="fs-note">同一檔（同係數）需求相同；未用黑暗儀式時 BOSS 更快，需求會更高。' +
        "數字＝比「" + esc(FS.bosses[bi]) + "」先動的最低敏捷。</p>";
      var w = document.getElementById("fsWrap");
      w.innerHTML = h;
      w.querySelectorAll(".fs-boss").forEach(function (b) {
        b.onclick = function () {
          st(id).boss = +this.getAttribute("data-b");
          fsRender();
        };
      });
    }

    function rerender() {
      fsRender();
      var q = st(id).q.trim();
      var h2 = "";
      D.turnorder.forEach(function (t2) {
        var list = q ? t2.s.filter(function (s) { return s[0].indexOf(q) >= 0 || s[1].indexOf(q) >= 0; }) : t2.s;
        if (q && !list.length) return;
        h2 += '<div class="to-row"><div class="to-ord"><b>' + t2.o + '</b><i>係數 ' + esc(t2.k) + "</i></div><div class=\"to-skills\">" +
          (list.length ? list.map(function (s) {
            return '<span class="to-chip"><i>' + esc(s[0]) + "</i>" + esc(s[1]) + "</span>";
          }).join("") : '<span class="tl-dim">（無技能登記）</span>') + "</div></div>";
      });
      bodyEl().innerHTML = h2 || '<div class="tl-empty">找不到，換個關鍵字試試。</div>';
    }
    bindCommon(id, rerender);
    rerender();
  }

  /* ---------------- 路由入口 ---------------- */
  function render(id, view) {
    view = view || document.getElementById("view");
    if (!id) return hubView(view);
    switch (id) {
      case "skills": return skillsView(view);
      case "obgem": return obgemView(view);
      case "growth": return growthView(view);
      case "toys": return toysView(view);
      case "monid": return monidView(view);
      case "dropspecial": return dropsView(view, "dropspecial", D.dropSpecial,
        '<div class="tl-note">喬舒亞石原石等「來源不詳」條目為原整理者留空，非資料遺漏。</div>');
      case "dropore": return dropsView(view, "dropore", D.dropOre,
        '<div class="tl-note">原石研磨成寶石後，可幫幻獸開技能——對照 <a href="#/g/obgem">寶石技能對照</a>。</div>');
      case "dropexp": return dropexpView(view);
      case "gather": return gatherView(view);
      case "craft": return craftView(view);
      case "weapons": return equipView(view, "weapons", D.weapons,
        "劍、刀、斧、棒、算盤、鞭、拳套七類武器：需求等級與完整材料表。");
      case "armor": return equipView(view, "armor", D.armor,
        "頭盔、帽子、手套、盾牌、鞋子、衣袍、皮甲、盔甲、戒指、項鍊、書籍、樂器全配方。");
      case "attrs": return attrsView(view);
      case "process": return processView(view);
      case "cart": return cartView(view);
      case "loc": return locView(view);
      case "family": return familyView(view);
      case "playground": return playgroundView(view);
      case "turnorder": return turnorderView(view);
      default: return hubView(view);
    }
  }

  /* 全站搜尋索引：頁面 + 掉寶物品 */
  function searchIndex() {
    var ix = [];
    PAGES.forEach(function (p) {
      ix.push({ t: p.t, d: p.d, hash: "#/g/" + p.id, page: p.id });
    });
    (D.dropSpecial || []).forEach(function (it) {
      ix.push({ t: it.n, d: "特殊物品掉寶 · " + it.src.map(function (s) { return s[0]; }).slice(0, 4).join("、"), hash: "#/g/dropspecial", page: "dropspecial", q: it.n });
    });
    (D.dropOre || []).forEach(function (it) {
      ix.push({ t: it.n, d: "原石掉寶 · " + it.src.map(function (s) { return s[0]; }).slice(0, 4).join("、"), hash: "#/g/dropore", page: "dropore", q: it.n });
    });
    return ix;
  }

  window.ToolsUI = {
    pages: PAGES,
    groups: GROUPS,
    render: render,
    setQuery: function (page, q) { st(page).q = q || ""; },
    title: function (id) { return byId[id] ? byId[id].t : "數據寶典"; },
    group: function (id) { return byId[id] ? byId[id].g : ""; },
    searchIndex: searchIndex,
  };
})();
