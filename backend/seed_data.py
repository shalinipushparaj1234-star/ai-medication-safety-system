"""Seeds the SQLite DB with a couple of demo patients + prescriptions, so the
app has something to show immediately after setup."""

from database import SessionLocal, engine, Base
import models


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.Patient).count() > 0:
            print("Database already has data, skipping seed.")
            return

        p1 = models.Patient(
            name="Ramesh Kumar",
            age=67,
            gender="Male",
            allergies="Penicillin",
            conditions="Atrial Fibrillation, Hypertension",
            notes="Demo patient #1 for prototype purposes.",
        )
        p2 = models.Patient(
            name="Anita Sharma",
            age=45,
            gender="Female",
            allergies="",
            conditions="Type 2 Diabetes",
            notes="Demo patient #2 for prototype purposes.",
        )
        db.add_all([p1, p2])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)

        prescriptions = [
            models.Prescription(patient_id=p1.id, doctor_name="Dr. Iyer (Cardiologist)",
                                 hospital="City Heart Hospital", medicine_name="Warfarin",
                                 dosage="5mg once daily", date_prescribed="2026-09-10"),
            models.Prescription(patient_id=p1.id, doctor_name="Dr. Mehta (Orthopedic)",
                                 hospital="Sunrise Clinic", medicine_name="Ibuprofen",
                                 dosage="400mg twice daily", date_prescribed="2026-09-18"),
            models.Prescription(patient_id=p2.id, doctor_name="Dr. Rao (Endocrinologist)",
                                 hospital="City Heart Hospital", medicine_name="Metformin",
                                 dosage="500mg twice daily", date_prescribed="2026-09-05"),
            models.Prescription(patient_id=p2.id, doctor_name="Dr. Singh (General Physician)",
                                 hospital="Wellness Clinic", medicine_name="Ibuprofen",
                                 dosage="200mg as needed", date_prescribed="2026-09-20"),
        ]
        db.add_all(prescriptions)

        db.add(models.AuditLog(action="SEED_DATA", details="Demo patients and prescriptions created."))
        db.commit()
        print("Seed data inserted.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()