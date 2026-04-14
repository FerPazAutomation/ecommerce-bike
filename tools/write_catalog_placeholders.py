"""
Escribe PNG mínimos (1×1 px) en frontend/public/images/catalog/…
para que las rutas del seed y del hero existan hasta que sustituyas por fotos reales.

Uso (desde la raíz del repo):  python tools/write_catalog_placeholders.py
"""

from __future__ import annotations

import base64
from pathlib import Path

# PNG 1×1 transparente (válido)
_MINI_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


def main() -> None:
    root = Path(__file__).resolve().parent.parent / "frontend" / "public" / "images" / "catalog"
    for cat in ("ciudad", "montana", "electrica"):
        for i in range(1, 8):
            path = root / cat / f"{cat}-{i:02d}.png"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(_MINI_PNG)
            print(path.relative_to(root.parent.parent.parent))


if __name__ == "__main__":
    main()
