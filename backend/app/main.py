"""
Punto de entrada FastAPI: registra CORS para que el navegador en otro puerto (Vite) pueda llamar a la API.

Por qué CORS: el navegador bloquea respuestas de otro origen salvo que el servidor las permita explícitamente.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import auth, cart, categories, orders, products, webhooks
from app.core.config import get_settings

settings = get_settings()

_OPENAPI_TAGS = [
    {
        "name": "auth",
        "description": "Registro y login. El login devuelve un JWT; en Swagger usa **Authorize** y pega el token (sin prefijo `Bearer `).",
    },
    {"name": "categories", "description": "Categorías de productos."},
    {"name": "products", "description": "Catálogo y detalle de productos."},
    {
        "name": "cart",
        "description": "Carrito del usuario autenticado (requiere JWT).",
    },
    {
        "name": "orders",
        "description": "Pedidos del usuario autenticado (requiere JWT).",
    },
    {"name": "webhooks", "description": "Webhooks (p. ej. pagos)."},
    {"name": "health", "description": "Comprobación de que la API responde."},
]

application = FastAPI(
    title="E-bike Tucson API",
    version="0.1.0",
    description=(
        "API del ecommerce. Los esquemas de petición y respuesta aparecen en **Schemas** abajo; "
        "las rutas protegidas usan el mismo esquema **HTTPBearer** que Swagger documenta automáticamente."
    ),
    openapi_tags=_OPENAPI_TAGS,
    servers=[{"url": "http://127.0.0.1:8000", "description": "Desarrollo local"}],
)

application.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

application.include_router(auth.router, prefix="/auth", tags=["auth"])
application.include_router(categories.router, prefix="/categories", tags=["categories"])
application.include_router(products.router, prefix="/products", tags=["products"])
application.include_router(cart.router, prefix="/cart", tags=["cart"])
application.include_router(orders.router, prefix="/orders", tags=["orders"])
application.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])


@application.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
