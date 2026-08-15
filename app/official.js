/* 官方誌 —— 官方公告、活動玩法與資料片典藏（#/o、#/o/<群組>） */
(function () {
  "use strict";
  var D = window.__OFFICIAL || { groups: [] };
  var M = "../official/";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var GROUP_DESC = {
    exp: "資料片開場故事與新地圖介紹，保存自官方網頁。",
    act: "歷年節慶與系列活動的官方玩法說明。",
    sys: "系統新功能、商城與平衡調整的官方公告。",
  };
  /* 資料片官方網頁——已完整鏡像進離線版（/lager/），FLASH 由 Ruffle 模擬器離線重現 */
  var EXP_LINKS = [
    ["人魚傳說", "../lager/12update/mermaid/", 0],
    ["夢遊仙境", "../lager/12update/Alice/", 0],
    ["一千零一夜", "../lager/12update/Night/index.shtml", 0],
    ["國王的新衣", "../lager/12update/king/index.htm", 0],
    ["綠野仙蹤", "../lager/27-the_wizard_of_oz/01-land.shtml", 0],
    ["拇指姑娘", "../lager/35_thumbelina/index.htm", 0],
    ["美女與野獸", "../lager/12update/bandb/", 0],
    ["桃太郎", "../lager/12update/momotao/index/index.htm", 1],
    ["糖果屋", "../lager/12update/candyshop/", 1],
  ];

  function grp(id) {
    for (var i = 0; i < D.groups.length; i++) if (D.groups[i].id === id) return D.groups[i];
    return null;
  }

  function hub(view) {
    var h = '<div class="of-hero"><img src="' + M + 'cover.jpg" alt="官方誌">' +
      '<div class="of-hero-txt"><div class="oh-kicker">OFFICIAL CHRONICLE</div>' +
      "<h1>官方誌</h1><div class=\"oh-sub\">公告・活動・資料片</div></div></div>";
    h += '<p class="of-lead">官方網頁上的活動玩法、系統公告與資料片介紹，原樣典藏。' +
      "感謝 KK 蒐集整理這批官方網頁材料。</p>";
    h += '<div class="of-cards">';
    D.groups.forEach(function (g) {
      h += '<a class="of-card" href="#/o/' + g.id + '"><b>' + esc(g.name) + "</b>" +
        "<span>" + esc(GROUP_DESC[g.id] || "") + "</span>" +
        '<i>' + g.items.length + " 篇</i></a>";
    });
    h += "</div>";
    view.innerHTML = h;
  }

  function group(view, gid) {
    var g = grp(gid);
    if (!g) { hub(view); return; }
    var h = '<div class="of-head"><a class="of-back" href="#/o">← 官方誌</a>' +
      "<h1>" + esc(g.name) + "</h1><p>" + esc(GROUP_DESC[gid] || "") + "</p></div>";
    h += '<div class="of-grid">';
    g.items.forEach(function (it, i) {
      h += '<figure class="of-shot" data-i="' + i + '">' +
        '<div class="of-thumb"><img src="' + M + it.f + '" loading="lazy" alt="' + esc(it.t) + '"></div>' +
        "<figcaption>" + esc(it.t) + "</figcaption></figure>";
    });
    h += "</div>";
    if (gid === "exp") {
      h += '<div class="of-links"><h3>資料片官方網頁・完整離線收藏</h3>' +
        '<p class="of-note">九個資料片官網已整站鏡像進典藏，免網路瀏覽；' +
        '標註 ✦ 者為 FLASH 動畫網頁，由 Ruffle 模擬器離線重現。</p>' +
        '<div class="of-linkrow">';
      EXP_LINKS.forEach(function (l) {
        h += '<a class="of-link' + (l[2] ? " flash" : "") + '" href="' + l[1] +
          '" target="_blank" rel="noopener">' + esc(l[0]) + (l[2] ? " ✦" : " ↗") + "</a>";
      });
      h += "</div></div>";
    }
    view.innerHTML = h;
    view.querySelectorAll(".of-shot").forEach(function (f) {
      f.onclick = function () {
        var it = g.items[+this.getAttribute("data-i")];
        openViewer(M + it.f, it.t);
      };
    });
  }

  /* 長圖檢視器：置頂開始、可捲動 */
  function openViewer(src, title) {
    var v = document.getElementById("ofViewer");
    if (!v) {
      v = document.createElement("div");
      v.id = "ofViewer";
      v.innerHTML = '<div class="ov-bar"><span class="ov-title"></span><span class="ov-close">✕ 關閉</span></div>' +
        '<div class="ov-body"><img alt=""></div>';
      v.querySelector(".ov-close").onclick = function () { v.classList.remove("show"); };
      v.querySelector(".ov-bar").onclick = function (e) {
        if (e.target.classList.contains("ov-bar")) v.classList.remove("show");
      };
      document.body.appendChild(v);
    }
    v.querySelector(".ov-title").textContent = title;
    v.querySelector("img").src = src;
    v.querySelector(".ov-body").scrollTop = 0;
    v.classList.add("show");
  }

  function searchIndex() {
    var out = [];
    D.groups.forEach(function (g) {
      g.items.forEach(function (it) {
        out.push({ t: it.t, sub: "官方誌・" + g.name, r: "#/o/" + g.id });
      });
    });
    return out;
  }

  window.OfficialUI = { hub: hub, group: group, groups: D.groups, searchIndex: searchIndex };
})();
