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