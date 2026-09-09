from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

import models
import schemas
from auth import create_access_token, hash_password, verify_password
from dependencies import get_db, get_current_user
from google_auth import verify_google_identity

router = APIRouter(tags=["Auth"])



@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    valid_roles = ["job_seeker", "company"]

    if user.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail="Role must be either job_seeker or company"
        )

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login", response_model=schemas.TokenResponse)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_is_correct = verify_password(
        user.password,
        existing_user.password_hash
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return token_response(existing_user)


def token_response(existing_user):
    access_token = create_access_token(
        data={
            "sub": existing_user.email,
            "user_id": existing_user.id,
            "role": existing_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": existing_user,
    }

@router.post("/auth/google", response_model=schemas.TokenResponse)
def google_login(data: schemas.GoogleLogin, db: Session = Depends(get_db)):
    claims = verify_google_identity(data.credential)
    user = db.query(models.User).filter(models.User.google_sub == claims["sub"]).first()
    if user:
        return token_response(user)
    matches = db.query(models.User).filter(func.lower(models.User.email) == claims["email"]).with_for_update().all()
    if len(matches) > 1:
        raise HTTPException(409, "Multiple accounts match this email. Please use email/password login.")
    user = matches[0] if matches else None
    if user:
        if user.google_sub and user.google_sub != claims["sub"]:
            raise HTTPException(409, "This account is linked to another Google identity.")
        authoritative = claims["email"].endswith("@gmail.com") or bool(claims.get("hd"))
        if not authoritative and not (data.password and verify_password(data.password, user.password_hash)):
            raise HTTPException(403, "Enter your existing Mihna password below, then try Continue with Google again to link this email securely.")
        user.google_sub = claims["sub"]
    else:
        name = claims.get("name")
        if not isinstance(name, str) or not name.strip():
            raise HTTPException(401, "Google did not provide a name.")
        user = models.User(name=name.strip()[:255], email=claims["email"],
                           google_sub=claims["sub"], password_hash=None, role="job_seeker")
        db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Account changed during sign-in. Please try again.") from None
    db.refresh(user)
    return token_response(user)


@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
