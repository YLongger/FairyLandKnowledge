# -*- coding: utf-8 -*-
"""從 site/ 鏡像建置現代版離線知識庫 App（site/modern/）。

流程：
1. 依策劃選單樹從入口頁 BFS 收集內容頁（過濾相簿/留言板等非遊戲資料）。
2. 清洗 Big5 舊式 HTML：去 script/style/框架殼，剝除表現層屬性，
   語意色彩映射為 class，內部連結改 hash route，圖片改相對路徑。
3. 解析 htm/huan 幻獸數值頁為結構化 JSON（幻獸資料庫）。
4. 產出 data-*.js 與 App 靜態檔到 site/modern/。
"""
import json
import re
import sys
import shutil
from pathlib import Path, PurePosixPath
from bs4 import BeautifulSoup, Comment, NavigableString

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).parent
SITE = ROOT / "site"
OUT = SITE / "modern"
APP = ROOT / "app"

# ---------------------------------------------------------------- 選單樹
# (章節, [(標題, 入口路徑)])；路徑相對 site/
NAV = [
    ("新手上路", "為第一次進入童話世界的你準備", [
        ("進入遊戲", "copy/enter.htm"),
        ("操作介面", "copy/face.htm"),
        ("初入家園", "copy/first.htm"),
        ("故事簡介", "copy/story.htm"),
        ("世界背景", "copy/map.htm"),
        ("玩家角色", "copy/player.htm"),
        ("職業分析", "copy/train.htm"),
        ("技能詳解", "copy/skill.htm"),
        ("法術一覽", "copy/magic.htm"),
        ("二轉新職", "copy/2g.htm"),
        ("幻獸介紹", "copy/cute.htm"),
        ("人民信仰", "copy/magicsh.htm"),
        ("新手問答", "htm/teach/nnn.htm"),
        ("仙人指路（舊版）", "htm/shin/shin.htm"),
    ]),
    ("攻略集", "任務、魔王、掉寶與各系統完整攻略", [
        ("任務攻略", "htm/mission/gn.htm"),
        ("魔王攻略", "htm/master/master.htm"),
        ("掉寶資料", "htm/db.htm"),
        ("攻城戰", "htm/gon/go.htm"),
        ("特殊物品", "htm/tu.htm"),
        ("地圖詳覽", "htm/map/mapp.htm"),
        ("結婚系統", "htm/marry/marry.htm"),
        ("推車與魔毯", "htm/bow/car.htm"),
        ("袖珍幻獸", "htm/sg/sg.htm"),
        ("魔女造型沙龍", "bea/bea.htm"),
        ("探險遊記", "htm/new/tan.htm"),
        ("仙人指路", "htm/shin/newshin.htm"),
        ("文章整理", "htm/newb.htm"),
    ]),
    ("幻獸大全", "數值、技能、掉寶、圖鑑一應俱全", [
        ("幻獸數值", "htm/huan/sux.htm"),
        ("幻獸一覽", "htm/huan/lan.htm"),
        ("幻獸百科", "htm/book99.htm"),
        ("幻獸圖鑑", "htm/allgif/image.htm"),
        ("幻獸娃娃", "htm/wawa/wawa.htm"),
        ("幻獸配件", "htm/wield/wield.htm"),
        ("寵物玩具", "htm/toy/toy.htm"),
        ("幻獸融合", "htm/lon/lon.htm"),
        ("幻獸變色", "htm/bow/ben.htm"),
    ]),
    ("裝備產物", "工作技能與各版本新產物", [
        ("工作技能", "htm/work.htm"),
        ("特殊裝備", "htm/memo2.htm"),
        ("桃源鄉新產物", "htm/5050/t/t.htm"),
        ("糖果屋新產物", "htm/6060/t.htm"),
    ]),
]

