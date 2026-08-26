import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
from routes.api import router
from services.ml_service import get_ml_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
REPORTS_DIR = os.getenv("REPORTS_DIR", "reports")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs(REPORTS_DIR, exist_ok=True)
    logger.info("Loading ML model...")
    get_ml_service()  # Eagerly load on startup
    logger.info("Application ready.")
    yield
    # Shutdown
    logger.info("Shutting down.")


app = FastAPI(
    title="Diabetic Retinopathy Detection API",
    version="1.0.0",
    description="AI-powered retinal analysis system for detecting diabetic retinopathy.",
    lifespan=lifespan
)

# CORS — allow all origins in development; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "https://retin-ai.vercel.app",
    "https://retin-2a486xuy9-vigya-s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded images
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# API routes
app.include_router(router, prefix="/api/v1", tags=["DR Detection"])


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "DR Detection API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
