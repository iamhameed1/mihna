from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models
from auth import decode_access_token
from database import SessionLocal


bearer_scheme = HTTPBearer()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate login token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    email = payload.get("sub")

    if email is None:
        raise credentials_exception

    # Email is mutable. Existing Mihna tokens already carry the stable user ID.
    user_id = payload.get("user_id")
    if not isinstance(user_id, int):
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == user_id).first()

    if user is None:
        raise credentials_exception

    return user


def require_company_user(
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "company":
        raise HTTPException(
            status_code=403,
            detail="Only company accounts can perform this action"
        )

    return current_user


def require_job_seeker_user(
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "job_seeker":
        raise HTTPException(
            status_code=403,
            detail="Only job seeker accounts can save jobs"
        )

    return current_user
