"""HTTP integration tests: isolated SQLite only, no real email or Google calls."""
import os
import unittest
from datetime import timedelta
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "isolated-auth-test-secret"
os.environ["ALGORITHM"] = "HS256"
os.environ["AUTH_CODE_SECRET"] = "isolated-code-secret-at-least-32-characters"

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import models
from account_security import digest, issue_code, now
from auth import create_access_token, hash_password
from dependencies import get_db
from routers import account, auth


class AccountTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = hash_password("original-password")

    def setUp(self):
        self.engine = self.make_engine()
        models.Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        app = FastAPI()
        app.include_router(auth.router)
        app.include_router(account.router)

        def test_db():
            with Session(self.engine) as db:
                yield db

        app.dependency_overrides[get_db] = test_db
        self.client = TestClient(app)
        self.settings_patch = patch("routers.account.email_settings", return_value={})
        self.settings_patch.start()
        self.mail_patch = patch("routers.account.deliver_code")
        self.mail = self.mail_patch.start()

    def make_engine(self):
        return create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)

    def tearDown(self):
        self.mail_patch.stop()
        self.settings_patch.stop()
        self.client.close()
        self.db.close()
        self.engine.dispose()

    def user(self, email="person@example.com", role="job_seeker", password=True):
        user = models.User(name="Person", email=email, role=role,
                           password_hash=self.password_hash if password else None)
        self.db.add(user)
        self.db.commit()
        return user

    def headers(self, user):
        return {"Authorization": "Bearer " + create_access_token(
            {"sub": user.email, "user_id": user.id, "role": user.role})}

    def challenge(self, user, purpose="verify_email", email=None):
        return issue_code(self.db, email or user.email.lower(), purpose, user)

    def post(self, path, data, user=None, headers=None):
        return self.client.post(path, json=data, headers=headers or (self.headers(user) if user else {}))

    def reset_grant(self, user):
        code = self.challenge(user, "reset_password")
        response = self.post("/auth/verify-reset-code", {"email": user.email, "code": code})
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()["reset_token"]

    def reset(self, token, password="new-password"):
        return self.post("/auth/reset-password", {"reset_token": token,
                         "new_password": password, "confirmation": password})

    def test_registration_unverified_case_insensitive_login_and_duplicate(self):
        data = {"name": "Company", "email": "Company@example.com", "password": "original-password", "role": "company"}
        response = self.post("/register", data)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()["email_verified"])
        self.assertTrue(response.json()["has_password"])
        self.assertNotIn("password_hash", response.text)
        self.assertEqual(self.post("/register", {**data, "email": "COMPANY@example.com"}).status_code, 400)
        login = self.post("/login", {"email": "COMPANY@example.com", "password": data["password"]})
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()["user"]["role"], "company")

    def test_database_enforces_case_insensitive_uniqueness(self):
        self.user()
        with self.assertRaises(IntegrityError):
            self.user(email="PERSON@example.com")
        self.db.rollback()

    def test_name_update_both_roles_and_no_hash_exposure(self):
        for role in ("job_seeker", "company"):
            user = self.user(email=f"{role}@example.com", role=role)
            response = self.client.patch("/users/me", headers=self.headers(user), json={"name": "  New name  ", "role": "admin"})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["name"], "New name")
            self.assertEqual(response.json()["role"], role)
            self.assertNotIn("password_hash", response.text)
        self.assertEqual(self.client.patch("/users/me", headers=self.headers(user), json={"name": " "}).status_code, 422)

    def test_account_mutations_require_authentication(self):
        for path, data in (("/users/me/password", {"new_password": "new-password", "confirmation": "new-password"}),
                           ("/users/me/change-email", {"email": "new@example.com"}),
                           ("/users/me/verify-new-email", {"email": "new@example.com", "code": "123456"})):
            self.assertIn(self.post(path, data).status_code, (401, 403))

    def test_verification_delivery_hash_and_single_use(self):
        user = self.user()
        response = self.post("/auth/send-verification-code", {"email": "PERSON@example.com"})
        self.assertEqual(response.status_code, 200)
        email, code, purpose = self.mail.call_args.args
        self.assertEqual((email, purpose), (user.email, "verify_email"))
        self.assertRegex(code, r"^[0-9]{6}$")
        row = self.db.query(models.AuthCode).one()
        self.assertNotEqual(row.code_hash, code)
        self.assertEqual(len(row.code_hash), 64)
        payload = {"email": user.email, "code": code}
        self.assertEqual(self.post("/auth/verify-email", payload).status_code, 200)
        self.db.refresh(user)
        self.assertTrue(user.email_verified)
        response = self.post("/auth/verify-email", payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("already used", response.json()["detail"])

    def test_invalid_expired_and_attempt_limit(self):
        user = self.user()
        code = self.challenge(user)
        wrong = "000000" if code != "000000" else "111111"
        for _ in range(5):
            self.assertEqual(self.post("/auth/verify-email", {"email": user.email, "code": wrong}).status_code, 400)
        self.assertEqual(self.post("/auth/verify-email", {"email": user.email, "code": code}).status_code, 429)
        code = self.challenge(user)
        row = self.db.query(models.AuthCode).order_by(models.AuthCode.id.desc()).first()
        row.expires_at = now() - timedelta(seconds=1)
        self.db.commit()
        response = self.post("/auth/verify-email", {"email": user.email, "code": code})
        self.assertEqual(response.status_code, 400)
        self.assertIn("expired", response.json()["detail"])

    def test_resend_invalidates_previous_code_and_enforces_cooldown(self):
        user = self.user()
        with patch("account_security.secrets.randbelow", side_effect=[123456, 654321]):
            self.challenge(user)
            response = self.post("/auth/resend-verification-code", {"email": user.email})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.post("/auth/verify-email", {"email": user.email, "code": "123456"}).status_code, 400)
        self.assertEqual(self.post("/auth/verify-email", {"email": user.email, "code": "654321"}).status_code, 200)
        response = self.post("/auth/resend-verification-code", {"email": user.email})
        self.assertEqual(response.status_code, 429)
        self.assertIn("retry-after", response.headers)

    def test_email_change_is_deferred_and_keeps_session_and_role(self):
        user = self.user(role="company")
        headers = self.headers(user)
        response = self.post("/users/me/change-email", {"email": "NEW@example.com"}, headers=headers)
        self.assertEqual(response.status_code, 200)
        code = self.mail.call_args.args[1]
        self.db.refresh(user)
        self.assertEqual(user.email, "person@example.com")
        response = self.post("/users/me/verify-new-email", {"email": "new@example.com", "code": code}, headers=headers)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["email_verified"])
        self.assertEqual(response.json()["email"], "new@example.com")
        self.assertEqual(response.json()["role"], "company")
        # Even when someone registers the released address, the old JWT belongs to its original user.
        self.user(email="person@example.com")
        me = self.client.get("/me", headers=headers)
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["id"], user.id)

    def test_email_change_conflict_at_request_and_confirmation(self):
        user = self.user()
        self.user(email="taken@example.com")
        self.assertEqual(self.post("/users/me/change-email", {"email": "TAKEN@example.com"}, user).status_code, 409)
        code = self.challenge(user, "change_email", "later@example.com")
        self.user(email="LATER@example.com")
        response = self.post("/users/me/verify-new-email", {"email": "later@example.com", "code": code}, user)
        self.assertEqual(response.status_code, 409)
        self.db.refresh(user)
        self.assertEqual(user.email, "person@example.com")

    def test_email_change_code_cannot_be_used_by_another_user_or_purpose(self):
        user = self.user()
        other = self.user(email="other@example.com")
        code = self.challenge(user, "change_email", "new@example.com")
        self.assertEqual(self.post("/users/me/verify-new-email", {"email": "new@example.com", "code": code}, other).status_code, 400)
        self.assertEqual(self.post("/auth/verify-reset-code", {"email": user.email, "code": code}).status_code, 400)

    def test_password_add_change_current_password_confirmation_and_reset_invalidation(self):
        user = self.user(password=False)
        data = {"new_password": "added-password", "confirmation": "added-password"}
        self.assertEqual(self.post("/users/me/password", {**data, "confirmation": "mismatch"}, user).status_code, 422)
        self.assertEqual(self.post("/users/me/password", {**data, "new_password": "short"}, user).status_code, 422)
        response = self.post("/users/me/password", data, user)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["has_password"])
        self.assertEqual(self.post("/users/me/password", data, user).status_code, 400)
        grant = self.reset_grant(user)
        response = self.post("/users/me/password", {**data, "current_password": "added-password"}, user)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.reset(grant).status_code, 400)
        self.assertEqual(self.post("/login", {"email": user.email, "password": "added-password"}).status_code, 200)

    def test_password_bcrypt_byte_limit(self):
        user = self.user(password=False)
        self.assertEqual(self.post("/users/me/password", {"new_password": "é" * 40, "confirmation": "é" * 40}, user).status_code, 422)

    def test_forgot_password_generic_for_unknown_known_and_google_only(self):
        self.user()
        self.user(email="google@example.com", password=False)
        responses = [self.post("/auth/forgot-password", {"email": email}) for email in
                     ("person@example.com", "unknown@example.com", "google@example.com")]
        self.assertTrue(all(response.status_code == 200 for response in responses))
        self.assertEqual(responses[0].json(), responses[1].json())
        self.assertEqual(responses[1].json(), responses[2].json())
        self.assertEqual(self.mail.call_count, 2)
        # Same request limits and stored challenge path for unknown addresses.
        self.assertEqual(self.db.query(models.AuthCode).count(), 3)
        self.assertEqual(self.post("/auth/forgot-password", {"email": "unknown@example.com"}).status_code, 429)
        self.assertEqual(self.post("/auth/forgot-password", {"email": "person@example.com"}).status_code, 429)

    def test_reset_flow_single_use_no_login_and_hashed_grant(self):
        user = self.user(role="company")
        code = self.challenge(user, "reset_password")
        payload = {"email": user.email, "code": code}
        response = self.post("/auth/verify-reset-code", payload)
        self.assertEqual(response.status_code, 200)
        grant = response.json()["reset_token"]
        self.assertEqual(self.post("/auth/verify-reset-code", payload).status_code, 400)
        row = self.db.query(models.AuthCode).one()
        self.assertNotEqual(row.reset_token_hash, grant)
        self.assertEqual(row.reset_token_hash, digest(f"reset:{grant}"))
        self.assertIn(self.client.get("/me", headers={"Authorization": f"Bearer {grant}"}).status_code, (401, 403))
        result = self.reset(grant)
        self.assertEqual(result.status_code, 200)
        self.assertNotIn("access_token", result.text)
        self.assertEqual(self.reset(grant).status_code, 400)
        self.assertEqual(self.post("/login", {"email": user.email, "password": "original-password"}).status_code, 401)
        result = self.post("/login", {"email": user.email, "password": "new-password"})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json()["user"]["role"], "company")
        self.assertTrue(result.json()["user"]["email_verified"])

    def test_reset_grant_expires_and_reissue_invalidates_it(self):
        user = self.user()
        grant = self.reset_grant(user)
        row = self.db.query(models.AuthCode).one()
        row.reset_expires_at = now() - timedelta(seconds=1)
        self.db.commit()
        self.assertEqual(self.reset(grant).status_code, 400)
        grant = self.reset_grant(user)
        self.challenge(user, "reset_password")
        self.assertEqual(self.reset(grant).status_code, 400)

    def test_verified_email_change_invalidates_old_mailbox_reset_grant(self):
        user = self.user()
        grant = self.reset_grant(user)
        code = self.challenge(user, "change_email", "new@example.com")
        self.assertEqual(self.post("/users/me/verify-new-email", {"email": "new@example.com", "code": code}, user).status_code, 200)
        self.assertEqual(self.reset(grant).status_code, 400)

    def test_google_only_can_recover_a_password(self):
        user = self.user(password=False)
        self.assertEqual(self.reset(self.reset_grant(user)).status_code, 200)
        self.assertEqual(self.post("/login", {"email": user.email, "password": "new-password"}).status_code, 200)

    def test_missing_email_config_does_not_leak_existence(self):
        from fastapi import HTTPException
        self.user()
        with patch("routers.account.email_settings", side_effect=HTTPException(503, "Email delivery is not configured.")):
            existing = self.post("/auth/forgot-password", {"email": "person@example.com"})
            unknown = self.post("/auth/forgot-password", {"email": "unknown@example.com"})
        self.assertEqual(existing.status_code, 503)
        self.assertEqual(existing.json(), unknown.json())

    def test_ip_send_limit_applies_to_distinct_addresses(self):
        for index in range(30):
            self.assertEqual(self.post("/auth/forgot-password", {"email": f"unknown{index}@example.com"}).status_code, 200)
        self.assertEqual(self.post("/auth/forgot-password", {"email": "one-more@example.com"}).status_code, 429)


if __name__ == "__main__":
    unittest.main()
