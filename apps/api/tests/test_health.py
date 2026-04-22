import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_ok(client: AsyncClient):
    resp = await client.get("/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["version"] == "0.1.0"
    assert "db" in body
