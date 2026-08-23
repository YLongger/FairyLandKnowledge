# -*- coding: utf-8 -*-
"""Offline viewer for the standalone FairyLand world map.

Serves atlas_site.zip (fallback: site.zip) from memory on 127.0.0.1
(random port), then opens the default browser. Nothing is extracted to disk.
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

APP_TITLE = "FairyLand World Map"
START_PAGE = "/atlas/index.html"


def resource_path(name):
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    return base / name


def find_zip():
    """Prefer atlas_site.zip so packing the map never collides with 典藏版 site.zip."""
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).parent))
    for name in ("atlas_site.zip", "site.zip"):
        p = base / name
        if p.is_file():
            return p
    raise SystemExit("missing atlas_site.zip (and no site.zip fallback)")


ZF = zipfile.ZipFile(find_zip())
NAMES = set(ZF.namelist())
LOCK = threading.Lock()

mimetypes.add_type("text/html", ".htm")
mimetypes.add_type("text/html", ".php")
mimetypes.add_type("text/html", ".shtml")
mimetypes.add_type("image/gif", ".gif")
mimetypes.add_type("image/jpeg", ".jpg")
mimetypes.add_type("image/png", ".png")
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("application/x-shockwave-flash", ".swf")
mimetypes.add_type("video/mp4", ".mp4")


def lookup(path, query):
    rel = urllib.parse.unquote(path).lstrip("/")
    if rel == "" or rel.endswith("/"):
        cands = [rel + "index.html", rel + "index8.htm", rel + "index.htm"]
    else:
        cands = [rel]
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
    url = "http://127.0.0.1:%d%s" % (port, START_PAGE)
    print(APP_TITLE)
    print("Serving at: " + url)
    print("Close this window to exit. / Guan bi ci chuang kou ji ke tui chu.")
    threading.Timer(0.3, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