# 不收錄的路徑前綴（相簿、留言板、廣告等非遊戲資料）
EXCLUDE_PREFIX = (
    "htm/photo/", "htm/pic/", "pic/", "friend/", "share/", "chat/",
    "lalala/", "files/files", "files/ad", "files/archie", "2019/my2019",
    "htm/our", "htm/menu", "htm/join", "htm/note", "htm/web",
    "count", "top", "index", "news", "fyboard",
)
# 純裝飾圖：以「解析後完整路徑」精準過濾，避免誤殺他目錄同名內容圖
DECOR_PATHS = {
    # 站根裝飾
    "yt.gif", "closed.gif", "closedfolder.gif", "openfolder.gif",
    "ball1.gif", "ball2.gif", "news.gif", "z.gif", "mail.gif",
    "world.gif", "glink.gif", "logo22.gif", "linktitle.gif",
    "b1.gif", "b2.gif", "b3.gif", "b4.gif", "b5.gif", "b6.gif",
    "b7.gif", "b8.gif",
    # 跨頁共用版頭（非該頁同名者）
    "htm/work.gif", "htm/tcc.gif", "htm/db.gif", "htm/newb.gif",
    "htm/wawa/wawawa.gif", "htm/huan/lan.gif", "htm/huan/su.gif",
    "htm/shin/shin.gif", "htm/marry/marry.gif", "htm/sg/sg.gif",
    "htm/bow/car.gif", "htm/bow/ben.gif", "htm/bow/acc.gif",
    "htm/map/map.gif", "htm/teach/nnn.gif", "htm/tu.gif",
    "htm/5050/t/t.gif", "htm/6060/t.gif", "bea/bea.gif",
    "htm/gon/go.gif", "htm/new/tan.gif", "htm/toy/toy.gif",
    "htm/wield/wield.gif", "htm/lon/lon.gif", "htm/allgif/image.gif",
    "htm/master/master.gif", "htm/mission/gn.gif", "htm/qa.gif",
    "files/fd.gif", "htm/bad/bad.gif", "htm/bad/2b/bad.gif",
    "htm/memo2.gif", "htm/book99.gif",
}
# 個別頁面標題覆寫（連結文字撈不到、又不宜用檔名者）
TITLE_OVERRIDES = {
    "htm/bad/bad2.htm": "商場騙術",
    "htm/bad/bad3.htm": "交易騙術",
    "htm/bad/bad4.htm": "其他騙術",
    "htm/tu22.htm": "特殊物品（下集）",
    "htm/6060/protect2.htm": "護具類 170–200",
    "htm/6060/weapon2.htm": "武器類 170–200",
    "htm/protect2.htm": "防具類・衣袍製作",
    "copy/map2.htm": "三大村莊與城市官方地圖",
    "htm/map/bird.htm": "青鳥城NPC地點",
    "htm/map/bird2.htm": "青鳥城NPC完整地圖",
    "htm/map/rainbow.htm": "彩虹城NPC地點",
    "htm/map/rainbow2.htm": "彩虹城NPC完整地圖",
    "htm/map/rainbow3.htm": "彩虹城NPC完整地圖（另一版）",
    "htm/map/gold2.htm": "金銀城NPC與倉庫地點",
    "htm/map/tenf.htm": "天方地圖總覽",
    "htm/newb2.htm": "新手教學文選",
    "htm/wawa/wawawawa.htm": "幻獸娃娃圖庫",
    "htm/wield/wield2.htm": "幻獸配件一覽",
    "htm/master/masterb.htm": "一般魔王（第二頁）",
    "htm/master/masterc.htm": "一般魔王（第三頁）",
    "htm/master/master22.htm": "任務魔王（第二頁）",
    "htm/master/master32.htm": "任務魔王（第三頁）",
}
GENERIC_TITLES = {
    "童話安徒生 敗家一族", "童話資料網 敗家一族", "敗家一族", "童話安徒生",
    "new page 1", "new page 2", "new page 3", "b2", "",
}
# ---------------------------------------------------------------- 顏色
NAMED_COLORS = {
    "red": (255, 0, 0), "green": (0, 128, 0), "blue": (0, 0, 255),
    "navy": (0, 0, 128), "navyblue": (0, 0, 128), "royalblue": (65, 105, 225),
    "lavender": (230, 230, 250), "white": (255, 255, 255), "black": (0, 0, 0),
    "yellow": (255, 255, 0), "orange": (255, 165, 0), "purple": (128, 0, 128),
    "gray": (128, 128, 128), "grey": (128, 128, 128), "silver": (192, 192, 192),
    "pink": (255, 192, 203), "brown": (165, 42, 42), "gold": (255, 215, 0),
    "lightblue": (173, 216, 230), "lightgreen": (144, 238, 144),
    "lightyellow": (255, 255, 224), "beige": (245, 245, 220),
    "ivory": (255, 255, 240), "khaki": (240, 230, 140),
    "maroon": (128, 0, 0), "olive": (128, 128, 0), "teal": (0, 128, 128),
    "aqua": (0, 255, 255), "cyan": (0, 255, 255), "lime": (0, 255, 0),
    "fuchsia": (255, 0, 255), "magenta": (255, 0, 255),
    "wheat": (245, 222, 179), "tan": (210, 180, 140),
    "lightgray": (211, 211, 211), "lightgrey": (211, 211, 211),
    "whitesmoke": (245, 245, 245), "snow": (255, 250, 250),
    "greenyellow": (173, 255, 47), "skyblue": (135, 206, 235),
}


