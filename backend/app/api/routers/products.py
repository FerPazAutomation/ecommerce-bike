"""
Catálogo: búsqueda por palabras (AND) en nombre, descripción, slug y nombre de categoría.

Por qué joinedload: evita consultas N+1 al serializar `category_slug` por producto.
"""

import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Category, Product
from app.schemas import ProductListOut, ProductOut, ProductSuggestionsOut
from app.schemas.product import ProductSuggestionItem, product_to_out

router = APIRouter()


def _apply_search_filter(query, q: str | None):
    """Cada término debe aparecer en nombre, descripción, slug o categoría (más tolerante que un solo ILIKE largo)."""
    if not q:
        return query
    raw = q.strip()
    if not raw:
        return query
    tokens = [t for t in re.split(r"\s+", raw) if t]
    for token in tokens:
        pat = f"%{token}%"
        query = query.filter(
            or_(
                Product.name.ilike(pat),
                Product.description.ilike(pat),
                Product.slug.ilike(pat),
                Product.category.has(Category.name.ilike(pat)),
            )
        )
    return query


@router.get("/suggestions", response_model=ProductSuggestionsOut)
def product_suggestions(
    db: Session = Depends(get_db),
    q: str = Query("", max_length=120),
    limit: int = Query(8, ge=1, le=20),
) -> ProductSuggestionsOut:
    """Debe declararse antes de `/{slug}` para que no tome 'suggestions' como slug."""
    qt = q.strip()
    if len(qt) < 2:
        return ProductSuggestionsOut(items=[])
    query = db.query(Product).options(joinedload(Product.category)).filter(Product.is_active.is_(True))
    query = _apply_search_filter(query, qt)
    rows = query.order_by(Product.name).limit(limit).all()
    return ProductSuggestionsOut(
        items=[ProductSuggestionItem(name=p.name, slug=p.slug) for p in rows],
    )


@router.get("", response_model=ProductListOut)
def list_products(
    db: Session = Depends(get_db),
    q: str | None = None,
    category_slug: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=100),
) -> ProductListOut:
    query = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active.is_(True))
    )
    if category_slug:
        cat = db.query(Category).filter(Category.slug == category_slug).first()
        if not cat:
            return ProductListOut(items=[], total=0)
        query = query.filter(Product.category_id == cat.id)
    query = _apply_search_filter(query, q)
    total = query.count()
    rows = query.order_by(Product.id).offset(skip).limit(limit).all()
    return ProductListOut(items=[product_to_out(p) for p in rows], total=total)


@router.get("/{slug}", response_model=ProductOut)
def get_product(slug: str, db: Session = Depends(get_db)) -> ProductOut:
    p = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.slug == slug, Product.is_active.is_(True))
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product_to_out(p)
