from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RefreshRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth import authenticate_user

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    tokens = await authenticate_user(db, body.email, body.password)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return tokens


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(body: RefreshRequest):
    from app.security import create_access_token, decode_token

    payload = decode_token(body.refresh_token)
    sub = payload.get("sub")
    token_type = payload.get("type")
    if not sub or token_type != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    return AccessTokenResponse(access_token=create_access_token(sub))


@router.get("/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(user.id), email=user.email, role=user.role.value, active=user.active
    )
