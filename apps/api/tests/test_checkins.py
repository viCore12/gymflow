import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.user import User, UserRole
from app.security import create_access_token, hash_password


async def _seed_user(db: AsyncSession) -> User:
    user = User(
        email="checkin-admin@gymflow.dev",
        password_hash=hash_password("pass"),
        role=UserRole.admin,
        active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def _auth_headers(db: AsyncSession) -> dict[str, str]:
    user = await _seed_user(db)
    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


async def _seed_customer(db: AsyncSession) -> Customer:
    customer = Customer(code="KH-000001", full_name="Test Customer", phone="0900000001")
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@pytest.mark.asyncio
async def test_check_in_customer(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    customer = await _seed_customer(db_session)
    resp = await client.post(
        "/v1/checkins",
        json={"customer_id": str(customer.id)},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["customer_id"] == str(customer.id)
    assert body["method"] == "manual"
    assert body["checked_in_by"] is not None


@pytest.mark.asyncio
async def test_check_in_with_notes(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    customer = await _seed_customer(db_session)
    resp = await client.post(
        "/v1/checkins",
        json={"customer_id": str(customer.id), "notes": "First visit today"},
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["notes"] == "First visit today"


@pytest.mark.asyncio
async def test_check_in_nonexistent_customer(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _auth_headers(db_session)
    resp = await client.post(
        "/v1/checkins",
        json={"customer_id": "00000000-0000-0000-0000-000000000099"},
        headers=headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_customer_checkins(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    customer = await _seed_customer(db_session)

    for _ in range(3):
        await client.post(
            "/v1/checkins",
            json={"customer_id": str(customer.id)},
            headers=headers,
        )

    resp = await client.get(
        f"/v1/checkins/customer/{customer.id}", headers=headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert len(body["items"]) == 3


@pytest.mark.asyncio
async def test_list_checkins_pagination(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    customer = await _seed_customer(db_session)

    for _ in range(5):
        await client.post(
            "/v1/checkins",
            json={"customer_id": str(customer.id)},
            headers=headers,
        )

    resp = await client.get(
        f"/v1/checkins/customer/{customer.id}?page=1&per_page=2",
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["page"] == 1


@pytest.mark.asyncio
async def test_list_checkins_ordered_desc(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _auth_headers(db_session)
    customer = await _seed_customer(db_session)

    for i in range(3):
        await client.post(
            "/v1/checkins",
            json={"customer_id": str(customer.id), "notes": f"visit-{i}"},
            headers=headers,
        )

    resp = await client.get(
        f"/v1/checkins/customer/{customer.id}", headers=headers
    )
    items = resp.json()["items"]
    assert items[0]["notes"] == "visit-2"
    assert items[2]["notes"] == "visit-0"


@pytest.mark.asyncio
async def test_list_checkins_nonexistent_customer(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _auth_headers(db_session)
    resp = await client.get(
        "/v1/checkins/customer/00000000-0000-0000-0000-000000000099",
        headers=headers,
    )
    assert resp.status_code == 404
