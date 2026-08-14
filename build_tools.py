# -*- coding: utf-8 -*-
"""解析 data/童话资料.xlsx（玩家整理的 23 分頁攻略數據）為結構化資料，
簡轉繁後輸出 app/data-tools.js，供典藏版「數據寶典」各互動頁使用。

跑法：python build_tools.py  →  之後跑 python build_modern.py 會一併複製進 site/modern/。
"""
import json
import sys
from pathlib import Path

import openpyxl
from opencc import OpenCC

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
ROOT = Path(__file__).parent
SRC = ROOT / "data" / "童话资料.xlsx"
OUT = ROOT / "app" / "data-tools.js"
CC = OpenCC("s2t")


def t(v):
    """cell → 繁體字串（None → ''）。"""
    if v is None:
        return ""
    s = str(v).strip()
    return CC.convert(s) if s else ""


def load():
    wb = openpyxl.load_workbook(SRC, data_only=True)
    return {ws.title: [[t(c) for c in row] for row in ws.iter_rows(values_only=True)]
            for ws in wb.worksheets}


def cell(rows, r, c):
    if r < len(rows) and c < len(rows[r]):
        return rows[r][c]
    return ""


# ---------------------------------------------------------------- 各分頁解析
def parse_obgem(rows):
    out = []
    for r in range(1, len(rows)):
        for c in (0, 3, 6):
            g, s = cell(rows, r, c), cell(rows, r, c + 1)
            if g and s:
                out.append([g, s])
    return out


SKILL_COLS = ["強化", "恢復", "連擊", "豬頭", "裝死", "賜福", "威脅", "轉換",
              "吸血", "推車", "犧牲", "亡命一擊", "魔法技能", "拉拉舞", "三連擊", "吸魂術"]


def parse_skills(rows):
    out, exp = [], ""
    for r in range(2, len(rows)):
        name = cell(rows, r, 1)
        if not name:
            continue
        if cell(rows, r, 0):
            exp = cell(rows, r, 0)
        marks = [1 if cell(rows, r, 4 + i) else 0 for i in range(16)]
        out.append({"e": exp, "n": name, "g": cell(rows, r, 2),
                    "d": cell(rows, r, 3), "s": marks})
    return out


def parse_toys(rows, stat_rows):
    lvmap = {}
    for r in range(2, len(stat_rows)):
        name, lv = cell(stat_rows, r, 0), cell(stat_rows, r, 8)
        if name and lv:
            lvmap[name] = lv
    out = []
    for r in range(2, len(rows)):
        name = cell(rows, r, 0)
        if not name:
            continue
        out.append({"n": name, "sp": cell(rows, r, 1), "mat": cell(rows, r, 2),
                    "card": cell(rows, r, 3), "doll": cell(rows, r, 4),
                    "dmax": cell(rows, r, 5), "amax": cell(rows, r, 6),
                    "lv": lvmap.get(name, "")})
    return out


def parse_drops3(rows):
    """特殊物品 / 原石：3 欄組（產物、幻獸、地點），合併儲存格向下補。"""
    items = []          # [{n, src:[[monster,[locs]],...]}]
    cur = [None, None, None]   # 每個 panel 目前 item
    curmon = [None, None, None]
    for r in range(2, len(rows)):
        for p, base in enumerate((0, 3, 6)):
            it, mon, loc = cell(rows, r, base), cell(rows, r, base + 1), cell(rows, r, base + 2)
            if it:
                cur[p] = {"n": it, "src": []}
                curmon[p] = None
                items.append(cur[p])
            if cur[p] is None:
                continue
            if mon:
                curmon[p] = [mon, []]
                cur[p]["src"].append(curmon[p])
            if loc and curmon[p] is not None:
                curmon[p][1].append(loc)
    return items


