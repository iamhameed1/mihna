from pydantic import BaseModel


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

    class Config:
        from_attributes = True