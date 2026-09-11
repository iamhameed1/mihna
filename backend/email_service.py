"""Provider-neutral email boundary, backed by any SMTP-compatible provider."""
import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

from fastapi import HTTPException

logger = logging.getLogger(__name__)


def email_settings():
    settings = {key: os.getenv(key, "").strip() for key in (
        "SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "EMAIL_FROM",
    )}
    settings["SMTP_SECURITY"] = os.getenv("SMTP_SECURITY", "starttls").lower()
    if (not settings["SMTP_HOST"] or not settings["EMAIL_FROM"]
            or settings["SMTP_SECURITY"] not in ("starttls", "ssl", "none")):
        raise HTTPException(503, "Email delivery is not configured. Please try again later.")
    try:
        settings["SMTP_PORT"] = int(settings["SMTP_PORT"] or "587")
    except ValueError:
        raise HTTPException(503, "Email delivery is not configured. Please try again later.") from None
    return settings


def send_email(recipient: str, subject: str, body: str):
    settings = email_settings()
    message = EmailMessage()
    message["From"] = settings["EMAIL_FROM"]
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)
    transport = smtplib.SMTP_SSL if settings["SMTP_SECURITY"] == "ssl" else smtplib.SMTP
    kwargs = {"timeout": 10}
    if settings["SMTP_SECURITY"] == "ssl":
        kwargs["context"] = ssl.create_default_context()
    with transport(settings["SMTP_HOST"], settings["SMTP_PORT"], **kwargs) as smtp:
        if settings["SMTP_SECURITY"] == "starttls":
            smtp.starttls(context=ssl.create_default_context())
        if settings["SMTP_USERNAME"]:
            smtp.login(settings["SMTP_USERNAME"], settings["SMTP_PASSWORD"])
        smtp.send_message(message)


def deliver_code(recipient: str, code: str, purpose: str):
    """Background delivery keeps public request timing independent of SMTP/account existence.

    Codes live only in task memory and the email; never log provider exceptions or payloads.
    """
    labels = {"verify_email": "Verify your email", "change_email": "Confirm your new email",
              "reset_password": "Reset your password"}
    try:
        send_email(recipient, f"Mihna: {labels[purpose]}",
                   f"Your Mihna code is {code}.\n\nIt expires in 10 minutes and can be used once."
                   "\nIf you did not request this, ignore this email.")
    except Exception as exc:
        logger.error(
        "Authentication email delivery failed: %s: %s",
        type(exc).__name__,
        str(exc),
    )
