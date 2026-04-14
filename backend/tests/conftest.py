"""
Fixtures compartidas: BD SQLite en memoria (variable de entorno antes de importar la app).

Por qué override de `get_db`: misma API FastAPI con sesión aislada por test.
"""

import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import get_settings

get_settings.cache_clear()

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import application  # noqa: E402
from app.database import get_db  # noqa: E402
import app.models  # noqa: E402, F401


@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    application.dependency_overrides[get_db] = _override_db
    with TestClient(application) as test_client:
        yield test_client
    application.dependency_overrides.clear()
