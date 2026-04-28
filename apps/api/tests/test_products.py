import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

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
    p1 = Product(sku="WB-001", name="Binh nuoc 1L", price=50_000, stock=100)
    p2 = Product(sku="GL-001", name="Gang tay tap", price=200_000, stock=50)
    p3 = Product(sku="MAT-001", name="Tham yoga", price=300_000, stock=0, active=False)
    db.add_all([p1, p2, p3])
    await db.commit()
    for obj in (user, p1, p2, p3):
        await db.refresh(obj)
    return user, p1, p2, p3


async def _auth_header(client: AsyncClient) -> dict:
    resp = await client.post(
        "/v1/auth/login", json={"email": "staff@gymflow.dev", "password": "pass"}
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_list_products_active_only(client: AsyncClient, db_session: AsyncSession):
    _, p1, p2, p3 = await _seed(db_session)
    resp = await client.get("/v1/products")
    assert resp.status_code == 200
    items = resp.json()
    skus = [i["sku"] for i in items]
    assert "WB-001" in skus
    assert "GL-001" in skus
    assert "MAT-001" not in skus


@pytest.mark.asyncio
async def test_list_products_all(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/v1/products?active_only=false")
    assert resp.status_code == 200
    assert len(resp.json()) == 3


@pytest.mark.asyncio
async def test_search_products(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    resp = await client.get("/v1/products?q=binh&active_only=false")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["sku"] == "WB-001"


@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, db_session: AsyncSession):
    await _seed(db_session)
    headers = await _auth_header(client)
    resp = await client.post(
        "/v1/products",
        headers=headers,
        json={"sku": "SHOE-01", "name": "Giay tap", "price": 500000, "stock": 20},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["sku"] == "SHOE-01"
    assert data["active"] is True


@pytest.mark.asyncio
async def test_get_product(client: AsyncClient, db_session: AsyncSession):
    _, p1, _, _ = await _seed(db_session)
    resp = await client.get(f"/v1/products/{p1.id}")
    assert resp.status_code == 200
    assert resp.json()["sku"] == "WB-001"


@pytest.mark.asyncio
async def test_update_product(client: AsyncClient, db_session: AsyncSession):
    _, p1, _, _ = await _seed(db_session)
    headers = await _auth_header(client)
    resp = await client.patch(
        f"/v1/products/{p1.id}",
        headers=headers,
        json={"price": 60000},
    )
    assert resp.status_code == 200
    assert float(resp.json()["price"]) == 60000


@pytest.mark.asyncio
async def test_get_product_not_found(client: AsyncClient, db_session: AsyncSession):
    import uuid

    resp = await client.get(f"/v1/products/{uuid.uuid4()}")
    assert resp.status_code == 404
