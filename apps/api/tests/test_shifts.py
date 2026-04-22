import uuid
from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
from app.models.user import User, UserRole
from app.security import create_access_token, hash_password


async def _seed_user(db: AsyncSession, email: str = "shift-admin@gymflow.dev") -> User:
    user = User(
        email=email,
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


async def _seed_staff(db: AsyncSession) -> Staff:
    # SQLite tests don't enforce FK constraints so user_id can be any UUID
    staff = Staff(
        user_id=uuid.uuid4(),
        full_name="Alice Trainer",
        role="trainer",
        hire_date=date(2024, 1, 1),
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff


# ---------------------------------------------------------------------------
# Happy-path CRUD
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_shift(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    resp = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-01",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["staff_id"] == str(staff.id)
    assert body["date"] == "2026-05-01"
    assert body["shift_type"] == "regular"
    assert body["is_cancelled"] is False
    assert body["staff_full_name"] == "Alice Trainer"


@pytest.mark.asyncio
async def test_get_shift(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    created = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-02",
            "start_time": "08:00:00",
            "end_time": "16:00:00",
        },
        headers=headers,
    )
    shift_id = created.json()["id"]

    resp = await client.get(f"/v1/shifts/{shift_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == shift_id


@pytest.mark.asyncio
async def test_update_shift(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    created = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-03",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=headers,
    )
    shift_id = created.json()["id"]

    resp = await client.patch(
        f"/v1/shifts/{shift_id}",
        json={"shift_type": "overtime", "notes": "Extra coverage"},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["shift_type"] == "overtime"
    assert body["notes"] == "Extra coverage"


@pytest.mark.asyncio
async def test_soft_cancel_shift(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    created = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-04",
            "start_time": "09:00:00",
            "end_time": "13:00:00",
        },
        headers=headers,
    )
    shift_id = created.json()["id"]

    resp = await client.delete(f"/v1/shifts/{shift_id}", headers=headers)
    assert resp.status_code == 204

    # Fetch and confirm is_cancelled=True (soft delete, not hard)
    resp = await client.get(f"/v1/shifts/{shift_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["is_cancelled"] is True


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_start_time_must_be_before_end_time(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    resp = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-05",
            "start_time": "17:00:00",
            "end_time": "09:00:00",
        },
        headers=headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_equal_start_end_time_rejected(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    resp = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-06",
            "start_time": "10:00:00",
            "end_time": "10:00:00",
        },
        headers=headers,
    )
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Overlap detection
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_overlapping_shift_rejected(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-10",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=headers,
    )

    # Overlapping: 10:00-12:00 is inside 09:00-17:00
    resp = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-10",
            "start_time": "10:00:00",
            "end_time": "12:00:00",
        },
        headers=headers,
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_adjacent_shifts_allowed(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-11",
            "start_time": "09:00:00",
            "end_time": "13:00:00",
        },
        headers=headers,
    )

    # Adjacent (starts exactly when previous ends): should succeed
    resp = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-11",
            "start_time": "13:00:00",
            "end_time": "17:00:00",
        },
        headers=headers,
    )
    assert resp.status_code == 201


@pytest.mark.asyncio
async def test_cancelled_shift_does_not_block_overlap(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    created = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-12",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=headers,
    )
    shift_id = created.json()["id"]
    await client.delete(f"/v1/shifts/{shift_id}", headers=headers)

    # Same slot should now be bookable since the original is cancelled
    resp = await client.post(
        "/v1/shifts",
        json={
            "staff_id": str(staff.id),
            "date": "2026-05-12",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=headers,
    )
    assert resp.status_code == 201


# ---------------------------------------------------------------------------
# Filtering
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_filter_by_staff_id(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff_a = await _seed_staff(db_session)
    staff_b = Staff(
        user_id=uuid.uuid4(),
        full_name="Bob Coach",
        role="coach",
        hire_date=date(2024, 1, 1),
    )
    db_session.add(staff_b)
    await db_session.commit()
    await db_session.refresh(staff_b)

    for staff, day in [(staff_a, "01"), (staff_a, "02"), (staff_b, "03")]:
        await client.post(
            "/v1/shifts",
            json={
                "staff_id": str(staff.id),
                "date": f"2026-06-{day}",
                "start_time": "09:00:00",
                "end_time": "17:00:00",
            },
            headers=headers,
        )

    resp = await client.get(f"/v1/shifts?staff_id={staff_a.id}", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert all(item["staff_id"] == str(staff_a.id) for item in body["items"])


@pytest.mark.asyncio
async def test_filter_by_date_range(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    for day in ["01", "05", "10", "20"]:
        await client.post(
            "/v1/shifts",
            json={
                "staff_id": str(staff.id),
                "date": f"2026-07-{day}",
                "start_time": "09:00:00",
                "end_time": "17:00:00",
            },
            headers=headers,
        )

    resp = await client.get(
        "/v1/shifts?date_from=2026-07-04&date_to=2026-07-15",
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    dates = {item["date"] for item in body["items"]}
    assert dates == {"2026-07-05", "2026-07-10"}


@pytest.mark.asyncio
async def test_list_shifts_pagination(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)
    staff = await _seed_staff(db_session)

    for day in range(1, 6):
        await client.post(
            "/v1/shifts",
            json={
                "staff_id": str(staff.id),
                "date": f"2026-08-{day:02d}",
                "start_time": "09:00:00",
                "end_time": "17:00:00",
            },
            headers=headers,
        )

    resp = await client.get("/v1/shifts?page=1&per_page=2", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["page"] == 1


@pytest.mark.asyncio
async def test_nonexistent_staff_returns_404(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)

    resp = await client.post(
        "/v1/shifts",
        json={
            "staff_id": "00000000-0000-0000-0000-000000000099",
            "date": "2026-09-01",
            "start_time": "09:00:00",
            "end_time": "17:00:00",
        },
        headers=headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_shift_returns_404(client: AsyncClient, db_session: AsyncSession):
    headers = await _auth_headers(db_session)

    resp = await client.get(
        "/v1/shifts/00000000-0000-0000-0000-000000000099",
        headers=headers,
    )
    assert resp.status_code == 404