def parse_color(v):
    if not v:
        return None
    v = v.strip().lower().lstrip("#")
    if v in NAMED_COLORS:
        return NAMED_COLORS[v]
    v = re.sub(r"[^0-9a-f]", "", v)
    if len(v) == 3:
        v = "".join(c * 2 for c in v)
    if len(v) >= 6:
        try:
            return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))
        except ValueError:
            return None
    return None


def lum(rgb):
    return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255


def bg_class(v):
    """原始 bgcolor -> 統一色板 class；近白回 None。"""
    rgb = parse_color(v)
    if rgb is None:
        return None
    l = lum(rgb)
    if l < 0.45:
        return "cx-head"
    if l < 0.72:
        return "cx-band"
    if l < 0.94:
        return "cx-soft"
    return None


def font_class(v):
    """字色 -> 語意 class；黑白黃灰淡則繼承。"""
    rgb = parse_color(v)
    if rgb is None:
        return None
    r, g, b = rgb
    l = lum(rgb)
    if l > 0.85 or l < 0.12:
        return None
    if r > g * 1.35 and r > b * 1.35:
        return "hl-warn"
    if g > r * 1.15 and g > b * 1.15:
        return "hl-map"
    if b > r * 1.15 and b > g * 1.15:
        return "hl-info"
    if abs(r - g) < 30 and abs(g - b) < 30:
        return "hl-dim"
    if b > 150 and r > 80 and g < r:
        return "hl-info"
    return None

pages = {}      # path -> dict(id,title,cat,html,text)
queue = []
seen = set()
title_hint = {}

# Wayback 救回的官網圖片映射（原網址 -> site 相對路徑）
EXT_MAP = {}
_ext_file = ROOT / "ext_map.json"
if _ext_file.exists():
    EXT_MAP = json.loads(_ext_file.read_text(encoding="utf-8"))

DSPS_ABS = re.compile(r"^https?://dsps\.case\.eorz\.net/", re.I)


def norm_path(href, base_dir):
    href = href.strip().split("#")[0]
    href = DSPS_ABS.sub("", href)  # 指回原站的絕對網址視為站內路徑
    if not href or href.lower().startswith(("http:", "https:", "mailto:", "javascript:", "ftp:")):
        return None
    href = href.replace("\\", "/")
    q = ""
    if "?" in href:
        href, q = href.split("?", 1)
    try:
        p = str(PurePosixPath(base_dir, href)) if not href.startswith("/") else href.lstrip("/")
    except ValueError:
        return None
    parts = []
    for seg in p.split("/"):
        if seg == "..":
            if parts:
                parts.pop()
        elif seg not in ("", "."):
            parts.append(seg)
    p = "/".join(parts)
    if q:
        p += "__q_" + re.sub(r"[^A-Za-z0-9_.-]", "_", q)
    return p


