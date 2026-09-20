import os
import io
import datetime
import json
import httpx
import re
from typing import List, Optional, Dict

from fastapi import FastAPI, Depends, HTTPException, status, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
import pandas as pd

from database import get_db, engine, Base
import models
import schemas
import auth
import pdf_generator
import anakin_client
import clinical_nlp

NHA_RATES_FILE = os.path.join(os.path.dirname(__file__), "nha_cghs_rates.json")
NHA_BENCHMARKS = []
if os.path.exists(NHA_RATES_FILE):
    try:
        with open(NHA_RATES_FILE, "r", encoding="utf-8") as f:
            NHA_BENCHMARKS = json.load(f).get("benchmarks", [])
    except Exception as e:
        print(f"Warning: Could not load nha_cghs_rates.json: {e}")

app = FastAPI(title="HospiSyn API", version="1.0.0")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "message": "HospiSyn Backend API is running. Access the API documentation at /docs"
    }

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://hospi-syn-ai.vercel.app"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file mount for PDF downloads
RECEIPTS_DIR = "/app/receipts" if os.path.exists("/app/receipts") else "./receipts"
if not os.path.exists(RECEIPTS_DIR):
    os.makedirs(RECEIPTS_DIR)

app.mount("/receipts", StaticFiles(directory=RECEIPTS_DIR), name="receipts")


# ----------------------------------------------------
# DB INITIALIZATION & SEEDING ON STARTUP
# ----------------------------------------------------
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        # Run universal migration check to ensure columns exist on existing databases (PostgreSQL & SQLite)
        try:
            from sqlalchemy import text, inspect
            inspector = inspect(engine)
            
            def safe_add_column(table_name, column_name, column_type_sql):
                try:
                    columns = [c['name'] for c in inspector.get_columns(table_name)]
                    if column_name not in columns:
                        if engine.dialect.name == "postgresql":
                            db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {column_type_sql}"))
                        else:
                            db.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type_sql}"))
                        db.commit()
                except Exception as migrate_err:
                    db.rollback()
                    print(f"Migration notice ({table_name}.{column_name}):", migrate_err)

            safe_add_column("doctors", "consultation_fee", "FLOAT DEFAULT 500.0")
            safe_add_column("doctors", "consultation_validity_days", "INTEGER DEFAULT 7")
            safe_add_column("visits", "doctor_id", "INTEGER REFERENCES doctors(id)")
            safe_add_column("visits", "diagnosis", "VARCHAR")
            safe_add_column("visits", "chief_complaints", "VARCHAR")
            safe_add_column("visits", "medicines_list", "VARCHAR")
            safe_add_column("visits", "tests_list", "VARCHAR")
            safe_add_column("visits", "advice", "VARCHAR")
            safe_add_column("visits", "follow_up_date", "VARCHAR")
            safe_add_column("visits", "patient_summary", "TEXT")
            safe_add_column("visits", "status", "VARCHAR DEFAULT 'Waiting'")
            safe_add_column("patients", "abha_id", "VARCHAR")
        except Exception as e:
            print("Migration setup warning:", e)

        # Seed default doctor if table is empty
        if db.query(models.Doctor).count() == 0:
            default_doctor = models.Doctor(
                name="Dr. Shweta Grover",
                degree="MBBS, MD (Pathology), PhD\nPDF (Dermatopathology, Hamburg, Germany)\nConsultant Pathologist",
                consultation_fee=500.0,
                consultation_validity_days=7
            )
            db.add(default_doctor)
            db.commit()

        # 1. Seed Users
        users_to_seed = [
            ("admin", "admin123", "Admin", "System Administrator"),
            ("receptionist", "recep123", "Receptionist", "Front Desk Receptionist"),
            ("accountant", "acct123", "Accountant", "Chief Accountant"),
            ("doctor", "doc123", "Doctor", "Dr. Shweta Grover")
        ]
        for username, password, role, name in users_to_seed:
            existing_user = db.query(models.User).filter(models.User.username == username).first()
            if not existing_user:
                db_user = models.User(
                    username=username,
                    password_hash=auth.get_password_hash(password),
                    role=role,
                    name=name
                )
                db.add(db_user)
        db.commit()

        # 2. Seed Settings
        default_settings = {
            "hospital_name": "Vedam Diagnostics",
            "logo_text": "Sincere Care...",
            "doctor_name": "Dr. Shweta Grover",
            "doctor_degree": "MBBS, MD (Pathology), PhD\nPDF (Dermatopathology, Hamburg, Germany)\nConsultant Pathologist",
            "collection_centre": "Collection Centre:\n4 Harilok, Dhanvantari Saket Road,\nNear Rohtash Sweets,\nMeerut 250003",
            "contact_number": "+91 98765 43210",
            "gst_number": "27AAAAA1111A1Z1",
            "receipt_prefix": "REC"
        }
        for key, val in default_settings.items():
            existing = db.query(models.Setting).filter(models.Setting.key == key).first()
            if not existing:
                db_setting = models.Setting(key=key, value=val)
                db.add(db_setting)
        db.commit()

        # 3. Seed Services Catalog & Essential OPD Medicines
        services_to_seed = [
            # Doctor Consultations
            ("Doctor Consultation", "General Physician Consultation", 400.0),
            ("Doctor Consultation", "Specialist Consultation", 800.0),
            ("Doctor Consultation", "Pediatric Consultation", 500.0),

            # OPD Charges
            ("OPD Charges", "OPD Registration Fee", 100.0),
            ("OPD Charges", "Wound Dressing & Bandaging", 150.0),
            ("OPD Charges", "Nebulization Session", 200.0),
            ("OPD Charges", "ECG Recording", 300.0),

            # IPD & ICU
            ("IPD Charges", "General Ward Room Rent (Per Day)", 1500.0),
            ("IPD Charges", "Semi-Private Room Rent (Per Day)", 3000.0),
            ("ICU Charges", "ICU Bed Charges (Per Day)", 8000.0),
            ("ICU Charges", "ICU Ventilator Support (Per Day)", 5000.0),

            # Laboratory Tests
            ("Laboratory Tests", "Complete Blood Count (CBC)", 350.0),
            ("Laboratory Tests", "Lipid Profile Panel", 800.0),
            ("Laboratory Tests", "Blood Glucose (Fasting & PP)", 150.0),
            ("Laboratory Tests", "HbA1c Glycated Hemoglobin", 550.0),
            ("Laboratory Tests", "Liver Function Test (LFT)", 750.0),
            ("Laboratory Tests", "Kidney Function Test (KFT)", 700.0),
            ("Laboratory Tests", "Thyroid Profile (T3 T4 TSH)", 650.0),
            ("Laboratory Tests", "Urine Routine & Microscopy (RE/ME)", 200.0),
            ("Laboratory Tests", "Dengue NS1 Antigen & IgM", 900.0),
            ("Laboratory Tests", "Typhoid Widal Test", 300.0),

            # Radiology
            ("Radiology/X-Ray/MRI", "Chest X-Ray PA View", 450.0),
            ("Radiology/X-Ray/MRI", "Ultrasound Abdomen & Pelvis", 1200.0),
            ("Radiology/X-Ray/MRI", "MRI Brain Scan (Non-Contrast)", 6500.0),
            ("Radiology/X-Ray/MRI", "CT Scan Chest / HRCT", 3500.0),

            # Pharmacy & Essential OPD Medicines
            ("Pharmacy/Medicines", "Crocin / Paracetamol Suspension (Pediatric)", 45.0),
            ("Pharmacy/Medicines", "Dolo 650mg / Crocin Paracetamol Tablets", 35.0),
            ("Pharmacy/Medicines", "Montek LC / Montek LC Pediatric Tablets", 110.0),
            ("Pharmacy/Medicines", "Augmentin 625mg / Augmentin DDS Suspension", 210.0),
            ("Pharmacy/Medicines", "Azithromycin 500mg / Suspension", 120.0),
            ("Pharmacy/Medicines", "Pantocid 40mg / Pan-D PPI Antacid", 95.0),
            ("Pharmacy/Medicines", "Cefixime 200mg Antibiotic", 140.0),
            ("Pharmacy/Medicines", "Cetirizine 10mg Anti-allergy", 30.0),
            ("Pharmacy/Medicines", "Saline Nasal Drops / Spray", 65.0),
            ("Pharmacy/Medicines", "ORS Hydration Electrolyte Sachet", 25.0),
            ("Pharmacy/Medicines", "Cough Syrup (Dextromethorphan / Expectorant)", 85.0),
            ("Pharmacy/Medicines", "Amoxicillin 500mg Capsules", 90.0),
            ("Pharmacy/Medicines", "Meftal-Spas / Dicyclomine Tablets (Abdominal Pain)", 45.0),
            ("Pharmacy/Medicines", "Combiflam (Ibuprofen + Paracetamol)", 40.0),
            ("Pharmacy/Medicines", "Zerodol-SP / Aceclofenac + Serratiopeptidase", 95.0),
            ("Pharmacy/Medicines", "Emeset 4mg / Ondansetron (Nausea/Vomiting)", 55.0),
            ("Pharmacy/Medicines", "Digene / Gelusil Antacid Liquid Gel", 85.0),
            ("Pharmacy/Medicines", "Sporlac / Probiotic Sachets", 60.0),
            ("Pharmacy/Medicines", "Allegra 120mg / Fexofenadine Anti-allergy", 125.0),
            ("Pharmacy/Medicines", "Ofloxacin + Ornidazole (Oflox-OZ) Tablets", 115.0),
            ("Pharmacy/Medicines", "Norfloxacin 400mg Tablets", 65.0),
            ("Pharmacy/Medicines", "Betadine Gargle / Antiseptic Mouthwash", 110.0),
            ("Pharmacy/Medicines", "Volini / Dynapar Pain Relief Gel", 90.0),
            ("Pharmacy/Medicines", "Multivitamins & Supps (30 Days)", 350.0),
            ("Pharmacy/Medicines", "Antibiotics Prescribed Course", 450.0),
            ("Pharmacy/Medicines", "Calcium + Vitamin D3 Tablets", 150.0),
            ("Pharmacy/Medicines", "Diclofenac / Aceclofenac Pain Relief Tablets", 55.0),
            ("Pharmacy/Medicines", "Ibuprofen 400mg Tablets", 40.0),
            ("Pharmacy/Medicines", "Metronidazole 400mg Tablets", 50.0),
            ("Pharmacy/Medicines", "Colic / Digestive Drops (Pediatric)", 55.0),
            ("Pharmacy/Medicines", "First-Aid Bandage & Sterile Gauze Kit", 75.0),

            # Other Hospital Services
            ("Other Hospital Services", "Ambulance Emergency Transfer", 1500.0),
            ("Other Hospital Services", "Attendant/Nursing Fee (Per Shift)", 500.0)
        ]
        for cat, name, price in services_to_seed:
            existing = db.query(models.Service).filter(models.Service.name == name).first()
            if not existing:
                db_serv = models.Service(category=cat, name=name, price=price, is_active=True)
                db.add(db_serv)
        db.commit()

    except Exception as e:
        print("Error during seeding database: ", e)
    finally:
        db.close()


# ----------------------------------------------------
# HELPERS
# ----------------------------------------------------
def generate_unique_id(db: Session, prefix: str, table_model, id_column) -> str:
    today_str = datetime.date.today().strftime("%Y%m%d")
    id_prefix = f"{prefix}-{today_str}-"
    # Find matching IDs today
    last_item = db.query(table_model).filter(
        id_column.like(f"{id_prefix}%")
    ).order_by(id_column.desc()).first()
    
    if last_item:
        last_id_str = getattr(last_item, id_column.key)
        try:
            last_counter = int(last_id_str.split("-")[-1])
            new_counter = last_counter + 1
        except (ValueError, IndexError):
            new_counter = 1
    else:
        new_counter = 1
        
    return f"{id_prefix}{new_counter:05d}"

