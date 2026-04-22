"""Acceptance criteria: mixed order with membership + product items."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.membership_plan import MembershipPlan
from app.models.product import Product
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
    customer = Customer(code="KH-001", full_name="Nguyen Van A")
    db.add(customer)
    plan = MembershipPlan(
        code="30BUOI", name="Goi 30 buoi", sessions=30, price=1_500_000
    )
    db.add(plan)
    plan_3m = MembershipPlan(
        code="3THANG", name="Goi 3 thang", duration_days=90, price=3_000_000
    )
    db.add(plan_3m)
    product = Product(sku="GLOVE-01", name="Gang tay tap", price=200_000, stock=100)
    db.add(product)
    await db.commit()
    for obj in (user, customer, plan, plan_3m, product):
        await db.refresh(obj)
    return user, customer, plan, plan_3m, product


async def _auth_header(client: AsyncClient) -> dict:
    resp = await client.post(
        "/v1/auth/login", json={"email": "staff@gymflow.dev", "password": "pass"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_mixed_order_session_plan(
    client: AsyncClient, db_session: AsyncSession
):
    """AC: 1 goi 30-buoi + 2 gang tay → membership sessions_left=30."""
    user, customer, plan, _, product = await _seed(db_session)
    headers = await _auth_header(client)

    resp = await client.post(
        "/v1/orders",
        headers=headers,
        json={
            "customer_id": str(customer.id),
            "lines": [
                {
                    "plan_id": str(plan.id),
                    "description": "Goi 30 buoi",
                    "qty": 1,
                    "unit_price": 1_500_000,
                },
                {
                    "product_id": str(product.id),
                    "description": "Gang tay tap",
                    "qty": 2,
                    "unit_price": 200_000,
                },
            ],
        },
    )
    assert resp.status_code == 201
    order = resp.json()
    assert len(order["lines"]) == 2
    assert float(order["total"]) == 1_900_000

    # Check membership was auto-created
    m_resp = await client.get(
        f"/v1/memberships?customer_id={customer.id}", headers=headers
    )
    memberships = m_resp.json()
    assert len(memberships) == 1
    assert memberships[0]["sessions_left"] == 30
    assert memberships[0]["end_at"] is None  # session-only, no end_at

    # Check product stock deducted
    await db_session.refresh(product)
    assert product.stock == 98


@pytest.mark.asyncio
async def test_order_duration_plan(
    client: AsyncClient, db_session: AsyncSession
):
    """AC: goi 3-thang → end_at = start_at + 90 days."""
    user, customer, _, plan_3m, _ = await _seed(db_session)
    headers = await _auth_header(client)

    resp = await client.post(
        "/v1/orders",
        headers=headers,
        json={
            "customer_id": str(customer.id),
            "lines": [
                {
                    "plan_id": str(plan_3m.id),
                    "description": "Goi 3 thang",
                    "qty": 1,
                    "unit_price": 3_000_000,
                },
            ],
        },
    )
    assert resp.status_code == 201

    m_resp = await client.get(
        f"/v1/memberships?customer_id={customer.id}", headers=headers
    )
    memberships = m_resp.json()
    assert len(memberships) == 1
    m = memberships[0]
    assert m["end_at"] is not None
    assert m["sessions_left"] is None

    from datetime import datetime
    start = datetime.fromisoformat(m["start_at"])
    end = datetime.fromisoformat(m["end_at"])
    delta = (end - start).days
    assert delta == 90
