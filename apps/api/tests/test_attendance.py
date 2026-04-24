from datetime import date, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.staff import Staff
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


async def _seed_staff(db: AsyncSession, user: User) -> Staff:
    staff = Staff(
        user_id=user.id,
        full_name="Nguyen Van Trainer",
        role="trainer",
        hire_date=date(2025, 1, 1),
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return staff


async def _setup(db: AsyncSession) -> tuple[dict[str, str], Staff]:
    user = await _seed_user(db)
    staff = await _seed_staff(db, user)
    token = create_access_token(str(user.id))
    headers = {"Authorization": f"Bearer {token}"}
    return headers, staff


@pytest.mark.asyncio
async def test_check_in_happy_path(client: AsyncClient, db_session: AsyncSession):
    headers, staff = await _setup(db_session)
    resp = await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["staff_id"] == str(staff.id)
    assert body["check_in"] is not None
    assert body["check_out"] is None
    assert body["source"] == "manual"


@pytest.mark.asyncio
async def test_check_out_happy_path(client: AsyncClient, db_session: AsyncSession):
    headers, staff = await _setup(db_session)
    await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    resp = await client.post(
        "/v1/attendance/check-out",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["check_out"] is not None


@pytest.mark.asyncio
async def test_double_check_in_rejected(client: AsyncClient, db_session: AsyncSession):
    headers, staff = await _setup(db_session)
    await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    resp = await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_check_out_without_check_in_rejected(
    client: AsyncClient, db_session: AsyncSession
):
    headers, staff = await _setup(db_session)
    resp = await client.post(
        "/v1/attendance/check-out",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_manual_adjust_records_audit_log(
    client: AsyncClient, db_session: AsyncSession
):
    headers, staff = await _setup(db_session)
    checkin_resp = await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    attendance_id = checkin_resp.json()["id"]

    resp = await client.post(
        "/v1/attendance/manual-adjust",
        json={
            "attendance_id": attendance_id,
            "check_in": "2026-04-22T08:00:00",
            "adjustment_reason": "Forgot to clock in on time",
        },
        headers=headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["adjustment_reason"] == "Forgot to clock in on time"
    assert body["adjusted_by_user_id"] is not None

    detail_resp = await client.get(f"/v1/attendance/{attendance_id}", headers=headers)
    audit_entries = detail_resp.json()["audit_entries"]
    actions = [e["action"] for e in audit_entries]
    assert "check_in" in actions
    assert "manual_adjust" in actions

    adjust_entry = next(e for e in audit_entries if e["action"] == "manual_adjust")
    assert adjust_entry["field_changed"] == "check_in"
    assert adjust_entry["new_value"] is not None


@pytest.mark.asyncio
async def test_manual_adjust_requires_adjustment_reason(
    client: AsyncClient, db_session: AsyncSession
):
    headers, staff = await _setup(db_session)
    checkin_resp = await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    attendance_id = checkin_resp.json()["id"]

    resp = await client.post(
        "/v1/attendance/manual-adjust",
        json={
            "attendance_id": attendance_id,
            "check_in": "2026-04-22T08:00:00",
        },
        headers=headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_filter_by_staff_id(client: AsyncClient, db_session: AsyncSession):
    headers, staff = await _setup(db_session)

    user2 = User(
        email="staff2@gymflow.dev",
        password_hash=hash_password("pass"),
        role=UserRole.staff,
        active=True,
    )
    db_session.add(user2)
    await db_session.commit()
    await db_session.refresh(user2)
    staff2 = Staff(
        user_id=user2.id,
        full_name="Other Staff",
        role="staff",
        hire_date=date(2025, 1, 1),
    )
    db_session.add(staff2)
    await db_session.commit()
    await db_session.refresh(staff2)

    await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )

    resp = await client.get(
        f"/v1/attendance?staff_id={staff.id}", headers=headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["staff_id"] == str(staff.id)

    resp2 = await client.get(
        f"/v1/attendance?staff_id={staff2.id}", headers=headers
    )
    assert resp2.json()["total"] == 0


@pytest.mark.asyncio
async def test_filter_by_date_range(client: AsyncClient, db_session: AsyncSession):
    from app.models.attendance import Attendance

    headers, staff = await _setup(db_session)

    today = date.today()
    yesterday = today - timedelta(days=1)

    db_session.add(
        Attendance(
            staff_id=staff.id,
            date=yesterday,
            source="manual",
        )
    )
    db_session.add(
        Attendance(
            staff_id=staff.id,
            date=today,
            source="manual",
        )
    )
    await db_session.commit()

    resp = await client.get(
        f"/v1/attendance?date_from={today}&date_to={today}",
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


@pytest.mark.asyncio
async def test_get_attendance_returns_audit_trail(
    client: AsyncClient, db_session: AsyncSession
):
    headers, staff = await _setup(db_session)
    checkin_resp = await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id), "notes": "Morning shift"},
        headers=headers,
    )
    attendance_id = checkin_resp.json()["id"]

    await client.post(
        "/v1/attendance/check-out",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )

    resp = await client.get(f"/v1/attendance/{attendance_id}", headers=headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["audit_entries"]) == 2
    actions = [e["action"] for e in body["audit_entries"]]
    assert "check_in" in actions
    assert "check_out" in actions


@pytest.mark.asyncio
async def test_get_attendance_not_found(client: AsyncClient, db_session: AsyncSession):
    headers, _ = await _setup(db_session)
    resp = await client.get(
        "/v1/attendance/00000000-0000-0000-0000-000000000001",
        headers=headers,
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_attendance_unauthenticated(client: AsyncClient):
    resp = await client.get("/v1/attendance")
    assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_check_in_staff_full_name_returned(
    client: AsyncClient, db_session: AsyncSession
):
    headers, staff = await _setup(db_session)
    resp = await client.post(
        "/v1/attendance/check-in",
        json={"staff_id": str(staff.id)},
        headers=headers,
    )
    assert resp.status_code == 201
    assert resp.json()["staff_full_name"] == "Nguyen Van Trainer"
