from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Mihna API is running with PostgreSQL"}


@app.get("/jobs", response_model=list[schemas.JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.Job).order_by(models.Job.id.desc()).all()
    return jobs


@app.post("/jobs", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, db: Session = Depends(get_db)):
    new_job = models.Job(**job.model_dump())

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}

@app.put("/jobs/{job_id}", response_model=schemas.JobResponse)
def update_job(
    job_id: int,
    updated_job: schemas.JobCreate,
    db: Session = Depends(get_db)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    job.title = updated_job.title
    job.company = updated_job.company
    job.country = updated_job.country
    job.city = updated_job.city
    job.type = updated_job.type
    job.salary = updated_job.salary
    job.link = updated_job.link
    job.description = updated_job.description

    db.commit()
    db.refresh(job)

    return job