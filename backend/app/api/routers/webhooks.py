"""
Webhook de Stripe: verifica la firma y marca el pedido como pagado (fuente de verdad del pago).

Por qué webhook: el cliente puede cerrar el navegador; Stripe notifica al servidor cuando el cobro terminó.
"""

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.database import get_db
from app.models import CartItem, Order, OrderStatus

router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> dict[str, str]:
    settings = get_settings()
    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook secret not configured",
        )
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")
    except Exception as exc:
        if exc.__class__.__name__ != "SignatureVerificationError":
            raise
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature") from exc

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session.get("metadata") or {}
        order_id = meta.get("order_id")
        if order_id:
            order = db.query(Order).filter(Order.id == int(order_id)).first()
            if order and order.status == OrderStatus.pending:
                order.status = OrderStatus.paid
                db.query(CartItem).filter(CartItem.user_id == order.user_id).delete()
                db.commit()

    return {"status": "ok"}
