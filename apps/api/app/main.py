from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.v1.router import v1_router
from app.database import engine
from app.exceptions import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


app = FastAPI(
    title="GymFlow API",
    version="0.1.0",
    lifespan=lifespan,
)

register_exception_handlers(app)
app.include_router(v1_router, prefix="/v1")
