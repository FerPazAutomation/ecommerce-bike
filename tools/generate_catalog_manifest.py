"""
Genera frontend/src/data/catalogManifest.json a partir de public/images/catalog.
Ejecutar desde la raíz del repo:  python tools/generate_catalog_manifest.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend" / "scripts"))

from catalog_scan import scan_catalog_png_indices  # noqa: E402


def main() -> None:
    data = scan_catalog_png_indices(ROOT)
    out = ROOT / "frontend" / "src" / "data" / "catalogManifest.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out.relative_to(ROOT)}")
    for k, v in data.items():
        print(f"  {k}: {len(v)} images -> indices {v}")


if __name__ == "__main__":
    main()
