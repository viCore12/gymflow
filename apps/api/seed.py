"""Seed script — creates admin user if not exists."""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session, engine
from app.models.user import User, UserRole
from app.security import hash_password

ADMIN_EMAIL = "admin@gymflow.local"
ADMIN_PASSWORD = "admin123"


async def seed() -> None:
    async with async_session() as session:
        session: AsyncSession
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


async def main() -> None:
    try:
        await seed()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
