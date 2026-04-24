from fastapi import APIRouter
from sqlalchemy import text

from app.database import async_session

router = APIRouter()


@router.get("/health")
async def health_check():
    db_status = "disconnected"
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception:
        pass
    return {"status": "ok", "version": "0.1.0", "db": db_status}
