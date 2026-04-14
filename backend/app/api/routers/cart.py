"""
Carrito persistido por usuario autenticado: requiere JWT.

Por qué merge al añadir: si el producto ya está en el carrito, se suma la cantidad en lugar de duplicar filas.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.database import get_db
from app.models import CartItem, Product, User
from app.schemas import CartItemCreate, CartItemOut, CartItemUpdate, CartOut
from app.schemas.product import product_to_out

router = APIRouter()


def _cart_item_out(row: CartItem) -> CartItemOut:
    price = row.product.price
    line = price * row.quantity
    return CartItemOut(
        id=row.id,
        quantity=row.quantity,
        product=product_to_out(row.product),
        line_total=line,
    )


@router.get("", response_model=CartOut)
def get_cart(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CartOut:
    rows = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.user_id == user.id)
        .all()
    )
    items = [_cart_item_out(r) for r in rows]
    subtotal = sum((i.line_total for i in items), Decimal("0"))
    return CartOut(items=items, subtotal=subtotal)


@router.post("/items", response_model=CartItemOut)
def add_item(
    body: CartItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CartItemOut:
    product = db.query(Product).filter(Product.id == body.product_id, Product.is_active.is_(True)).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product.stock < body.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough stock")
    existing = (
        db.query(CartItem)
        .filter(CartItem.user_id == user.id, CartItem.product_id == body.product_id)
        .first()
    )
    if existing:
        new_qty = existing.quantity + body.quantity
        if new_qty > product.stock:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough stock")
        existing.quantity = new_qty
        db.commit()
        db.refresh(existing)
        db.refresh(existing, ["product"])
        row = (
            db.query(CartItem)
            .options(joinedload(CartItem.product).joinedload(Product.category))
            .filter(CartItem.id == existing.id)
            .first()
        )
        assert row
        return _cart_item_out(row)

    row = CartItem(user_id=user.id, product_id=body.product_id, quantity=body.quantity)
    db.add(row)
    db.commit()
    db.refresh(row)
    row = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.id == row.id)
        .first()
    )
    assert row
    return _cart_item_out(row)


@router.patch("/items/{item_id}", response_model=CartItemOut)
def update_item(
    item_id: int,
    body: CartItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CartItemOut:
    row = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.id == item_id, CartItem.user_id == user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    if body.quantity > row.product.stock:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough stock")
    row.quantity = body.quantity
    db.commit()
    db.refresh(row, ["product"])
    row = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.category))
        .filter(CartItem.id == item_id)
        .first()
    )
    assert row
    return _cart_item_out(row)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    row = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    db.delete(row)
    db.commit()
