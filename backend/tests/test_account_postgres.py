"""Optional PostgreSQL checks, restricted to a dedicated local test database.

Set MIHNA_TEST_DATABASE_URL to postgresql://...@127.0.0.1:PORT/mihna_account_test.
Each test creates and removes only its own randomly named schema.
"""
import importlib.util
import os
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import DBAPIError

import test_account_management

TEST_URL = os.getenv("MIHNA_TEST_DATABASE_URL")


def isolated_engine():
    url = make_url(TEST_URL)
    if url.host not in ("localhost", "127.0.0.1") or url.database != "mihna_account_test":
        raise RuntimeError("PostgreSQL tests require a dedicated local mihna_account_test database.")
    raw = create_engine(url)
    schema = "account_test_" + uuid.uuid4().hex
    with raw.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA "{schema}"'))
    return raw, schema


@unittest.skipUnless(TEST_URL, "Set MIHNA_TEST_DATABASE_URL for isolated PostgreSQL checks")
class PostgresAccountTests(test_account_management.AccountTests):
    def make_engine(self):
        self.raw_engine, self.schema = isolated_engine()
        return self.raw_engine.execution_options(schema_translate_map={None: self.schema})

    def tearDown(self):
        super().tearDown()
        with self.raw_engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA "{self.schema}" CASCADE'))
        self.raw_engine.dispose()

    def test_concurrent_reset_grant_consumption_has_one_winner(self):
        user = self.user()
        grant = self.reset_grant(user)
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda _: self.reset(grant), range(2)))
        self.assertEqual(sorted(response.status_code for response in responses), [200, 400])

    def test_concurrent_code_consumption_has_one_winner(self):
        user = self.user()
        code = self.challenge(user, "reset_password")
        email = user.email
        with ThreadPoolExecutor(max_workers=2) as pool:
            responses = list(pool.map(lambda _: self.post("/auth/verify-reset-code", {"email": email, "code": code}), range(2)))
        self.assertEqual(sorted(response.status_code for response in responses), [200, 400])


@unittest.skipUnless(TEST_URL, "Set MIHNA_TEST_DATABASE_URL for isolated PostgreSQL checks")
class PostgresMigrationTests(unittest.TestCase):
    def setUp(self):
        self.engine, self.schema = isolated_engine()
        path = Path(__file__).resolve().parents[1] / "alembic/versions/c72a9b830f14_account_management.py"
        spec = importlib.util.spec_from_file_location("account_migration", path)
        self.migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.migration)
        with self.engine.begin() as conn:
            conn.execute(text(f'SET LOCAL search_path TO "{self.schema}"'))
            conn.execute(text("""CREATE TABLE users (
                id INTEGER PRIMARY KEY, name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255),
                google_sub VARCHAR(255) UNIQUE, role VARCHAR(50) NOT NULL)"""))
            conn.execute(text("""INSERT INTO users VALUES
                (1, 'Existing', 'Person@example.com', 'existing-hash', NULL, 'company'),
                (2, 'Google', 'google@example.com', NULL, 'google-sub', 'job_seeker')"""))

    def tearDown(self):
        with self.engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA "{self.schema}" CASCADE'))
        self.engine.dispose()

    def migrate(self, direction):
        with self.engine.begin() as conn:
            conn.execute(text(f'SET LOCAL search_path TO "{self.schema}"'))
            with Operations.context(MigrationContext.configure(conn)):
                getattr(self.migration, direction)()

    def test_upgrade_backfill_constraint_and_downgrade_preserve_accounts(self):
        self.migrate("upgrade")
        with self.engine.begin() as conn:
            conn.execute(text(f'SET LOCAL search_path TO "{self.schema}"'))
            rows = conn.execute(text("SELECT email, password_hash, google_sub, role, email_verified FROM users ORDER BY id")).all()
            self.assertEqual(rows[0], ("Person@example.com", "existing-hash", None, "company", False))
            self.assertEqual(rows[1], ("google@example.com", None, "google-sub", "job_seeker", False))
        with self.assertRaises(DBAPIError), self.engine.begin() as conn:
            conn.execute(text(f'SET LOCAL search_path TO "{self.schema}"'))
            conn.execute(text("INSERT INTO users (id,name,email,role) VALUES (3,'Duplicate','PERSON@example.com','job_seeker')"))
        self.migrate("downgrade")
        with self.engine.begin() as conn:
            conn.execute(text(f'SET LOCAL search_path TO "{self.schema}"'))
            self.assertEqual(conn.execute(text("SELECT count(*) FROM users")).scalar_one(), 2)

    def test_duplicates_abort_without_partial_schema_changes(self):
        with self.engine.begin() as conn:
            conn.execute(text(f'SET LOCAL search_path TO "{self.schema}"'))
            conn.execute(text("INSERT INTO users (id,name,email,role) VALUES (3,'Duplicate','PERSON@example.com','job_seeker')"))
        with self.assertRaises(DBAPIError):
            self.migrate("upgrade")
        with self.engine.begin() as conn:
            self.assertEqual(conn.execute(text("SELECT count(*) FROM information_schema.columns WHERE table_schema=:schema AND table_name='users' AND column_name='email_verified'"), {"schema": self.schema}).scalar_one(), 0)
            self.assertEqual(conn.execute(text(f'SELECT count(*) FROM "{self.schema}".users')).scalar_one(), 3)


if __name__ == "__main__":
    unittest.main()