def is_html_path(p):
    low = p.lower()
    return low.endswith((".htm", ".html")) or "__q_" in low or low.endswith(".php")


def excluded(p):
    low = p.lower()
    return any(low.startswith(x) for x in EXCLUDE_PREFIX)


def read_page(path):
    f = SITE / path
    if not f.exists():
        return None
    return f.read_bytes().decode("big5", errors="replace")


def page_id(path):
    return re.sub(r"[^a-z0-9]+", "-", path.lower()).strip("-")


def _tiny(v):
    try:
        return 0 < int(str(v).rstrip("px")) <= 12
    except (ValueError, TypeError):
        return False


def clean(soup_root, page_path, collect_links):
    """就地清洗；回傳發現的內部 html 連結 [(path, text)]。"""
    base_dir = str(PurePosixPath(page_path).parent)
    page_stem = PurePosixPath(page_path).stem.lower()
    found = []
    for c in soup_root.find_all(string=lambda s: isinstance(s, Comment)):
        c.extract()
    for t in soup_root.find_all(["script", "style", "link", "meta", "title", "base", "head", "iframe", "form", "input", "select", "option", "marquee", "bgsound", "embed", "object", "map"]):
        t.decompose()
    for t in soup_root.find_all(["center", "big", "small", "u", "tt"]):
        t.unwrap()
    # 逐格解算最終背景色（td 自身 > tr > table），色板 class 只掛儲存格；
    # 掛在 table/tr 會因 CSS color 繼承污染巢狀表格（曾造成白字白底）
    for cell in soup_root.find_all(["td", "th"]):
        bg = cell.get("bgcolor")
        if not bg:
            tr = cell.find_parent("tr")
            bg = tr.get("bgcolor") if tr else None
        if not bg:
            tb = cell.find_parent("table")
            bg = tb.get("bgcolor") if tb else None
        cls = bg_class(bg)
        if cls:
            cell["data-cx"] = cls
    for t in soup_root.find_all("font"):
        cls = font_class(t.get("color"))
        if cls:
            t.name = "span"
            t.attrs = {"class": cls}
        else:
            t.unwrap()
    img_index = 0
    for img in soup_root.find_all("img"):
        src = (img.get("src") or "").strip()
        if not src:
            img.decompose()
            continue
        # 外部圖：Wayback 救援映射，救不回的移除
        if re.match(r"^https?://", src, re.I) and not DSPS_ABS.match(src):
            rel = EXT_MAP.get(src) or EXT_MAP.get(src.replace("https://", "http://"))
            if rel and (SITE / rel).exists():
                img.attrs = {"src": "../" + rel, "loading": "lazy", "alt": ""}
                continue
            img.decompose()
            continue
        p = norm_path(src, base_dir)
        if p is None or not (SITE / p).exists() or (SITE / p).stat().st_size == 0:
            # 不存在或 0 位元組（原站即為壞檔）一律移除，不留破圖
            img.decompose()
            continue
        base = p.rsplit("/", 1)[-1].lower()
        # 同名版頭圖只砍「頁面第一張」；後面出現的同名圖視為內容（如 marry/2.htm 的步驟圖 2.gif）
        same_dir_banner = (
            img_index == 0
            and p.lower() == (base_dir + "/" if base_dir else "").lower() + page_stem + ".gif")
        img_index += 1
        if p in DECOR_PATHS or same_dir_banner or (_tiny(img.get("width")) or _tiny(img.get("height"))):
            img.decompose()
            continue
        img.attrs = {"src": "../" + p, "loading": "lazy", "alt": img.get("alt", "")}
    for a in soup_root.find_all("a"):
        # <a name="X"> 錨點：轉成帶 id 的 span，供頁內／跨頁定位
        nm = (a.get("name") or "").strip()
        if nm and not (a.get("href") or "").strip():
            a.name = "span"
            a.attrs = {"id": "anch-" + re.sub(r"[^\w-]", "_", nm)}
            continue
        href = (a.get("href") or "").strip()
        if not href or href.lower().startswith(("javascript:", "mailto:")):
            a.unwrap()
            continue
        if re.match(r"^https?://", href, re.I) and not DSPS_ABS.match(href):
            a.attrs = {"href": href, "target": "_blank", "rel": "noopener", "class": "ext"}
            continue
        frag = ""
        if "#" in href:
            href, frag = href.split("#", 1)
            frag = re.sub(r"[^\w-]", "_", frag.strip())
        if not href:
            # 同頁錨點連結：交給前端 data-anchor 捲動（頁面 id 在建置時未必可知）
            if frag:
                a.attrs = {"href": "#", "data-anchor": "anch-" + frag}
            else:
                a.unwrap()
            continue
        p = norm_path(href, base_dir)
        if p is None:
            a.unwrap()
            continue
        if is_html_path(p) and not excluded(p) and (SITE / p).exists():
            text = a.get_text(" ", strip=True)
            found.append((p, text))
            pid = page_id(p) + ("@anch-" + frag if frag else "")
            a.attrs = {"href": "#/p/" + pid, "data-pid": page_id(p)}
        elif (SITE / p).exists():
            a.attrs = {"href": "../" + p, "target": "_blank"}
        else:
            a.unwrap()
    # 剝除表現層屬性（data-cx 轉為 class）
    keep = {"a": {"href", "target", "rel", "class", "data-pid", "data-anchor"},
            "img": {"src", "loading", "alt"},
            "td": {"colspan", "rowspan", "data-cx"},
            "th": {"colspan", "rowspan", "data-cx"},
            "span": {"class", "id"}}
    for t in soup_root.find_all(True):
        allowed = keep.get(t.name, set())
        t.attrs = {k: v for k, v in t.attrs.items() if k in allowed}
        if "data-cx" in t.attrs:
            t["class"] = t.attrs.pop("data-cx")
    # 移除完全空白的表格列（原站用隱形文字／佔位圖排版的殘留）；留有錨點的列不砍
    for tr in soup_root.find_all("tr"):
        if not tr.find("img") and not tr.get_text(strip=True) and not tr.find(attrs={"id": True}):
            tr.decompose()
    transform_boss_tables(soup_root)
    if collect_links:
        return found
    return []


