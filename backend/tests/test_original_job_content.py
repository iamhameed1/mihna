"""Original job content remains authoritative in every job workflow."""
import csv
import io
import os
import unittest
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite://"

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
import models
from dependencies import get_db, get_current_user, require_company_user, require_job_seeker_user
from routers.jobs import router as jobs_router
from routers.company import router as company_router
from routers.saved_jobs import router as saved_router
from routers.analytics import router as analytics_router


class OriginalJobContentTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        models.Base.metadata.create_all(self.engine)
        app = FastAPI()
        for router in (jobs_router, company_router, saved_router, analytics_router):
            app.include_router(router)
        def test_db():
            with Session(self.engine) as db:
                yield db
        app.dependency_overrides[get_db] = test_db
        for dependency in (get_current_user, require_company_user, require_job_seeker_user):
            app.dependency_overrides[dependency] = lambda: models.User(id=1, role="company")
        self.client = TestClient(app)
        self.payload = dict(title="Data Engineer", description="Build data platforms.", company="Example",
                            country="SA", city="Riyadh", type="Remote", salary="10000", link="https://example.com")
        with Session(self.engine) as db:
            row = models.Job(**self.payload, owner_id=1)
            db.add(row)
            db.commit()
            self.job_id = row.id

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def assert_original(self, row):
        self.assertEqual(row["title"], self.payload["title"])
        self.assertEqual(row["description"], self.payload["description"])

    def test_list_details_company_saved_and_csv_exclude_legacy_fields(self):
        self.assert_original(self.client.get("/jobs").json()["items"][0])
        self.assert_original(self.client.get(f"/jobs/{self.job_id}").json())
        self.assert_original(self.client.get("/company/jobs").json()[0])
        self.assertEqual(self.client.post(f"/saved-jobs/{self.job_id}").status_code, 200)
        self.assert_original(self.client.get("/saved-jobs").json()[0])
        self.assert_original(list(csv.DictReader(io.StringIO(self.client.get("/jobs/export/csv").text)))[0])

    def test_search_uses_original_fields_and_preserves_filters_and_pagination(self):
        for search in ("Data Engineer", "platforms", "Example"):
            result = self.client.get("/jobs", params=dict(search=search, type="Remote", page_size=1)).json()
            self.assertEqual(result["total"], 1)
            self.assert_original(result["items"][0])
        for search in ("مهندس", "تحليل"):
            self.assertEqual(self.client.get("/jobs", params={"search": search}).json()["total"], 0)
        self.assertEqual(self.client.get("/jobs?type=Onsite").json()["total"], 0)
        self.assertEqual(self.client.get("/jobs?page=2&page_size=1").json()["items"], [])

    def test_analytics_csv_preserves_filtered_summary_sections(self):
        for filters, expected in (({}, 1), ({"type": "Onsite"}, 0), ({"search": "platforms"}, 1)):
            with self.subTest(filters=filters):
                summary = self.client.get("/analytics/summary", params=filters)
                exported = self.client.get("/analytics/export/csv", params=filters)
                self.assertEqual(summary.status_code, 200)
                self.assertEqual(exported.status_code, 200)
                self.assertIn("mihna_analytics_export.csv", exported.headers["content-disposition"])
                self.assertEqual(summary.json()["total_jobs"], expected)
                rows = list(csv.reader(io.StringIO(exported.text)))
                self.assertEqual(rows[0], ["Section", "Metric", "Value"])
                self.assertIn(["Summary", "Total Jobs", str(expected)], rows)
                self.assertIn(["Summary", "Manual Jobs", str(expected)], rows)
                for section, heading in (("Jobs By Source", "Source"), ("Jobs By Type", "Type"), ("Top Cities", "City"), ("Top Companies", "Company"), ("Jobs By Date", "Date")):
                    self.assertIn([section, heading, "Count"], rows)
                if expected:
                    self.assertIn(["Jobs By Source", "manual", "1"], rows)
                    self.assertIn(["Jobs By Type", "Remote", "1"], rows)
                    self.assertIn(["Top Cities", "Riyadh", "1"], rows)
                    self.assertIn(["Top Companies", "Example", "1"], rows)

    @patch("requests.post", side_effect=AssertionError("Unexpected external request"))
    def test_create_and_edit_preserve_original_content_without_translation(self, post):
        for title, description in [("Senior Data Engineer", "Original English."), ("مهندس برمجيات", "وصف الوظيفة الأصلي")]:
            payload = {**self.payload, "title": title, "description": description}
            created = self.client.post("/jobs", json=payload)
            self.assertEqual(created.status_code, 200)
            self.assertEqual(created.json()["title"], title)
            self.assertEqual(created.json()["description"], description)
            edited = self.client.put(f"/jobs/{self.job_id}", json=payload)
            self.assertEqual(edited.status_code, 200)
            self.assertEqual(edited.json()["title"], title)
            self.assertEqual(edited.json()["description"], description)
        with Session(self.engine) as db:
            row = db.get(models.Job, self.job_id)
            self.assertEqual(row.title, "مهندس برمجيات")
            self.assertEqual(row.description, "وصف الوظيفة الأصلي")
        post.assert_not_called()

    @patch("requests.post", side_effect=AssertionError("Unexpected external request"))
    @patch("routers.company.requests.get")
    def test_import_cleans_deduplicates_and_logs_without_translation(self, get, post):
        get.return_value.status_code = 200
        get.return_value.json.return_value = {"jobs": [{"id": 123, "title": "Data Engineer", "description": "<p>Build platforms.</p>"}]}
        self.assertEqual(self.client.post("/company/fetch-remotive-jobs").json()["added"], 1)
        self.assertEqual(self.client.post("/company/fetch-remotive-jobs").json()["skipped_duplicates"], 1)
        with Session(self.engine) as db:
            row = db.query(models.Job).filter_by(source="remotive").one()
            self.assertEqual(row.title, "Data Engineer")
            self.assertEqual(row.description, "Build platforms.")
            self.assertTrue(all(log.status == "success" for log in db.query(models.IngestionLog)))
        self.assertEqual(len(self.client.get("/company/ingestion-logs").json()), 2)
        post.assert_not_called()
