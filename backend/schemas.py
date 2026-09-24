from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = ""
    allergies: Optional[str] = ""
    conditions: Optional[str] = ""
    notes: Optional[str] = ""


class PatientOut(PatientCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PrescriptionCreate(BaseModel):
    doctor_name: str
    hospital: Optional[str] = ""
    medicine_name: str
    dosage: Optional[str] = ""
    date_prescribed: Optional[str] = ""


class PrescriptionOut(PrescriptionCreate):
    id: int
    patient_id: int

    class Config:
        from_attributes = True


class ReviewDecision(BaseModel):
    decision: str          # "APPROVED" or "REJECTED"
    reviewer_name: str
    comment: Optional[str] = ""


class AgentAnalysisOut(BaseModel):
    id: int
    patient_id: int
    created_at: datetime
    interactions_json: str
    guardian_report: str
    physician_report: str
    pharmacist_report: str
    recommendation: str
    overall_risk: str
    review_status: str
    reviewer_name: str
    review_comment: str
    reviewed_at: Optional[datetime]

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: int
    timestamp: datetime
    patient_id: Optional[int]
    action: str
    details: str

    class Config:
        from_attributes = True