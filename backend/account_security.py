"""Database-backed, single-use email challenges and request limits."""
import hashlib
import hmac
import os
import secrets
import time
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import case, func

import models

CODE_LIFETIME = timedelta(minutes=10)
GENERIC_SENT = {"message": "If this email is eligible, a code will arrive shortly. Check your inbox and spam folder."}


def now():
    return datetime.now(timezone.utc)


def aware(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def normalize_email(email):
    return str(email).strip().lower()


def digest(value):
    key = os.getenv("AUTH_CODE_SECRET", "")
    if len(key) < 32:
        raise HTTPException(503, "Email verification is not configured. Please try again later.")
    return hmac.new(key.encode(), value.encode(), hashlib.sha256).hexdigest()


def code_digest(email, purpose, code):
    return digest(f"code:{purpose}:{email}:{code}")


def limit(db, scope, identity, seconds, maximum):
    """Atomic fixed-window counter shared across workers; no raw email/IP in keys."""
    from sqlalchemy.dialects.postgresql import insert as pg_insert
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    key = digest(f"rate:{scope}:{identity}")
    window = int(time.time()) // seconds * seconds
    table = models.AuthRateLimit.__table__
    insert = pg_insert if db.bind.dialect.name == "postgresql" else sqlite_insert
    stmt = insert(table).values(key=key, window_start=window, count=1)
    same_window = table.c.window_start == window
    stmt = stmt.on_conflict_do_update(index_elements=[table.c.key], set_={
        "window_start": window,
        "count": case((same_window, table.c.count + 1), else_=1),
    }).returning(table.c.count)
    count = db.execute(stmt).scalar_one()
    # Commit limits even when the subsequent operation fails or rolls back.
    db.commit()
    if count > maximum:
        raise HTTPException(429, "Too many attempts. Please wait and try again.",
                            headers={"Retry-After": str(seconds - int(time.time()) % seconds)})


def request_limits(db, request, email, sending=False, user_id=None):
    ip = request.client.host if request.client else "unknown"
    # Do not trust arbitrary X-Forwarded-For headers here; configure Uvicorn's trusted proxy list.
    limit(db, "send-ip" if sending else "check-ip", ip, 3600, 30 if sending else 120)
    limit(db, "send-email" if sending else "check-email", email, 3600, 5 if sending else 30)
    if sending:
        limit(db, "send-cooldown", email, 60, 1)
        if user_id is not None:
            limit(db, "send-user", str(user_id), 3600, 5)


def lock_user(db, user_id):
    return db.query(models.User).filter(models.User.id == user_id).populate_existing().with_for_update().one()


def find_user(db, email):
    return db.query(models.User).filter(func.lower(models.User.email) == email).first()


def invalidate_user_codes(db, user_id, purposes=None):
    query = db.query(models.AuthCode).filter(models.AuthCode.user_id == user_id)
    if purposes:
        query = query.filter(models.AuthCode.purpose.in_(purposes))
    query.update({models.AuthCode.used_at: now(), models.AuthCode.reset_used_at: now()},
                 synchronize_session=False)


def issue_code(db, email, purpose, user=None):
    # Serializes all account security mutations and issuance across PostgreSQL workers.
    if user is not None:
        user = lock_user(db, user.id)
    existing = db.query(models.AuthCode).filter(
        models.AuthCode.email == email, models.AuthCode.purpose == purpose)
    existing.update({models.AuthCode.used_at: now(), models.AuthCode.reset_used_at: now()},
                    synchronize_session=False)
    if user is not None and purpose == "change_email":
        invalidate_user_codes(db, user.id, [purpose])
    code = f"{secrets.randbelow(1000000):06d}"
    db.add(models.AuthCode(user_id=user.id if user else None, email=email,
                          purpose=purpose, code_hash=code_digest(email, purpose, code),
                          created_at=now(), expires_at=now() + CODE_LIFETIME))
    db.commit()
    return code


def consume_code(db, email, purpose, code, user_id=None):
    query = db.query(models.AuthCode).filter(models.AuthCode.email == email,
                                            models.AuthCode.purpose == purpose)
    if user_id is not None:
        query = query.filter(models.AuthCode.user_id == user_id)
    challenge = query.order_by(models.AuthCode.id.desc()).with_for_update().first()
    if challenge is None:
        raise HTTPException(400, "Invalid code.")
    if challenge.used_at is not None:
        raise HTTPException(400, "Code already used or replaced. Request a new code.")
    if aware(challenge.expires_at) <= now():
        raise HTTPException(400, "Code expired. Request a new code.")
    if challenge.attempts >= 5:
        raise HTTPException(429, "Too many incorrect codes. Request a new code.")
    if not hmac.compare_digest(challenge.code_hash, code_digest(email, purpose, code)):
        challenge.attempts += 1
        db.commit()
        raise HTTPException(400, "Invalid code.")
    challenge.used_at = now()
    return challenge
