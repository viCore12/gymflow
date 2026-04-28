"""Tests: renewal stacking and check-in priority."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.membership_plan import MembershipPlan
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
    customer = Customer(code="KH-003", full_name="Le Van C")
    db.add(customer)
    plan = MembershipPlan(
        code="10BUOI", name="Goi 10 buoi", sessions=10, price=500_000
    )
    db.add(plan)
    await db.commit()
    for obj in (user, customer, plan):
        await db.refresh(obj)
    return user, customer, plan


async def _auth_header(client: AsyncClient) -> dict:
    resp = await client.post(
        "/v1/auth/login", json={"email": "staff@gymflow.dev", "password": "pass"}
    )
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


@pytest.mark.asyncio
async def test_renewal_stacking(
    client: AsyncClient, db_session: AsyncSession
):
    """Same plan twice → extend sessions_left, not a second row."""
    user, customer, plan = await _seed(db_session)
    headers = await _auth_header(client)

    # First purchase
    resp = await client.post(
        "/v1/memberships",
        headers=headers,
        json={"customer_id": str(customer.id), "plan_id": str(plan.id)},
    )
    assert resp.status_code == 201
    first = resp.json()
    assert first["sessions_left"] == 10

    # Second purchase (renewal stacking)
    resp = await client.post(
        "/v1/memberships",
        headers=headers,
        json={"customer_id": str(customer.id), "plan_id": str(plan.id)},
    )
    assert resp.status_code == 201
    second = resp.json()
    assert second["id"] == first["id"]  # same row
    assert second["sessions_left"] == 20  # stacked

    # Only one membership
    resp = await client.get(
        f"/v1/memberships?customer_id={customer.id}", headers=headers
    )
    assert len(resp.json()) == 1


@pytest.mark.asyncio
async def test_check_in_deducts_session(
    client: AsyncClient, db_session: AsyncSession
):
    user, customer, plan = await _seed(db_session)
    headers = await _auth_header(client)

    await client.post(
        "/v1/memberships",
        headers=headers,
        json={"customer_id": str(customer.id), "plan_id": str(plan.id)},
    )

    resp = await client.post(
        "/v1/memberships/check-in",
        headers=headers,
        json={"customer_id": str(customer.id)},
    )
    assert resp.status_code == 201

    # Sessions should drop to 9
    m_resp = await client.get(
        f"/v1/memberships?customer_id={customer.id}", headers=headers
    )
    assert m_resp.json()[0]["sessions_left"] == 9
