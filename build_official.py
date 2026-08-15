# -*- coding: utf-8 -*-
"""官方誌收納：把官方公告截圖壓縮進 site/official/，並產 app/data-official.js。

來源資料夾結構（預設 incoming/taitong，之後有新公告丟同結構資料夾重跑即可）：
    资料片介绍/*.jpg  官方活动玩法/*.jpg  新功能以及调整/*.jpg
檔名即標題（會做簡轉繁與符號清理）。輸出檔名取 MD5 前 8 碼，內容不變則檔名不變。
"""
import hashlib
import json
import re
import sys
from pathlib import Path

from PIL import Image
from opencc import OpenCC

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "incoming/taitong")
DEST = Path("site/official")
DEST.mkdir(exist_ok=True)
CC = OpenCC("s2twp")

GROUPS = [  # (來源資料夾, 群組代號, 顯示名)
    ("资料片介绍", "exp", "資料片介紹"),
    ("官方活动玩法", "act", "官方活動玩法"),
    ("新功能以及调整", "sys", "新功能與調整"),
]
MAX_W = 1000
QUALITY = 80


def tidy_title(stem):
    t = CC.convert(stem)
    t = re.sub(r"[_]+", " ", t).strip()
    t = re.sub(r"[。．.]$", "", t)
    return t


data = {"groups": []}
total_in = total_out = 0
for folder, gid, gname in GROUPS:
    items = []
    for f in sorted((SRC / folder).glob("*.jpg")):
        raw = f.read_bytes()
        h = hashlib.md5(raw).hexdigest()[:8]
        out = DEST / f"{gid}-{h}.jpg"
        im = Image.open(f)
        if im.mode != "RGB":
            im = im.convert("RGB")
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        im.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        total_in += len(raw)
        total_out += out.stat().st_size
        items.append({"f": out.name, "t": tidy_title(f.stem),
                      "w": im.width, "h": im.height})
    data["groups"].append({"id": gid, "name": gname, "items": items})
    print(f"{gname}: {len(items)} 張")

Path("app/data-official.js").write_text(
    "window.__OFFICIAL=" + json.dumps(data, ensure_ascii=False) + ";",
    encoding="utf-8")
print(f"in {total_in/1048576:.1f} MB -> out {total_out/1048576:.1f} MB")
