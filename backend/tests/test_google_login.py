"""Isolated auth tests: no production database or Google network requests."""
import json
import os
import time
import unittest
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "isolated-auth-test-secret"
os.environ["ALGORITHM"] = "HS256"
os.environ["GOOGLE_CLIENT_ID"] = "test.apps.googleusercontent.com"
os.environ["GOOGLE_CLIENT_SECRET"] = "isolated-google-test-secret"

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from fastapi import HTTPException
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

import models
import schemas
from auth import decode_access_token, hash_password
from google_auth import verify_google_identity
from routers.auth import google_login, login_user


class GoogleLoginTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.password_hash = hash_password("existing-password")

    def setUp(self):
        self.engine = create_engine("sqlite://")
        models.Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.claims = {"sub": "google-123", "email": "person@gmail.com", "name": "Google Person", "email_verified": True}

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def google(self, password=None):
        with patch("routers.auth.verify_google_identity", return_value=self.claims):
            return google_login(schemas.GoogleLogin(code="test", redirect_uri="http://localhost:5173", password=password), self.db)

    def add_user(self, role="job_seeker", email="person@gmail.com", google_sub=None):
        user = models.User(name="Existing", email=email, password_hash=self.password_hash, role=role, google_sub=google_sub)
        self.db.add(user)
        self.db.commit()
        return user

    def test_new_user_and_repeat_login(self):
        result = self.google()
        self.assertEqual(result["user"].role, "job_seeker")
        self.assertEqual(result["user"].name, "Google Person")
        self.assertIsNone(result["user"].password_hash)
        self.assertTrue(result["user"].email_verified)
        self.assertEqual(decode_access_token(result["access_token"])["user_id"], result["user"].id)
        self.google()
        self.assertEqual(self.db.query(models.User).count(), 1)

    def test_existing_company_and_password_preserved(self):
        user = self.add_user(role="company", email="Person@gmail.com")
        result = self.google()
        self.assertEqual(result["user"].id, user.id)
        self.assertEqual(result["user"].role, "company")
        self.assertEqual(result["user"].password_hash, self.password_hash)
        result = login_user(schemas.UserLogin(email=user.email, password="existing-password"), self.db)
        self.assertEqual(decode_access_token(result["access_token"])["role"], "company")

    def test_google_only_password_login_rejected(self):
        self.google()
        with self.assertRaises(HTTPException) as error:
            login_user(schemas.UserLogin(email=self.claims["email"], password="anything"), self.db)
        self.assertEqual(error.exception.status_code, 401)

    def test_external_email_requires_password_only_for_first_link(self):
        self.claims["email"] = "person@example.com"
        self.add_user(email=self.claims["email"])
        for password in (None, "wrong"):
            with self.assertRaises(HTTPException) as error:
                self.google(password)
            self.assertEqual(error.exception.status_code, 403)
        self.google("existing-password")
        self.google()

    def test_workspace_email_links(self):
        self.claims.update(email="person@example.com", hd="example.com")
        user = self.add_user(email=self.claims["email"])
        self.assertEqual(self.google()["user"].id, user.id)

    def test_conflicting_google_identity_rejected(self):
        self.add_user(google_sub="different-google-account")
        with self.assertRaises(HTTPException) as error:
            self.google()
        self.assertEqual(error.exception.status_code, 409)

    def test_changed_google_email_uses_stable_subject(self):
        user = self.google()["user"]
        self.claims["email"] = "changed@gmail.com"
        self.assertEqual(self.google()["user"].id, user.id)
        self.assertEqual(self.db.query(models.User).count(), 1)


class GoogleVerificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        cls.private = cls.key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
        cls.public = cls.key.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()

    def verify(self, **overrides):
        claims = dict(iss="https://accounts.google.com", aud=os.environ["GOOGLE_CLIENT_ID"],
                      sub="123", email="person@gmail.com", email_verified=True,
                      iat=int(time.time()), exp=int(time.time()) + 300)
        claims.update(overrides)
        token = jwt.encode(claims, self.private, algorithm="RS256", headers={"kid": "test-key"})
        class CertificateResponse:
            status = 200
            data = json.dumps({"test-key": self.public}).encode()
        with patch("google_auth.Request") as request, patch("google_auth.requests.post") as exchange:
            exchange.return_value.ok = True
            exchange.return_value.json.return_value = {"id_token": token}
            request.return_value.return_value = CertificateResponse()
            return verify_google_identity("test-code", "http://localhost:5173")

    def test_signed_token(self):
        self.assertEqual(self.verify()["sub"], "123")

    def test_reject_invalid_claims(self):
        for claims in ({"aud": "other-client"}, {"iss": "attacker"}, {"exp": 1},
                       {"email_verified": False}, {"sub": ""}, {"email": "invalid"}):
            with self.subTest(claims=claims), self.assertRaises(HTTPException) as error:
                self.verify(**claims)
            self.assertEqual(error.exception.status_code, 401)

    def test_reject_forged_token(self):
        class CertificateResponse:
            status = 200
            data = json.dumps({"test-key": self.public}).encode()
        with patch("google_auth.Request") as request, patch("google_auth.requests.post") as exchange, self.assertRaises(HTTPException) as error:
            exchange.return_value.ok = True
            exchange.return_value.json.return_value = {"id_token": "not-a-jwt"}
            request.return_value.return_value = CertificateResponse()
            verify_google_identity("test-code", "http://localhost:5173")
        self.assertEqual(error.exception.status_code, 401)

    def test_missing_configuration(self):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": ""}), self.assertRaises(HTTPException) as error:
            verify_google_identity("test", "http://localhost:5173")
        self.assertEqual(error.exception.status_code, 503)


if __name__ == "__main__":
    unittest.main()