def parse_expansion(rows):
    out, cur = [], None
    for r in range(2, len(rows)):
        exp, area = cell(rows, r, 0), cell(rows, r, 1)
        lv, elem, drop, mons = (cell(rows, r, 2), cell(rows, r, 3),
                                cell(rows, r, 4), cell(rows, r, 5))
        if exp:
            cur = {"n": exp, "areas": []}
            out.append(cur)
        if cur is None:
            continue
        if area:
            cur["areas"].append({"a": area, "lv": lv, "e": elem, "d": drop, "m": mons})
        elif cur["areas"]:
            last = cur["areas"][-1]
            if lv:
                last["lv"] += "、" + lv
            if elem:
                last["e"] += "、" + elem
            if drop:
                last["d"] += "、" + drop
            if mons:
                last["m"] += "、" + mons
    return out


def parse_gather(rows):
    """基本技能：兩排、各三個 panel（技能名在 panel 首欄的標題列）。"""
    out = {}
    r = 0
    while r < len(rows):
        row = rows[r]
        heads = []
        for base in (0, 4, 8):
            h = cell(rows, r, base)
            if h in ("伐木", "挖礦", "釣魚", "狩獵", "採集", "農事"):
                heads.append((base, h))
        if len(heads) >= 2:
            panels = {h: [] for _, h in heads}
            rr = r + 1
            while rr < len(rows):
                row2 = rows[rr]
                if any(cell(rows, rr, b) in ("伐木", "挖礦", "釣魚", "狩獵", "採集", "農事") for b in (0, 4, 8)):
                    break
                if not any(x for x in row2):
                    # 允許一列空白（排版留白），連兩列空白就結束
                    if rr + 1 < len(rows) and not any(x for x in rows[rr + 1]):
                        break
                    rr += 1
                    continue
                for base, h in heads:
                    name, lv, loc = cell(rows, rr, base), cell(rows, rr, base + 1), cell(rows, rr, base + 2)
                    lst = panels[h]
                    if name:
                        lst.append({"n": name, "lv": lv, "loc": []})
                    if loc and lst:
                        lst[-1]["loc"].append(loc)
                rr += 1
            out.update(panels)
            r = rr
        else:
            r += 1
    return out


def parse_craft(rows):
    """進階技能：col0 群組、col1 成品、col2 等級、材料對×3、col9/10 效果。"""
    out, cur = [], None
    for r in range(1, len(rows)):
        grp, name = cell(rows, r, 0), cell(rows, r, 1)
        if grp:
            cur = {"n": grp, "items": []}
            out.append(cur)
        if cur is None or not name:
            continue
        mats = []
        for base in (3, 5, 7):
            mn, mq = cell(rows, r, base), cell(rows, r, base + 1)
            if mn:
                mats.append([mn, mq])
        eff = [x for x in (cell(rows, r, 9), cell(rows, r, 10)) if x and x != "/"]
        cur["items"].append({"n": name, "lv": cell(rows, r, 2), "m": mats, "fx": "／".join(eff)})
    return out


def parse_equipment(rows):
    """武器 / 防具：左右兩個 panel（0..8 與 10..18），分類列 + 特殊屬性分隔列。"""
    cats = []
    cur = [None, None]      # panel 0 / 1
    special = [False, False]
    for r in range(1, len(rows)):
        for p, base in enumerate((0, 10)):
            catname = cell(rows, r, base)
            name, lv = cell(rows, r, base + 1), cell(rows, r, base + 2)
            if catname:
                cur[p] = {"n": catname, "items": []}
                special[p] = False
                cats.append(cur[p])
            if cur[p] is None or not name:
                continue
            if name.startswith("有特殊屬性"):
                special[p] = True
                continue
            if not lv:
                continue
            mats = []
            for mb in (base + 3, base + 5, base + 7):
                mn, mq = cell(rows, r, mb), cell(rows, r, mb + 1)
                if mn and mq and not str(mq).replace("*", "").replace(".", "").isdigit() is False:
                    mats.append([mn, mq])
                elif mn:
                    mats.append([mn, mq])
            cur[p]["items"].append({"n": name, "lv": lv, "m": mats, "sp": 1 if special[p] else 0})
    return [c for c in cats if c["items"]]


