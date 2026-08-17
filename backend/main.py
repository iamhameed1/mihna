from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models
from database import engine
from routers import auth as auth_router
from routers import saved_jobs as saved_jobs_router
from routers import jobs as jobs_router
from routers import company as company_router
from routers import analytics as analytics_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    root_path="/api",
    root_path_in_servers=True,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(saved_jobs_router.router)
app.include_router(jobs_router.router)
app.include_router(company_router.router)
app.include_router(analytics_router.router)


@app.get("/")
def home():
    return {"message": "Mihna API is running with PostgreSQL"}