# -*- coding: utf-8 -*-
"""全站逐頁審計：對比度（隱形字）、破圖、水平溢出。1109 頁全跑。"""
import json
import sys
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BASE = "http://127.0.0.1:8777/modern/index.html"
OUT = Path(__file__).parent / "audit-report.json"

AUDIT_JS = """
() => {
  const view = document.getElementById('view');
  if (!view) return {err: 'no-view'};
  const issues = [];
  // 1) 破圖
  view.querySelectorAll('img').forEach(im => {
    if (im.complete && im.naturalWidth === 0)
      issues.push({t: 'img', src: (im.getAttribute('src') || '').slice(-70)});
  });
  // 2) 水平溢出
  if (view.scrollWidth > view.clientWidth + 8)
    issues.push({t: 'overflow', w: view.scrollWidth - view.clientWidth});
  // 3) 隱形字：文字色 vs 有效背景色 對比過低
  function parse(c) {
    const m = c.match(/rgba?\\(([\\d.]+),\\s*([\\d.]+),\\s*([\\d.]+)(?:,\\s*([\\d.]+))?\\)/);
    if (!m) return null;
    return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  }
  function effBg(el) {
    let e = el;
    while (e && e !== document.documentElement) {
      const bg = parse(getComputedStyle(e).backgroundColor);
      if (bg && bg[3] > 0.1) return bg;
      e = e.parentElement;
    }
    return [245, 239, 223, 1];
  }
  function lum(c) {
    const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]);
  }
  function ratio(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
  }
  const walker = document.createTreeWalker(view, NodeFilter.SHOW_TEXT);
  const flagged = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const txt = n.textContent.trim();
    if (txt.length < 2) continue;
    const el = n.parentElement;
    if (!el || flagged.has(el)) continue;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden') continue;
    const fg = parse(st.color);
    if (!fg) continue;
    const r = ratio(fg, effBg(el));
    if (r < 1.8) {
      flagged.add(el);
      if (flagged.size <= 3)
        issues.push({t: 'contrast', r: Math.round(r * 100) / 100,
                     tag: el.tagName + '.' + (el.className || ''),
                     txt: txt.slice(0, 24)});
    }
  }
  if (flagged.size > 3) issues.push({t: 'contrast-more', n: flagged.size - 3});
  return {issues};
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1360, "height": 900})
    pg.goto(BASE)
    pg.wait_for_timeout(1200)
    ids = pg.evaluate("() => window.__META.pages.map(x => ['#/p/' + x.id, x.t])")
    # 數據寶典 + 計算機路由一併審計
    tools = pg.evaluate(
        "() => window.ToolsUI ? ToolsUI.pages.map(p => ['#/g/' + p.id, p.t]) : []")
    offs = pg.evaluate(
        "() => window.OfficialUI ? OfficialUI.groups.map(g => ['#/o/' + g.id, g.name]) : []")
    ids = ([["#/g", "寶典總覽"], ["#/t/calc", "降級計算機"], ["#/y", "童話時分"], ["#/o", "官方誌"]]
           + offs + tools + ids)
    print("pages to audit:", len(ids), flush=True)
    report = {}
    t0 = time.time()
    for i, (pid, title) in enumerate(ids):
        pg.evaluate("(h) => { location.hash = h; }", pid)
        pg.wait_for_timeout(60)
        # 讓 lazy 圖片開始載入並等它們有結果
        pg.evaluate("""() => new Promise(res => {
          const imgs = [...document.querySelectorAll('#view img')];
          imgs.forEach(i => { i.loading = 'eager'; });
          const pend = imgs.filter(i => !i.complete);
          if (!pend.length) return res(0);
          let left = pend.length;
          const done = () => { if (--left <= 0) res(0); };
          pend.forEach(i => { i.onload = done; i.onerror = done; });
          setTimeout(() => res(0), 1500);
        })""")
        r = pg.evaluate(AUDIT_JS)
        if r.get("issues"):
            report[pid] = {"title": title, "issues": r["issues"]}
        if (i + 1) % 100 == 0:
            print(f"[{i+1}/{len(ids)}] flagged={len(report)} elapsed={time.time()-t0:.0f}s", flush=True)
    b.close()

OUT.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"DONE flagged={len(report)} / {len(ids)}")
by_type = {}
for pid, v in report.items():
    for it in v["issues"]:
        by_type.setdefault(it["t"], []).append(pid)
for k, v in sorted(by_type.items()):
    print(f"  {k}: {len(v)} pages")