BOSS_LABELS = {"魔王名稱", "魔王等級", "HP", "屬性", "法術技能", "小嘍囉們", "掉落物品", "出現地點", "攻略心得"}
BOSS_ROW_ORDER = ["屬性", "法術技能", "小嘍囉們", "掉落物品", "出現地點", "攻略心得"]


def transform_boss_tables(root):
    """原站魔王資料表（label/value 巢狀表）→ 現代魔王檔案卡。"""
    for table in root.find_all("table"):
        if table.find_parent("table") is not None:
            continue
        tds = table.find_all("td")
        texts = [td.get_text(" ", strip=True) for td in tds]
        if "魔王名稱" not in texts:
            continue
        # 原站常缺 </td>，後續列會被吞進 value 格：value 取 label 的下一個 td，
        # 並把複本中被吞進來的巢狀列剝掉；同一 label 只取第一次出現。
        kv = {}
        for td in tds:
            t = td.get_text(" ", strip=True)
            if t in BOSS_LABELS and t not in kv:
                vtd = td.find_next("td")
                if vtd is None:
                    continue
                frag = BeautifulSoup(str(vtd), "html.parser").find("td")
                for sub in frag.find_all(["table", "tr", "td"]):
                    sub.decompose()
                kv[t] = frag.decode_contents().strip()
        img = table.find("img")
        name = re.sub(r"<[^>]+>", "", kv.get("魔王名稱", "")).strip() or "魔王"
        chips = ""
        if kv.get("魔王等級"):
            chips += '<span class="bc-chip">等級 ' + kv["魔王等級"] + "</span>"
        if kv.get("HP"):
            chips += '<span class="bc-chip hp">HP ' + kv["HP"] + "</span>"
        rows = "".join(
            '<div class="bc-row"><span class="bk">' + k + '</span><span class="bv">' + kv[k] + "</span></div>"
            for k in BOSS_ROW_ORDER if kv.get(k))
        h3cls = ' class="long"' if len(name) > 14 else ""
        html = ('<div class="boss-card"><div class="bc-img">' + (str(img) if img else "") +
                '</div><div class="bc-body"><div class="bc-head"><h3' + h3cls + ">" + name + "</h3>" + chips +
                '</div><div class="bc-kv">' + rows + "</div></div></div>")
        table.replace_with(BeautifulSoup(html, "html.parser"))


