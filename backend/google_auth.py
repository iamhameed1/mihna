import os

import requests
from fastapi import HTTPException
from google.auth.exceptions import GoogleAuthError, TransportError
from google.auth.transport.requests import Request
from google.oauth2 import id_token
from pydantic import EmailStr, TypeAdapter, ValidationError


GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


def verify_google_identity(code: str, redirect_uri: str) -> dict:
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()

    if not client_id or not client_secret:
        raise HTTPException(
            503,
            "Google sign-in is not configured.",
        )

    try:
        token_response = requests.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=10,
        )
    except requests.RequestException:
        raise HTTPException(
            503,
            "Google sign-in is temporarily unavailable.",
        ) from None

    if not token_response.ok:
        raise HTTPException(
            401,
            "Google authorization code is invalid or expired.",
        )

    token_data = token_response.json()

    google_id_token = token_data.get("id_token")

    if not google_id_token:
        raise HTTPException(
            401,
            "Google did not return an identity token.",
        )

    try:
        claims = id_token.verify_oauth2_token(
            google_id_token,
            Request(),
            client_id,
        )
    except TransportError:
        raise HTTPException(
            503,
            "Google sign-in is temporarily unavailable.",
        ) from None
    except (ValueError, GoogleAuthError):
        raise HTTPException(
            401,
            "Invalid Google identity.",
        ) from None

    if (
        claims.get("iss")
        not in (
            "accounts.google.com",
            "https://accounts.google.com",
        )
        or claims.get("aud") != client_id
        or claims.get("email_verified") is not True
        or not isinstance(claims.get("sub"), str)
        or not 1 <= len(claims["sub"]) <= 255
    ):
        raise HTTPException(
            401,
            "Google identity must include a verified email.",
        )

    try:
        claims["email"] = str(
            TypeAdapter(EmailStr).validate_python(
                claims.get("email")
            )
        ).lower()
    except ValidationError:
        raise HTTPException(
            401,
            "Invalid Google email.",
        ) from None

    if len(claims["email"]) > 255:
        raise HTTPException(
            401,
            "Invalid Google email.",
        )

    return claims