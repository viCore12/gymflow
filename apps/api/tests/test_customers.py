import time

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.customer import Customer
from app.models.user import User, UserRole
from app.security import create_access_token, hash_password


async def _seed_user(db: AsyncSession) -> User:
    user = User(
        email="admin@gymflow.dev",
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


@pytest.mark.asyncio
async def test_create_customer(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    resp = await client.post(
        "/v1/customers",
        json={"full_name": "Nguyen Van A", "phone": "0901234567"},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["full_name"] == "Nguyen Van A"
    assert body["phone"] == "0901234567"
    assert body["code"].startswith("KH-")


@pytest.mark.asyncio
async def test_create_customer_auto_code(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    resp1 = await client.post(
        "/v1/customers", json={"full_name": "A"}, headers=headers
    )
    resp2 = await client.post(
        "/v1/customers", json={"full_name": "B"}, headers=headers
    )
    assert resp1.json()["code"] == "KH-000001"
    assert resp2.json()["code"] == "KH-000002"


@pytest.mark.asyncio
async def test_create_customer_duplicate_phone(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _auth_headers(db_session)
    await client.post(
        "/v1/customers",
        json={"full_name": "A", "phone": "0901111111"},
        headers=headers,
    )
    resp = await client.post(
        "/v1/customers",
        json={"full_name": "B", "phone": "0901111111"},
        headers=headers,
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_get_customer(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    create_resp = await client.post(
        "/v1/customers",
        json={"full_name": "Tran B", "gender": "female"},
        headers=headers,
    )
    cid = create_resp.json()["id"]
    resp = await client.get(f"/v1/customers/{cid}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "Tran B"
    assert resp.json()["gender"] == "female"


@pytest.mark.asyncio
async def test_get_customer_not_found(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    resp = await client.get(
        "/v1/customers/00000000-0000-0000-0000-000000000001", headers=headers
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_customer(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    create_resp = await client.post(
        "/v1/customers", json={"full_name": "Old Name"}, headers=headers
    )
    cid = create_resp.json()["id"]
    resp = await client.patch(
        f"/v1/customers/{cid}",
        json={"full_name": "New Name", "phone": "0909999999"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["full_name"] == "New Name"
    assert resp.json()["phone"] == "0909999999"


@pytest.mark.asyncio
async def test_delete_customer(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    create_resp = await client.post(
        "/v1/customers", json={"full_name": "To Delete"}, headers=headers
    )
    cid = create_resp.json()["id"]
    resp = await client.delete(f"/v1/customers/{cid}", headers=headers)
    assert resp.status_code == 204
    get_resp = await client.get(f"/v1/customers/{cid}", headers=headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_list_customers_pagination(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _auth_headers(db_session)
    for i in range(5):
        await client.post(
            "/v1/customers", json={"full_name": f"Customer {i}"}, headers=headers
        )
    resp = await client.get("/v1/customers?page=1&per_page=2", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["page"] == 1
    assert body["per_page"] == 2


@pytest.mark.asyncio
async def test_search_customers_by_name(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _auth_headers(db_session)
    await client.post(
        "/v1/customers", json={"full_name": "Nguyen Van A"}, headers=headers
    )
    await client.post(
        "/v1/customers", json={"full_name": "Tran Thi B"}, headers=headers
    )
    resp = await client.get("/v1/customers?q=Nguyen", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["full_name"] == "Nguyen Van A"


@pytest.mark.asyncio
async def test_search_customers_by_phone(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _auth_headers(db_session)
    await client.post(
        "/v1/customers",
        json={"full_name": "Phone User", "phone": "0912345678"},
        headers=headers,
    )
    resp = await client.get("/v1/customers?q=0912345678", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


@pytest.mark.asyncio
async def test_add_contact(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    create_resp = await client.post(
        "/v1/customers", json={"full_name": "Contact Test"}, headers=headers
    )
    cid = create_resp.json()["id"]
    resp = await client.post(
        f"/v1/customers/{cid}/contacts",
        json={
            "contact_type": "emergency",
            "value": "0999888777",
            "label": "Mom",
            "is_primary": True,
        },
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["contact_type"] == "emergency"
    assert resp.json()["value"] == "0999888777"
    assert resp.json()["label"] == "Mom"


@pytest.mark.asyncio
async def test_delete_contact(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    create_resp = await client.post(
        "/v1/customers", json={"full_name": "Contact Del"}, headers=headers
    )
    cid = create_resp.json()["id"]
    contact_resp = await client.post(
        f"/v1/customers/{cid}/contacts",
        json={"contact_type": "phone", "value": "0111222333"},
        headers=headers,
    )
    contact_id = contact_resp.json()["id"]
    resp = await client.delete(
        f"/v1/customers/contacts/{contact_id}", headers=headers
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_create_customer_with_contacts(
    client: AsyncClient, db_session: AsyncSession
):
    headers = await _auth_headers(db_session)
    resp = await client.post(
        "/v1/customers",
        json={
            "full_name": "Full Create",
            "contacts": [
                {"contact_type": "phone", "value": "0111000111"},
                {"contact_type": "emergency", "value": "0222000222", "label": "Dad"},
            ],
        },
        headers=headers,
    )
    assert resp.status_code == 201
    assert len(resp.json()["contacts"]) == 2


@pytest.mark.asyncio
async def test_search_100_customers_under_300ms(
    client: AsyncClient, db_session: AsyncSession
):
    """AC: 100 KH mẫu, search/filter phan hồi <300ms."""
    headers = await _auth_headers(db_session)
    for i in range(100):
        db_session.add(
            Customer(
                code=f"KH-{i + 1:06d}",
                full_name=f"Customer {i}",
                phone=f"09{i:08d}",
            )
        )
    await db_session.commit()

    start = time.monotonic()
    resp = await client.get("/v1/customers?q=Customer 5", headers=headers)
    elapsed_ms = (time.monotonic() - start) * 1000

    assert resp.status_code == 200
    assert resp.json()["total"] >= 1
    assert elapsed_ms < 300, f"Search took {elapsed_ms:.0f}ms, exceeds 300ms"


@pytest.mark.asyncio
async def test_filter_by_gender(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    await client.post(
        "/v1/customers",
        json={"full_name": "Male User", "gender": "male"},
        headers=headers,
    )
    await client.post(
        "/v1/customers",
        json={"full_name": "Female User", "gender": "female"},
        headers=headers,
    )
    resp = await client.get("/v1/customers?gender=female", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["items"][0]["full_name"] == "Female User"


@pytest.mark.asyncio
async def test_unauthenticated_access(client: AsyncClient):
    resp = await client.get("/v1/customers")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_list_items_include_email_dob_is_active(
    client: AsyncClient, db_session: AsyncSession
):
    """BLU-464: CustomerListItem must expose email, dob, is_active."""
    headers = await _auth_headers(db_session)
    resp = await client.post(
        "/v1/customers",
        json={
            "full_name": "ListItem Test",
            "dob": "1990-05-15",
            "contacts": [
                {"contact_type": "email", "value": "test@example.com", "is_primary": True},
            ],
        },
        headers=headers,
    )
    assert resp.status_code == 201
    cid = resp.json()["id"]
    assert resp.json()["is_active"] is True

    list_resp = await client.get("/v1/customers", headers=headers)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    entry = [i for i in items if i["id"] == cid][0]
    assert entry["email"] == "test@example.com"
    assert entry["dob"] == "1990-05-15"
    assert entry["is_active"] is True


@pytest.mark.asyncio
async def test_list_item_email_fallback_no_primary(
    client: AsyncClient, db_session: AsyncSession
):
    """BLU-464: email fallbacks to first email when no primary."""
    headers = await _auth_headers(db_session)
    resp = await client.post(
        "/v1/customers",
        json={
            "full_name": "Fallback Email Test",
            "contacts": [
                {"contact_type": "email", "value": "first@example.com"},
                {"contact_type": "email", "value": "second@example.com"},
            ],
        },
        headers=headers,
    )
    assert resp.status_code == 201

    list_resp = await client.get("/v1/customers", headers=headers)
    items = list_resp.json()["items"]
    entry = [i for i in items if i["id"] == resp.json()["id"]][0]
    assert entry["email"] == "first@example.com"


@pytest.mark.asyncio
async def test_update_customer_is_active(
    client: AsyncClient, db_session: AsyncSession
):
    """BLU-464: is_active can be toggled via update."""
    headers = await _auth_headers(db_session)
    create_resp = await client.post(
        "/v1/customers",
        json={"full_name": "Toggle Active"},
        headers=headers,
    )
    cid = create_resp.json()["id"]

    patch_resp = await client.patch(
        f"/v1/customers/{cid}",
        json={"is_active": False},
        headers=headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["is_active"] is False

    list_resp = await client.get("/v1/customers", headers=headers)
    items = list_resp.json()["items"]
    entry = [i for i in items if i["id"] == cid][0]
    assert entry["is_active"] is False


@pytest.mark.asyncio
async def test_list_item_no_email_when_no_contact(
    client: AsyncClient, db_session: AsyncSession
):
    """BLU-464: email is None when no email contact exists."""
    headers = await _auth_headers(db_session)
    resp = await client.post(
        "/v1/customers",
        json={"full_name": "No Email User"},
        headers=headers,
    )
    assert resp.status_code == 201

    list_resp = await client.get("/v1/customers", headers=headers)
    items = list_resp.json()["items"]
    entry = [i for i in items if i["id"] == resp.json()["id"]][0]
    assert entry["email"] is None
    assert entry["dob"] is None
    assert entry["is_active"] is True
