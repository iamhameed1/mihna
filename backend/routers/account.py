import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

import models
import schemas
from account_security import (CODE_LIFETIME, GENERIC_SENT, aware, consume_code, digest,
                              find_user, invalidate_user_codes, issue_code, lock_user,
                              normalize_email, now, request_limits)
from auth import hash_password, verify_password
from dependencies import get_current_user, get_db
from email_service import deliver_code, email_settings

router = APIRouter(tags=["Account"])


def commit_profile(db, user):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Email is already in use. Choose another email.") from None
    db.refresh(user)
    return user


@router.patch("/users/me", response_model=schemas.UserResponse)
def update_profile(data: schemas.ProfileUpdate, db: Session = Depends(get_db),
                   current_user: models.User = Depends(get_current_user)):
    user = lock_user(db, current_user.id)
    user.name = data.name
    return commit_profile(db, user)


@router.post("/users/me/password", response_model=schemas.UserResponse)
def update_password(data: schemas.PasswordUpdate, request: Request, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    request_limits(db, request, f"user:{current_user.id}")
    user = lock_user(db, current_user.id)
    if user.has_password and not (data.current_password and
                                  verify_password(data.current_password, user.password_hash)):
        raise HTTPException(400, "Current password is incorrect.")
    user.password_hash = hash_password(data.new_password)
    invalidate_user_codes(db, user.id, ["reset_password"])
    return commit_profile(db, user)


@router.post("/users/me/change-email", response_model=schemas.MessageResponse)
def change_email(data: schemas.EmailRequest, request: Request, background: BackgroundTasks,
                 db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    email = normalize_email(data.email)
    email_settings()
    request_limits(db, request, email, sending=True, user_id=current_user.id)
    user = lock_user(db, current_user.id)
    if email == normalize_email(user.email):
        raise HTTPException(400, "Enter a different email address.")
    if find_user(db, email):
        raise HTTPException(409, "Email is already in use. Choose another email.")
    code = issue_code(db, email, "change_email", user)
    background.add_task(deliver_code, email, code, "change_email")
    return {"message": "A verification code has been sent to your new email. Your current email is unchanged."}


@router.post("/users/me/verify-new-email", response_model=schemas.UserResponse)
def verify_new_email(data: schemas.EmailCode, request: Request, db: Session = Depends(get_db),
                     current_user: models.User = Depends(get_current_user)):
    email = normalize_email(data.email)
    request_limits(db, request, email)
    user = lock_user(db, current_user.id)
    consume_code(db, email, "change_email", data.code, user.id)
    other = find_user(db, email)
    if other and other.id != user.id:
        raise HTTPException(409, "Email is already in use. Choose another email.")
    user.email = email
    user.email_verified = True
    # Old-mailbox challenges and any outstanding reset grants must stop working.
    invalidate_user_codes(db, user.id)
    return commit_profile(db, user)


def send_public_code(data, request, background, db, purpose):
    email = normalize_email(data.email)
    # Configuration and limits are identical for existing and nonexistent addresses.
    email_settings()
    request_limits(db, request, email, sending=True)
    user = find_user(db, email)
    if user:
        user = lock_user(db, user.id)
        if normalize_email(user.email) != email:
            user = None
    eligible = user is not None and (purpose == "reset_password" or not user.email_verified)
    code = issue_code(db, email, purpose, user if eligible else None)
    if eligible:
        background.add_task(deliver_code, email, code, purpose)
    return GENERIC_SENT


@router.post("/auth/send-verification-code", response_model=schemas.MessageResponse)
@router.post("/auth/resend-verification-code", response_model=schemas.MessageResponse)
def send_verification(data: schemas.EmailRequest, request: Request, background: BackgroundTasks,
                      db: Session = Depends(get_db)):
    return send_public_code(data, request, background, db, "verify_email")


@router.post("/auth/verify-email", response_model=schemas.MessageResponse)
def verify_email(data: schemas.EmailCode, request: Request, db: Session = Depends(get_db)):
    email = normalize_email(data.email)
    request_limits(db, request, email)
    user = find_user(db, email)
    if not user:
        raise HTTPException(400, "Invalid code.")
    user = lock_user(db, user.id)
    if normalize_email(user.email) != email:
        raise HTTPException(400, "Invalid code.")
    consume_code(db, email, "verify_email", data.code, user.id)
    user.email_verified = True
    db.commit()
    return {"message": "Email verified successfully."}


@router.post("/auth/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(data: schemas.EmailRequest, request: Request, background: BackgroundTasks,
                    db: Session = Depends(get_db)):
    return send_public_code(data, request, background, db, "reset_password")


@router.post("/auth/verify-reset-code", response_model=schemas.ResetCodeResponse)
def verify_reset_code(data: schemas.EmailCode, request: Request, db: Session = Depends(get_db)):
    email = normalize_email(data.email)
    request_limits(db, request, email)
    user = find_user(db, email)
    if not user:
        raise HTTPException(400, "Invalid code.")
    user = lock_user(db, user.id)
    if normalize_email(user.email) != email:
        raise HTTPException(400, "Invalid code.")
    challenge = consume_code(db, email, "reset_password", data.code, user.id)
    # A random bearer grant authorizes only password reset; it is never a Mihna JWT.
    reset_token = secrets.token_urlsafe(32)
    challenge.reset_token_hash = digest(f"reset:{reset_token}")
    challenge.reset_expires_at = now() + CODE_LIFETIME
    db.commit()
    return {"reset_token": reset_token}


@router.post("/auth/reset-password", response_model=schemas.MessageResponse)
def reset_password(data: schemas.PasswordReset, request: Request, db: Session = Depends(get_db)):
    request_limits(db, request, "reset:" + digest(data.reset_token))
    token_hash = digest(f"reset:{data.reset_token}")
    challenge = db.query(models.AuthCode).filter(models.AuthCode.reset_token_hash == token_hash).first()
    if not challenge or not challenge.user_id:
        raise HTTPException(400, "Invalid or expired reset session. Request a new code.")
    user = lock_user(db, challenge.user_id)
    challenge = db.query(models.AuthCode).filter(models.AuthCode.id == challenge.id).populate_existing().with_for_update().one()
    if (challenge.purpose != "reset_password" or challenge.used_at is None
            or challenge.reset_used_at is not None or challenge.reset_expires_at is None
            or aware(challenge.reset_expires_at) <= now()
            or normalize_email(user.email) != challenge.email):
        raise HTTPException(400, "Invalid, expired, or already-used reset session. Request a new code.")
    user.password_hash = hash_password(data.new_password)
    user.email_verified = True
    invalidate_user_codes(db, user.id, ["reset_password", "verify_email"])
    db.commit()
    return {"message": "Password reset successfully. Sign in with your new password."}