def frame_srcs(text):
    if "<frameset" not in text.lower():
        return None
    srcs = re.findall(r"<frame\b[^>]*src=['\"]?([^'\" >]+)", text, re.I)
    out, seen_f = [], set()
    for s in srcs:
        if s not in seen_f:
            seen_f.add(s)
            out.append(s)
    return out


BANNER_FRAMES = re.compile(r"(kkk|top|toppp|topp|count|p\d)\.htm$", re.I)


def build_article(path):
    """回傳 (html, text, links, title)；frameset 會串接內容框。"""
    text = read_page(path)
    if text is None:
        return None
    fs = frame_srcs(text)
    if fs:
        parts, links, title = [], [], None
        for s in fs:
            if BANNER_FRAMES.search(s):
                continue
            sub = norm_path(s, str(PurePosixPath(path).parent))
            if sub is None or excluded(sub) or not (SITE / sub).exists():
                continue
            r = build_article(sub)
            if r:
                h, tx, lk, tt = r
                parts.append('<div class="frame-part">' + h + "</div>")
                links.extend(lk)
                title = title or tt
        return "\n".join(parts), "", links, title
    soup = BeautifulSoup(text, "html.parser")
    tt = soup.title.get_text(strip=True) if soup.title else ""
    body = soup.body or soup
    links = clean(body, path, True)
    # 幻獸解析表格頁：整頁以結構化資料重製成卡片（連結照常收集供 BFS）
    if "幻獸解析" in text and "幻獸名" in text:
        mons, _mf = parse_blocks(text, path)
        if mons:
            gm = re.search(r"◆([^◆<>]{2,20})◆", text)
            group = gm.group(1).strip() if gm else ""
            html = monster_cards_html(mons, group)
            plain = " ".join(
                m["n"] + " " + "、".join(m["m"]) + " " + " ".join(m["d"]) +
                " " + "、".join(m["k"]) + " " + m["note"] for m in mons)
            return html, re.sub(r"\s+", " ", plain).strip(), links, (tt if tt.lower() not in GENERIC_TITLES else None)
    html = body.decode_contents() if body.name == "body" else str(body)
    plain = re.sub(r"\s+", " ", BeautifulSoup(html, "html.parser").get_text(" ")).strip()
    return html, plain, links, (tt if tt.lower() not in GENERIC_TITLES else None)


def collect():
    for ci, (cat, _desc, items) in enumerate(NAV):
        for label, entry in items:
            queue.append((entry, cat, label, True))
    while queue:
        path, cat, label, is_entry = queue.pop(0)
        if path in seen:
            continue
        seen.add(path)
        if excluded(path) or not is_html_path(path):
            continue
        r = build_article(path)
        if r is None:
            continue
        html, plain, links, tt = r
        if not plain and not html:
            continue
        title = label if is_entry else (
            TITLE_OVERRIDES.get(path) or title_hint.get(path) or tt or PurePosixPath(path).stem)
        if len(plain) < 2 and "<img" not in html and "<table" not in html:
            continue
        pages[path] = {"id": page_id(path), "path": path, "title": title,
                       "cat": cat, "entry": is_entry, "html": html, "text": plain}
        for p, anchor_text in links:
            if p not in seen:
                # 連結文字要含中英數才能當標題（排除「>>>」之類符號）
                if (anchor_text and p not in title_hint and 1 <= len(anchor_text) <= 30
                        and re.search(r"[\w\u4e00-\u9fff]", anchor_text)):
                    title_hint[p] = anchor_text
                queue.append((p, cat, None, False))


# ---------------------------------------------------------------- 幻獸解析
REGIONS = "主愛天國綠姆美桃糖"


