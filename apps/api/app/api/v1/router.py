from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.checkins import router as checkins_router
from app.api.v1.customers import router as customers_router
from app.api.v1.health import router as health_router
from app.api.v1.pt_sessions import router as pt_sessions_router

v1_router = APIRouter()
v1_router.include_router(health_router, tags=["health"])
v1_router.include_router(auth_router, prefix="/auth", tags=["auth"])
v1_router.include_router(customers_router, prefix="/customers", tags=["customers"])
v1_router.include_router(checkins_router, prefix="/checkins", tags=["checkins"])
v1_router.include_router(pt_sessions_router, prefix="/pt-sessions", tags=["pt-sessions"])
