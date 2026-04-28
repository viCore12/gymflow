"""Tests: payments on orders."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.user import User, UserRole
from app.security import hash_password


async def _seed(db: AsyncSession):
    user = User(
        email="staff@gymflow.dev",
        password_hash=hash_password("pass"),
        role=UserRole.admin,
        active=True,
    )
    db.add(user)
    customer = Customer(code="KH-004", full_name="Pham Van D")
    db.add(customer)
    await db.commit()
    for obj in (user, customer):
        await db.refresh(obj)
    return user, customer


async def _auth_header(client: AsyncClient) -> dict:
    resp = await client.post(
        "/v1/auth/login", json={"email": "staff@gymflow.dev", "password": "pass"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_payment_on_order(
    client: AsyncClient, db_session: AsyncSession
):
    """Create order, then record payment."""
    user, customer = await _seed(db_session)
    headers = await _auth_header(client)

    # Create an order with one product line
    resp = await client.post(
        "/v1/orders",
        headers=headers,
        json={
            "customer_id": str(customer.id),
            "lines": [
                {
                    "product_id": None,
                    "description": "Thanh toan",
                    "qty": 1,
                    "unit_price": 100_000,
                },
            ],
        },
    )
    assert resp.status_code == 201
    order = resp.json()
    order_id = order["id"]

    # Create payment
    resp = await client.post(
        f"/v1/orders/{order_id}/payments",
        headers=headers,
        json={
            "amount": 100_000,
            "method": "cash",
            "reference": "PAY-001",
            "note": "Thu tien mat",
        },
    )
    assert resp.status_code == 201
    payment = resp.json()
    assert payment["amount"] == 100_000
    assert payment["method"] == "cash"
    assert payment["status"] == "confirmed"


@pytest.mark.asyncio
async def test_list_payments_for_order(
    client: AsyncClient, db_session: AsyncSession
):
    """Multiple payments on one order."""
    user, customer = await _seed(db_session)
    headers = await _auth_header(client)

    resp = await client.post(
        "/v1/orders",
        headers=headers,
        json={
            "customer_id": str(customer.id),
            "lines": [
                {
                    "description": "Goi tap",
                    "qty": 1,
                    "unit_price": 500_000,
                },
            ],
        },
    )
    order_id = resp.json()["id"]

    # First payment
    await client.post(
        f"/v1/orders/{order_id}/payments",
        headers=headers,
        json={"amount": 200_000, "method": "ewallet"},
    )

    # Second payment
    await client.post(
        f"/v1/orders/{order_id}/payments",
        headers=headers,
        json={"amount": 300_000, "method": "cash"},
    )

    # List payments
    resp = await client.get(f"/v1/orders/{order_id}/payments", headers=headers)
    assert resp.status_code == 200
    payments = resp.json()
    assert len(payments) == 2
    assert payments[0]["method"] == "cash"  # newest first


@pytest.mark.asyncio
async def test_payment_404_on_missing_order(
    client: AsyncClient, db_session: AsyncSession
):
    """Payment on non-existent order returns 404."""
    await _seed(db_session)
    headers = await _auth_header(client)

    import uuid
    fake_id = str(uuid.uuid4())
    resp = await client.post(
        f"/v1/orders/{fake_id}/payments",
        headers=headers,
        json={"amount": 10, "method": "cash"},
    )
    assert resp.status_code == 404
