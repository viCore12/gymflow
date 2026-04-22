from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.customers import router as customers_router
from app.api.v1.health import router as health_router
from app.api.v1.inventory import router as inventory_router
from app.api.v1.membership_plans import router as plans_router
from app.api.v1.memberships import router as memberships_router
from app.api.v1.orders import router as orders_router
from app.api.v1.products import router as products_router

v1_router = APIRouter()
v1_router.include_router(health_router, tags=["health"])
v1_router.include_router(auth_router, prefix="/auth", tags=["auth"])
v1_router.include_router(customers_router, prefix="/customers", tags=["customers"])
v1_router.include_router(products_router, prefix="/products", tags=["products"])
v1_router.include_router(plans_router, prefix="/membership-plans", tags=["membership-plans"])
v1_router.include_router(memberships_router, prefix="/memberships", tags=["memberships"])
v1_router.include_router(orders_router, prefix="/orders", tags=["orders"])
v1_router.include_router(inventory_router, prefix="/inventory", tags=["inventory"])
