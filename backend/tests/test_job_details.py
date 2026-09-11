"""Public job deep-link API and CSV compatibility, using an isolated database."""
import os
import unittest

os.environ["DATABASE_URL"] = "sqlite://"

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import models
from dependencies import get_db
from routers.jobs import router


class JobDetailsTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        models.Base.metadata.create_all(self.engine)
        with Session(self.engine) as db:
            job = models.Job(title="Deep link job", company="Example", country="SA", city="Riyadh",
                             type="Remote", salary="Negotiable", link="https://example.com",
                             description="Description", owner_id=None)
            db.add(job)
            db.commit()
            self.job_id = job.id
        app = FastAPI()
        app.include_router(router)

        def test_db():
            with Session(self.engine) as db:
                yield db

        app.dependency_overrides[get_db] = test_db
        self.client = TestClient(app)

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def test_public_job_details(self):
        response = self.client.get(f"/jobs/{self.job_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["title"], "Deep link job")
        self.assertEqual(response.json()["id"], self.job_id)

    def test_missing_job_returns_404(self):
        response = self.client.get("/jobs/9999")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Job not found")

    def test_csv_and_paginated_listing_are_not_shadowed(self):
        csv = self.client.get("/jobs/export/csv")
        self.assertEqual(csv.status_code, 200)
        self.assertIn("text/csv", csv.headers["content-type"])
        self.assertIn("Deep link job", csv.text)
        listing = self.client.get("/jobs?page=1&page_size=10")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["items"][0]["id"], self.job_id)


if __name__ == "__main__":
    unittest.main()