def parse_locations(rows):
    skills, titles = [], []
    mode = "skill"
    curskill = None
    for r in range(1, len(rows)):
        c0 = cell(rows, r, 0)
        if c0 == "職業頭銜":
            mode = "title"
            continue
        if c0 in ("技能名稱", "所需等級", "相關地點") or c0 == "所需等級":
            continue
        if mode == "skill":
            if c0.startswith("所需等") or c0 == "技能名稱":
                continue
            if c0:
                curskill = {"n": c0, "learn": [cell(rows, r, 1)], "mat": cell(rows, r, 2),
                            "work": cell(rows, r, 3), "guild": cell(rows, r, 4)}
                skills.append(curskill)
            elif curskill and cell(rows, r, 1):
                curskill["learn"].append(cell(rows, r, 1))
        else:
            if c0.lower().startswith("lv"):
                titles.append([c0, cell(rows, r, 1), cell(rows, r, 2)])
    return {"skills": skills, "titles": titles}


def parse_attrs(rows):
    out, cur = [], None
    for r in range(2, len(rows)):
        grp, name = cell(rows, r, 0), cell(rows, r, 1)
        if grp:
            cur = {"n": grp, "items": []}
            out.append(cur)
        if cur is None or not name:
            continue
        fx = []
        for base in (4, 6, 8, 10):
            e, v = cell(rows, r, base), cell(rows, r, base + 1)
            if e and e != "/":
                fx.append([e, v])
        cur["items"].append({"n": name, "lv": cell(rows, r, 2),
                             "cnt": cell(rows, r, 3), "fx": fx})
    return out


def parse_process(rows):
    head = [c for c in rows[1] if c]
    data = []
    for r in range(2, len(rows)):
        if not cell(rows, r, 0):
            continue
        data.append([cell(rows, r, c) for c in range(len(head) + 1)])
    return {"head": head, "rows": data}


def parse_refine(rows):
    out = []
    for r in range(2, len(rows)):
        if cell(rows, r, 0):
            out.append([cell(rows, r, c) for c in range(4)])
    return out[1:] if out and out[0][0] == "種類" else out


def parse_cart(rows):
    out, cur = [], None
    for r in range(2, len(rows)):
        tier, name = cell(rows, r, 0), cell(rows, r, 1)
        if tier:
            cur = {"n": tier, "req": "", "place": "", "fee": "", "items": []}
            out.append(cur)
        if cur is None or not name:
            continue
        if cell(rows, r, 13):
            cur["req"] = cell(rows, r, 13)
        if cell(rows, r, 14):
            cur["place"] = cell(rows, r, 14).replace("\\n", "").strip()
        if cell(rows, r, 15):
            cur["fee"] = cell(rows, r, 15)
        mats = []
        for base in (2, 4, 6, 8, 10):
            mn, mq = cell(rows, r, base), cell(rows, r, base + 1)
            if mn:
                mats.append([mn, mq])
        cur["items"].append({"n": name, "m": mats, "buff": cell(rows, r, 12)})
    return out


def parse_family(rows):
    levels = []
    cur = [None, None]
    curcard = [None, None]
    for r in range(2, len(rows)):
        for p, base in enumerate((0, 6)):
            lvl = cell(rows, r, base)
            card, clv, loc, feat = (cell(rows, r, base + 1), cell(rows, r, base + 2),
                                    cell(rows, r, base + 3), cell(rows, r, base + 4))
            if lvl:
                cur[p] = {"n": lvl, "feat": "", "cards": []}
                curcard[p] = None
                levels.append(cur[p])
            if cur[p] is None:
                continue
            if feat and not cur[p]["feat"]:
                cur[p]["feat"] = feat
            if card:
                curcard[p] = {"n": card, "lv": clv, "loc": []}
                cur[p]["cards"].append(curcard[p])
            if loc and curcard[p] is not None:
                curcard[p]["loc"].append(loc)
    order = "一二三四五六七八九十"
    def key(x):
        for i, ch in enumerate(order):
            if ("第" + ch) in x["n"]:
                return i
        return 99
    return sorted(levels, key=key)


def parse_growth(rows):
    head = [cell(rows, 1, c) for c in range(1, 8)]
    data = []
    for r in range(2, len(rows)):
        if cell(rows, r, 0):
            data.append([cell(rows, r, c) for c in range(8)])
    return {"head": head, "rows": data}


