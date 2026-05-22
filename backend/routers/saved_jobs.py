from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from dependencies import get_db, require_job_seeker_user


router = APIRouter(tags=["Saved Jobs"])


@router.post("/saved-jobs/{job_id}", response_model=schemas.SavedJobResponse)
def save_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_job_seeker_user)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    existing_saved_job = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id,
        models.SavedJob.job_id == job_id
    ).first()

    if existing_saved_job:
        return existing_saved_job

    saved_job = models.SavedJob(
        user_id=current_user.id,
        job_id=job_id
    )

    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)

    return saved_job


@router.get("/saved-jobs", response_model=list[schemas.JobResponse])
def get_saved_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_job_seeker_user)
):
    saved_jobs = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id
    ).all()

    job_ids = [saved_job.job_id for saved_job in saved_jobs]

    if not job_ids:
        return []

    jobs = db.query(models.Job).filter(
        models.Job.id.in_(job_ids)
    ).order_by(models.Job.id.desc()).all()

    return jobs


@router.delete("/saved-jobs/{job_id}")
def remove_saved_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_job_seeker_user)
):
    saved_job = db.query(models.SavedJob).filter(
        models.SavedJob.user_id == current_user.id,
        models.SavedJob.job_id == job_id
    ).first()

    if saved_job is None:
        raise HTTPException(status_code=404, detail="Saved job not found")

    db.delete(saved_job)
    db.commit()

    return {"message": "Saved job removed successfully"}