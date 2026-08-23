# -*- coding: utf-8 -*-
"""One-shot packer for the standalone world map.

Same pipeline as the archive exe:
  atlas/ -> site/atlas/ -> atlas_site.zip (in memory for the launcher) ->
  Python 3.7 PyInstaller onefile -> 交付包 (exe + Big5 readme + zip)

Does NOT write site.zip, so the 典藏版 archive is left alone.

On Windows with the Win7 Python 3.7 this is one command:
    python pack_atlas.py

On a machine without that Python it still writes atlas_site.zip so the
launcher can be smoke-tested with:  python launcher_atlas.py
"""
from __future__ import print_function
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NAME = "童話世界地圖"
SITE = ROOT / "site"
ZIP_PATH = ROOT / "atlas_site.zip"
INCLUDE = ("atlas", "htm/map", "copy", "cimage", "htm/huan")
PY37_DEFAULT = Path(r"C:\Users\user-66990\Desktop\TWlogin\.build\Python37\python.exe")


def sync_atlas():
    src = ROOT / "atlas"
    dst = SITE / "atlas"
    if not src.is_dir():
        raise SystemExit("missing atlas/")
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(
        src, dst,
        ignore=shutil.ignore_patterns(
            "__pycache__", "*.pyc", "_rev", "*.py", "client_maps.json",
            "rare_src", "layout", "catalog_names.json",
        ),
    )
    print("atlas -> site/atlas")


def build_zip():
    files = []
    for rel in INCLUDE:
        p = SITE / rel
        if not p.exists():
            print("skip missing", rel)
            continue
        if p.is_file():
            files.append(p)
        else:
            files.extend(
                f for f in p.rglob("*")
                if f.is_file() and f.name not in ("build_data.py",) and "__pycache__" not in f.parts
            )
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.write(f, f.relative_to(SITE).as_posix())
    print("atlas_site.zip", ZIP_PATH.stat().st_size, "files", len(files))
    return len(files)


def find_py37():
    env = os.environ.get("FAIRYLAND_PY37") or os.environ.get("PY37")
    cands = []
    if env:
        cands.append(Path(env))
    cands.append(PY37_DEFAULT)
    for p in cands:
        if p and p.is_file():
            return p
    return None


def build_exe(py37):
    site_zip = str(ZIP_PATH.resolve())
    launcher = str((ROOT / "launcher_atlas.py").resolve())
    cmd = [
        str(py37), "-m", "PyInstaller",
        "--onefile", "--console",
        "--name", NAME,
        "--add-data", site_zip + ";.",
        "--distpath", str(ROOT / "dist37"),
        "--workpath", str(ROOT / "build37"),
        "--specpath", str(ROOT / "build37"),
        "-y",
        launcher,
    ]
    print("PyInstaller:", " ".join(cmd))
    subprocess.check_call(cmd)
    exe = ROOT / "dist37" / (NAME + ".exe")
    if not exe.is_file():
        raise SystemExit("PyInstaller finished but exe missing: " + str(exe))
    print("exe", exe, exe.stat().st_size)


def main():
    sync_atlas()
    n = build_zip()
    if n < 10:
        raise SystemExit("atlas_site.zip too small, abort")
    py37 = find_py37()
    if py37 is None:
        print("Python 3.7 not found. atlas_site.zip is ready.")
        print("On the Win7 VM run:")
        print('  python pack_atlas.py')
        print("or set FAIRYLAND_PY37 to that python.exe and rerun.")
        print("Smoke test without exe:")
        print("  python launcher_atlas.py")
        print("This packer never writes site.zip (that file belongs to 典藏版).")
        return 0
    build_exe(py37)
    subprocess.check_call([sys.executable, str(ROOT / "make_package_atlas.py")])
    return 0


if __name__ == "__main__":
    sys.exit(main() or 0)
