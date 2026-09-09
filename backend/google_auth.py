import os
from functools import partial

from fastapi import HTTPException
from google.auth.exceptions import GoogleAuthError, TransportError
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from pydantic import EmailStr, TypeAdapter, ValidationError


def verify_google_identity(credential: str) -> dict:
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        raise HTTPException(503, "Google sign-in is not configured.")
    try:
        claims = id_token.verify_oauth2_token(credential, partial(Request(), timeout=10), client_id)
    except TransportError:
        raise HTTPException(503, "Google sign-in is temporarily unavailable.") from None
    except (ValueError, GoogleAuthError):
        raise HTTPException(401, "Invalid or expired Google identity.") from None
    if (claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com")
        or claims.get("aud") != client_id or claims.get("email_verified") is not True
        or not isinstance(claims.get("sub"), str) or not 1 <= len(claims["sub"]) <= 255):
        raise HTTPException(401, "Google identity must include a verified email.")
    try:
        claims["email"] = str(TypeAdapter(EmailStr).validate_python(claims.get("email"))).lower()
    except ValidationError:
        raise HTTPException(401, "Invalid Google email.") from None
    if len(claims["email"]) > 255:
        raise HTTPException(401, "Invalid Google email.")
    return claims
