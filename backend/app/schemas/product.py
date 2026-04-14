from decimal import Decimal
from typing import TYPE_CHECKING

from pydantic import BaseModel

if TYPE_CHECKING:
    from app.models.product import Product


class ProductOut(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    price: Decimal
    image_url: str | None
    stock: int
    category_slug: str

    model_config = {"from_attributes": True}


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int


class ProductSuggestionItem(BaseModel):
    name: str
    slug: str


class ProductSuggestionsOut(BaseModel):
    items: list[ProductSuggestionItem]


def product_to_out(product: "Product") -> ProductOut:
    return ProductOut(
        id=product.id,
        name=product.name,
        slug=product.slug,
        description=product.description,
        price=product.price,
        image_url=product.image_url,
        stock=product.stock,
        category_slug=product.category.slug,
    )