def parse_monsters():
    monsters, fails = [], []
    sarea_files = ["sarea.htm"] + [f"sarea{i}.htm" for i in range(2, 10)]
    for ri, sf in enumerate(sarea_files):
        t = read_page(f"htm/huan/{sf}")
        if t is None:
            continue
        region = REGIONS[ri]
        for m in re.finditer(r"<a href=['\"]?([a-z0-9./]+)['\"]?\s+target=['\"]?aa['\"]?[^>]*>(?:<font[^>]*>)?([^<]+)", t, re.I):
            fname, elem = m.group(1), m.group(2).strip()
            if "說明" in elem:
                continue
            dp = f"htm/huan/{fname}"
            dt = read_page(dp)
            if dt is None:
                continue
            mons, mf = parse_blocks(dt, dp)
            fails.extend(mf)
            for mon in mons:
                mon["e"] = elem
                mon["r"] = region
                mon["src"] = page_id(dp)
                monsters.append(mon)
    return monsters, fails


def parse_blocks(dt, dp):
    """從一頁原始 HTML 解析幻獸解析區塊，回傳 (幻獸列表, 失敗)。"""
    mons, fails = [], []
    for block in re.split(r"(?=<TR><TD width=\"23%\")", dt, flags=re.I):
        mm = re.search(
            r"<font color=green>(.*?)</font>\s*<BR><img src=['\"]?([^ '\">]+\.gif)['\"]?>\s*<BR>([^<]+)<TD>",
            block, re.I | re.S)
        if not mm:
            continue
        maps = [x.strip() for x in re.split(r"<br\s*/?>", mm.group(1), flags=re.I) if x.strip()]
        img_rel = norm_path(mm.group(2), str(PurePosixPath(dp).parent))
        name = mm.group(3).strip()
        # 欄內可能有 <BR>（多段等級/數值），先壓平再抓
        flat = re.sub(r"<br\s*/?>", "／", block, flags=re.I)
        rows = re.findall(
            r"<TR align=center><TD>([^<]*)<td>([^<]*)<td>([^<]*)<TD>([^<]*)<TD>([^<]*)",
            flat, re.I)
        stats = {}
        if len(rows) >= 2:
            a, b = rows[0], rows[1]
            stats = {"偏向": a[0].strip(), "等級": a[1].strip(), "力量": a[2].strip(),
                     "體質": a[3].strip(), "敏捷": a[4].strip(),
                     "技能數": b[0].strip(), "生命": b[1].strip(), "智慧": b[2].strip(),
                     "幸運": b[3].strip(), "魅力": b[4].strip()}
        dm = re.search(r"掉寶資料：(?:</font>)?<P>(.*?)</table>", block, re.I | re.S)
        drops = []
        if dm:
            drops = [x for x in re.sub(r"<[^>]+>", " ", dm.group(1)).split() if x]
        sm = re.search(r"可學技能\s*[:：]\s*([^<]+)", block, re.I)
        skills = [x.strip() for x in re.split(r"[、,，]", sm.group(1))] if sm else []
        rm = re.search(r"備註：</b>(.*?)</td>", block, re.I | re.S)
        remark = re.sub(r"<[^>]+>", "", rm.group(1)).strip() if rm else ""
        if not name or not stats:
            fails.append((dp, name))
            continue
        mons.append({
            "n": name, "m": maps, "img": "../" + (img_rel or ""), "s": stats,
            "d": drops, "k": [s for s in skills if s], "note": remark,
        })
    return mons, fails


MC_STATS = ["力量", "體質", "敏捷", "智慧", "幸運", "魅力", "生命"]


def known(v):
    """數值是否為有效資料（原站以 ?/？ 標示未收錄）。"""
    v = (v or "").strip()
    return "" if not v or re.fullmatch(r"[?？\s／]+", v) else v


