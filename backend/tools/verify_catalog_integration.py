"""
Delega al script real en la raíz del repositorio (`tools/verify_catalog_integration.py`).

Uso desde la carpeta `backend`:
  python tools/verify_catalog_integration.py

Uso desde la raíz del repo:
  python tools/verify_catalog_integration.py
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

_REPO = Path(__file__).resolve().parent.parent.parent
_SCRIPT = _REPO / "tools" / "verify_catalog_integration.py"

if __name__ == "__main__":
    if not _SCRIPT.is_file():
        print(f"ERROR: no se encuentra {_SCRIPT}", file=sys.stderr)
        raise SystemExit(2)
    raise SystemExit(subprocess.call([sys.executable, str(_SCRIPT)]))
