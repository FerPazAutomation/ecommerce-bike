"""
Pedidos y checkout: crea una orden `pending` y una Stripe Checkout Session; el pago se confirma vía webhook.

Por qué snapshot en `order_items.unit_price`: el precio del catálogo puede cambiar después de la compra.
"""

from decimal import Decimal

import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.database import get_db
from app.models import CartItem, Order, OrderItem, OrderStatus, Product, User
from app.schemas import CheckoutOut, OrderItemOut, OrderOut, OrderSummaryOut

router = APIRouter()


@router.get("", response_model=list[OrderSummaryOut])
def list_orders(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[Order]:
    return (
        db.query(Order)
        .filter(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.post("/checkout", response_model=CheckoutOut)
def create_checkout(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CheckoutOut:
    settings = get_settings()
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured (set STRIPE_SECRET_KEY)",
        )
    stripe.api_key = settings.stripe_secret_key

    lines = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == user.id)
        .all()
    )
    if not lines:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    total = Decimal("0")
    order_items_data: list[tuple[Product, int, Decimal]] = []
    for line in lines:
        p = line.product
        if not p.is_active:
            continue
        unit = p.price
        line_total = unit * line.quantity
        total += line_total
        order_items_data.append((p, line.quantity, unit))

    if not order_items_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid items in cart")

    order = Order(user_id=user.id, status=OrderStatus.pending, total_amount=total, currency="usd")
    db.add(order)
    db.flush()

    for p, qty, unit in order_items_data:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=p.id,
                quantity=qty,
                unit_price=unit,
            )
        )
    db.commit()
    db.refresh(order)

    line_items: list[dict] = []
    for p, qty, unit in order_items_data:
        cents = int((unit * 100).quantize(Decimal("1")))
        line_items.append(
            {
                "quantity": qty,
                "price_data": {
                    "currency": "usd",
                    "unit_amount": cents,
                    "product_data": {"name": p.name},
                },
            }
        )

    success_url = f"{settings.frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{settings.frontend_url}/checkout/cancel"

    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": str(order.id)},
    )

    order.stripe_checkout_session_id = session.id
    db.add(order)
    db.commit()

    return CheckoutOut(checkout_url=session.url or "", order_id=order.id)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OrderOut:
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id, Order.user_id == user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    items_out = [
        OrderItemOut(
            product_id=it.product_id,
            quantity=it.quantity,
            unit_price=it.unit_price,
            name=it.product.name if it.product else "?",
        )
        for it in order.items
    ]
    return OrderOut(
        id=order.id,
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
        created_at=order.created_at,
        items=items_out,
    )
