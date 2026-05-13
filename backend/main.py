from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from auth import create_access_token, decode_access_token, hash_password, verify_password
from bs4 import BeautifulSoup

import models
import schemas
from database import SessionLocal, engine
import requests

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
bearer_scheme = HTTPBearer()

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

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate login token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    email = payload.get("sub")

    if email is None:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if user is None:
        raise credentials_exception

    return user

def require_company_user(
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "company":
        raise HTTPException(
            status_code=403,
            detail="Only company accounts can perform this action"
        )

    return current_user

def require_job_seeker_user(
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "job_seeker":
        raise HTTPException(
            status_code=403,
            detail="Only job seeker accounts can save jobs"
        )

    return current_user

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return "No description available."

    soup = BeautifulSoup(raw_html, "html.parser")

    for tag in soup(["script", "style", "img"]):
        tag.decompose()

    text = soup.get_text(separator="\n")

    lines = [line.strip() for line in text.splitlines() if line.strip()]

    return "\n".join(lines)

@app.get("/")
def home():
    return {"message": "Mihna API is running with PostgreSQL"}


@app.get("/jobs", response_model=list[schemas.JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(models.Job).order_by(models.Job.id.desc()).all()
    return jobs

@app.get("/company/jobs", response_model=list[schemas.JobResponse])
def get_company_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    jobs = db.query(models.Job).filter(
        models.Job.owner_id == current_user.id
    ).order_by(models.Job.id.desc()).all()

    return jobs

@app.post("/jobs", response_model=schemas.JobResponse)
def create_job(
    job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    new_job = models.Job(
        **job.model_dump(),
        owner_id=current_user.id
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job

@app.delete("/jobs/{job_id}")
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role != "company":
        raise HTTPException(
            status_code=403,
            detail="Only company accounts can delete jobs"
        )

    if job.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own jobs"
        )

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}

@app.put("/jobs/{job_id}", response_model=schemas.JobResponse)
def update_job(
    job_id: int,
    updated_job: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    if current_user.role != "company":
        raise HTTPException(
            status_code=403,
            detail="Only company accounts can update jobs"
        )

    if job.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only update your own jobs"
        )

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

@app.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    valid_roles = ["job_seeker", "company"]

    if user.role not in valid_roles:
        raise HTTPException(
            status_code=400,
            detail="Role must be either job_seeker or company"
        )

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post("/login", response_model=schemas.TokenResponse)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_is_correct = verify_password(
        user.password,
        existing_user.password_hash
    )

    if not password_is_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={
            "sub": existing_user.email,
            "user_id": existing_user.id,
            "role": existing_user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": existing_user,
    }

@app.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/saved-jobs/{job_id}", response_model=schemas.SavedJobResponse)
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

@app.get("/saved-jobs", response_model=list[schemas.JobResponse])
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

@app.delete("/saved-jobs/{job_id}")
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

@app.post("/company/fetch-remotive-jobs")
def fetch_remotive_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_company_user)
):
    response = requests.get("https://remotive.com/api/remote-jobs", timeout=20)

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch jobs from Remotive"
        )

    data = response.json()
    remote_jobs = data.get("jobs", [])

    added_count = 0
    skipped_count = 0

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
            owner_id=current_user.id,
            source="remotive",
            external_id=external_id,
        )

        db.add(new_job)
        added_count += 1

    db.commit()

    return {
        "message": "Remotive jobs fetched successfully",
        "added": added_count,
        "skipped_duplicates": skipped_count,
        "source": "remotive",
    }