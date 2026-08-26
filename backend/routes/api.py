import os
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Patient, Report
from schemas import PatientResponse, PredictionResponse
from services.ml_service import get_ml_service
from services.report_service import generate_report

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
REPORTS_DIR = os.getenv("REPORTS_DIR", "reports")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/predict", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
async def predict(
    name: str = Form(...),
    age: int = Form(...),
    gender: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # ── Validate inputs ──────────────────────────────────────────────────────
    name = name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Patient name must not be empty.")
    if age < 0 or age > 120:
        raise HTTPException(status_code=422, detail="Age must be between 0 and 120.")
    if gender.lower() not in {"male", "female", "other"}:
        raise HTTPException(status_code=422, detail="Gender must be male, female, or other.")

    # ── Validate image ───────────────────────────────────────────────────────
    ext = os.path.splitext(image.filename or "")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    image_bytes = await image.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image file too large (max 20 MB).")
    if len(image_bytes) == 0:
        raise HTTPException(status_code=422, detail="Uploaded image is empty.")

    # ── Save image ───────────────────────────────────────────────────────────
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    image_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(image_path, "wb") as f:
        f.write(image_bytes)

    # ── Run ML inference ──────────────────────────────────────────────────────
    try:
        ml = get_ml_service()
        prediction = ml.predict(image_bytes)
    except Exception as e:
        os.remove(image_path)  # cleanup on failure
        logger.error(f"ML inference failed: {e}")
        raise HTTPException(status_code=500, detail=f"ML inference failed: {str(e)}")

    # ── Persist to DB ────────────────────────────────────────────────────────
    patient = Patient(
        name=name,
        age=age,
        gender=gender.lower(),
        image_path=image_path,
        result=prediction["result"],
        confidence=prediction["confidence"],
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return PredictionResponse(
        result=prediction["result"],
        confidence=prediction["confidence"],
        patient_id=patient.id,
        message="Prediction completed successfully."
    )


@router.get("/patients", response_model=List[PatientResponse])
def get_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = db.query(Patient).order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()
    return patients


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    return patient


@router.get("/report/{patient_id}")
def get_report(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")

    # Check if recent report exists
    existing = (
        db.query(Report)
        .filter(Report.patient_id == patient_id)
        .order_by(Report.created_at.desc())
        .first()
    )
    if existing and existing.report_path and os.path.exists(existing.report_path):
        return FileResponse(
            path=existing.report_path,
            media_type="application/pdf",
            filename=f"DR_Report_{patient.name.replace(' ', '_')}_{patient_id}.pdf"
        )

    # Generate new report
    try:
        ml = get_ml_service()
        prediction_details = {}
        if patient.image_path and os.path.exists(patient.image_path):
            with open(patient.image_path, "rb") as f:
                prediction_details = ml.predict(f.read())
    except Exception:
        prediction_details = {}

    try:
        report_path = generate_report(patient, prediction_details, REPORTS_DIR)
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

    report = Report(patient_id=patient.id, report_path=report_path)
    db.add(report)
    db.commit()

    return FileResponse(
        path=report_path,
        media_type="application/pdf",
        filename=f"DR_Report_{patient.name.replace(' ', '_')}_{patient_id}.pdf"
    )


@router.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
    # Remove associated files
    if patient.image_path and os.path.exists(patient.image_path):
        try:
            os.remove(patient.image_path)
        except OSError:
            pass
    db.delete(patient)
    db.commit()
