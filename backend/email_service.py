"""Provider-neutral email boundary using Brevo transactional email API."""

import logging
import os

import requests
from fastapi import HTTPException

logger = logging.getLogger(__name__)

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def email_settings():
    api_key = os.getenv("BREVO_API_KEY", "").strip()
    email_from = os.getenv("EMAIL_FROM", "").strip()

    if not api_key or not email_from:
        raise HTTPException(
            503,
            "Email delivery is not configured. Please try again later.",
        )

    return {
        "BREVO_API_KEY": api_key,
        "EMAIL_FROM": email_from,
    }


def parse_sender(value: str):
    if "<" in value and value.endswith(">"):
        name, email = value.rsplit("<", 1)
        return {
            "name": name.strip(),
            "email": email[:-1].strip(),
        }

    return {
        "name": "Mihna",
        "email": value.strip(),
    }


def send_email(recipient: str, subject: str, body: str):
    settings = email_settings()

    payload = {
        "sender": parse_sender(settings["EMAIL_FROM"]),
        "to": [{"email": recipient}],
        "subject": subject,
        "textContent": body,
    }

    response = requests.post(
        BREVO_API_URL,
        headers={
            "accept": "application/json",
            "content-type": "application/json",
            "api-key": settings["BREVO_API_KEY"],
        },
        json=payload,
        timeout=10,
    )

    if not response.ok:
        raise RuntimeError(
            f"Brevo API error {response.status_code}"
        )


def deliver_code(recipient: str, code: str, purpose: str):
    labels = {
        "verify_email": "Verify your email",
        "change_email": "Confirm your new email",
        "reset_password": "Reset your password",
    }

    try:
        send_email(
            recipient,
            f"Mihna: {labels[purpose]}",
            (
                f"Your Mihna code is {code}.\n\n"
                "It expires in 10 minutes and can be used once.\n"
                "If you did not request this, ignore this email."
            ),
        )
    except Exception as exc:
        logger.error(
            "Authentication email delivery failed: %s",
            type(exc).__name__,
        )
