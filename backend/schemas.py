from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True
        
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class JobCreate(BaseModel):
    title: str
    company: str
    country: str
    city: str
    type: str
    salary: str
    link: str
    description: str


class JobResponse(JobCreate):
    id: int
    owner_id: int | None = None
    source: str | None = None
    external_id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

class SavedJobResponse(BaseModel):
    id: int
    user_id: int
    job_id: int

    class Config:
        from_attributes = True

class IngestionLogResponse(BaseModel):
    id: int
    source: str
    added_count: int
    skipped_count: int
    status: str
    error_message: str | None = None
    started_at: datetime
    finished_at: datetime | None = None

    class Config:
        from_attributes = True

class JobsPageResponse(BaseModel):
    items: list[JobResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class CountItem(BaseModel):
    name: str
    count: int

class DateCountItem(BaseModel):
    date: str
    count: int

class AnalyticsSummaryResponse(BaseModel):
    total_jobs: int
    total_companies: int
    manual_jobs: int
    remotive_jobs: int
    platform_jobs: int

    remote_jobs: int
    hybrid_jobs: int
    onsite_jobs: int

    top_cities: list[CountItem]
    top_companies: list[CountItem]

    jobs_by_source: list[CountItem]
    jobs_by_type: list[CountItem]
    jobs_by_date: list[DateCountItem]