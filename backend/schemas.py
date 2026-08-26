from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str

    @field_validator("name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip()

    @field_validator("age")
    @classmethod
    def age_must_be_valid(cls, v: int) -> int:
        if v < 0 or v > 120:
            raise ValueError("Age must be between 0 and 120")
        return v

    @field_validator("gender")
    @classmethod
    def gender_must_be_valid(cls, v: str) -> str:
        allowed = {"male", "female", "other"}
        if v.lower() not in allowed:
            raise ValueError(f"Gender must be one of: {', '.join(allowed)}")
        return v.lower()


class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    result: str
    confidence: float
    image_path: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionResponse(BaseModel):
    result: str
    confidence: float
    patient_id: int
    message: str


class ReportResponse(BaseModel):
    id: int
    patient_id: int
    report_path: str
    created_at: datetime

    model_config = {"from_attributes": True}
