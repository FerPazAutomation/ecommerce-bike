"""
Copia PNG desde la carpeta de assets de Cursor al catálogo público del frontend.

Nombres esperados en origen (como los que genera Cursor al adjuntar imágenes):
  *images_ciudadN*.png  → ciudad/ciudad-NN.png
  *images_monta_aN*.png → montana/montana-NN.png
  *images_e-bikeN*.png  → electrica/electrica-NN.png

Hasta 8 índices por categoría (24 fotos si hay 8×3 PNG en origen). Regenera el manifiesto tras copiar.

Uso:
  set CATALOG_ASSETS=C:\\ruta\\a\\assets
  python tools/sync_catalog_images_from_assets.py

Por defecto intenta:
  %USERPROFILE%\\.cursor\\projects\\c-Users-Fernando-Desktop-ecommerce-bike\\assets
"""

from __future__ import annotations

import os
import re
import shutil
from pathlib import Path

DEFAULT_SRC = (
    Path(os.environ.get("USERPROFILE", ""))
    / ".cursor"
    / "projects"
    / "c-Users-Fernando-Desktop-ecommerce-bike"
    / "assets"
)

DEST_ROOT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "images" / "catalog"

CIUDAD_RE = re.compile(r"images_ciudad(\d+)", re.I)
MONTA_RE = re.compile(r"images_monta_a(\d+)", re.I)
EBIKE_RE = re.compile(r"images_e-bike(\d+)", re.I)


def _pick_files(src: Path) -> list[Path]:
    if not src.is_dir():
        return []
    return [p for p in src.iterdir() if p.suffix.lower() == ".png"]


def _index_map(files: list[Path], pattern: re.Pattern[str]) -> dict[int, Path]:
    out: dict[int, Path] = {}
    for p in files:
        m = pattern.search(p.name)
        if m:
            out[int(m.group(1))] = p
    return out


def _copy_series(folder: str, mapping: dict[int, Path], label: str) -> None:
    dest_dir = DEST_ROOT / folder
    dest_dir.mkdir(parents=True, exist_ok=True)
    for i in range(1, 9):
        src = mapping.get(i)
        if src is None and i == 8:
            src = mapping.get(7) or mapping.get(1)
        if src is None:
            print(f"  [{label}] omitido {folder}-{i:02d}: no hay fuente")
            continue
        dest = dest_dir / f"{folder}-{i:02d}.png"
        shutil.copy2(src, dest)
        print(f"  {src.name} -> {dest.relative_to(DEST_ROOT.parent.parent.parent)}")


def main() -> None:
    src = Path(os.environ.get("CATALOG_ASSETS", str(DEFAULT_SRC))).expanduser()
    print(f"Origen: {src}")
    files = _pick_files(src)
    if not files:
        print("No se encontraron PNG en esa carpeta. Define CATALOG_ASSETS o copia los archivos allí.")
        return

    print("Ciudad:")
    _copy_series("ciudad", _index_map(files, CIUDAD_RE), "ciudad")
    print("Montaña:")
    _copy_series("montana", _index_map(files, MONTA_RE), "montana")
    print("Eléctrica:")
    _copy_series("electrica", _index_map(files, EBIKE_RE), "electrica")
    print("Listo.")


if __name__ == "__main__":
    main()
