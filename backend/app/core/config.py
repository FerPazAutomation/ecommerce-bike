"""
Configuración centralizada (variables de entorno).

Por qué: secretos y URLs fuera del código permiten dev/test/prod y CI sin cambiar .py.
"""

from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://ebike:ebike_dev@localhost:5433/ebike_tucson"
    secret_key: str = "change-me-in-production-use-openssl-rand-hex-32"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # CORS y URLs de retorno de Stripe Checkout deben coincidir con el origen del frontend.
    frontend_url: str = "http://localhost:5173"

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    @field_validator("stripe_secret_key", "stripe_webhook_secret", mode="before")
    @classmethod
    def strip_optional_secrets(cls, v: object) -> str:
        if v is None:
            return ""
        s = str(v).strip()
        return s


@lru_cache
def get_settings() -> Settings:
    return Settings()
