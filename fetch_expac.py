# -*- coding: utf-8 -*-
"""鏡像九個資料片官方網頁（fairyland.lager.com.tw）到 site/lager/。

- HTML 只在各資料片路徑範圍內遞迴（避免爬到整個官網）；資源檔（圖/CSS/JS/SWF）不限路徑。
- .shtml 的 SSI 已由對方伺服器解析，抓到的就是成品。
- 站內絕對網址改寫為 /lager/ 前綴；其餘保留原始位元組。
"""
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path, PurePosixPath

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HOST = "https://fairyland.lager.com.tw/"
DEST = Path("site/lager")
ENTRIES = [
    "12update/mermaid/", "12update/Alice/", "12update/Night/index.shtml",
    "12update/king/index.htm", "27-the_wizard_of_oz/01-land.shtml",
    "35_thumbelina/index.htm", "12update/bandb/",
    "12update/momotao/index/index.htm", "12update/candyshop/",
]
SCOPES = ("12update/mermaid", "12update/Alice", "12update/Night",
          "12update/king", "27-the_wizard_of_oz", "35_thumbelina",
          "12update/bandb", "12update/momotao", "12update/candyshop")
HTML_EXT = (".htm", ".html", ".shtml", ".asp", ".php", "")
ASSET_RE = re.compile(
    r"""(?:href|src|background|value)\s*=\s*["']?([^"'<> ]+)|url\(["']?([^"')]+)""", re.I)

seen, q = set(), []
ok = fail = 0


def fetch(url):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0", "Referer": HOST})
    return urllib.request.urlopen(req, timeout=30).read()


def fetch_path(path):
    """UTF-8 編碼優先，404 再試 Big5（原站少數中文檔名是 Big5 編碼，如 間距.gif）。"""
    try:
        return fetch(HOST + urllib.parse.quote(path, safe="/.-_~"))
    except Exception:
        return fetch(HOST + urllib.parse.quote(path.encode("big5"), safe="/.-_~"))


def norm(ref, base):
    """回傳 host 相對路徑；站外或錨點回 None。"""
    ref = ref.strip().replace("\\", "/")
    if not ref or ref.startswith(("#", "mailto:", "javascript:", "data:")):
        return None
    if ref.lower().startswith(("http://", "https://")):
        u = urllib.parse.urlparse(ref)
        if u.netloc.lower() != "fairyland.lager.com.tw":
            return None
        ref = u.path.lstrip("/")
        return urllib.parse.unquote(ref.split("#")[0].split("?")[0])
    ref = ref.split("#")[0].split("?")[0]
    if not ref:
        return None
    joined = urllib.parse.urljoin("https://x/" + base, ref)
    return urllib.parse.unquote(urllib.parse.urlparse(joined).path.lstrip("/"))


def is_html(path):
    return PurePosixPath(path).suffix.lower() in (".htm", ".html", ".shtml") or path.endswith("/")


def in_scope(path):
    return any(path.startswith(s) for s in SCOPES)


def local_path(path):
    if path.endswith("/") or path == "":
        path += "index.html"
    return DEST / path


for e in ENTRIES:
    q.append(e)

while q:
    path = q.pop(0)
    if path in seen:
        continue
    seen.add(path)
    lp = local_path(path)
    try:
        data = fetch_path(path)
        ok += 1
    except Exception as ex:
        print("FAIL", path, ex)
        fail += 1
        continue
    if is_html(path):
        base = path + ("index.html" if path.endswith("/") else "")
        # 先抽連結（改寫前，否則絕對網址會變成錯的相對路徑），再改寫存檔
        text = data.decode("big5", "replace")
        data = data.replace(b"https://fairyland.lager.com.tw/", b"/lager/")
        data = data.replace(b"http://fairyland.lager.com.tw/", b"/lager/")
        for m in ASSET_RE.finditer(text):
            ref = m.group(1) or m.group(2)
            p = norm(ref, base)
            if p is None or p in seen:
                continue
            if is_html(p):
                if in_scope(p):
                    q.append(p)
            else:
                q.append(p)
    lp.parent.mkdir(parents=True, exist_ok=True)
    lp.write_bytes(data)
    time.sleep(0.1)

swfs = list(DEST.rglob("*.swf"))
total = sum(f.stat().st_size for f in DEST.rglob("*") if f.is_file())
print(f"ok={ok} fail={fail} files={sum(1 for f in DEST.rglob('*') if f.is_file())} "
      f"swf={len(swfs)} total={total/1048576:.1f}MB")
