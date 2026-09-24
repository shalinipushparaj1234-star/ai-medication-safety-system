from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    allergies = Column(String, default="")       # comma-separated, demo data
    conditions = Column(String, default="")       # comma-separated (paramedical data)
    notes = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    prescriptions = relationship("Prescription", back_populates="patient", cascade="all, delete-orphan")
    analyses = relationship("AgentAnalysis", back_populates="patient", cascade="all, delete-orphan")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    doctor_name = Column(String, nullable=False)
    hospital = Column(String, default="")
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, default="")
    date_prescribed = Column(String, default="")

    patient = relationship("Patient", back_populates="prescriptions")


class AgentAnalysis(Base):
    __tablename__ = "agent_analyses"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    interactions_json = Column(Text, default="[]")      # raw interaction hits
    guardian_report = Column(Text, default="")
    physician_report = Column(Text, default="")
    pharmacist_report = Column(Text, default="")
    recommendation = Column(Text, default="")
    overall_risk = Column(String, default="LOW")         # HIGH / MEDIUM / LOW

    review_status = Column(String, default="PENDING")    # PENDING / APPROVED / REJECTED
    reviewer_name = Column(String, default="")
    review_comment = Column(String, default="")
    reviewed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="analyses")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    patient_id = Column(Integer, nullable=True)
    action = Column(String, nullable=False)
    details = Column(Text, default="")