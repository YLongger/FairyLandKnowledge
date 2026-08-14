# -*- coding: utf-8 -*-
"""Offline viewer launcher for the mirrored dsps.case.eorz.net site.

Serves site.zip contents directly from memory over a local HTTP server,
then opens the default browser. No files are extracted to disk.
"""
import mimetypes
import re
import socket
import sys
import threading
import urllib.parse
import webbrowser
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

APP_TITLE = "FairyLand Archive Modern Viewer"
START_PAGE = "/modern/index.html"


def resource_path(name: str) -> Path:
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    return base / name


ZF = zipfile.ZipFile(resource_path("site.zip"))
NAMES = set(ZF.namelist())
LOCK = threading.Lock()

mimetypes.add_type("text/html", ".htm")
mimetypes.add_type("image/gif", ".gif")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("application/javascript", ".js")


def lookup(path: str, query: str):
    """Map a request path (+query) to a zip entry name, mirroring mirror.py."""
    rel = urllib.parse.unquote(path).lstrip("/")
    if rel == "" or rel.endswith("/"):
        cands = [rel + "index.html", rel + "index8.htm", rel + "index.htm"]
    else:
        cands = [rel]
        # 原站部分頁面以查詢字串區分，鏡像時存成 __q_ 後綴檔
        if query:
            safe_q = re.sub(r"[^A-Za-z0-9_.-]", "_", query)
            cands.insert(0, rel + "__q_" + safe_q)
    for c in cands:
        if c in NAMES:
            return c
    return None


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ("", "/"):
            self.send_response(302)
            self.send_header("Location", START_PAGE)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        entry = lookup(parsed.path, parsed.query)
        if entry is None:
            body = b"<html><body><h3>404 Not Found (offline archive)</h3></body></html>"
            self.send_response(404)
            self.send_header("Content-Type", "text/html")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        with LOCK:
            data = ZF.read(entry)
        ctype = mimetypes.guess_type(entry)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "max-age=3600")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        pass


def main():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}{START_PAGE}"
    print(f"{APP_TITLE}")
    print(f"Serving at: {url}")
    print("Close this window to exit. / Guan bi ci chuang kou ji ke tui chu.")
    threading.Timer(0.3, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

