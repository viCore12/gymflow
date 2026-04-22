import uuid

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
    c1 = Customer(code="KH-001", full_name="Nguyen Van A", phone="0901234567")
    c2 = Customer(code="KH-002", full_name="Tran Thi B", phone="0907654321")
    c3 = Customer(code="KH-003", full_name="Le Van C")
    db.add_all([c1, c2, c3])
    await db.commit()
    for obj in (user, c1, c2, c3):
        await db.refresh(obj)
    return user, c1, c2, c3


async def _auth_header(client: AsyncClient) -> dict:
    resp = await client.post(
        "/v1/auth/login", json={"email": "staff@gymflow.dev", "password": "pass"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_customers(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/v1/customers")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


@pytest.mark.asyncio
async def test_search_customers_by_name(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/v1/customers?q=nguyen")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["code"] == "KH-001"


@pytest.mark.asyncio
async def test_search_customers_by_phone(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/v1/customers?q=0907")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["code"] == "KH-002"


@pytest.mark.asyncio
async def test_search_customers_by_code(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/v1/customers?q=KH-003")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["full_name"] == "Le Van C"


@pytest.mark.asyncio
async def test_pagination(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/v1/customers?per_page=2&page=1")
    assert resp.status_code == 200
    assert len(resp.json()) == 2

    resp2 = await client.get("/v1/customers?per_page=2&page=2")
    assert resp2.status_code == 200
    assert len(resp2.json()) == 1


@pytest.mark.asyncio
async def test_create_customer(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    headers = await _auth_header(client)
    resp = await client.post(
        "/v1/customers",
        headers=headers,
        json={"code": "KH-004", "full_name": "Pham Van D", "phone": "0912345678"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["code"] == "KH-004"
    assert data["phone"] == "0912345678"


@pytest.mark.asyncio
async def test_get_customer(client: AsyncClient, db_session: AsyncSession):
    _, c1, _, _ = await _seed(db_session)
    resp = await client.get(f"/v1/customers/{c1.id}")
    assert resp.status_code == 200
    assert resp.json()["code"] == "KH-001"


@pytest.mark.asyncio
async def test_update_customer(client: AsyncClient, db_session: AsyncSession):
    _, c1, _, _ = await _seed(db_session)
    headers = await _auth_header(client)
    resp = await client.patch(
        f"/v1/customers/{c1.id}",
        headers=headers,
        json={"phone": "0999999999", "address": "123 Le Loi, Q1"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["phone"] == "0999999999"
    assert data["address"] == "123 Le Loi, Q1"


@pytest.mark.asyncio
async def test_get_customer_not_found(client: AsyncClient, db_session: AsyncSession):
    resp = await client.get(f"/v1/customers/{uuid.uuid4()}")
    assert resp.status_code == 404
