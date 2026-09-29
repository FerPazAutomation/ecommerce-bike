"""
E2E: carga de la home.

Para ver el navegador al depurar, ejecuta desde la carpeta ``backend``::

    pytest tests/e2e --headed

Las capturas se escriben en ``tests/e2e/artifacts/`` (ruta estable respecto a este archivo).
"""

import re
from pathlib import Path

import pytest
from playwright.sync_api import Page, expect

_ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


@pytest.mark.e2e
def test_home_loads(page: Page, base_url: str) -> None:
    """La SPA debe cargar y tener un título (ajusta el patrón al título real de index.html)."""
    _ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    screenshot_path = _ARTIFACTS_DIR / "home_load.png"

    page.goto(base_url)
    page.screenshot(path=str(screenshot_path))
    expect(page.get_by_label("Principal", exact=True).get_by_role("button")).to_contain_text("Tienda ▾")
    expect(page.get_by_label("Principal", exact=True)).to_contain_text("Inicio")
    expect(page.get_by_label("Principal", exact=True)).to_contain_text("Servicio")
    expect(page.get_by_label("Principal", exact=True)).to_contain_text("Contacto")
    expect(page.locator("#catalogo")).to_contain_text("Destacados del catálogo")
    expect(page.locator("#contacto")).to_contain_text("Hablemos")
    expect(page.get_by_role("link", name="Entrar")).to_be_visible()
    expect(page.get_by_role("button", name="Buscar")).to_be_visible()
    expect(page.get_by_role("link", name="Carrito")).to_be_visible()
    expect(page.get_by_label("Lo que dicen quienes ya")).to_be_visible()
    
