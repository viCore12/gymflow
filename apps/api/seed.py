"""Seed script — creates admin user and 100 sample customers."""
import asyncio
import random

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, engine
from app.models.customer import Customer, Gender
from app.models.user import User, UserRole
from app.security import hash_password

ADMIN_EMAIL = "admin@gymflow.local"
ADMIN_PASSWORD = "admin123"

FIRST_NAMES = [
    "Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Phan", "Vu",
    "Vo", "Dang", "Bui", "Do", "Ho", "Ngo", "Duong", "Ly",
]
MIDDLE_NAMES = [
    "Van", "Thi", "Duc", "Minh", "Quang", "Thanh", "Hong", "Ngoc",
    "Anh", "Tuan", "Hai", "Mai", "Thu", "Lan", "Hoa", "Phuong",
]
LAST_NAMES = [
    "An", "Binh", "Cuong", "Dung", "Em", "Phuc", "Giang", "Hieu",
    "Khanh", "Linh", "Mai", "Nam", "Oanh", "Phong", "Quyen", "Son",
    "Tam", "Uyen", "Vy", "Xuan",
]
GENDERS = [Gender.male, Gender.female, Gender.other]
DISTRICTS = [
    "Q1", "Q2", "Q3", "Q5", "Q7", "Q10", "Binh Thanh", "Go Vap",
    "Phu Nhuan", "Tan Binh", "Thu Duc",
]


def _random_phone() -> str:
    prefix = random.choice(["090", "091", "093", "097", "098", "070", "079"])
    return prefix + "".join(str(random.randint(0, 9)) for _ in range(7))


def _random_name() -> str:
    return f"{random.choice(FIRST_NAMES)} {random.choice(MIDDLE_NAMES)} {random.choice(LAST_NAMES)}"


async def seed_admin(session: AsyncSession) -> None:
    result = await session.execute(
        select(User).where(User.email == ADMIN_EMAIL)
    )
    if result.scalar_one_or_none():
        print(f"Admin user {ADMIN_EMAIL} already exists, skipping.")
        return
    admin = User(
        email=ADMIN_EMAIL,
        password_hash=hash_password(ADMIN_PASSWORD),
        role=UserRole.admin,
        active=True,
    )
    session.add(admin)
    await session.commit()
    print(f"Created admin user: {ADMIN_EMAIL}")


async def seed_customers(session: AsyncSession, count: int = 100) -> None:
    result = await session.execute(select(func.count()).select_from(Customer))
    existing = result.scalar_one()
    if existing >= count:
        print(f"{existing} customers already exist, skipping seed.")
        return

    to_create = count - existing
    used_phones: set[str] = set()
    customers = []

    for i in range(to_create):
        seq = existing + i + 1
        phone = _random_phone()
        while phone in used_phones:
            phone = _random_phone()
        used_phones.add(phone)

        gender = random.choice(GENDERS)
        customers.append(
            Customer(
                code=f"KH-{seq:06d}",
                full_name=_random_name(),
                phone=phone,
                gender=gender,
                address=f"{random.randint(1, 200)} {random.choice(DISTRICTS)}, TP.HCM",
                notes=None,
            )
        )

    session.add_all(customers)
    await session.commit()
    print(f"Seeded {to_create} customers (total: {existing + to_create}).")


async def main() -> None:
    try:
        async with async_session() as session:
            await seed_admin(session)
            await seed_customers(session)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
