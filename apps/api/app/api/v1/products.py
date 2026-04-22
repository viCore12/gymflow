import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter()


@router.get("", response_model=list[ProductResponse])
async def list_products(
    active_only: bool = True,
    q: str | None = Query(None, min_length=1),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Product)
    if active_only:
        stmt = stmt.where(Product.active == True)  # noqa: E712
    if q:
        stmt = stmt.where(
            Product.name.ilike(f"%{q}%") | Product.sku.ilike(f"%{q}%")
        )
    stmt = stmt.order_by(Product.name)
    rows = (await db.execute(stmt)).scalars().all()
    return rows


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product
