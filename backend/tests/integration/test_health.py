"""Ejemplo de test de integración: endpoint público sin BD compleja.

Lenguaje: Python.
Framework: pytest + FastAPI TestClient (httpx bajo el capó).
Estructura: archivo test_*.py, función test_*, fixture `client` de tests/conftest.py.
"""

import pytest


@pytest.mark.integration
def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
