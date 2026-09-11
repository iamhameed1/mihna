import unittest
from unittest.mock import patch

from fastapi import HTTPException

import email_service


class EmailServiceTests(unittest.TestCase):
    def settings(self, security="starttls"):
        return {"SMTP_HOST": "smtp.example.com", "SMTP_PORT": 587,
                "SMTP_SECURITY": security, "SMTP_USERNAME": "test-user",
                "SMTP_PASSWORD": "test-password", "EMAIL_FROM": "Mihna <sender@example.com>"}

    def test_starttls_email_uses_configured_sender_and_transport(self):
        with patch("email_service.email_settings", return_value=self.settings()), patch("email_service.smtplib.SMTP") as transport:
            email_service.deliver_code("recipient@example.com", "123456", "verify_email")
            smtp = transport.return_value.__enter__.return_value
            smtp.starttls.assert_called_once()
            smtp.login.assert_called_once_with("test-user", "test-password")
            message = smtp.send_message.call_args.args[0]
            self.assertEqual(message["To"], "recipient@example.com")
            self.assertEqual(message["From"], "Mihna <sender@example.com>")
            self.assertIn("123456", message.get_content())
            self.assertIn("10 minutes", message.get_content())

    def test_ssl_transport(self):
        with patch("email_service.email_settings", return_value=self.settings("ssl")), patch("email_service.smtplib.SMTP_SSL") as transport:
            email_service.send_email("recipient@example.com", "Test", "Test message")
            transport.return_value.__enter__.return_value.starttls.assert_not_called()
            transport.return_value.__enter__.return_value.send_message.assert_called_once()

    def test_delivery_failure_never_logs_exception_secrets(self):
        with patch("email_service.send_email", side_effect=RuntimeError("secret-password 123456 token")), self.assertLogs("email_service", level="ERROR") as logs:
            email_service.deliver_code("recipient@example.com", "123456", "reset_password")
        output = " ".join(logs.output)
        for sensitive in ("secret-password", "123456", "token", "recipient@example.com"):
            self.assertNotIn(sensitive, output)

    def test_missing_configuration_fails_closed(self):
        with patch.dict("os.environ", {"SMTP_HOST": "", "EMAIL_FROM": ""}), self.assertRaises(HTTPException) as error:
            email_service.email_settings()
        self.assertEqual(error.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
