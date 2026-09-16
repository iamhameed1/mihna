import unittest
from unittest.mock import patch

from fastapi import HTTPException

import email_service


class EmailServiceTests(unittest.TestCase):
    def settings(self):
        return {"BREVO_API_KEY": "test-api-key", "EMAIL_FROM": "Mihna <sender@example.com>"}

    def test_brevo_email_uses_configured_sender_and_transport(self):
        with patch("email_service.email_settings", return_value=self.settings()), patch("email_service.requests.post") as transport:
            email_service.deliver_code("recipient@example.com", "123456", "verify_email")
            transport.assert_called_once()
            self.assertEqual(transport.call_args.args, (email_service.BREVO_API_URL,))
            options = transport.call_args.kwargs
            self.assertEqual(options["headers"]["api-key"], "test-api-key")
            self.assertEqual(options["timeout"], 10)
            message = options["json"]
            self.assertEqual(message["to"], [{"email": "recipient@example.com"}])
            self.assertEqual(message["sender"], {"name": "Mihna", "email": "sender@example.com"})
            self.assertIn("123456", message["textContent"])
            self.assertIn("10 minutes", message["textContent"])

    def test_provider_failure_excludes_response_body(self):
        with patch("email_service.email_settings", return_value=self.settings()), patch("email_service.requests.post") as transport:
            transport.return_value.ok = False
            transport.return_value.status_code = 400
            transport.return_value.text = "sensitive provider response"
            with self.assertRaises(RuntimeError) as error:
                email_service.send_email("recipient@example.com", "Test", "Test message")
            self.assertEqual(str(error.exception), "Brevo API error 400")

    def test_delivery_failure_never_logs_exception_secrets(self):
        with patch("email_service.send_email", side_effect=RuntimeError("secret-password 123456 token")), self.assertLogs("email_service", level="ERROR") as logs:
            email_service.deliver_code("recipient@example.com", "123456", "reset_password")
        output = " ".join(logs.output)
        for sensitive in ("secret-password", "123456", "token", "recipient@example.com"):
            self.assertNotIn(sensitive, output)

    def test_missing_configuration_fails_closed(self):
        with patch.dict("os.environ", {"BREVO_API_KEY": "", "EMAIL_FROM": ""}), self.assertRaises(HTTPException) as error:
            email_service.email_settings()
        self.assertEqual(error.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
