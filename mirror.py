# -*- coding: utf-8 -*-
"""Mirror dsps.case.eorz.net (Big5 frameset site) for offline browsing.

- Downloads same-host pages/assets recursively starting from index8.htm.
- Keeps original bytes (Big5) untouched; link discovery is done on a
  decoded copy but files are saved as-is so encoding is preserved.
- Saves under ./site/ preserving the server path structure.
"""
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HOST = "dsps.case.eorz.net"
BASE = f"https://{HOST}/"
OUT = Path(__file__).parent / "site"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OfflineArchiver/1.0"

HTML_EXT = {".htm", ".html", ".asp", ".php", ""}
ATTR_RE = re.compile(
    r"""(?:src|href|background|action)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))""",
    re.IGNORECASE,
)
CSS_URL_RE = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", re.IGNORECASE)
META_REFRESH_RE = re.compile(r"""content\s*=\s*["'][^"']*url=([^"'>\s]+)""", re.IGNORECASE)

queued = set()
failed = []


def norm(url: str, base_url: str):
    url = url.strip()
    if not url or url.startswith(("#", "javascript:", "mailto:", "data:")):
        return None
    absu = urllib.parse.urljoin(base_url, url)
    absu = absu.split("#", 1)[0]
    p = urllib.parse.urlparse(absu)
    if p.scheme not in ("http", "https") or p.netloc.lower() != HOST:
        return None
    return absu


def local_path(url: str) -> Path:
    p = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(p.path)
    if path.endswith("/") or path == "":
        path += "index.html"
    rel = path.lstrip("/")
    if p.query:
        safe_q = re.sub(r"[^A-Za-z0-9_.-]", "_", p.query)
        rel += "__q_" + safe_q
    return OUT / rel


def fetch(url: str):
    # 站方有 Referer 防盜連檢查，需帶站內 Referer 才能取得圖片
    req = urllib.request.Request(
        url, headers={"User-Agent": UA, "Referer": BASE + "index8.htm"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read(), r.headers.get("Content-Type", "")


def extract_links(data: bytes, url: str, ctype: str):
    links = []
    is_html = "html" in ctype or Path(urllib.parse.urlparse(url).path).suffix.lower() in (".htm", ".html")
    is_css = "css" in ctype or url.lower().endswith(".css")
    if not (is_html or is_css):
        return links
    text = data.decode("big5", errors="replace")
    if is_html:
        for m in ATTR_RE.finditer(text):
            links.append(m.group(1) or m.group(2) or m.group(3))
        for m in META_REFRESH_RE.finditer(text):
            links.append(m.group(1))
        links += CSS_URL_RE.findall(text)  # inline styles
    if is_css:
        links += CSS_URL_RE.findall(text)
    out = []
    for l in links:
        n = norm(l, url)
        if n:
            out.append(n)
    return out


def main():
    start = norm("index8.htm", BASE)
    todo = [start]
    queued.add(start)
    done = 0
    while todo:
        url = todo.pop(0)
        dest = local_path(url)
        try:
            if dest.exists():
                data = dest.read_bytes()
                ctype = ""
            else:
                data, ctype = fetch(url)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(data)
                time.sleep(0.05)
            done += 1
            if done % 25 == 0:
                print(f"[{done}] downloaded, queue={len(todo)}", flush=True)
            for link in extract_links(data, url, ctype):
                if link not in queued:
                    queued.add(link)
                    todo.append(link)
        except Exception as e:
            failed.append((url, str(e)))
            print(f"FAIL {url}: {e}", flush=True)
    print(f"DONE total={done} failed={len(failed)}")
    if failed:
        (OUT.parent / "mirror-failed.txt").write_text(
            "\n".join(f"{u}\t{e}" for u, e in failed), encoding="utf-8"
        )


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
