import json
from datetime import datetime
from typing import List

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
import models
import schemas
import agents
from interaction_db import KNOWN_MEDICINES

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Multi-Agent Medication Safety & Reconciliation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def log_action(db: Session, action: str, details: str = "", patient_id: int = None):
    entry = models.AuditLog(action=action, details=details, patient_id=patient_id)
    db.add(entry)
    db.commit()


@app.get("/")
def root():
    return {"status": "ok", "service": "medication-safety-backend"}


@app.get("/api/known-medicines")
def known_medicines():
    return {"medicines": KNOWN_MEDICINES}


# ---------- Patients ----------

@app.post("/api/patients", response_model=schemas.PatientOut)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    log_action(db, "PATIENT_ADDED", f"Patient '{db_patient.name}' added.", db_patient.id)
    return db_patient


@app.get("/api/patients", response_model=List[schemas.PatientOut])
def list_patients(db: Session = Depends(get_db)):
    return db.query(models.Patient).order_by(models.Patient.id.desc()).all()


@app.get("/api/patients/{patient_id}", response_model=schemas.PatientOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    return patient


# ---------- Prescriptions ----------

@app.post("/api/patients/{patient_id}/prescriptions", response_model=schemas.PrescriptionOut)
def add_prescription(patient_id: int, rx: schemas.PrescriptionCreate, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    db_rx = models.Prescription(patient_id=patient_id, **rx.dict())
    db.add(db_rx)
    db.commit()
    db.refresh(db_rx)
    log_action(db, "PRESCRIPTION_ADDED",
               f"{rx.medicine_name} prescribed by {rx.doctor_name} for patient #{patient_id}.",
               patient_id)
    return db_rx


@app.get("/api/patients/{patient_id}/prescriptions", response_model=List[schemas.PrescriptionOut])
def list_prescriptions(patient_id: int, db: Session = Depends(get_db)):
    return db.query(models.Prescription).filter(models.Prescription.patient_id == patient_id).all()


@app.delete("/api/prescriptions/{rx_id}")
def delete_prescription(rx_id: int, db: Session = Depends(get_db)):
    rx = db.query(models.Prescription).get(rx_id)
    if not rx:
        raise HTTPException(404, "Prescription not found")
    patient_id = rx.patient_id
    db.delete(rx)
    db.commit()
    log_action(db, "PRESCRIPTION_REMOVED", f"Prescription #{rx_id} removed.", patient_id)
    return {"ok": True}


# ---------- Interaction check (raw, without full agent run) ----------

@app.get("/api/patients/{patient_id}/check-interactions")
def check_interactions(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    prescriptions = db.query(models.Prescription).filter(models.Prescription.patient_id == patient_id).all()
    guardian_result = agents.guardian_agent(patient, prescriptions)
    log_action(db, "INTERACTION_CHECK_RUN",
               f"{len(guardian_result['interaction_hits'])} interaction(s) found.", patient_id)
    return guardian_result


# ---------- Multi-agent analysis ----------

@app.post("/api/patients/{patient_id}/analyze", response_model=schemas.AgentAnalysisOut)
def run_agent_analysis(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).get(patient_id)
    if not patient:
        raise HTTPException(404, "Patient not found")
    prescriptions = db.query(models.Prescription).filter(models.Prescription.patient_id == patient_id).all()
    if not prescriptions:
        raise HTTPException(400, "Add at least one prescription before running analysis.")

    guardian_result = agents.guardian_agent(patient, prescriptions)
    physician_report = agents.physician_agent(patient, guardian_result)
    pharmacist_report = agents.pharmacist_agent(patient, guardian_result)
    recommendation, overall_risk = agents.coordinator_agent(
        patient, guardian_result, physician_report, pharmacist_report
    )

    analysis = models.AgentAnalysis(
        patient_id=patient_id,
        interactions_json=json.dumps(guardian_result["interaction_hits"]),
        guardian_report=guardian_result["report"],
        physician_report=physician_report,
        pharmacist_report=pharmacist_report,
        recommendation=recommendation,
        overall_risk=overall_risk,
        review_status="PENDING",
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)

    log_action(db, "AGENT_ANALYSIS_RUN",
               f"Overall risk: {overall_risk}. Analysis #{analysis.id} created.", patient_id)
    return analysis


@app.get("/api/patients/{patient_id}/analyses", response_model=List[schemas.AgentAnalysisOut])
def list_analyses(patient_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.AgentAnalysis)
        .filter(models.AgentAnalysis.patient_id == patient_id)
        .order_by(models.AgentAnalysis.id.desc())
        .all()
    )


@app.get("/api/analyses/{analysis_id}", response_model=schemas.AgentAnalysisOut)
def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(models.AgentAnalysis).get(analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    return analysis


# ---------- Human review (approve/reject) ----------

@app.post("/api/analyses/{analysis_id}/review", response_model=schemas.AgentAnalysisOut)
def review_analysis(analysis_id: int, decision: schemas.ReviewDecision, db: Session = Depends(get_db)):
    analysis = db.query(models.AgentAnalysis).get(analysis_id)
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    if decision.decision not in ("APPROVED", "REJECTED"):
        raise HTTPException(400, "decision must be APPROVED or REJECTED")

    analysis.review_status = decision.decision
    analysis.reviewer_name = decision.reviewer_name
    analysis.review_comment = decision.comment or ""
    analysis.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(analysis)

    log_action(
        db, f"RECOMMENDATION_{decision.decision}",
        f"Analysis #{analysis_id} {decision.decision.lower()} by {decision.reviewer_name}. "
        f"Comment: {decision.comment or '(none)'}",
        analysis.patient_id,
    )
    return analysis


# ---------- Audit log ----------

@app.get("/api/audit-log", response_model=List[schemas.AuditLogOut])
def full_audit_log(db: Session = Depends(get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).limit(300).all()


@app.get("/api/patients/{patient_id}/audit-log", response_model=List[schemas.AuditLogOut])
def patient_audit_log(patient_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.AuditLog)
        .filter(models.AuditLog.patient_id == patient_id)
        .order_by(models.AuditLog.id.desc())
        .all()
    )