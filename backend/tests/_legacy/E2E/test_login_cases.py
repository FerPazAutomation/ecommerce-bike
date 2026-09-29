import pytest
import re
from pathlib import Path
from playwright.sync_api import Page, expect

_ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


@pytest.mark.e2e
def test_login_success(page: Page, base_url: str) -> None:
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

@pytest.mark.e2e
def test_login_flow_with_invalid_credentials(page: Page, base_url: str) -> None:
    """El usuario debe poder loguearse con email y contraseña."""
    page.goto(base_url)
    page.get_by_role("link", name="Entrar").click()
    expect(page).to_have_url(re.compile(r".*/login/?$"))
    page.get_by_placeholder("Email").fill("f.llanes@gmail.com")
    page.get_by_placeholder("Contraseña").fill("pw12347845")
    # El submit del formulario sí es un <button>; acotar al form evita colisiones futuras.
    page.locator("form").get_by_role("button", name="Entrar").click()
    expect(page.get_by_text("Incorrect email or password")).to_be_visible()
    print("Login failed with invalid credentials")