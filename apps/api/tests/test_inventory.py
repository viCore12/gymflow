"""Acceptance criteria: import → sell → stock-take → adjustment + low-stock."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.product import Product
from app.models.user import User, UserRole
from app.security import hash_password


async def _seed(db: AsyncSession):
    user = User(
        email="admin@gymflow.dev",
        password_hash=hash_password("pass"),
        role=UserRole.admin,
        active=True,
    )
    db.add(user)
    customer = Customer(code="KH-002", full_name="Tran Thi B")
    db.add(customer)
    product = Product(
        sku="WATER-01", name="Binh nuoc 500ml", price=15_000, stock=0
    )
    db.add(product)
    await db.commit()
    for obj in (user, customer, product):
        await db.refresh(obj)
    return user, customer, product


async def _auth_header(client: AsyncClient) -> dict:
    resp = await client.post(
        "/v1/auth/login", json={"email": "admin@gymflow.dev", "password": "pass"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_full_inventory_flow(
    client: AsyncClient, db_session: AsyncSession
):
    """AC: import 50 → sell 5 → stock-take counted 43 → adjustment -2."""
    user, customer, product = await _seed(db_session)
    headers = await _auth_header(client)

    # 1. Create import move (draft)
    resp = await client.post(
        "/v1/inventory/moves",
        headers=headers,
        json={
            "product_id": str(product.id),
            "move_type": "in",
            "qty": 50,
            "note": "Nhap 50 binh nuoc",
        },
    )
    assert resp.status_code == 201
    move = resp.json()
    assert move["status"] == "draft"
    move_id = move["id"]

    # 2. Approve import → stock should increase to 50
    resp = await client.post(
        f"/v1/inventory/moves/{move_id}/approve",
        headers=headers,
        json={"approved_by_id": str(user.id)},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"

    await db_session.refresh(product)
    assert product.stock == 50

    # 3. Sell 5 via order → auto stock_move(out), stock becomes 45
    resp = await client.post(
        "/v1/orders",
        headers=headers,
        json={
            "customer_id": str(customer.id),
            "lines": [
                {
                    "product_id": str(product.id),
                    "description": "Binh nuoc 500ml",
                    "qty": 5,
                    "unit_price": 15_000,
                },
            ],
        },
    )
    assert resp.status_code == 201

    await db_session.refresh(product)
    assert product.stock == 45

    # 4. Stock take: system says 45, counted 43 → discrepancy -2
    resp = await client.post(
        "/v1/inventory/stock-takes",
        headers=headers,
        json={"note": "Kiem kho tuan 17"},
    )
    assert resp.status_code == 201
    take_id = resp.json()["id"]

    resp = await client.post(
        f"/v1/inventory/stock-takes/{take_id}/lines",
        headers=headers,
        json={
            "product_id": str(product.id),
            "system_qty": 45,
            "counted_qty": 43,
        },
    )
    assert resp.status_code == 201

    # 5. Close stock take → adjustment created, stock becomes 43
    resp = await client.post(
        f"/v1/inventory/stock-takes/{take_id}/close",
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "confirmed"

    await db_session.refresh(product)
    assert product.stock == 43


@pytest.mark.asyncio
async def test_low_stock_alert(
    client: AsyncClient, db_session: AsyncSession
):
    """AC: low-stock alert when product drops below threshold."""
    user, _, product = await _seed(db_session)

    # Product stock is 0, should appear in low-stock with threshold=10
    resp = await client.get("/v1/inventory/low-stock?threshold=10")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) >= 1
    assert any(i["sku"] == "WATER-01" for i in items)


@pytest.mark.asyncio
async def test_reject_stock_move(
    client: AsyncClient, db_session: AsyncSession
):
    """Rejected moves should not affect stock."""
    user, _, product = await _seed(db_session)
    headers = await _auth_header(client)

    resp = await client.post(
        "/v1/inventory/moves",
        headers=headers,
        json={
            "product_id": str(product.id),
            "move_type": "in",
            "qty": 100,
        },
    )
    move_id = resp.json()["id"]

    resp = await client.post(
        f"/v1/inventory/moves/{move_id}/reject",
        headers=headers,
        json={"approved_by_id": str(user.id)},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"

    await db_session.refresh(product)
    assert product.stock == 0
