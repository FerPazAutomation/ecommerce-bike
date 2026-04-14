"""
Índices de PNG en frontend/public/images/catalog/<carpeta>/<carpeta>-NN.png
Usado por seed y por tools/generate_catalog_manifest.py.
"""

from __future__ import annotations

import re
from pathlib import Path

FOLDERS = ("ciudad", "montana", "electrica")
CAT_SLUG = {"ciudad": "ciudad", "montana": "montana", "electrica": "electrica"}

_CASCOS_SUFFIXES = (".png", ".jpg", ".jpeg", ".webp", ".jfif")

# Solo índices 01–07 por carpeta (21 bicis en total: 7 montaña + 7 ciudad + 7 e-bike).
# Si existen PNG adicionales (p. ej. …-08.png), no se usan en seed ni en el manifiesto.
MAX_INDEX_PER_CATEGORY = 7


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent.parent


def scan_catalog_png_indices(root: Path | None = None) -> dict[str, list[int]]:
    base = (root or repo_root()) / "frontend" / "public" / "images" / "catalog"
    out: dict[str, list[int]] = {}
    for folder in FOLDERS:
        found: list[int] = []
        d = base / folder
        if d.is_dir():
            for p in d.glob(f"{folder}-*.png"):
                m = re.search(rf"{re.escape(folder)}-(\d+)\.png$", p.name, re.I)
                if m:
                    n = int(m.group(1))
                    if 1 <= n <= MAX_INDEX_PER_CATEGORY:
                        found.append(n)
        out[folder] = sorted(set(found))
    return out


def scan_cascos_filenames(root: Path | None = None) -> list[str]:
    """Archivos `cascoN.*` en `public/images/catalog/cascos/` (extensiones habituales)."""
    d = (root or repo_root()) / "frontend" / "public" / "images" / "catalog" / "cascos"
    if not d.is_dir():
        return []
    found: list[tuple[int, str]] = []
    for p in d.iterdir():
        if not p.is_file() or p.suffix.lower() not in _CASCOS_SUFFIXES:
            continue
        m = re.match(r"casco(\d+)$", p.stem, re.I)
        if not m:
            continue
        found.append((int(m.group(1)), p.name))
    return [name for _, name in sorted(found)]
