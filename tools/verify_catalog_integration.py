"""
Comprueba que cada PNG (índices 01–07 por carpeta, 21 en total) esté alineado con
catalogManifest.json. Los archivos …-08.png u otros no se usan en seed/manifiesto.

Uso (desde la raíz del repo):  python tools/verify_catalog_integration.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend" / "scripts"))

from catalog_scan import scan_catalog_png_indices  # noqa: E402


def main() -> int:
    scan = scan_catalog_png_indices(ROOT)
    manifest_path = ROOT / "frontend" / "src" / "data" / "catalogManifest.json"
    if not manifest_path.is_file():
        print("ERROR: falta catalogManifest.json — ejecuta: python tools/generate_catalog_manifest.py")
        return 1
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    errors = 0
    for folder in ("ciudad", "montana", "electrica"):
        disk = set(scan.get(folder, []))
        json_indices = set(manifest.get(folder, []))
        if disk != json_indices:
            print(f"ERROR {folder}: disco {sorted(disk)} != manifiesto {sorted(json_indices)}")
            errors += 1
        for idx in disk:
            rel = ROOT / "frontend" / "public" / "images" / "catalog" / folder / f"{folder}-{idx:02d}.png"
            if not rel.is_file():
                print(f"ERROR: falta archivo {rel.relative_to(ROOT)}")
                errors += 1

    total_png = sum(len(scan[f]) for f in ("ciudad", "montana", "electrica"))
    print(f"OK: {total_png} PNG en disco; manifiesto alineado con scan.")
    print("Tras re-sembrar la base, la API tendrá un producto por PNG (image_url /images/catalog/...).")
    return errors


if __name__ == "__main__":
    raise SystemExit(main())
