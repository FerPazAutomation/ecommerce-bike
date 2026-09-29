import pytest
import re
from playwright.sync_api import Page, expect


@pytest.mark.e2e
def test_service_form_success(page: Page, base_url: str) -> None:
    """El usuario debe poder enviar el formulario de servicio."""
    page.goto(base_url)
    page.get_by_role("link", name="Servicio").click()
    expect(page).to_have_url(re.compile(r".*/servicio/?$"))
    page.get_by_placeholder("Nombre completo").fill("Fernando Llanes Paz")
    page.get_by_placeholder("Email").fill("f.llanes@gmail.com")
    page.get_by_placeholder("Teléfono").fill("+543816783152")
    page.get_by_placeholder("Modelo de bici").fill("MTB Trail 01")
    page.get_by_placeholder("Fecha desde").fill("El motor no funciona")
    page.get_by_placeholder("Mensaje").fill("I have a problem with my bike")
    page.get_by_role("button", name="Enviar").click()
    expect(page.get_by_text("Mensaje enviado correctamente")).to_be_visible()