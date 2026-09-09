"""Deletion regression tests with real foreign-key enforcement."""
import os
import unittest
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite://"

from fastapi import HTTPException
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
import models
from routers.jobs import delete_job


class DeleteJobTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        @event.listens_for(self.engine, "connect")
        def enable_foreign_keys(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")
        models.Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.owner = models.User(name="Owner", email="owner@example.com", role="company")
        self.other = models.User(name="Other", email="other@example.com", role="company")
        self.seeker = models.User(name="Seeker", email="seeker@example.com", role="job_seeker")
        self.db.add_all([self.owner, self.other, self.seeker])
        self.db.flush()
        fields = dict(title="Test", company="Test", country="SA", city="Riyadh", type="Full-time", salary="100", link="https://example.com", description="Test")
        self.job = models.Job(**fields, owner_id=self.owner.id)
        self.remaining = models.Job(**fields, owner_id=self.other.id)
        self.db.add_all([self.job, self.remaining])
        self.db.flush()
        self.job_id = self.job.id
        self.remaining_id = self.remaining.id
        self.db.add_all([models.SavedJob(user_id=self.seeker.id, job_id=self.job.id),
                         models.SavedJob(user_id=self.other.id, job_id=self.job.id),
                         models.SavedJob(user_id=self.seeker.id, job_id=self.remaining.id)])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_delete_saved_job_preserves_unrelated_data(self):
        result = delete_job(self.job_id, self.db, self.owner)
        self.assertEqual(result["message"], "Job deleted successfully")
        self.assertIsNone(self.db.get(models.Job, self.job_id))
        self.assertEqual(self.db.query(models.SavedJob).count(), 1)
        self.assertEqual(self.db.query(models.SavedJob).one().job_id, self.remaining_id)
        self.assertEqual(self.db.query(models.User).count(), 3)

    def test_non_owner_and_seeker_cannot_delete(self):
        for user in (self.other, self.seeker):
            with self.assertRaises(HTTPException) as error:
                delete_job(self.job_id, self.db, user)
            self.assertEqual(error.exception.status_code, 403)
        self.assertEqual(self.db.query(models.SavedJob).count(), 3)
        self.assertEqual(self.db.query(models.Job).count(), 2)

    def test_failure_rolls_back_bookmark_removal(self):
        with patch.object(self.db, "commit", side_effect=RuntimeError("test failure")):
            with self.assertRaises(RuntimeError):
                delete_job(self.job_id, self.db, self.owner)
        self.assertEqual(self.db.query(models.SavedJob).count(), 3)
        self.assertIsNotNone(self.db.get(models.Job, self.job_id))

    def test_missing_job(self):
        with self.assertRaises(HTTPException) as error:
            delete_job(9999, self.db, self.owner)
        self.assertEqual(error.exception.status_code, 404)