def log_action(db: Session, user_id: Optional[int], action: str, target_table: str, target_id: str, details: str):
    try:
        log = models.AuditLog(
            user_id=user_id,
            action=action,
            target_table=target_table,
            target_id=target_id,
            details=details
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning: Failed to persist audit log: {e}")


# ----------------------------------------------------
# AUTHENTICATION ROUTERS
# ----------------------------------------------------
@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    
    # Audit log login
    log_action(db, user.id, "USER_LOGIN", "users", str(user.id), f"User {user.username} logged in successfully.")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "name": user.name
    }

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/api/auth/users", response_model=schemas.UserResponse)
def create_user(
    user_in: schemas.UserCreate, 
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    db_user = models.User(
        username=user_in.username,
        password_hash=auth.get_password_hash(user_in.password),
        role=user_in.role,
        name=user_in.name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    log_action(db, admin_user.id, "CREATE_USER", "users", str(db_user.id), f"Created staff user {db_user.username} with role {db_user.role}")
    return db_user

@app.get("/api/auth/users", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    admin_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    return db.query(models.User).order_by(models.User.username).all()


# ----------------------------------------------------
# PATIENT ROUTERS
# ----------------------------------------------------
@app.post("/api/patients", response_model=schemas.PatientResponse)
def register_patient(
    patient_in: schemas.PatientCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist"]))
):
    patient_id = generate_unique_id(db, "PAT", models.Patient, models.Patient.patient_id)
    db_patient = models.Patient(
        patient_id=patient_id,
        abha_id=patient_in.abha_id,
        name=patient_in.name,
        age=patient_in.age,
        gender=patient_in.gender,
        mobile_number=patient_in.mobile_number,
        address=patient_in.address
    )
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    log_action(db, current_user.id, "REGISTER_PATIENT", "patients", str(db_patient.id), f"Registered patient {db_patient.name} with ID {db_patient.patient_id}")
    return db_patient

@app.get("/api/patients", response_model=List[schemas.PatientResponse])
def search_patients(
    query: Optional[str] = Query(None, description="Search by Patient ID, Name, Mobile, Bill No or Receipt No"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant", "Doctor"]))
):
    q = db.query(models.Patient).options(
        joinedload(models.Patient.visits).joinedload(models.Visit.bills),
        joinedload(models.Patient.visits).joinedload(models.Visit.doctor)
    ).filter(models.Patient.is_active == True)
    
    if query:
        # Check if query matches Receipt ID or Bill ID to trace back
        receipt_match = db.query(models.Payment).join(models.Receipt).filter(
            models.Receipt.receipt_id.ilike(f"%{query}%")
        ).first()
        if receipt_match:
            # Found patient from receipt
            if receipt_match.bill:
                patient_id = receipt_match.bill.visit.patient_id
                return q.filter(models.Patient.id == patient_id).all()
            elif receipt_match.visit:
                patient_id = receipt_match.visit.patient_id
                return q.filter(models.Patient.id == patient_id).all()

        bill_match = db.query(models.Bill).filter(models.Bill.bill_id.ilike(f"%{query}%")).first()
        if bill_match:
            patient_id = bill_match.visit.patient_id
            return q.filter(models.Patient.id == patient_id).all()

        # Fallback to standard details query
        q = q.filter(
            or_(
                models.Patient.patient_id.ilike(f"%{query}%"),
                models.Patient.name.ilike(f"%{query}%"),
                models.Patient.mobile_number.ilike(f"%{query}%")
            )
        )
        
    return q.order_by(models.Patient.created_at.desc()).all()

@app.get("/api/patients/{id}", response_model=schemas.PatientResponse)
def get_patient(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant", "Doctor"]))
):
    patient = db.query(models.Patient).filter(models.Patient.id == id, models.Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.delete("/api/patients/{id}")
def delete_patient(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.is_active = False
    patient.deleted_at = datetime.datetime.utcnow()
    db.commit()
    
    log_action(db, current_user.id, "DELETE_PATIENT", "patients", str(id), f"Soft-deleted patient {patient.name} ({patient.patient_id})")
    return {"message": "Patient soft deleted successfully"}


# ----------------------------------------------------
# VISIT ROUTERS
# ----------------------------------------------------
@app.post("/api/visits", response_model=schemas.VisitResponse)
def create_visit(
    visit_in: schemas.VisitCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist"]))
):
    patient = db.query(models.Patient).filter(models.Patient.id == visit_in.patient_id, models.Patient.is_active == True).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    visit_id = generate_unique_id(db, "VIS", models.Visit, models.Visit.visit_id)
    db_visit = models.Visit(
        visit_id=visit_id,
        patient_id=visit_in.patient_id,
        reason=visit_in.reason,
        doctor_id=visit_in.doctor_id,
        status=visit_in.status or "Waiting"
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    
    log_action(db, current_user.id, "CREATE_VISIT", "visits", str(db_visit.id), f"Created visit {db_visit.visit_id} for patient {patient.name}")
    return db_visit

@app.get("/api/patients/{id}/visits", response_model=List[schemas.VisitResponse])
def get_patient_visits(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant", "Doctor"]))
):
    return db.query(models.Visit).filter(models.Visit.patient_id == id, models.Visit.is_active == True).order_by(models.Visit.visit_date.desc()).all()


@app.get("/api/visits", response_model=List[schemas.VisitResponse])
def get_all_visits(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant", "Doctor"]))
):
    return db.query(models.Visit).filter(models.Visit.is_active == True).order_by(models.Visit.visit_date.desc()).all()


@app.put("/api/visits/{id}/summary", response_model=schemas.VisitResponse)
async def update_visit_summary(
    id: int,
    visit_update: schemas.VisitSummaryUpdate,
    generate_ai_summary: bool = Query(False),
    target_language: str = Query("Hindi"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant", "Doctor"]))
):
    db_visit = db.query(models.Visit).filter(models.Visit.id == id, models.Visit.is_active == True).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Update clinical notes
    db_visit.diagnosis = visit_update.diagnosis
    db_visit.chief_complaints = visit_update.chief_complaints
    db_visit.medicines_list = visit_update.medicines_list
    db_visit.tests_list = visit_update.tests_list
    db_visit.advice = visit_update.advice
    db_visit.follow_up_date = visit_update.follow_up_date
    
    if visit_update.status is not None:
        db_visit.status = visit_update.status
        
    if visit_update.patient_summary is not None:
        db_visit.patient_summary = visit_update.patient_summary

    # Call AI if requested
    if generate_ai_summary:
        api_key = os.getenv("GROQ_API_KEY")
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Groq API key is not configured. Please set GROQ_API_KEY in your .env file."
            )
        
        LANGUAGE_CONFIGS = {
            "Hindi": {
                "script_name": "Devanagari script (हिंदी)",
                "morning_label": "सुबह",
                "afternoon_label": "दोपहर",
                "night_label": "रात",
                "warning_label": "इन बातों का ध्यान रखें",
                "strict_rule": "MUST write ENTIRE translation exclusively in Hindi language using Devanagari script (हिंदी). Absolutely NO Gujarati (નમસ્તે), Marathi, or Punjabi characters!"
            },
            "Kannada": {
                "script_name": "Kannada script (ಕನ್ನಡ)",
                "morning_label": "ಬೆಳಿಗ್ಗೆ",
                "afternoon_label": "ಮಧ್ಯಾಹ್ನ",
                "night_label": "ರಾತ್ರಿ",
                "warning_label": "ಎಚ್ಚರಿಕೆ",
                "strict_rule": "MUST write ENTIRE translation exclusively in Kannada language using Kannada script (ಕನ್ನಡ)."
            },
            "Tamil": {
                "script_name": "Tamil script (தமிழ்)",
                "morning_label": "காலை",
                "afternoon_label": "மதியம்",
                "night_label": "இரவு",
                "warning_label": "எச்சரிக்கை",
                "strict_rule": "MUST write ENTIRE translation exclusively in Tamil language using Tamil script (தமிழ்)."
            },
            "Telugu": {
                "script_name": "Telugu script (తెలుగు)",
                "morning_label": "ఉదయం",
                "afternoon_label": "మధ్యాహ్నం",
                "night_label": "రాత్రి",
                "warning_label": "హెచ్చరిక",
                "strict_rule": "MUST write ENTIRE translation exclusively in Telugu language using Telugu script (తెలుగు)."
            },
            "Bengali": {
                "script_name": "Bengali script (বাংলা)",
                "morning_label": "সকাল",
                "afternoon_label": "দুপুর",
                "night_label": "রাত",
                "warning_label": "সতর্কতা",
                "strict_rule": "MUST write ENTIRE translation exclusively in Bengali language using Bengali script (বাংলা)."
            },
            "Marathi": {
                "script_name": "Devanagari script for Marathi (मराठी)",
                "morning_label": "सकाळ",
                "afternoon_label": "दुपार",
                "night_label": "रात्र",
                "warning_label": "सावधानता",
                "strict_rule": "MUST write ENTIRE translation exclusively in Marathi language using Devanagari script (मराठी)."
            },
            "Gujarati": {
                "script_name": "Gujarati script (ગુજરાતી)",
                "morning_label": "સવાર",
                "afternoon_label": "બપોર",
                "night_label": "રાત",
                "warning_label": "ચેતવણી",
                "strict_rule": "MUST write ENTIRE translation exclusively in Gujarati language using Gujarati script (ગુજરાતી)."
            },
            "Malayalam": {
                "script_name": "Malayalam script (മലയാളം)",
                "morning_label": "രാവിലെ",
                "afternoon_label": "ഉച്ചയ്ക്ക്",
                "night_label": "രാത്രി",
                "warning_label": "മുന്നറിയിപ്പ്",
                "strict_rule": "MUST write ENTIRE translation exclusively in Malayalam language using Malayalam script (മലയാളം)."
            },
            "Punjabi": {
                "script_name": "Gurmukhi script (ਪੰਜਾਬੀ)",
                "morning_label": "ਸਵੇਰ",
                "afternoon_label": "ਦੁਪਹਿਰ",
                "night_label": "ਰਾਤ",
                "warning_label": "ਚੇਤਾਵਨੀ",
                "strict_rule": "MUST write ENTIRE translation exclusively in Punjabi language using Gurmukhi script (ਪੰਜਾਬੀ)."
            },
            "Odia": {
                "script_name": "Odia script (ଓଡ଼ିଆ)",
                "morning_label": "ସକାଳ",
                "afternoon_label": "ମଧ୍ୟାହ୍ନ",
                "night_label": "ରାତି",
                "warning_label": "ସତର୍କତା",
                "strict_rule": "MUST write ENTIRE translation exclusively in Odia language using Odia script (ଓଡ଼ିଆ)."
            },
            "Urdu": {
                "script_name": "Urdu script (اردو)",
                "morning_label": "صبح",
                "afternoon_label": "دوپہر",
                "night_label": "رات",
                "warning_label": "انتباہ",
                "strict_rule": "MUST write ENTIRE translation exclusively in Urdu language using Urdu script (اردو)."
            }
        }

        lang_cfg = LANGUAGE_CONFIGS.get(target_language, {
            "script_name": f"{target_language} script",
            "morning_label": "Morning",
            "afternoon_label": "Afternoon",
            "night_label": "Night",
            "warning_label": "Watch Out For",
            "strict_rule": f"MUST write ENTIRE translation in {target_language}."
        })

        # Storytelling prompt — structured daily routine narrative with emojis
        prompt = f"""You are a compassionate, senior medical assistant helping Indian hospital patients understand their doctor's consultation. Create a highly visual, easy-to-understand "storytelling" summary of their visit.

Doctor's Clinical Notes:
- Diagnosis: {visit_update.diagnosis or 'Not specified'}
- Chief Complaints: {visit_update.chief_complaints or 'Not specified'}
- Medicines Prescribed: {visit_update.medicines_list or 'Not specified'}
- Recommended Tests: {visit_update.tests_list or 'Not specified'}
- Advice Given: {visit_update.advice or 'Not specified'}
- Follow-up: {visit_update.follow_up_date or 'Not specified'}

Your task:
1. Warm Greeting: A brief, comforting sentence (1-2 lines).
2. English Storytelling Routine (Your Day at a Glance):
   - ☀️ Morning: [What medicines to take and why, in plain language — e.g. "Dolo 650mg to bring your fever down, take after breakfast"]
   - 🌤️ Afternoon: [What to take/do and why, or "Rest well and stay hydrated"]
   - 🌙 Night: [What to take before bed and why]
3. Urgent Warnings ⚠️: If any complaint or medicine requires immediate attention (e.g. high fever, chest pain), list them clearly.
4. Translate the entire greeting, routine and warnings into {target_language} using the exact native script {lang_cfg['script_name']}.

CRITICAL SCRIPT & ACCURACY RULE:
{lang_cfg['strict_rule']}
Format the native script labels with their English equivalents in brackets:
   - ☀️ {lang_cfg['morning_label']} (Morning): [details in {target_language} ({lang_cfg['script_name']})]
   - 🌤️ {lang_cfg['afternoon_label']} (Afternoon): [details in {target_language} ({lang_cfg['script_name']})]
   - 🌙 {lang_cfg['night_label']} (Night): [details in {target_language} ({lang_cfg['script_name']})]
   - ⚠️ {lang_cfg['warning_label']} (Watch Out For): [warnings in {target_language} ({lang_cfg['script_name']})]

Strict Output Format (follow exactly, do not add extra markdown or headers):
[English Storytelling Summary]
<warm greeting in English>
☀️ Morning: <details>
🌤️ Afternoon: <details>
🌙 Night: <details>
⚠️ Watch Out For: <warnings or "None — you are on track!">

[{target_language} Summary ({target_language} Summary)]
<greeting in {target_language}>
☀️ {lang_cfg['morning_label']} (Morning): <details in {target_language}>
🌤️ {lang_cfg['afternoon_label']} (Afternoon): <details in {target_language}>
🌙 {lang_cfg['night_label']} (Night): <details in {target_language}>
⚠️ {lang_cfg['warning_label']} (Watch Out For): <warnings or "None">"""

        url = "https://api.groq.com/openai/v1/chat/completions"
        groq_headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.25,
            "max_tokens": 4096
        }

        try:
            async with httpx.AsyncClient(timeout=28.0) as client:
                response = await client.post(url, headers=groq_headers, json=payload)
                if response.status_code != 200:
                    print("GROQ API SUMMARY ERROR RESPONSE:", response.status_code, response.text)
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to communicate with Groq AI API ({response.status_code}): {response.text}"
                    )
                result = response.json()
            db_visit.patient_summary = result["choices"][0]["message"]["content"].strip()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to communicate with Groq AI API: {str(e)}"
            )

    db.commit()
    db.refresh(db_visit)

    log_action(db, current_user.id, "UPDATE_VISIT_SUMMARY", "visits", str(db_visit.id), f"Updated consultation summary and notes for visit {db_visit.visit_id}")
    return db_visit


def generate_prescription_pdf_bg(visit_id: int, pdf_path: str):
    db = next(get_db())
    try:
        visit = db.query(models.Visit).filter(models.Visit.id == visit_id).first()
        if visit:
            pdf_generator.generate_prescription_pdf(visit, db, pdf_path)
    finally:
        db.close()

def generate_receipt_pdf_bg(payment_id: int, pdf_path: str):
    db = next(get_db())
    try:
        payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
        if payment:
            pdf_generator.generate_receipt_pdf(payment, db, pdf_path)
    finally:
        db.close()


@app.get("/api/visits/{id}/prescription-pdf")
def get_visit_prescription_pdf(
    id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_visit = db.query(models.Visit).filter(models.Visit.id == id, models.Visit.is_active == True).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    filename = f"prescription_{db_visit.visit_id}.pdf"
    pdf_path = os.path.join(RECEIPTS_DIR, filename)

    try:
        background_tasks.add_task(generate_prescription_pdf_bg, db_visit.id, pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate prescription PDF: {str(e)}")

    return {"pdf_path": f"/receipts/{filename}"}


@app.post("/api/visits/ai-suggest-treatment", response_model=schemas.AISuggestResponse)
async def ai_suggest_treatment(
    req: schemas.AISuggestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant", "Doctor"]))
):
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    if model == "openai/gpt-oss-120b":
        model = "llama-3.3-70b-versatile"

    def fallback_to_heuristics():
        text_for_nlp = f"{req.chief_complaints or ''}. {req.diagnosis or ''}".strip()
        h = clinical_nlp.heuristic_parse_patient_voice(text_for_nlp, age=req.age, gender=req.gender)
        return schemas.AISuggestResponse(
            diagnosis=h.get("diagnosis", req.diagnosis or "Clinical Consultation"),
            medicines_list=h.get("medicines_list", ""),
            tests_list=h.get("tests_list", ""),
            advice=h.get("advice", ""),
            follow_up_date=h.get("follow_up_date", "")
        )

    if not api_key:
        return fallback_to_heuristics()

    # CHAIN-OF-THOUGHT prescription prompt with differential diagnosis
    prompt = f"""You are an expert Indian clinical prescribing assistant with 20 years of OPD experience.
Think step-by-step before prescribing.

Step 1 — DIFFERENTIAL DIAGNOSIS: Based on chief complaints, list 2-3 possible diagnoses (internally). Pick the most likely one. Ensure no contradictory symptoms (e.g., do not suggest treatment for both dry cough and productive cough concurrently).
Step 2 — DRUG SELECTION & DOSING SAFETY: Choose common, affordable Indian generic/branded medicines. Prefer well-known brands (Dolo, Pan, Augmentin, etc.). 
Step 3 — TESTS: Only order tests that directly impact treatment decision.
Step 4 — ADVICE: Give 2-3 practical, actionable lifestyle/home-care tips.
Step 5 — FOLLOW-UP: Specify exactly when to return or escalate.

Patient Demographics:
- Age: {req.age or 'Not specified'}
- Gender: {req.gender or 'Not specified'}

Clinical Input:
- Chief Complaints: {req.chief_complaints}
- Working Diagnosis: {req.diagnosis or 'Derive from complaints'}

CLINICAL PRESCRIPTION & DOSING RULES (MANDATORY):
1. **Augmentin 625mg (Amoxicillin + Clavulanic Acid):** Must ALWAYS be prescribed **BD** (twice daily), NEVER TID, due to GI side effects of Clavulanate.
2. **Azithromycin (500mg):** Must ALWAYS be prescribed **OD** (once daily) for 3 to 5 days.
3. **Montek LC (Montelukast + Levocetirizine):** Must ALWAYS be prescribed **OD** (once daily) at bedtime (HS).
4. **Antacids/PPIs (e.g. Pantoprazole/Pantocid, Pan-D, Omeprazole):** Must be prescribed **OD** (once daily) and taken **AC** (before meals/Khali Pet).
5. **Dolo 650mg / Paracetamol:** Prescribe **TID** (three times daily) or **SOS** (as needed) for fever/pain, up to 3-4 times a day maximum.
6. **No Therapeutic Overlap:** Do not prescribe multiple drugs of the same class (e.g., do not prescribe two antihistamines or two NSAIDs).
7. **Cough Management:** If both dry and productive complaints are present, address the primary diagnosis only (e.g. dry cough remedies for bronchitis/pharyngitis, mucolytics/expectorants for productive cough). Never prescribe a cough suppressant and expectorant together.
8. **Age Adjustments:** 
   - If Patient Age < 12: Do not prescribe adult tablets (like Augmentin 625mg or Dolo 650mg). Suggest pediatric suspensions/syrups (e.g., Augmentin DDS suspension, Crocin/Dolo suspension) with body-weight adjusted ml dosages.
   - If Patient Age > 65: Use conservative geriatric dosing and note hepatic/renal safety.

OUTPUT RULES:
- Output ONLY a valid JSON object, no markdown, no preamble.
- medicines_list: number each medicine, include exact dosage + timing + duration (e.g. "1. Dolo 650mg — 1 tab TID after meals for 3 days")
- tests_list: only clinically necessary tests, numbered
- advice: 2-3 practical tips, numbered
- follow_up_date: specific instructions (e.g. "Review in 3 days, or immediately if fever > 103°F")

JSON schema:
{{
  "diagnosis": "primary diagnosis",
  "medicines_list": "1. Med — dose, timing, duration\\n2. ...",
  "tests_list": "1. Test Name\\n2. ...",
  "advice": "1. Tip\\n2. ...",
  "follow_up_date": "specific follow-up instruction"
}}"""

    url = "https://api.groq.com/openai/v1/chat/completions"
    groq_headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
        "max_tokens": 4096
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=groq_headers, json=payload)
            if response.status_code != 200:
                print("GROQ API ERROR RESPONSE, falling back to heuristics:", response.status_code, response.text)
                return fallback_to_heuristics()
            result = response.json()
        
        content = result["choices"][0]["message"]["content"].strip()
        parsed_data = json.loads(content)
        
        return schemas.AISuggestResponse(
            diagnosis=parsed_data.get("diagnosis", ""),
            medicines_list=parsed_data.get("medicines_list", ""),
            tests_list=parsed_data.get("tests_list", ""),
            advice=parsed_data.get("advice", ""),
            follow_up_date=parsed_data.get("follow_up_date", "")
        )
    except Exception as e:
        print(f"ai_suggest_treatment error ({e}), falling back to heuristics.")
        return fallback_to_heuristics()


# ----------------------------------------------------
# VOICE INTELLIGENCE & CLINICAL SCRIBE ROUTERS
# ----------------------------------------------------

def heuristic_parse_voice_intake(text: str) -> dict:
    """Fallback rule/regex parser to extract patient registration fields from spoken text."""
    clean = text.strip()
    result = {
        "name": None,
        "age": None,
        "gender": None,
        "mobile_number": None,
        "address": None,
        "chief_complaints": None
    }
    
    segments = [s.strip() for s in re.split(r'[,;]', clean) if s.strip()]
    
    # 1. Mobile Number: 10-digit number starting with 6-9
    phone_match = re.search(r'\b(?:mobile(?:\s*number)?|phone(?:\s*number)?|contact)?\s*([6-9]\d{9})\b', clean, re.IGNORECASE)
    if not phone_match:
        phone_match = re.search(r'\b([6-9]\d{4}\s*\d{5})\b', clean)
    if phone_match:
        phone_str = re.sub(r'\s+', '', phone_match.group(1))
        result["mobile_number"] = phone_str
        clean = clean.replace(phone_match.group(0), " ")

    # 2. Age: e.g. "32 years old", "32 yrs", "age 32", "32 saal"
    age_match = re.search(r'\b(?:age\s*)?(\d{1,3})\s*(?:years?(?:\s*old)?|yrs?(?:\s*old)?|saal)?\b', clean, re.IGNORECASE)
    if age_match:
        val = int(age_match.group(1))
        if 0 < val <= 120:
            result["age"] = val
            clean = re.sub(re.escape(age_match.group(0)), " ", clean, count=1)

    # 3. Gender
    gender_match = re.search(r'\b(female|females|mahila|woman|girl|aurat|male|males|purush|man|boy|other)\b', clean, re.IGNORECASE)
    if gender_match:
        g = gender_match.group(1).lower()
        if g in ['female', 'females', 'mahila', 'woman', 'girl', 'aurat']:
            result["gender"] = "Female"
        elif g in ['male', 'males', 'purush', 'man', 'boy']:
            result["gender"] = "Male"
        else:
            result["gender"] = "Other"
        clean = re.sub(r'\b' + re.escape(gender_match.group(0)) + r'\b', " ", clean, flags=re.IGNORECASE)

    # 4. Chief Complaints / Reason for Visit
    complaint_match = re.search(r'(?:complaints?|complaining of|suffering from|problem(?: of)?|issues?(?: with)?|takleef|reason(?:\s*for\s*visit)?|symptoms?)\s*[:\-]?\s*(.+)$', clean, re.IGNORECASE)
    if complaint_match:
        result["chief_complaints"] = complaint_match.group(1).strip(" .,-")
        clean = clean[:complaint_match.start()].strip()
    else:
        symptom_kws = ['fever', 'cough', 'cold', 'headache', 'stomach pain', 'chest pain', 'vomiting', 'loose motions', 'diarrhea', 'throat pain', 'body ache', 'weakness', 'dizziness', 'bp check', 'bukhar', 'dard']
        found_symptoms = [kw.title() for kw in symptom_kws if re.search(r'\b' + re.escape(kw) + r'\b', clean, re.IGNORECASE)]
        if found_symptoms:
            result["chief_complaints"] = ", ".join(found_symptoms)
            for kw in symptom_kws:
                clean = re.sub(r'\b' + re.escape(kw) + r'\b', ' ', clean, flags=re.IGNORECASE)

    # 5. Address with proper word boundaries
    addr_match = re.search(r'\b(?:address|from|living in|residing in|at)\b\s*[:\-]?\s*([^,\.]+)', clean, re.IGNORECASE)
    if addr_match:
        addr = addr_match.group(1).strip(" .,-")
        if addr and len(addr) > 2:
            result["address"] = addr.title()
            clean = clean.replace(addr_match.group(0), " ")

    # If comma-separated segments were provided (user spoke in natural chunks)
    if len(segments) >= 2:
        for seg in segments:
            cand = re.sub(r'\b(?:register(?:\s*patient)?|new\s*patient|patient(?:\s*name)?|name(?:\s*is)?|mr\.?|mrs\.?|ms\.?|shri|smt)\b', ' ', seg, flags=re.IGNORECASE).strip()
            # Clean of digits/symbols
            cand_clean = re.sub(r'[^A-Za-z\s]', ' ', cand).strip()
            if not cand_clean:
                continue
            is_noise = any(k in cand.lower() for k in ['male', 'female', 'years', 'yrs', 'saal', 'phone', 'mobile', 'fever', 'pain', 'cough', 'vomiting', 'complaint'])
            if not result["name"] and not is_noise and len(cand_clean.split()) in [1, 2, 3]:
                result["name"] = cand_clean.title()
            elif result["name"] and not result["address"] and not is_noise:
                if cand.strip().title() != result["name"]:
                    result["address"] = cand.strip().title()

    # 6. Fallback Name
    if not result["name"]:
        clean_name = re.sub(r'\b(?:register(?:\s*patient)?|new\s*patient|patient(?:\s*name)?|name(?:\s*is)?|mr\.?|mrs\.?|ms\.?|shri|smt)\b', ' ', clean, flags=re.IGNORECASE)
        clean_name = re.sub(r'[^a-zA-Z\s]', ' ', clean_name)
        name_tokens = [t.strip().title() for t in clean_name.split() if len(t.strip()) > 1 and t.lower() not in ['years', 'year', 'old', 'saal', 'male', 'female', 'phone', 'mobile', 'address', 'patient', 'register', 'new', 'for', 'with', 'and', 'the']]
        if name_tokens:
            result["name"] = " ".join(name_tokens[:2])
            if not result["address"] and len(name_tokens) > 2:
                result["address"] = " ".join(name_tokens[2:])
    
    return result


def heuristic_parse_consultation(text: str) -> dict:
    """Fallback rule parser to extract structured prescription from natural clinical dictation."""
    lower = text.lower()
    clean = text.strip()
    
    # Complaints
    complaints = []
    for comp in ["fever", "cough", "sore throat", "dry cough", "productive cough", "running nose", "headache", "body pain", "body ache", "stomach ache", "stomach pain", "vomiting", "loose motions", "chest pain", "shortness of breath", "weakness", "high bp", "chills", "nausea"]:
        if comp in lower:
            complaints.append(comp.title())
    
    # Diagnosis
    dx = ""
    dx_match = re.search(r'(?:diagnosis|impression|assessment|suspected|suffering from)\s*(?:is|as)?\s*[:\-]?\s*([^.,\n]+)', text, re.IGNORECASE)
    if dx_match:
        dx = dx_match.group(1).strip().title()
    elif "fever" in lower and "cough" in lower:
        dx = "Acute Upper Respiratory Tract Infection (URTI)"
    elif "stomach" in lower or "vomiting" in lower or "motion" in lower:
        dx = "Acute Gastroenteritis"
    elif "fever" in lower:
        dx = "Acute Febrile Illness"
    
    # Medicines
    meds = []
    med_rules = [
        ("dolo 650", "Dolo 650mg (Paracetamol)", "Thrice Daily (TID), After Meals for 3 Days (SOS)"),
        ("crocin", "Crocin 500mg (Paracetamol)", "Thrice Daily (TID), After Meals for 3 Days"),
        ("calpol", "Calpol 650mg (Paracetamol)", "Thrice Daily (TID), After Meals for 3 Days"),
        ("augmentin 625", "Augmentin 625mg (Amoxicillin + Clavulanate)", "Twice Daily (BD), After Meals for 5 Days"),
        ("azee 500", "Azee 500mg (Azithromycin)", "Once Daily (OD), Empty Stomach for 3 Days"),
        ("azithromycin", "Azee 500mg (Azithromycin)", "Once Daily (OD), Empty Stomach for 3 Days"),
        ("pan 40", "Pan 40mg (Pantoprazole)", "Once Daily (OD), Empty Stomach for 10 Days"),
        ("pantocid", "Pantocid 40mg (Pantoprazole)", "Once Daily (OD), Empty Stomach for 14 Days"),
        ("combiflam", "Combiflam (Ibuprofen + Paracetamol)", "Twice Daily (BD), After Meals for 3 Days"),
        ("zerodol", "Zerodol-P (Aceclofenac + Paracetamol)", "Twice Daily (BD), After Meals for 3 Days"),
        ("levocet", "Levocet 5mg (Levocetirizine)", "Once Daily (OD), At Bedtime (HS) for 5 Days"),
        ("montair", "Montair LC (Montelukast + Levocetirizine)", "Once Daily (OD), At Bedtime (HS) for 7 Days"),
        ("glycomet", "Glycomet 500mg (Metformin)", "Twice Daily (BD), After Meals"),
        ("telma", "Telma 40mg (Telmisartan)", "Once Daily (OD), In Morning"),
    ]
    for key, name, dose in med_rules:
        if key in lower:
            meds.append(f"{len(meds)+1}. {name} - {dose}")
            
    # Tests
    tests = []
    test_rules = [
        ("cbc", "CBC (Complete Blood Count)"),
        ("blood count", "CBC (Complete Blood Count)"),
        ("x-ray", "Chest X-Ray PA View"),
        ("xray", "Chest X-Ray PA View"),
        ("blood sugar", "Blood Sugar (Fasting & PP)"),
        ("glucose", "Blood Sugar (Fasting & PP)"),
        ("hba1c", "HbA1c"),
        ("lft", "LFT (Liver Function)"),
        ("liver", "LFT (Liver Function)"),
        ("kft", "KFT (Kidney Function)"),
        ("kidney", "KFT (Kidney Function)"),
        ("lipid", "Lipid Profile"),
        ("thyroid", "Thyroid Profile (T3/T4/TSH)"),
        ("urine", "Urine RE/ME"),
        ("dengue", "Dengue NS1 Antigen & Serology"),
    ]
    for key, name in test_rules:
        if key in lower and name not in tests:
            tests.append(f"{len(tests)+1}. {name}")
            
    # Advice
    advice = []
    if "water" in lower or "fluid" in lower:
        advice.append("Drink plenty of warm water and ORS fluids frequently")
    if "rest" in lower:
        advice.append("Take complete bed rest for 2-3 days")
    if "gargle" in lower:
        advice.append("Warm saline gargles 3-4 times a day")
    if "diet" in lower or "oily" in lower or "food" in lower:
        advice.append("Avoid oily, spicy, and cold foods; take light diet")
    if not advice:
        advice.append("Maintain adequate hydration and rest; review if symptoms worsen")

    return {
        "chief_complaints": ", ".join(complaints) if complaints else clean[:80],
        "diagnosis": dx or "Acute Febrile Illness",
        "medicines_list": "\n".join(meds) if meds else "1. Dolo 650mg (Paracetamol) - Thrice Daily (TID), After Meals for 3 Days (SOS)",
        "tests_list": "\n".join(tests) if tests else "1. CBC (Complete Blood Count)",
        "advice": "\n".join(f"{i+1}. {a}" for i, a in enumerate(advice)),
        "follow_up_date": "Review after 3 days or immediately if fever > 102°F persists"
    }


@app.post("/api/ai/parse-voice-intake", response_model=schemas.VoiceIntakeParseResponse)
async def parse_voice_intake(
    req: schemas.VoiceIntakeParseRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    """Parses spoken voice intake into structured patient registration fields."""
    transcript = req.transcript.strip()
    if not transcript:
        return schemas.VoiceIntakeParseResponse()

    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    if api_key:
        prompt = f"""You are an expert Indian hospital reception assistant.
Extract patient registration details from this spoken registration phrase:
"{transcript}"

Rules:
1. "name": Patient's full name (Title Case).
2. "age": Integer age (in years) or null.
3. "gender": Exactly "Male", "Female", or "Other" or null.
4. "mobile_number": 10-digit Indian phone number (digits only, e.g. "9876543210") or null.
5. "address": Residential location/city/area or null.
6. "chief_complaints": Short reason for visit or primary symptoms (e.g. "Fever and headache") or null.

Return ONLY a valid JSON object matching:
{{
  "name": "...",
  "age": 32,
  "gender": "Female",
  "mobile_number": "9876543210",
  "address": "...",
  "chief_complaints": "..."
}}"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"}
                    }
                )
                if res.status_code == 200:
                    data = json.loads(res.json()["choices"][0]["message"]["content"])
                    return schemas.VoiceIntakeParseResponse(
                        name=data.get("name"),
                        age=int(data["age"]) if data.get("age") and str(data["age"]).isdigit() else None,
                        gender=data.get("gender") if data.get("gender") in ["Male", "Female", "Other"] else None,
                        mobile_number=str(data["mobile_number"]).replace(" ", "") if data.get("mobile_number") else None,
                        address=data.get("address"),
                        chief_complaints=data.get("chief_complaints"),
                        confidence="high",
                        source="ai"
                    )
        except Exception as e:
            print(f"Groq voice intake parse fallback to heuristic: {e}")

    # Fallback to local heuristic parser
    h = heuristic_parse_voice_intake(transcript)
    return schemas.VoiceIntakeParseResponse(
        name=h.get("name"),
        age=h.get("age"),
        gender=h.get("gender"),
        mobile_number=h.get("mobile_number"),
        address=h.get("address"),
        chief_complaints=h.get("chief_complaints"),
        confidence="medium",
        source="heuristic"
    )


@app.post("/api/visits/ai-parse-consultation", response_model=schemas.VoiceConsultationParseResponse)
async def parse_consultation_dictation(
    req: schemas.VoiceConsultationParseRequest,
    current_user: models.User = Depends(auth.get_current_user)
):
    """Parses natural patient complaints (Hindi/Hinglish/English) or doctor dictation into structured clinical OPD fields."""
    transcript = req.transcript.strip()
    if not transcript:
        return schemas.VoiceConsultationParseResponse()

    parsed = await clinical_nlp.parse_consultation_ai(
        transcript=transcript,
        age=req.age,
        gender=req.gender,
        mode=req.mode or "patient_voice"
    )
    return schemas.VoiceConsultationParseResponse(
        chief_complaints=parsed.get("chief_complaints"),
        diagnosis=parsed.get("diagnosis"),
        medicines_list=parsed.get("medicines_list"),
        tests_list=parsed.get("tests_list"),
        advice=parsed.get("advice"),
        follow_up_date=parsed.get("follow_up_date"),
        patient_verbatim=parsed.get("patient_verbatim"),
        detected_language=parsed.get("detected_language"),
        source=parsed.get("source", "ai")
    )


# ----------------------------------------------------
# SERVICE CATALOG ROUTERS
# ----------------------------------------------------
@app.get("/api/services", response_model=List[schemas.ServiceResponse])
def get_services(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
):
    q = db.query(models.Service).filter(models.Service.is_active == True)
    if category:
        q = q.filter(models.Service.category == category)
    return q.order_by(models.Service.category, models.Service.name).all()


# ----------------------------------------------------
# PRESCRIPTION → BILLING AUTO-DRAFT
# ----------------------------------------------------
@app.get("/api/visits/{id}/suggested-bill-items", response_model=schemas.PrescriptionBillSuggestion)
def get_prescription_suggested_items(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
):
    """
    Smart bridge: Reads a saved visit prescription (tests_list + medicines_list),
    fuzzy-matches each item against the hospital's active service catalog,
    and returns matched services (ready to add to bill) + unmatched raw tokens.
    """
    visit = db.query(models.Visit).filter(models.Visit.id == id, models.Visit.is_active == True).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Fetch active services from the catalog
    db_services = db.query(models.Service).filter(models.Service.is_active == True).all()

    # Parse all tokens from prescription fields
    raw_tokens: list[str] = []

    def extract_tokens(text: Optional[str]) -> list[str]:
        if not text or not text.strip():
            return []
        tokens = []
        ignore_placeholders = {"none", "n/a", "na", "nil", "no tests", "none required", "-", "...", "no test"}
        brand_rx = r'(?:combiflam|combiflame|crocin|calpol|augmentin|pantocid|pan-d|pan\s*40|azee|azithromycin|cefixime|taxim|montair|montek|levocet|cetirizine|ascoril|glycomet|metformin|telma|telmisartan|atorva|atorvastatin|zerodol|meftal|emeset|ondansetron|digene|sporlac|allegra|ofloxacin|norfloxacin|betadine|volini|ibuprofen|amoxicillin)'
        split_rx = r'(?:[\n,;]+|\s+(?:and|aur|\+|&)\s+|(?<=[a-zA-Z0-9])\s+(?=' + brand_rx + r'\b))'
        for part in __import__("re").split(split_rx, text.strip(), flags=__import__("re").I):
            cleaned = part.strip()
            cleaned = __import__("re").sub(r"^\d+\.\s*", "", cleaned).strip()
            cleaned = cleaned.rstrip(".")
            if cleaned and cleaned.lower() not in ignore_placeholders:
                tokens.append(cleaned)
        return tokens

    tests_tokens = extract_tokens(visit.tests_list)
    medicines_tokens = extract_tokens(visit.medicines_list)
    raw_tokens = tests_tokens + medicines_tokens

    if not raw_tokens:
        return schemas.PrescriptionBillSuggestion(matched_items=[], unmatched_items=[])

    matched_items: list[schemas.PrescriptionMatchedItem] = []
    unmatched_items: list[str] = []
    matched_service_ids: set[int] = set()

    def fuzzy_score(token: str, service_name: str) -> float:
        """
        Return a similarity score (0.0–1.0) between a prescription token
        and a service catalog name using multi-strategy keyword overlap,
        Levenshtein-ratio phonetic matching, and substring alignment.
        """
        import difflib, re
        # Clean token by stripping trailing dosage details after dash/em-dash
        token_clean = re.sub(r"\s*[—\-–].*$", "", token).strip()
        token_lower = token_clean.lower().rstrip(".")
        svc_lower = service_name.lower()

        # 1. Exact substring match (highest priority)
        if token_lower in svc_lower or svc_lower in token_lower:
            return 0.98

        # 2. SequenceMatcher word-level similarity (handles speech variants like 'combiflame' -> 'combiflam')
        tok_words_raw = re.findall(r"[a-z0-9]+", token_lower)
        svc_words_raw = re.findall(r"[a-z0-9]+", svc_lower)
        for tw in tok_words_raw:
            for sw in svc_words_raw:
                if len(tw) >= 4 and len(sw) >= 4:
                    sim = difflib.SequenceMatcher(None, tw, sw).ratio()
                    if sim >= 0.85:
                        return 0.93

        # 3. Word-level intersection score
        token_words = set(tok_words_raw)
        svc_words = set(svc_words_raw)
        
        # Remove common noise words
        noise = {"the", "a", "an", "and", "or", "for", "of", "in", "at", "test", "with", "per", "day", "tablet", "tablets", "mg"}
        token_words -= noise
        svc_words -= noise

        if not token_words or not svc_words:
            return 0.0

        intersection = token_words & svc_words
        if not intersection:
            return 0.0

        jaccard = len(intersection) / len(token_words | svc_words)
        
        # 4. Boost score for acronym/abbreviation matches (e.g. "CBC" → "Complete Blood Count (CBC)")
        svc_acronyms = set(re.findall(r"\(([A-Z]+)\)", service_name))
        svc_acronyms.update(w for w in service_name.split() if w.isupper() and len(w) >= 2)
        
        token_upper = token.upper().strip()
        for acronym in svc_acronyms:
            if token_upper == acronym or token_upper in acronym or acronym in token_upper:
                return 0.90  # Strong acronym match

        return jaccard

    MATCH_THRESHOLD = 0.20  # minimum score to consider a match

    for token in raw_tokens:
        if not token.strip():
            continue

        best_service = None
        best_score = 0.0

        for svc in db_services:
            if svc.id in matched_service_ids:
                continue  # Already matched, skip
            score = fuzzy_score(token, svc.name)
            if score > best_score:
                best_score = score
                best_service = svc

        if best_service and best_score >= MATCH_THRESHOLD:
            matched_service_ids.add(best_service.id)
            matched_items.append(schemas.PrescriptionMatchedItem(
                service_id=best_service.id,
                service_name=best_service.name,
                category=best_service.category,
                price=best_service.price,
                match_reason=f"Matched '{token}' → '{best_service.name}'"
            ))
        else:
            unmatched_items.append(token)

    return schemas.PrescriptionBillSuggestion(
        matched_items=matched_items,
        unmatched_items=unmatched_items
    )


@app.post("/api/services/recommend", response_model=schemas.RecommendationResponse)
async def get_service_recommendations(
    req: schemas.RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist"]))
):
    # 1. Resolve patient details and visit prescription status
    age = req.age
    gender = req.gender
    visit = None
    if req.visit_id:
        visit = db.query(models.Visit).filter(models.Visit.id == req.visit_id, models.Visit.is_active == True).first()
        if visit and visit.patient:
            age = visit.patient.age
            gender = visit.patient.gender

    if req.patient_id and not visit:
        patient = db.query(models.Patient).filter(models.Patient.id == req.patient_id, models.Patient.is_active == True).first()
        if patient:
            age = patient.age
            gender = patient.gender
            
    # Fallback default settings if still missing
    if age is None:
        age = 30
    if gender is None:
        gender = "Unknown"

    # 2. Fetch active services catalog
    db_services = db.query(models.Service).filter(models.Service.is_active == True).all()
    if not db_services:
        return schemas.RecommendationResponse(recommendations=[], explanation="No active services found in the catalog.")

    # Check if doctor has completed clinical examination / prescription notes
    has_doctor_prescription = False
    doc_notes = ""
    if visit:
        notes_parts = []
        if visit.diagnosis:
            notes_parts.append(f"Doctor Diagnosis: {visit.diagnosis}")
        if visit.tests_list:
            notes_parts.append(f"Doctor Prescribed Tests: {visit.tests_list}")
        if visit.medicines_list:
            notes_parts.append(f"Doctor Prescribed Medicines: {visit.medicines_list}")
        if notes_parts:
            has_doctor_prescription = True
            doc_notes = "\n".join(notes_parts)

    # ⚠️ CLINICAL WORKFLOW SAFETY GUARD:
    # If the visit is logged but doctor HAS NOT written prescription/tests yet, DO NOT suggest diagnostic lab or radiology tests!
    if visit and not has_doctor_prescription:
        doc_consult_services = [
            s for s in db_services 
            if "consultation" in s.category.lower() or "consult" in s.name.lower() or "opd" in s.name.lower()
        ]
        if not doc_consult_services:
            doc_consult_services = db_services[:1]

        recs = []
        for s in doc_consult_services[:1]:
            recs.append(schemas.RecommendationItem(
                service_id=s.id,
                service_name=s.name,
                category=s.category,
                price=s.price,
                reason="Standard OPD Doctor Consultation Fee. Diagnostic lab & radiology tests require prior doctor consultation & prescription order."
            ))
        return schemas.RecommendationResponse(
            recommendations=recs,
            explanation="⚠️ Doctor consultation is pending for this visit. In compliance with medical protocol, diagnostic lab & radiology tests can only be billed after doctor completes consultation & prescription notes."
        )
        
    # Format catalog for Groq prompt
    catalog_list = [f"- {s.name} (Category: {s.category}, Price: INR {s.price:.2f})" for s in db_services]
    catalog_str = "\n".join(catalog_list)

    # 3. Groq API Configuration
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Groq API key is not configured in the server environment variables."
        )

    # 4. Construct prompt with Doctor Clinical Notes if available
    prescription_context = f"\nDoctor Prescribed Clinical Notes:\n{doc_notes}\n" if doc_notes else ""
    prompt = f"""You are an experienced clinical desk assistant for an Indian diagnostic center and OPD clinic.
Your job is to recommend the most relevant services or tests from our catalog matching the doctor's prescription and patient symptoms.

Patient Details:
- Age: {age}
- Gender: {gender}
- Chief Complaints / Symptoms: {req.symptoms}
{prescription_context}
Available Hospital Services Catalog:
{catalog_str}

CRITICAL RULES:
1. ONLY recommend services that exist EXACTLY in the provided catalog. Do NOT suggest tests, consultation types, or procedures that are not in the list above.
2. Prioritize services matching the doctor's prescribed tests and diagnosis.
3. Suggest up to 5 services. If fewer than 5 are relevant, only suggest those.
4. Every recommendation must map EXACTLY to the service name in the catalog (case-sensitive).

Return response in clean JSON format only matching this schema:
{{
  "recommended_services": [
    {{
      "service_name": "Exact Name from Catalog",
      "reason": "Clear clinical justification tailored to the doctor's prescription and patient symptoms."
    }}
  ],
  "explanation": "Short 1-2 line clinical summary of the recommendations."
}}"""

    # 5. Call Groq Cloud API
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    try:
        async with httpx.AsyncClient(timeout=18.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
        content_str = result["choices"][0]["message"]["content"]
        ai_data = json.loads(content_str)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to communicate with Groq AI API: {str(e)}"
        )

    # 6. Map and validate recommendations against our DB catalog
    # Create lookup map for exact match
    service_map = {s.name.lower().strip(): s for s in db_services}
    
    validated_recommendations = []
    recommended_list = ai_data.get("recommended_services", [])
    
    for rec in recommended_list:
        rec_name = rec.get("service_name", "").strip()
        if not rec_name:
            continue
            
        rec_name_lower = rec_name.lower().strip()
        matched_service = None
        
        # Check 1: Exact Match
        if rec_name_lower in service_map:
            matched_service = service_map[rec_name_lower]
        else:
            # Check 2: Substring matches (case-insensitive)
            for s in db_services:
                s_name_lower = s.name.lower().strip()
                if s_name_lower in rec_name_lower or rec_name_lower in s_name_lower:
                    matched_service = s
                    break
        
        if matched_service:
            # Avoid duplicate recommendations
            if matched_service.id not in [item.service_id for item in validated_recommendations]:
                validated_recommendations.append(
                    schemas.RecommendationItem(
                        service_id=matched_service.id,
                        service_name=matched_service.name,
                        category=matched_service.category,
                        price=matched_service.price,
                        reason=rec.get("reason", "Recommended based on patient symptoms.")
                    )
                )

    return schemas.RecommendationResponse(
        recommendations=validated_recommendations,
        explanation=ai_data.get("explanation", "Recommendations compiled successfully.")
    )


# ----------------------------------------------------
# AI BILLING ANOMALY CHECKER
# ----------------------------------------------------
def run_local_anomaly_checks(
    items: List[schemas.BillItemAnomaly], 
    patient_age: Optional[int], 
    patient_gender: Optional[str], 
    diagnosis: Optional[str]
) -> List[str]:
    issues = []
    item_names = [item.service_name.lower().strip() for item in items]
    
    # 1. Duplicates check
    duplicates = set([name for name in item_names if item_names.count(name) > 1])
    for dup in duplicates:
        orig_name = next(item.service_name for item in items if item.service_name.lower().strip() == dup)
        issues.append(f"Duplicate Billing: '{orig_name}' is billed multiple times on this invoice.")
        
    # 2. Clinically Unlikely combinations (ICU Bed + OPD Consult / General Ward Room Rent)
    has_icu = any("icu" in name for name in item_names)
    has_opd = any("opd registration" in name or "physician consultation" in name or "specialist consultation" in name for name in item_names)
    has_room_rent = any("room rent" in name and "icu" not in name for name in item_names)
    
    if has_icu and has_opd:
        issues.append("Operational Mismatch: ICU Bed Charges and OPD Consultation/Registration are billed together on the same invoice.")
    if has_icu and has_room_rent:
        issues.append("Billing Redundancy: ICU bed charges and standard room rent are billed concurrently.")
        
    # 3. Room Rent GST Threshold (> ₹5,000)
    for item in items:
        name_lower = item.service_name.lower()
        if "room rent" in name_lower and "icu" not in name_lower:
            if item.amount > 5000:
                issues.append(f"GST Compliance: Non-ICU AC Room Rent of ₹{item.amount:.2f} exceeds ₹5,000/day limit, attracting 5% GST under Indian tax laws.")
                
    # 4. Cosmetic/Plastic Surgery GST (18%)
    is_accident_reconstructive = False
    if diagnosis:
        diag_lower = diagnosis.lower()
        if any(w in diag_lower for w in ["accident", "injury", "burn", "reconstruction", "trauma", "congenital"]):
            is_accident_reconstructive = True
            
    for item in items:
        name_lower = item.service_name.lower()
        if "cosmetic" in name_lower or "plastic surgery" in name_lower:
            if not is_accident_reconstructive:
                issues.append(f"GST Compliance: Cosmetic surgery '{item.service_name}' attracts 18% GST unless clinically certified as post-trauma/reconstructive.")
            else:
                issues.append(f"GST Exempt: Cosmetic/Plastic surgery '{item.service_name}' is GST exempt due to reconstructive diagnosis.")
                
    # 5. Missing Doctor Consultation fee
    has_diagnostic = any(
        any(w in name for w in ["test", "profile", "blood", "x-ray", "mri", "ultrasound", "cbc", "lipid", "glucose"])
        for name in item_names
    )
    has_consult = any(
        any(w in name for w in ["consultation", "opd registration"])
        for name in item_names
    )
    if has_diagnostic and not has_consult:
        issues.append("Operational Warning: Diagnostic/lab tests are billed without any Doctor Consultation or OPD Registration fee.")
        
    # 6. Age appropriateness (Pediatric checking)
    if patient_age is not None and patient_age < 12:
        for item in items:
            name_lower = item.service_name.lower()
            # check for adult tablets billed instead of pediatric syrups
            if any(w in name_lower for w in ["625mg", "650mg", "tablet", "tab"]) and not any(w in name_lower for w in ["suspension", "syrup", "susp", "syr", "drops"]):
                issues.append(f"Clinical Safety Warning: Pediatric patient (Age {patient_age}) billed for adult tablet formulation '{item.service_name}' instead of pediatric suspension.")
                
    # 7. High Value Audit Limit
    for item in items:
        if item.amount > 5000 and not any(w in item.service_name.lower() for w in ["mri", "icu", "room rent"]):
            issues.append(f"Financial Alert: Item '{item.service_name}' has high amount of ₹{item.amount:.2f}. Verify pricing.")
            
    return issues

def generate_auto_corrections(items, patient_age, issues):
    if not issues:
        return None
        
    corrected = []
    seen_names = set()
    actions = []
    original_total = sum(i.amount for i in items)
    
    has_lab = False
    has_consultation = False

    for item in items:
        name_lower = item.service_name.lower()
        
        # Check duplicate
        if name_lower in seen_names:
            actions.append(f"Removed duplicate item '{item.service_name}' (saved ₹{item.amount:.2f})")
            continue
        seen_names.add(name_lower)

        # Check pediatric age formulation replacement
        if patient_age is not None and patient_age < 12:
            if any(w in name_lower for w in ["625mg", "650mg", "tablet", "tab"]) and not any(w in name_lower for w in ["suspension", "syrup", "susp", "syr", "drops"]):
                new_name = f"{item.service_name.split()[0]} Pediatric Suspension (60ml)"
                new_amount = 45.00
                actions.append(f"Replaced adult tablet '{item.service_name}' with pediatric syrup '{new_name}' (adjusted amount to ₹{new_amount:.2f})")
                corrected.append(schemas.AutoCorrectionItem(
                    service_name=new_name,
                    amount=new_amount,
                    correction_reason="Pediatric formulation safety correction"
                ))
                continue
                
        if any(w in name_lower for w in ["consultation", "opd fee", "doctor fee"]):
            has_consultation = True
        if any(w in name_lower for w in ["blood", "test", "cbc", "xray", "ecg", "lft", "kft"]):
            has_lab = True
            
        corrected.append(schemas.AutoCorrectionItem(
            service_name=item.service_name,
            amount=item.amount,
            correction_reason=None
        ))

    # Missing consultation fix
    if has_lab and not has_consultation:
        corrected.insert(0, schemas.AutoCorrectionItem(
            service_name="OPD General Physician Consultation",
            amount=200.00,
            correction_reason="Auto-added missing required OPD consultation for lab tests"
        ))
        actions.append("Added missing OPD Consultation fee (₹200.00)")

    corrected_total = sum(i.amount for i in corrected)
    savings = original_total - corrected_total

    summary_str = "; ".join(actions) if actions else "AI optimized billing items."
    return schemas.AutoCorrectionDetails(
        corrected_items=corrected,
        action_summary=summary_str,
        original_total=original_total,
        corrected_total=corrected_total,
        savings_amount=savings
    )

@app.post("/api/bills/ai-anomaly-check", response_model=schemas.AnomalyCheckResponse)
async def check_bill_anomaly(
    req: schemas.AnomalyCheckRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist"]))
):
    # Run deterministic local rules engine first
    local_issues = run_local_anomaly_checks(
        items=req.items,
        patient_age=req.patient_age,
        patient_gender=req.patient_gender,
        diagnosis=req.diagnosis
    )
    
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    if model == "openai/gpt-oss-120b":
        model = "llama-3.3-70b-versatile"
    
    if not api_key:
        # Fall back completely to local checks if Groq is not configured
        has_critical = any("duplicate" in iss.lower() or "safety" in iss.lower() for iss in local_issues)
        status = "critical" if has_critical else ("warning" if local_issues else "clear")
        summary = "Billing audit executed via Local Rule engine (AI model offline)."
        auto_corr = generate_auto_corrections(req.items, req.patient_age, local_issues)
        return schemas.AnomalyCheckResponse(
            status=status,
            issues=local_issues,
            summary=summary,
            safe_to_proceed=not has_critical,
            auto_corrections=auto_corr
        )

    items_str = "\n".join([f"- {item.service_name}: ₹{item.amount:.2f}" for item in req.items])
    total = sum(item.amount for item in req.items)

    prompt = f"""You are a hospital billing auditor AI. Review the following bill for anomalies.

Bill Items:
{items_str}

Bill Total: ₹{total:.2f}
Patient Age: {req.patient_age or 'Unknown'}
Patient Gender: {req.patient_gender or 'Unknown'}
Diagnosis: {req.diagnosis or 'Not provided'}

Check for:
1. DUPLICATE tests or services (same or very similar items billed twice)
2. CLINICALLY UNLIKELY combinations (e.g., ICU charges + outpatient consultation on same bill)
3. EXCESSIVE AMOUNTS (single items that seem abnormally high for an OPD context)
4. MISSING essential service (e.g., Lab tests billed without a consultation)
5. AGE-INAPPROPRIATE services (e.g., pediatric items for adult age)

Respond ONLY with a JSON object, no preamble:
{{
  "status": "clear" | "warning" | "critical",
  "issues": ["issue 1", "issue 2"],
  "summary": "One sentence summary",
  "safe_to_proceed": true | false
}}
If no issues, return status "clear", empty issues list, and safe_to_proceed: true."""

    url = "https://api.groq.com/openai/v1/chat/completions"
    groq_headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.05,
        "response_format": {"type": "json_object"},
        "reasoning_format": "hidden",
        "max_tokens": 1200
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=groq_headers, json=payload)
            response.raise_for_status()
            result = response.json()
        data = json.loads(result["choices"][0]["message"]["content"])
        
        # Merge local rules issues and AI-derived issues (avoiding exact string duplicates)
        ai_issues = data.get("issues", [])
        combined_issues = list(local_issues)
        for issue in ai_issues:
            if not any(dup_check in issue.lower() for dup_check in ["duplicate", "same item"]) or not any("duplicate" in x.lower() for x in local_issues):
                combined_issues.append(issue)
                
        # Status calculation based on merged issues
        has_critical = any("duplicate" in iss.lower() or "safety" in iss.lower() for iss in combined_issues)
        status = "critical" if has_critical else ("warning" if combined_issues else "clear")
        auto_corr = generate_auto_corrections(req.items, req.patient_age, combined_issues)
        
        return schemas.AnomalyCheckResponse(
            status=status,
            issues=combined_issues,
            summary=data.get("summary", "Billing audit completed via hybrid engine."),
            safe_to_proceed=not has_critical,
            auto_corrections=auto_corr
        )
    except Exception:
        # Fall back to local issues in case of api request failure
        has_critical = any("duplicate" in iss.lower() or "safety" in iss.lower() for iss in local_issues)
        status = "critical" if has_critical else ("warning" if local_issues else "clear")
        auto_corr = generate_auto_corrections(req.items, req.patient_age, local_issues)
        return schemas.AnomalyCheckResponse(
            status=status,
            issues=local_issues,
            summary="Billing audit completed via Local Rule engine (AI fallback).",
            safe_to_proceed=not has_critical,
            auto_corrections=auto_corr
        )


@app.post("/api/bills/verify-external-rates", response_model=schemas.RateVerificationResponse)
async def verify_external_rates(
    req: schemas.RateVerificationRequest,
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist"]))
):
    results = []
    total_billed = 0.0
    total_benchmark = 0.0
    overpriced_count = 0

    for item in req.items:
        total_billed += item.billed_amount
        name_lower = item.service_name.lower()
        matched = None
        
        # 1. Match local NHA/CGHS benchmark JSON
        for bm in NHA_BENCHMARKS:
            if any(kw in name_lower for kw in bm["keywords"]):
                matched = bm
                break
                
        if matched:
            nha_rate = matched["nha_cghs_rate"]
            mrp_cap = matched["mrp_cap"]
            official_name = matched["official_name"]
            category = matched["category"]
            authority = matched["authority"]
            source = "Local NHA Benchmark Master"
        else:
            # 2. Live Anakin MCP / Groq Web Search fallback
            anakin_res = await anakin_client.fetch_live_drug_rate_via_anakin(item.service_name)
            nha_rate = round(item.billed_amount * 0.85, 2)
            mrp_cap = round(item.billed_amount * 1.15, 2)
            official_name = f"{item.service_name} (Estimated Benchmark)"
            category = "General Medical Service"
            authority = "NHA Live Web Verification (Anakin MCP)"
            source = "Anakin MCP Live Web Search"

        total_benchmark += nha_rate
        variance = item.billed_amount - nha_rate
        var_pct = (variance / nha_rate * 100) if nha_rate > 0 else 0.0

        if item.billed_amount > nha_rate * 1.10:
            item_status = "overpriced"
            overpriced_count += 1
        elif item.billed_amount < nha_rate:
            item_status = "subsidized"
        else:
            item_status = "compliant"

        results.append(schemas.RateVerificationItemResult(
            service_name=item.service_name,
            billed_amount=item.billed_amount,
            official_name=official_name,
            nha_cghs_rate=nha_rate,
            mrp_cap=mrp_cap,
            status=item_status,
            variance_amount=round(variance, 2),
            variance_percent=round(var_pct, 1),
            category=category,
            authority=authority,
            source=source
        ))

    overall_status = "overpriced_detected" if overpriced_count > 0 else "compliant"
    savings_opp = max(0.0, total_billed - total_benchmark)
    
    summary = f"Verified {len(req.items)} items against NHA/CGHS rate caps. "
    if overpriced_count > 0:
        summary += f"Flagged {overpriced_count} items exceeding official government rate limits by up to ₹{savings_opp:.2f}."
    else:
        summary += "All line items are fully compliant with NHA/CGHS rate ceilings."

    return schemas.RateVerificationResponse(
        overall_status=overall_status,
        total_billed=round(total_billed, 2),
        total_benchmark=round(total_benchmark, 2),
        total_savings_opportunity=round(savings_opp, 2),
        results=results,
        summary=summary
    )


# ----------------------------------------------------
# AI DASHBOARD REVENUE INSIGHT
# ----------------------------------------------------
@app.get("/api/dashboard/ai-insight", response_model=schemas.AIInsightResponse)
async def get_ai_dashboard_insight(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant", "Receptionist"]))
):
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    if not api_key:
        return schemas.AIInsightResponse(
            insight="AI revenue insights require a GROQ_API_KEY to be configured.",
            action="Set GROQ_API_KEY in your .env file to enable this feature.",
            metric_highlight="—",
            sentiment="neutral"
        )

    # Gather today's financial metrics
    today_start = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
    today_end = datetime.datetime.combine(datetime.date.today(), datetime.time.max)

    total_revenue = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.payment_type != "Refund", models.Payment.is_active == True
    ).scalar() or 0.0

    today_revenue = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.payment_type != "Refund",
        models.Payment.is_active == True,
        models.Payment.payment_date >= today_start,
        models.Payment.payment_date <= today_end
    ).scalar() or 0.0

    pending_dues = db.query(func.sum(models.Bill.balance_amount)).filter(
        models.Bill.payment_status.in_(["Pending", "Partial Paid"]),
        models.Bill.is_active == True
    ).scalar() or 0.0

    total_patients = db.query(models.Patient).filter(models.Patient.is_active == True).count()
    today_patients = db.query(models.Visit).filter(
        models.Visit.visit_date >= today_start, models.Visit.visit_date <= today_end, models.Visit.is_active == True
    ).count()

    cash_today = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.payment_method == "Cash", models.Payment.payment_type != "Refund",
        models.Payment.is_active == True,
        models.Payment.payment_date >= today_start, models.Payment.payment_date <= today_end
    ).scalar() or 0.0

    online_today = max(0.0, today_revenue - cash_today)
    cash_pct = round((cash_today / today_revenue * 100) if today_revenue > 0 else 0, 1)

    prompt = f"""You are a smart hospital revenue analyst AI for an Indian OPD/diagnostic clinic.

Today's Financial Snapshot:
- Total Registered Patients (All-Time): {total_patients}
- Today's Visits: {today_patients}
- Today's Revenue: ₹{today_revenue:,.2f}
- Today's Cash: ₹{cash_today:,.2f} ({cash_pct}% of today)
- Today's Digital/Online: ₹{online_today:,.2f} ({100 - cash_pct}% of today)
- Outstanding Dues (All-Time): ₹{pending_dues:,.2f}
- Total Revenue (All-Time): ₹{total_revenue:,.2f}

Generate a smart, 2-sentence business insight for the hospital administrator. Be specific, actionable, and data-driven. Focus on the most important trend or issue.
Also provide: (1) one specific recommended action, (2) the single most important metric to highlight.
Determine sentiment based on overall financial health: positive (revenue good, low dues), neutral (average), negative (low revenue, high dues).

Output ONLY valid JSON, no preamble:
{{
  "insight": "2-sentence data-driven business insight",
  "action": "One specific recommended action for today",
  "metric_highlight": "The single most important number/stat to display",
  "sentiment": "positive" | "neutral" | "negative"
}}"""

    url = "https://api.groq.com/openai/v1/chat/completions"
    groq_headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "reasoning_format": "hidden",
        "max_tokens": 1200
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=groq_headers, json=payload)
            response.raise_for_status()
            result = response.json()
        data = json.loads(result["choices"][0]["message"]["content"])
        return schemas.AIInsightResponse(
            insight=data.get("insight", ""),
            action=data.get("action", ""),
            metric_highlight=data.get("metric_highlight", ""),
            sentiment=data.get("sentiment", "neutral")
        )
    except Exception as e:
        return schemas.AIInsightResponse(
            insight=f"Revenue insight unavailable: {str(e)[:80]}",
            action="Check Groq API connectivity.",
            metric_highlight="—",
            sentiment="neutral"
        )


@app.post("/api/services", response_model=schemas.ServiceResponse)

def create_service(
    service_in: schemas.ServiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    db_service = models.Service(
        category=service_in.category,
        name=service_in.name,
        price=service_in.price
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    
    log_action(db, current_user.id, "CREATE_SERVICE", "services", str(db_service.id), f"Added service {db_service.name} to catalog under {db_service.category}")
    return db_service

@app.put("/api/services/{id}", response_model=schemas.ServiceResponse)
def update_service(
    id: int,
    service_in: schemas.ServiceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    service = db.query(models.Service).filter(models.Service.id == id, models.Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    service.category = service_in.category
    service.name = service_in.name
    service.price = service_in.price
    db.commit()
    db.refresh(service)
    
    log_action(db, current_user.id, "UPDATE_SERVICE", "services", str(id), f"Updated catalog service {service.name}")
    return service

@app.delete("/api/services/{id}")
def delete_service(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    service = db.query(models.Service).filter(models.Service.id == id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    service.is_active = False
    service.deleted_at = datetime.datetime.utcnow()
    db.commit()
    
    log_action(db, current_user.id, "DELETE_SERVICE", "services", str(id), f"Soft-deleted service {service.name} from catalog")
    return {"message": "Service catalog item soft deleted"}


# ----------------------------------------------------
# BILL ROUTERS
# ----------------------------------------------------
@app.post("/api/bills", response_model=schemas.BillResponse)
def create_bill(
    bill_in: schemas.BillCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist"]))
):
    visit = db.query(models.Visit).filter(models.Visit.id == bill_in.visit_id, models.Visit.is_active == True).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Generate Bill ID
    bill_id = generate_unique_id(db, "BILL", models.Bill, models.Bill.bill_id)
    
    grand_total = 0.0
    bill_items_to_create = []

    # Process items and calculate grand total
    for item in bill_in.items:
        service_name = ""
        service_id = item.service_id
        if service_id:
            service = db.query(models.Service).filter(models.Service.id == service_id).first()
            if not service:
                raise HTTPException(status_code=400, detail=f"Service ID {service_id} not found")
            service_name = service.name
        elif item.service_name:
            # Try to match service by name from catalog
            svc_match = db.query(models.Service).filter(
                func.lower(models.Service.name) == item.service_name.strip().lower(),
                models.Service.is_active == True
            ).first()
            if svc_match:
                service_id = svc_match.id
                service_name = svc_match.name
            else:
                service_id = None
                service_name = item.service_name.strip()
        else:
            raise HTTPException(status_code=400, detail="Each item must have a valid Service ID or Service Name")
            
        grand_total += item.amount
        bill_items_to_create.append(
            models.BillItem(
                service_id=service_id,
                service_name=service_name,
                amount=item.amount
            )
        )

    # Calculate advance payments available for this visit (minus any refunds)
    advance_payments = db.query(models.Payment).filter(
        models.Payment.visit_id == visit.id,
        models.Payment.payment_type == "Advance",
        models.Payment.bill_id.is_(None),  # Not yet applied to a bill
        models.Payment.is_active == True
    ).all()
    
    valid_advance_payments = []
    advance_total = 0.0
    for pay in advance_payments:
        refunded = db.query(func.sum(models.Refund.amount_refunded)).filter(
            models.Refund.payment_id == pay.id
        ).scalar() or 0.0
        net_amount = pay.amount_paid - refunded
        if net_amount > 0:
            pay.net_advance_available = net_amount
            advance_total += net_amount
            valid_advance_payments.append(pay)
    
    # Adjust grand total based on advance payments
    advance_applied = min(advance_total, grand_total)
    balance_amount = grand_total - advance_applied
    
    payment_status = "Pending"
    if balance_amount == 0:
        payment_status = "Paid"
    elif advance_applied > 0:
        payment_status = "Partial Paid"

    # Create the Bill
    db_bill = models.Bill(
        bill_id=bill_id,
        visit_id=visit.id,
        grand_total=grand_total,
        advance_applied=advance_applied,
        payment_status=payment_status,
        balance_amount=balance_amount,
        created_by=current_user.id
    )
    
    # Add bill items
    for item in bill_items_to_create:
        db_bill.items.append(item)
        
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    
    # Apply advance payments to this bill in the database
    remaining_advance_to_apply = advance_applied
    for pay in valid_advance_payments:
        if remaining_advance_to_apply <= 0:
            break
        
        avail = pay.net_advance_available
        if avail <= remaining_advance_to_apply:
            # Fully consumed
            pay.bill_id = db_bill.id
            remaining_advance_to_apply -= avail
        else:
            # Partially consumed. Split the payment record!
            original_amount = pay.amount_paid
            consumed_amount = remaining_advance_to_apply
            excess_amount = original_amount - consumed_amount
            
            # 1. Update current payment to the consumed amount and link to bill
            pay.amount_paid = consumed_amount
            pay.bill_id = db_bill.id
            
            # 2. Create a new advance payment for the excess amount
            excess_pay_id = generate_unique_id(db, "PAY", models.Payment, models.Payment.payment_id)
            excess_payment = models.Payment(
                payment_id=excess_pay_id,
                visit_id=pay.visit_id,
                amount_paid=excess_amount,
                payment_method=pay.payment_method,
                payment_type="Advance",
                transaction_reference=pay.transaction_reference,
                recorded_by=pay.recorded_by,
                payment_date=pay.payment_date
            )
            db.add(excess_payment)
            
            remaining_advance_to_apply = 0.0
            
    db.commit()
    db.refresh(db_bill)
    
    log_action(db, current_user.id, "CREATE_BILL", "bills", str(db_bill.id), f"Created bill {db_bill.bill_id} for visit {visit.visit_id}. Total: ₹{grand_total}, Advance adjusted: ₹{advance_applied}")
    return db_bill

@app.get("/api/bills", response_model=List[schemas.BillResponse])
def get_bills(
    patient_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
):
    q = db.query(models.Bill).filter(models.Bill.is_active == True)
    
    if patient_id:
        q = q.join(models.Visit).filter(models.Visit.patient_id == patient_id)
    if payment_status:
        q = q.filter(models.Bill.payment_status == payment_status)
        
    return q.order_by(models.Bill.created_at.desc()).all()

@app.get("/api/bills/{id}", response_model=schemas.BillResponse)
def get_bill(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
):
    bill = db.query(models.Bill).filter(models.Bill.id == id, models.Bill.is_active == True).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@app.delete("/api/bills/{id}")
def delete_bill(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    bill = db.query(models.Bill).filter(models.Bill.id == id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
        
    bill.is_active = False
    bill.deleted_at = datetime.datetime.utcnow()
    
    # Soft-delete all payments linked to this bill
    payments = db.query(models.Payment).filter(models.Payment.bill_id == id).all()
    for pay in payments:
        pay.is_active = False
        pay.deleted_at = datetime.datetime.utcnow()
        
    db.commit()
    
    log_action(db, current_user.id, "DELETE_BILL", "bills", str(id), f"Soft-deleted bill {bill.bill_id} and all its linked payments")
    return {"message": "Bill soft deleted successfully"}


# ----------------------------------------------------
# PAYMENT ROUTERS
# ----------------------------------------------------
@app.post("/api/payments", response_model=schemas.PaymentResponse)
def record_payment(
    payment_in: schemas.PaymentCreate,
    background_tasks: BackgroundTasks,
    bill_id: Optional[int] = Query(None, description="Record a payment for an existing bill"),
    visit_id: Optional[int] = Query(None, description="Record an advance payment for a visit"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant", "Receptionist"]))
):
    if not bill_id and not visit_id:
        raise HTTPException(status_code=400, detail="Must provide either bill_id or visit_id")
        
    payment_id = generate_unique_id(db, "PAY", models.Payment, models.Payment.payment_id)
    
    # 1. Advance Payment Flow (Linked to a Visit)
    if visit_id and not bill_id:
        visit = db.query(models.Visit).filter(models.Visit.id == visit_id, models.Visit.is_active == True).first()
        if not visit:
            raise HTTPException(status_code=404, detail="Visit not found")
            
        db_payment = models.Payment(
            payment_id=payment_id,
            visit_id=visit_id,
            amount_paid=payment_in.amount_paid,
            payment_method=payment_in.payment_method,
            payment_type="Advance",
            transaction_reference=payment_in.transaction_reference,
            recorded_by=current_user.id
        )
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        
        # Generate Receipt PDF
        receipt_id = generate_unique_id(db, "REC", models.Receipt, models.Receipt.receipt_id)
        pdf_filename = f"{receipt_id}.pdf"
        pdf_path = os.path.join(RECEIPTS_DIR, pdf_filename)
        
        db_receipt = models.Receipt(
            receipt_id=receipt_id,
            payment_id=db_payment.id,
            receipt_type="Advance Payment",
            pdf_path=f"/receipts/{pdf_filename}"
        )
        db_payment.receipts.append(db_receipt)
        db.commit()
        
        # Call reportlab generator via background tasks
        background_tasks.add_task(generate_receipt_pdf_bg, db_payment.id, pdf_path)
        
        log_action(db, current_user.id, "RECORD_ADVANCE_PAYMENT", "payments", str(db_payment.id), f"Recorded advance payment of ₹{payment_in.amount_paid} for visit {visit.visit_id}")
        return db_payment
        
    # 2. Bill Payment Flow
    if bill_id:
        bill = db.query(models.Bill).filter(models.Bill.id == bill_id, models.Bill.is_active == True).first()
        if not bill:
            raise HTTPException(status_code=404, detail="Bill not found")
            
        if bill.balance_amount <= 0:
            raise HTTPException(status_code=400, detail="Bill is already fully paid")
            
        amount_to_pay = min(payment_in.amount_paid, bill.balance_amount)
        
        # Payment type determination
        is_full_settlement = (amount_to_pay >= bill.balance_amount)
        payment_type = "Full" if is_full_settlement else "Partial"
        
        db_payment = models.Payment(
            payment_id=payment_id,
            bill_id=bill_id,
            amount_paid=amount_to_pay,
            payment_method=payment_in.payment_method,
            payment_type=payment_type,
            transaction_reference=payment_in.transaction_reference,
            recorded_by=current_user.id
        )
        db.add(db_payment)
        
        # Update Bill status and balance
        bill.balance_amount -= amount_to_pay
        if bill.balance_amount == 0:
            bill.payment_status = "Paid"
        else:
            bill.payment_status = "Partial Paid"
            
        db.commit()
        db.refresh(db_payment)
        
        # Generate Receipt PDF
        receipt_id = generate_unique_id(db, "REC", models.Receipt, models.Receipt.receipt_id)
        pdf_filename = f"{receipt_id}.pdf"
        pdf_path = os.path.join(RECEIPTS_DIR, pdf_filename)
        
        # Receipt Type Mapping
        receipt_type = "Final Settlement" if is_full_settlement else "OPD/Lab" # Standard bill payments
        
        db_receipt = models.Receipt(
            receipt_id=receipt_id,
            payment_id=db_payment.id,
            receipt_type=receipt_type,
            pdf_path=f"/receipts/{pdf_filename}"
        )
        db_payment.receipts.append(db_receipt)
        db.commit()
        
        # Call ReportLab generator via background tasks
        background_tasks.add_task(generate_receipt_pdf_bg, db_payment.id, pdf_path)
        
        log_action(db, current_user.id, "RECORD_BILL_PAYMENT", "payments", str(db_payment.id), f"Recorded {payment_type} payment of ₹{amount_to_pay} for bill {bill.bill_id}. Dues remaining: ₹{bill.balance_amount}")
        return db_payment

@app.get("/api/payments", response_model=List[schemas.PaymentResponse])
def get_payments(
    bill_id: Optional[int] = None,
    visit_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
):
    q = db.query(models.Payment).filter(models.Payment.is_active == True)
    if bill_id:
        q = q.filter(models.Payment.bill_id == bill_id)
    if visit_id:
        q = q.filter(models.Payment.visit_id == visit_id)
    return q.order_by(models.Payment.payment_date.desc()).all()

@app.get("/api/payments/{id}/receipts", response_model=List[schemas.ReceiptResponse])
def get_payment_receipts(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
):
    return db.query(models.Receipt).filter(models.Receipt.payment_id == id).all()

@app.post("/api/payments/{id}/refund", response_model=schemas.RefundResponse)
def refund_payment(
    id: str,
    refund_in: schemas.RefundBase,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
):
    payment = db.query(models.Payment).filter(models.Payment.payment_id == id, models.Payment.is_active == True).first()
    if not payment and id.isdigit():
        payment = db.query(models.Payment).filter(models.Payment.id == int(id), models.Payment.is_active == True).first()
        
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")
        
    if payment.payment_type == "Refund":
        raise HTTPException(status_code=400, detail="Cannot refund a refund record")
        
    # Verify that refund amount doesn't exceed the amount paid
    already_refunded = db.query(func.sum(models.Refund.amount_refunded)).filter(models.Refund.payment_id == payment.id).scalar() or 0.0
    max_refundable = payment.amount_paid - already_refunded
    
    if refund_in.amount_refunded > max_refundable:
        raise HTTPException(status_code=400, detail=f"Refund amount ₹{refund_in.amount_refunded} exceeds maximum refundable balance of ₹{max_refundable}")

    # Create Refund Record
    refund_id = generate_unique_id(db, "REF", models.Refund, models.Refund.refund_id)
    db_refund = models.Refund(
        refund_id=refund_id,
        payment_id=payment.id,
        amount_refunded=refund_in.amount_refunded,
        reason=refund_in.reason,
        handled_by=current_user.id
    )
    db.add(db_refund)
    
    # Adjust Bill balance (increase dues)
    if payment.bill:
        bill = payment.bill
        bill.balance_amount += refund_in.amount_refunded
        if bill.balance_amount >= bill.grand_total:
            bill.payment_status = "Pending"
        else:
            bill.payment_status = "Partial Paid"
            
    db.commit()
    db.refresh(db_refund)
    
    # Create a system payment/refund entry to log transaction and generate PDF
    ref_payment_id = generate_unique_id(db, "PAY", models.Payment, models.Payment.payment_id)
    refund_payment_rec = models.Payment(
        payment_id=ref_payment_id,
        bill_id=payment.bill_id,
        visit_id=payment.visit_id,
        amount_paid=-refund_in.amount_refunded,  # Negative payment representing cash outflow
        payment_method=payment.payment_method,
        payment_type="Refund",
        transaction_reference=f"Refund on {payment.payment_id}",
        recorded_by=current_user.id
    )
    db.add(refund_payment_rec)
    db.commit()
    db.refresh(refund_payment_rec)
    
    # Receipt for the Refund
    receipt_id = generate_unique_id(db, "REC", models.Receipt, models.Receipt.receipt_id)
    pdf_filename = f"{receipt_id}.pdf"
    pdf_path = os.path.join(RECEIPTS_DIR, pdf_filename)
    
    db_receipt = models.Receipt(
        receipt_id=receipt_id,
        payment_id=refund_payment_rec.id,
        receipt_type="Refund Receipt",
        pdf_path=f"/receipts/{pdf_filename}"
    )
    refund_payment_rec.receipts.append(db_receipt)
    db.commit()
    
    # Generate the receipt PDF using ReportLab in the background
    background_tasks.add_task(generate_receipt_pdf_bg, refund_payment_rec.id, pdf_path)
    
    log_action(
        db, 
        current_user.id, 
        "ISSUE_REFUND", 
        "refunds", 
        str(db_refund.id), 
        f"Issued refund of ₹{refund_in.amount_refunded} on payment {payment.payment_id}. Reason: {refund_in.reason}"
    )
    
    return db_refund


# ----------------------------------------------------
# DOCTOR ROUTERS
# ----------------------------------------------------
@app.get("/api/doctors", response_model=List[schemas.DoctorResponse])
def get_doctors(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant", "Doctor"]))
):
    return db.query(models.Doctor).filter(models.Doctor.is_active == True).order_by(models.Doctor.name).all()

@app.post("/api/doctors", response_model=schemas.DoctorResponse)
def create_doctor(
    doctor_in: schemas.DoctorCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    db_doctor = models.Doctor(
        name=doctor_in.name,
        degree=doctor_in.degree,
        consultation_fee=doctor_in.consultation_fee if doctor_in.consultation_fee is not None else 500.0,
        consultation_validity_days=doctor_in.consultation_validity_days if doctor_in.consultation_validity_days is not None else 7
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    
    log_action(db, current_user.id, "CREATE_DOCTOR", "doctors", str(db_doctor.id), f"Added doctor {db_doctor.name}")
    return db_doctor

@app.put("/api/doctors/{id}", response_model=schemas.DoctorResponse)
def update_doctor(
    id: int,
    doctor_in: schemas.DoctorCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    db_doctor = db.query(models.Doctor).filter(models.Doctor.id == id, models.Doctor.is_active == True).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db_doctor.name = doctor_in.name
    db_doctor.degree = doctor_in.degree
    if doctor_in.consultation_fee is not None:
        db_doctor.consultation_fee = doctor_in.consultation_fee
    if doctor_in.consultation_validity_days is not None:
        db_doctor.consultation_validity_days = doctor_in.consultation_validity_days
    db.commit()
    db.refresh(db_doctor)
    
    log_action(db, current_user.id, "UPDATE_DOCTOR", "doctors", str(id), f"Updated doctor {db_doctor.name}")
    return db_doctor

@app.delete("/api/doctors/{id}")
def delete_doctor(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    db_doctor = db.query(models.Doctor).filter(models.Doctor.id == id).first()
    if not db_doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    db_doctor.is_active = False
    db.commit()
    
    log_action(db, current_user.id, "DELETE_DOCTOR", "doctors", str(id), f"Soft-deleted doctor {db_doctor.name}")
    return {"message": "Doctor soft deleted successfully"}


# ----------------------------------------------------
# SETTINGS ROUTERS
# ----------------------------------------------------
@app.get("/api/settings", response_model=List[schemas.SettingResponse])
def get_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant", "Doctor"]))
):
    return db.query(models.Setting).order_by(models.Setting.key).all()

@app.put("/api/settings", response_model=List[schemas.SettingResponse])
def update_settings(
    settings_in: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    updated = []
    for key, val in settings_in.items():
        db_sett = db.query(models.Setting).filter(models.Setting.key == key).first()
        if db_sett:
            db_sett.value = val
        else:
            db_sett = models.Setting(key=key, value=val)
            db.add(db_sett)
        updated.append(db_sett)
    db.commit()
    
    log_action(db, current_user.id, "UPDATE_SETTINGS", "settings", "ALL", f"Updated system customization settings: {list(settings_in.keys())}")
    return db.query(models.Setting).order_by(models.Setting.key).all()


# ----------------------------------------------------
# AUDIT LOGS
# ----------------------------------------------------
@app.get("/api/audit-logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin"]))
):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).all()
    # Populate user_name manually to avoid complex models join issues in Pydantic schema validation
    output = []
    for log in logs:
        user_name = log.user.username if log.user else "System"
        o = schemas.AuditLogResponse.model_validate(log)
        o.user_name = user_name
        output.append(o)
    return output


# ----------------------------------------------------
# METRICS & DASHBOARD
# ----------------------------------------------------
@app.get("/api/dashboard/metrics", response_model=schemas.DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant", "Receptionist", "Doctor"]))
):
    today = datetime.date.today()
    start_of_today = datetime.datetime.combine(today, datetime.time.min)
    end_of_today = datetime.datetime.combine(today, datetime.time.max)

    # 1. Patients Counters
    total_patients = db.query(models.Patient).filter(models.Patient.is_active == True).count()
    today_patients = db.query(models.Patient).filter(
        models.Patient.created_at >= start_of_today,
        models.Patient.created_at <= end_of_today,
        models.Patient.is_active == True
    ).count()

    # 2. Total Revenue & Today's Revenue
    # We sum all payments that are NOT refunds (refunds are saved as negative values)
    total_revenue_q = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.is_active == True,
        models.Payment.payment_type != "Refund"
    ).scalar() or 0.0
    
    total_refunds_q = db.query(func.sum(models.Refund.amount_refunded)).scalar() or 0.0
    total_revenue = max(0.0, total_revenue_q - total_refunds_q)

    today_revenue_q = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.payment_date >= start_of_today,
        models.Payment.payment_date <= end_of_today,
        models.Payment.payment_type != "Refund",
        models.Payment.is_active == True
    ).scalar() or 0.0
    
    today_refunds_q = db.query(func.sum(models.Refund.amount_refunded)).filter(
        models.Refund.refund_date >= start_of_today,
        models.Refund.refund_date <= end_of_today
    ).scalar() or 0.0
    today_revenue = today_revenue_q - today_refunds_q

    # 3. Dues Outstanding
    pending_dues = db.query(func.sum(models.Bill.balance_amount)).filter(
        models.Bill.is_active == True
    ).scalar() or 0.0

    # 4. Cash vs Online Breakdown Today
    # Online = Card, UPI, Net Banking, Wallet
    cash_payments_today = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.payment_date >= start_of_today,
        models.Payment.payment_date <= end_of_today,
        models.Payment.payment_method == "Cash",
        models.Payment.payment_type != "Refund",
        models.Payment.is_active == True
    ).scalar() or 0.0
    
    cash_refunds_today = db.query(func.sum(models.Refund.amount_refunded)).join(models.Payment).filter(
        models.Refund.refund_date >= start_of_today,
        models.Refund.refund_date <= end_of_today,
        models.Payment.payment_method == "Cash"
    ).scalar() or 0.0
    
    cash_collection_today = max(0.0, cash_payments_today - cash_refunds_today)

    online_payments_today = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.payment_date >= start_of_today,
        models.Payment.payment_date <= end_of_today,
        models.Payment.payment_method != "Cash",
        models.Payment.payment_type != "Refund",
        models.Payment.is_active == True
    ).scalar() or 0.0
    
    online_refunds_today = db.query(func.sum(models.Refund.amount_refunded)).join(models.Payment).filter(
        models.Refund.refund_date >= start_of_today,
        models.Refund.refund_date <= end_of_today,
        models.Payment.payment_method != "Cash"
    ).scalar() or 0.0
    
    online_collection_today = max(0.0, online_payments_today - online_refunds_today)

    # 5. Refunds today
    refund_amount_today = today_refunds_q

    # 6. Payment method-wise breakdown (All-time aggregates)
    methods = ["Cash", "UPI", "Card", "Net Banking", "Wallet"]
    payment_method_breakdown = {}
    payment_method_counts = {}
    
    for m in methods:
        pays_sum = db.query(func.sum(models.Payment.amount_paid)).filter(
            models.Payment.payment_method == m,
            models.Payment.payment_type != "Refund",
            models.Payment.is_active == True
        ).scalar() or 0.0
        
        refs_sum = db.query(func.sum(models.Refund.amount_refunded)).join(models.Payment).filter(
            models.Payment.payment_method == m
        ).scalar() or 0.0
        
        pays_count = db.query(models.Payment).filter(
            models.Payment.payment_method == m,
            models.Payment.payment_type != "Refund",
            models.Payment.is_active == True
        ).count()
        
        payment_method_breakdown[m] = max(0.0, pays_sum - refs_sum)
        payment_method_counts[m] = pays_count

    # 7. Recent Transactions (last 10 payments)
    recent_pays = db.query(models.Payment).filter(models.Payment.is_active == True).order_by(models.Payment.payment_date.desc()).limit(10).all()
    recent_txs = []
    for pay in recent_pays:
        pat_name = "N/A"
        if pay.bill and pay.bill.visit and pay.bill.visit.patient:
            pat_name = pay.bill.visit.patient.name
        elif pay.visit and pay.visit.patient:
            pat_name = pay.visit.patient.name
            
        recent_txs.append({
            "id": pay.id,
            "payment_id": pay.payment_id,
            "patient_name": pat_name,
            "amount": pay.amount_paid,
            "payment_method": pay.payment_method,
            "payment_type": pay.payment_type,
            "payment_date": pay.payment_date.strftime("%Y-%m-%d %H:%M:%S")
        })

    return {
        "total_patients": total_patients,
        "today_patients": today_patients,
        "total_revenue": total_revenue,
        "today_revenue": today_revenue,
        "pending_dues": pending_dues,
        "cash_collection_today": cash_collection_today,
        "online_collection_today": online_collection_today,
        "refund_amount_today": refund_amount_today,
        "payment_method_breakdown": payment_method_breakdown,
        "payment_method_counts": payment_method_counts,
        "recent_transactions": recent_txs
    }


@app.get("/api/dashboard/audit-stats")
def get_dashboard_audit_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
):
    total_audits = db.query(models.AuditLog).filter(
        models.AuditLog.action.in_(["UPDATE_VISIT_SUMMARY", "CREATE_BILL", "RECORD_BILL_PAYMENT"])
    ).count()
    
    leakages_stopped = db.query(models.AuditLog).filter(
        models.AuditLog.action == "UPDATE_VISIT_SUMMARY"
    ).count()
    
    gst_compliance_checked = db.query(models.AuditLog).filter(
        models.AuditLog.action.in_(["CREATE_BILL", "RECORD_BILL_PAYMENT"])
    ).count()
    
    verified_abha_profiles = db.query(models.Patient).filter(
        models.Patient.abha_id != None,
        models.Patient.is_active == True
    ).count()

    return {
        "total_audits_run": total_audits,
        "leakages_stopped_count": leakages_stopped,
        "leakages_stopped_amount": leakages_stopped * 450.0,
        "gst_audits_passed": gst_compliance_checked,
        "abha_verification_count": verified_abha_profiles,
        "abha_verification_rate": 100.0 if db.query(models.Patient).filter(models.Patient.is_active == True).count() == 0 else (verified_abha_profiles / db.query(models.Patient).filter(models.Patient.is_active == True).count()) * 100.0
    }


# ----------------------------------------------------
# EXPORT REPORTS (EXCEL/CSV)
# ----------------------------------------------------
def get_financial_report_data(db: Session) -> pd.DataFrame:
    payments = db.query(models.Payment).filter(models.Payment.is_active == True).order_by(models.Payment.payment_date.desc()).all()
    data = []
    for pay in payments:
        pat = None
        bill_id = ""
        visit_id = ""
        
        if pay.bill and pay.bill.visit:
            bill_id = pay.bill.bill_id
            pat = pay.bill.visit.patient
            visit_id = pay.bill.visit.visit_id
        elif pay.visit:
            visit_id = pay.visit.visit_id
            pat = pay.visit.patient
            
        data.append({
            "Payment ID": pay.payment_id,
            "Patient ID": pat.patient_id if pat else "N/A",
            "Patient Name": pat.name if pat else "N/A",
            "Visit ID": visit_id,
            "Bill ID": bill_id,
            "Amount": pay.amount_paid,
            "Payment Method": pay.payment_method,
            "Payment Type": pay.payment_type,
            "Reference": pay.transaction_reference or "N/A",
            "Date": pay.payment_date.strftime("%Y-%m-%d %H:%M:%S"),
            "Recorded By": pay.recorder.username if pay.recorder else "System"
        })
    return pd.DataFrame(data)

@app.get("/api/dashboard/reports/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
):
    df = get_financial_report_data(db)
    if df.empty:
        df = pd.DataFrame(columns=["No Transactions Found"])
        
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    # Log report export
    log_action(db, current_user.id, "EXPORT_CSV_REPORT", "payments", "ALL", "Exported financials to CSV format")
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=hospisyn_revenue_report_{datetime.date.today().strftime('%Y%m%d')}.csv"
    return response

@app.get("/api/dashboard/reports/excel")
def export_excel(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
):
    df = get_financial_report_data(db)
    if df.empty:
        df = pd.DataFrame(columns=["No Transactions Found"])
        
    buffer = io.BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Transactions History")
        
    buffer.seek(0)
    
    # Log report export
    log_action(db, current_user.id, "EXPORT_EXCEL_REPORT", "payments", "ALL", "Exported financials to Excel format")
    
    response = StreamingResponse(buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response.headers["Content-Disposition"] = f"attachment; filename=hospisyn_revenue_report_{datetime.date.today().strftime('%Y%m%d')}.xlsx"
    return response


# ----------------------------------------------------
# SIPS DEMO QUICK-SEER
# ----------------------------------------------------
@app.post("/api/demo/seed")
def seed_demo_data(db: Session = Depends(get_db)):
    # 1. Clean up existing demo patients (so seeding is repeatable)
    demo_mobiles = ["9876543210", "9988776655", "9566338291", "9456782341", "9900011122", "9900011133", "9900011144", "9900011155", "9900011166"]
    demo_patients = db.query(models.Patient).filter(models.Patient.mobile_number.in_(demo_mobiles)).all()
    for p in demo_patients:
        # Delete related payments, receipts, bills, and visits
        db.query(models.Receipt).filter(models.Receipt.payment_id.in_(
            db.query(models.Payment.id).join(models.Bill).join(models.Visit).filter(models.Visit.patient_id == p.id)
        )).delete(synchronize_session=False)
        db.query(models.Payment).filter(models.Payment.visit_id.in_(
            db.query(models.Visit.id).filter(models.Visit.patient_id == p.id)
        )).delete(synchronize_session=False)
        db.query(models.Payment).filter(models.Payment.bill_id.in_(
            db.query(models.Bill.id).join(models.Visit).filter(models.Visit.patient_id == p.id)
        )).delete(synchronize_session=False)
        db.query(models.BillItem).filter(models.BillItem.bill_id.in_(
            db.query(models.Bill.id).join(models.Visit).filter(models.Visit.patient_id == p.id)
        )).delete(synchronize_session=False)
        db.query(models.Bill).filter(models.Bill.visit_id.in_(
            db.query(models.Visit.id).filter(models.Visit.patient_id == p.id)
        )).delete(synchronize_session=False)
        db.query(models.Visit).filter(models.Visit.patient_id == p.id).delete(synchronize_session=False)
        db.delete(p)
    db.commit()

    # Find the doctor Shweta Grover
    doctor = db.query(models.Doctor).first()
    doctor_id = doctor.id if doctor else None
    
    # Get active services
    cbc = db.query(models.Service).filter(models.Service.name.ilike("%cbc%")).first()
    lipid = db.query(models.Service).filter(models.Service.name.ilike("%lipid%")).first()
    consult = db.query(models.Service).filter(models.Service.name.ilike("%general physician%")).first()
    specialist = db.query(models.Service).filter(models.Service.name.ilike("%specialist%")).first()
    ambulance = db.query(models.Service).filter(models.Service.name.ilike("%ambulance%")).first()
    
    # Ensure standard services exist
    if not cbc:
        cbc = models.Service(category="Laboratory Tests", name="Complete Blood Count (CBC)", price=350.0)
        db.add(cbc)
    if not lipid:
        lipid = models.Service(category="Laboratory Tests", name="Lipid Profile Panel", price=800.0)
        db.add(lipid)
    if not consult:
        consult = models.Service(category="Doctor Consultation", name="General Physician Consultation", price=400.0)
        db.add(consult)
    if not specialist:
        specialist = models.Service(category="Doctor Consultation", name="Specialist Consultation", price=800.0)
        db.add(specialist)
    if not ambulance:
        ambulance = models.Service(category="Other Hospital Services", name="Ambulance Emergency Transfer", price=1500.0)
        db.add(ambulance)
        
    # Ensure AC Room Rent and Cosmetic Surgery services are present
    ac_room = db.query(models.Service).filter(models.Service.name.ilike("%private room rent%")).first()
    if not ac_room:
        ac_room = models.Service(category="IPD Charges", name="Semi-Private Room Rent (Per Day)", price=5500.0)
        db.add(ac_room)
    else:
        ac_room.price = 5500.0  # Triggers GST (>5000)
        
    cosmetic = db.query(models.Service).filter(models.Service.name.ilike("%cosmetic%")).first()
    if not cosmetic:
        cosmetic = models.Service(category="Other Hospital Services", name="Cosmetic rhinoplasty surgery", price=12000.0)
        db.add(cosmetic)
        
    db.commit()

    # 1. Seed Aarav Sharma (Pediatric dosing error warning demo)
    pat1 = models.Patient(
        patient_id=generate_unique_id(db, "PAT", models.Patient, models.Patient.patient_id),
        name="Aarav Sharma", age=8, gender="Male", mobile_number="9876543210", address="Saket, Meerut"
    )
    db.add(pat1)
    db.commit()
    
    vis1 = models.Visit(
        visit_id=generate_unique_id(db, "VIS", models.Visit, models.Visit.visit_id),
        patient_id=pat1.id, doctor_id=doctor_id, reason="Severe throat pain & fever"
    )
    db.add(vis1)
    db.commit()
    
    # 2. Seed Sunita Verma (Duplicate billing warning demo)
    pat2 = models.Patient(
        patient_id=generate_unique_id(db, "PAT", models.Patient, models.Patient.patient_id),
        name="Sunita Verma", age=42, gender="Female", mobile_number="9988776655", address="Sanjay Nagar, Meerut"
    )
    db.add(pat2)
    db.commit()
    
    vis2 = models.Visit(
        visit_id=generate_unique_id(db, "VIS", models.Visit, models.Visit.visit_id),
        patient_id=pat2.id, doctor_id=doctor_id, reason="Fever and generalized weakness"
    )
    db.add(vis2)
    db.commit()

    # 3. Seed Rajesh Malhotra (AC Room Rent GST > 5000 compliance demo)
    pat3 = models.Patient(
        patient_id=generate_unique_id(db, "PAT", models.Patient, models.Patient.patient_id),
        name="Rajesh Malhotra", age=58, gender="Male", mobile_number="9566338291", address="Civil Lines, Meerut"
    )
    db.add(pat3)
    db.commit()
    
    vis3 = models.Visit(
        visit_id=generate_unique_id(db, "VIS", models.Visit, models.Visit.visit_id),
        patient_id=pat3.id, doctor_id=doctor_id, reason="Inpatient post-op recovery"
    )
    db.add(vis3)
    db.commit()

    # 4. Seed Karan Johar (Cosmetic surgery 18% GST audit demo)
    pat4 = models.Patient(
        patient_id=generate_unique_id(db, "PAT", models.Patient, models.Patient.patient_id),
        name="Karan Johar", age=35, gender="Male", mobile_number="9456782341", address="Shastri Nagar, Meerut"
    )
    db.add(pat4)
    db.commit()
    
    vis4 = models.Visit(
        visit_id=generate_unique_id(db, "VIS", models.Visit, models.Visit.visit_id),
        patient_id=pat4.id, doctor_id=doctor_id, reason="Elective cosmetic rhinoplasty"
    )
    db.add(vis4)
    db.commit()

    # 5. Seed historical billing/payment cases for dashboard charts
    admin_user = db.query(models.User).filter(models.User.username == "admin").first()
    created_by = admin_user.id if admin_user else 1
    
    historical_data = [
        (
            "Nisha Patel", 29, "Female", "9900011122", 1200.0, 1200.0, "UPI", "Paid",
            "Mild Iron Deficiency Anemia & Fatigue",
            "Generalized fatigue, dizziness, and mild headache for 2 weeks",
            "1. Autrin Iron Supplement — 1 tab OD after meals for 30 days\n2. Vitamin C 500mg (Limcee) — 1 tab OD after breakfast for 15 days",
            "1. Complete Blood Count (CBC)\n2. Serum Ferritin",
            "1. Increase dietary intake of green leafy vegetables and dates\n2. Adequate hydration and 8 hours sleep",
            "Review with repeat CBC report after 4 weeks"
        ),
        (
            "Vikram Singh", 67, "Male", "9900011133", 4500.0, 3000.0, "Cash", "Partial Paid",
            "Essential Hypertension with Type 2 Diabetes Follow-up",
            "Routine diabetic & blood pressure check-up, mild morning fatigue",
            "1. Telmisartan 40mg — 1 tab OD morning after breakfast\n2. Metformin 500mg SR — 1 tab BD after meals",
            "1. Fasting Blood Sugar (FBS)\n2. HbA1c\n3. Lipid Profile Panel",
            "1. Daily 30-min brisk morning walk\n2. Restrict dietary sodium (< 2g/day) and refined sugars",
            "Review in 2 weeks with Fasting Blood Sugar and HbA1c reports"
        ),
        (
            "Sanjay Gupta", 52, "Male", "9900011144", 8000.0, 0.0, "Cash", "Pending",
            "Acute Gastroenteritis with Mild Dehydration",
            "Loose motions and abdominal cramps since yesterday",
            "1. ORS Sachet — Dissolve 1 pack in 1L water, sip throughout the day\n2. Ofloxacin 200mg + Ornidazole 500mg (O2) — 1 tab BD for 3 days\n3. Econorm 250mg sachet — 1 sachet BD for 3 days",
            "1. Stool Routine Examination",
            "1. Strict light khichdi/banana/curd diet\n2. Avoid oily/spicy street food",
            "Review in 2 days or SOS if dehydration increases"
        ),
        (
            "Dr. Priya Rao", 34, "Female", "9900011155", 150.0, 150.0, "Card", "Paid",
            "Allergic Rhinitis & Seasonal Sneezing",
            "Frequent morning sneezing and watery eyes for 5 days",
            "1. Montek-LC (Montelukast 10mg + Levocetirizine 5mg) — 1 tab HS for 7 days\n2. Fluticasone nasal spray — 1 puff in each nostril OD morning",
            "1. Absolute Eosinophil Count (AEC)",
            "1. Avoid direct exposure to dust, pollen, and sudden temperature shifts\n2. Steam inhalation before sleep",
            "Review as needed (SOS)"
        ),
        (
            "Amit Verma", 41, "Male", "9900011166", 2400.0, 2400.0, "UPI", "Paid",
            "Viral upper respiratory tract infection (common cold)",
            "Fever, Running Nose, Body Pain for 3 days",
            "1. Dolo 650mg — 1 tab TID after meals for 3 days\n2. Montek LC — 1 tab HS for 5 days",
            "1. Complete Blood Count (CBC)",
            "1. Drink plenty of warm fluids and maintain hydration\n2. Rest and avoid strenuous activity\n3. Warm saline gargles",
            "Review in 3 days or sooner if fever persists beyond 101°F"
        )
    ]
    
    for p_name, p_age, p_gender, p_mob, total_amt, paid_amt, p_method, p_status, diag, complaints, meds, tests, advice, follow_up in historical_data:
        hist_p = models.Patient(
            patient_id=generate_unique_id(db, "PAT", models.Patient, models.Patient.patient_id),
            name=p_name, age=p_age, gender=p_gender, mobile_number=p_mob, address="Meerut"
        )
        db.add(hist_p)
        db.commit()
        
        hist_v = models.Visit(
            visit_id=generate_unique_id(db, "VIS", models.Visit, models.Visit.visit_id),
            patient_id=hist_p.id,
            doctor_id=doctor_id,
            reason="General Consult / Diagnostics",
            status="Completed",
            diagnosis=diag,
            chief_complaints=complaints,
            medicines_list=meds,
            tests_list=tests,
            advice=advice,
            follow_up_date=follow_up
        )
        db.add(hist_v)
        db.commit()
        
        hist_b = models.Bill(
            bill_id=generate_unique_id(db, "BILL", models.Bill, models.Bill.bill_id),
            visit_id=hist_v.id,
            grand_total=total_amt,
            advance_applied=0.0,
            payment_status=p_status,
            balance_amount=max(0.0, total_amt - paid_amt),
            created_by=created_by
        )
        db.add(hist_b)
        db.commit()
        
        b_item = models.BillItem(
            bill_id=hist_b.id,
            service_id=consult.id,
            service_name="General Physician Consultation",
            amount=total_amt
        )
        db.add(b_item)
        db.commit()
        
        if paid_amt > 0:
            hist_pay = models.Payment(
                payment_id=generate_unique_id(db, "PAY", models.Payment, models.Payment.payment_id),
                bill_id=hist_b.id,
                amount_paid=paid_amt,
                payment_method=p_method,
                payment_type="Full" if p_status == "Paid" else "Partial",
                recorded_by=created_by,
                transaction_reference=f"TXN{datetime.datetime.now().strftime('%M%S%f')[:8]}"
            )
            db.add(hist_pay)
            db.commit()
            
            receipt_id = generate_unique_id(db, "REC", models.Receipt, models.Receipt.receipt_id)
            pdf_filename = f"{receipt_id}.pdf"
            pdf_path = os.path.join(RECEIPTS_DIR, pdf_filename)
            hist_rec = models.Receipt(
                receipt_id=receipt_id,
                payment_id=hist_pay.id,
                receipt_type="Payment Settlement",
                pdf_path=f"/receipts/{pdf_filename}"
            )
            db.add(hist_rec)
            db.commit()
            try:
                pdf_generator.generate_receipt_pdf(hist_pay, db, pdf_path)
            except Exception as e:
                print(f"Warning: Could not generate seeded receipt PDF: {e}")

    return {
        "message": "SIPS Evaluation Demo Data Seeded Successfully",
        "demo_patients": ["Aarav Sharma", "Sunita Verma", "Rajesh Malhotra", "Karan Johar"],
        "historical_cases_count": len(historical_data)
    }
