from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderItemOut(BaseModel):
    product_id: int
    quantity: int
    unit_price: Decimal
    name: str

    model_config = {"from_attributes": True}


class OrderSummaryOut(BaseModel):
    """Listado de pedidos sin ítems (detalle en GET /orders/{id})."""

    id: int
    status: OrderStatus
    total_amount: Decimal
    currency: str
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: int
    status: OrderStatus
    total_amount: Decimal
    currency: str
    created_at: datetime
    items: list[OrderItemOut]

    model_config = {"from_attributes": True}


class CheckoutOut(BaseModel):
    checkout_url: str
    order_id: int
