from datetime import datetime, timezone

import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db, require_company_user
from utils import clean_html


router = APIRouter(tags=["Company"])


@router.get("/company/jobs", response_model=list[schemas.JobResponse])
def get_company_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    jobs = db.query(models.Job).filter(
        models.Job.owner_id == current_user.id,
        models.Job.source.is_(None)
    ).order_by(models.Job.id.desc()).all()

    return jobs


@router.post("/company/fetch-remotive-jobs")
def fetch_remotive_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    ingestion_log = models.IngestionLog(
        source="remotive",
        added_count=0,
        skipped_count=0,
        status="running",
        started_at=datetime.now(timezone.utc),
    )

    db.add(ingestion_log)
    db.commit()
    db.refresh(ingestion_log)

    added_count = 0
    skipped_count = 0

    try:
        response = requests.get(
            "https://remotive.com/api/remote-jobs",
            timeout=20
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Failed to fetch jobs from Remotive"
            )

        data = response.json()
        remote_jobs = data.get("jobs", [])

        for item in remote_jobs[:20]:
            external_id = str(item.get("id"))

            existing_job = db.query(models.Job).filter(
                models.Job.source == "remotive",
                models.Job.external_id == external_id
            ).first()

            if existing_job:
                skipped_count += 1
                continue

            location = item.get("candidate_required_location") or "Remote"
            company = item.get("company_name") or "Unknown Company"
            title = item.get("title") or "Untitled Job"
            link = item.get("url") or "https://remotive.com"
            description = clean_html(item.get("description") or "")

            new_job = models.Job(
                title=title,
                company=company,
                country="Remote",
                city=location,
                type="Remote",
                salary="Not specified",
                link=link,
                description=description,
                owner_id=None,
                source="remotive",
                external_id=external_id,
            )

            db.add(new_job)
            added_count += 1

        ingestion_log.added_count = added_count
        ingestion_log.skipped_count = skipped_count
        ingestion_log.status = "success"
        ingestion_log.finished_at = datetime.now(timezone.utc)

        db.commit()

        return {
            "message": "Remotive jobs fetched successfully",
            "added": added_count,
            "skipped_duplicates": skipped_count,
            "source": "remotive",
            "log_id": ingestion_log.id,
        }

    except Exception as error:
        ingestion_log.added_count = added_count
        ingestion_log.skipped_count = skipped_count
        ingestion_log.status = "failed"
        ingestion_log.error_message = str(error)
        ingestion_log.finished_at = datetime.now(timezone.utc)

        db.commit()

        raise


@router.get("/company/ingestion-logs", response_model=list[schemas.IngestionLogResponse])
def get_ingestion_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    logs = db.query(models.IngestionLog).order_by(
        models.IngestionLog.id.desc()
    ).limit(20).all()

    return logs