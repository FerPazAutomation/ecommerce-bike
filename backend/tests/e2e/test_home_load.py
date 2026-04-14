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
    # En Python el patrón va con re.compile(...), no con /.../ (eso es JS/TS).
    expect(page).to_have_title(re.compile(r".+"))

@pytest.mark.e2e
def test_login_flow(page: Page, base_url: str) -> None:
    """El usuario debe poder loguearse con email y contraseña."""
    page.goto(base_url)
    # En el header, "Entrar" es un <Link> (rol link), no un button.
    page.get_by_role("link", name="Entrar").click()
    expect(page).to_have_url(re.compile(r".*/login/?$"))
    page.get_by_placeholder("Email").fill("f.llanes@gmail.com")
    page.get_by_placeholder("Contraseña").fill("pw123456")
    # El submit del formulario sí es un <button>; acotar al form evita colisiones futuras.
    page.locator("form").get_by_role("button", name="Entrar").click()
    page.screenshot(path=str(_ARTIFACTS_DIR / "login_flow.png"))        # Guarda la captura de pantalla
    print("Login flow completed successfully")
    expect(page).to_have_url(re.compile(r".*/productos/?$"))
    