def monster_cards_html(mons, group=""):
    """幻獸解析頁重製：結構化資料 → 現代幻獸卡。"""
    head = (group + "．" if group else "") + ("本頁 %d 隻幻獸已重新結構化排版。" % len(mons))
    out = ['<p class="lead">' + head + "「資料不足」表示原站當年未收錄該數值。</p>"]
    for m in mons:
        s = m["s"]
        badges = (['<span class="badge">%s系</span>' % m["e"]] if m.get("e") else [])
        if known(s.get("偏向")):
            badges.append('<span class="badge">%s偏向</span>' % s["偏向"])
        if known(s.get("等級")):
            badges.append('<span class="badge">出現等級 %s</span>' % s["等級"])
        if known(s.get("技能數")):
            badges.append('<span class="badge">技能 %s</span>' % s["技能數"])
        stats = "".join(
            '<div class="ms"><b>%s</b><i>%s</i></div>'
            % (known(s.get(k)) or '<span class="nd">資料不足</span>', k)
            for k in MC_STATS)
        parts = ""
        if m["m"]:
            parts += '<div class="mc-line"><span class="lk">出沒</span><span>' + "、".join(m["m"]) + "</span></div>"
        if m["d"]:
            parts += ('<div class="mc-line"><span class="lk">掉寶</span><span>' +
                      "".join('<span class="chip">%s</span>' % d for d in m["d"]) + "</span></div>")
        if m["k"]:
            parts += '<div class="mc-line"><span class="lk">可學技能</span><span>' + "、".join(m["k"]) + "</span></div>"
        if m["note"]:
            parts += '<p class="mc-note">%s</p>' % m["note"]
        out.append(
            '<section class="mcard"><header class="mc-head"><img src="%s" loading="lazy" alt="">'
            '<div><h3>%s</h3><div class="mc-badges">%s</div></div></header>'
            '<div class="mc-stats">%s</div>%s</section>'
            % (m["img"], m["n"], "".join(badges), stats, parts))
    return "\n".join(out)


# ---------------------------------------------------------------- 輸出
def emit():
    OUT.mkdir(parents=True, exist_ok=True)
    monsters, fails = parse_monsters()
    nav_data = []
    for cat, desc, items in NAV:
        nav_data.append({
            "cat": cat, "desc": desc,
            "items": [{"t": t, "id": page_id(p)} for t, p in items if p in pages],
        })
    arts = list(pages.values())
    meta = {"nav": nav_data,
            "counts": {"articles": len(arts)},
            "pages": [{"id": a["id"], "t": a["title"], "c": a["cat"]} for a in arts]}
    (OUT / "data-nav.js").write_text(
        "window.__META=" + json.dumps(meta, ensure_ascii=False) + ";",
        encoding="utf-8")
    # 文章分塊
    chunks = {}
    for a in arts:
        chunks.setdefault(a["cat"], []).append(a)
    files = []
    for i, (cat, items) in enumerate(chunks.items()):
        fn = f"data-a{i}.js"
        payload = [{"id": x["id"], "t": x["title"], "c": x["cat"],
                    "h": x["html"], "x": x["text"]} for x in items]
        (OUT / fn).write_text(
            "window.__ART.push(" + json.dumps(payload, ensure_ascii=False) + ");",
            encoding="utf-8")
        files.append(fn)
    (OUT / "data-monsters.js").write_text(
        "window.__MON=" + json.dumps(monsters, ensure_ascii=False) + ";",
        encoding="utf-8")
    # App 靜態檔
    for f in APP.iterdir():
        shutil.copy2(f, OUT / f.name)
    # index.html 注入資料檔清單
    idx = (OUT / "index.html").read_text(encoding="utf-8")
    tags = "".join(f'<script src="{fn}"></script>' for fn in files)
    idx = idx.replace("<!--DATA_CHUNKS-->", tags)
    (OUT / "index.html").write_text(idx, encoding="utf-8")
    print(f"articles={len(arts)} monsters={len(monsters)} monster_parse_fail={len(fails)}")
    sizes = sum(f.stat().st_size for f in OUT.glob("data-*.js"))
    print(f"data size = {sizes/1048576:.1f} MB, chunks={len(files)}")
    for f, n in fails[:10]:
        print("  fail:", f, n)


if __name__ == "__main__":
    collect()
    print("collected pages:", len(pages))
    emit()