def parse_monid(rows):
    out = {}
    for r in range(2, len(rows)):
        for c in range(0, 16, 2):
            num, name = cell(rows, r, c), cell(rows, r, c + 1)
            if num and name and num.isdigit():
                out[int(num)] = name
    return [[k, v] for k, v in sorted(out.items())]


def parse_playground(rows):
    prizes, cur = [], [None, None]
    started = False
    for r in range(len(rows)):
        if cell(rows, r, 0) == "獎品設置":
            started = True
        if not started:
            continue
        for p, base in enumerate((1, 3)):
            tier, item = cell(rows, r, base), cell(rows, r, base + 1)
            if tier:
                cur[p] = {"n": tier, "items": []}
                prizes.append(cur[p])
            if item and cur[p] is not None:
                cur[p]["items"].append(item)
    return prizes


def parse_turnorder(rows):
    tiers, cur = [], None
    for r in range(2, len(rows)):
        c0, c1 = cell(rows, r, 0), cell(rows, r, 1)
        if c0 and c0.isdigit():
            cur = {"o": int(c0), "k": c1, "s": []}
            tiers.append(cur)
        if cur is None:
            continue
        for base in (2, 4, 6, 8, 10):
            job, sk = cell(rows, r, base), cell(rows, r, base + 1)
            if job and sk:
                cur["s"].append([job, sk])
    return tiers


# ---------------------------------------------------------------- 主流程
def main():
    sheets = load()
    data = {
        "obgem": parse_obgem(sheets["OB技能"]),
        "skills": parse_skills(sheets["幻兽技能"]),
        "skillCols": SKILL_COLS,
        "toys": parse_toys(sheets["幻兽玩具"], sheets["玩具统计"]),
        "dropSpecial": parse_drops3(sheets["特殊物品"]),
        "dropOre": parse_drops3(sheets["原石"]),
        "dropExp": parse_expansion(sheets["资料片"]),
        "gather": parse_gather(sheets["基本技能"]),
        "craft": parse_craft(sheets["进阶技能"]),
        "weapons": parse_equipment(sheets["武器"]),
        "armor": parse_equipment(sheets["防具"]),
        "loc": parse_locations(sheets["相关地点"]),
        "attrs": parse_attrs(sheets["特殊属性"]),
        "process": parse_process(sheets["武器加工"]),
        "refine": parse_refine(sheets["武器精炼"]),
        "cart": parse_cart(sheets["推车"]),
        "family": parse_family(sheets["家族"]),
        "growth": parse_growth(sheets["成长偏向"]),
        "monid": parse_monid(sheets["幻兽序号"]),
        "playground": parse_playground(sheets["游乐场"]),
        "turnorder": parse_turnorder(sheets["出手顺序"]),
    }
    OUT.write_text("window.__TOOLS=" + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";",
                   encoding="utf-8")
    print("written", OUT, f"{OUT.stat().st_size/1024:.0f} KB")
    # 摘要
    print("obgem", len(data["obgem"]), "| skills", len(data["skills"]),
          "| toys", len(data["toys"]), "| dropSpecial", len(data["dropSpecial"]),
          "| dropOre", len(data["dropOre"]), "| dropExp", len(data["dropExp"]))
    print("gather", {k: len(v) for k, v in data["gather"].items()})
    print("craft", [(g["n"], len(g["items"])) for g in data["craft"]])
    print("weapons", [(g["n"], len(g["items"])) for g in data["weapons"]])
    print("armor", [(g["n"], len(g["items"])) for g in data["armor"]])
    print("loc skills", len(data["loc"]["skills"]), "titles", len(data["loc"]["titles"]))
    print("attrs", [(g["n"], len(g["items"])) for g in data["attrs"]])
    print("process rows", len(data["process"]["rows"]), "cols", len(data["process"]["head"]))
    print("refine", len(data["refine"]), "| cart", [(g["n"], len(g["items"])) for g in data["cart"]])
    print("family", [(g["n"], len(g["cards"])) for g in data["family"]])
    print("growth", len(data["growth"]["rows"]), "| monid", len(data["monid"]),
          "| playground", [(g["n"], len(g["items"])) for g in data["playground"]],
          "| turnorder", len(data["turnorder"]))


if __name__ == "__main__":
    main()
