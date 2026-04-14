from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.product import ProductOut


class CartItemCreate(BaseModel):
    product_id: int = Field(ge=1)
    quantity: int = Field(ge=1, default=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    id: int
    quantity: int
    product: ProductOut
    line_total: Decimal


class CartOut(BaseModel):
    items: list[CartItemOut]
    subtotal: Decimal
