from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class GoogleLogin(BaseModel):
    code: str
    redirect_uri: str
    password: str | None = None

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=72)
    role: str

    @field_validator("password")
    @classmethod
    def password_byte_limit(cls, value):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value

    @field_validator("name")
    @classmethod
    def registration_name(cls, value):
        if not value.strip():
            raise ValueError("Name cannot be blank")
        return value.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    email_verified: bool
    has_password: bool

    class Config:
        from_attributes = True
        
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)

    @field_validator("name")
    @classmethod
    def clean_name(cls, value):
        if not value.strip():
            raise ValueError("Name cannot be blank")
        return value.strip()


class EmailRequest(BaseModel):
    email: EmailStr = Field(max_length=255)


class EmailCode(EmailRequest):
    code: str = Field(pattern=r"^[0-9]{6}$")


class NewPassword(BaseModel):
    new_password: str = Field(min_length=8, max_length=72)
    confirmation: str

    @model_validator(mode="after")
    def validate_password(self):
        if len(self.new_password.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        if self.new_password != self.confirmation:
            raise ValueError("Passwords do not match")
        return self


class PasswordUpdate(NewPassword):
    current_password: str | None = None


class PasswordReset(NewPassword):
    reset_token: str = Field(min_length=32, max_length=128)


class MessageResponse(BaseModel):
    message: str


class ResetCodeResponse(BaseModel):
    reset_token: str


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
