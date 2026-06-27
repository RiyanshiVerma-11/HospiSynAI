import os
import io
import datetime
import json
import httpx
from typing import List, Optional, Dict

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
import pandas as pd

from database import get_db, engine, Base
import models
import schemas
import auth
import pdf_generator

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
    allow_origins=["*"],  # For dockerized environments, allow any origin to connect easily
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
        # Run migration query to ensure visits table has doctor_id and clinical columns
        try:
            from sqlalchemy import text
            db.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS doctor_id INTEGER REFERENCES doctors(id)"))
            db.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS diagnosis VARCHAR"))
            db.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS chief_complaints VARCHAR"))
            db.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS medicines_list VARCHAR"))
            db.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS tests_list VARCHAR"))
            db.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS advice VARCHAR"))
            db.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS follow_up_date VARCHAR"))
            db.execute(text("ALTER TABLE visits ADD COLUMN IF NOT EXISTS patient_summary TEXT"))
            db.commit()
        except Exception as migrate_err:
            print("Migration warning (visits.doctor_id / clinical columns):", migrate_err)
            db.rollback()

        # Seed default doctor if table is empty
        if db.query(models.Doctor).count() == 0:
            default_doctor = models.Doctor(
                name="Dr. Shweta Grover",
                degree="MBBS, MD (Pathology), PhD\nPDF (Dermatopathology, Hamburg, Germany)\nConsultant Pathologist"
            )
            db.add(default_doctor)
            db.commit()

        # 1. Seed Users
        users_to_seed = [
            ("admin", "admin123", "Admin", "System Administrator"),
            ("receptionist", "recep123", "Receptionist", "Front Desk Receptionist"),
            ("accountant", "acct123", "Accountant", "Chief Accountant")
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

        # 3. Seed Services Catalog
        if db.query(models.Service).count() == 0:
            services_to_seed = [
                ("Doctor Consultation", "General Physician Consultation", 400.0),
                ("Doctor Consultation", "Specialist Consultation", 800.0),
                ("OPD Charges", "OPD Registration Fee", 100.0),
                ("OPD Charges", "Wound Dressing & Bandaging", 150.0),
                ("IPD Charges", "General Ward Room Rent (Per Day)", 1500.0),
                ("IPD Charges", "Semi-Private Room Rent (Per Day)", 3000.0),
                ("ICU Charges", "ICU Bed Charges (Per Day)", 8000.0),
                ("ICU Charges", "ICU Ventilator Support (Per Day)", 5000.0),
                ("Laboratory Tests", "Complete Blood Count (CBC)", 350.0),
                ("Laboratory Tests", "Lipid Profile Panel", 800.0),
                ("Laboratory Tests", "Blood Glucose (Fasting & PP)", 150.0),
                ("Radiology/X-Ray/MRI", "Chest X-Ray PA View", 450.0),
                ("Radiology/X-Ray/MRI", "Ultrasound Abdomen", 1200.0),
                ("Radiology/X-Ray/MRI", "MRI Brain Scan (Non-Contrast)", 6500.0),
                ("Pharmacy/Medicines", "Multivitamins & Supps (30 Days)", 350.0),
                ("Pharmacy/Medicines", "Antibiotics Prescribed Course", 450.0),
                ("Other Hospital Services", "Ambulance Emergency Transfer", 1500.0),
                ("Other Hospital Services", "Attendant/Nursing Fee (Per Shift)", 500.0)
            ]
            for cat, name, price in services_to_seed:
                db_serv = models.Service(category=cat, name=name, price=price)
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
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        target_table=target_table,
        target_id=target_id,
        details=details
    )
    db.add(log)
    db.commit()


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
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
):
    q = db.query(models.Patient).filter(models.Patient.is_active == True)
    
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
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
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
        doctor_id=visit_in.doctor_id
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
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
):
    return db.query(models.Visit).filter(models.Visit.patient_id == id, models.Visit.is_active == True).order_by(models.Visit.visit_date.desc()).all()


@app.put("/api/visits/{id}/summary", response_model=schemas.VisitResponse)
async def update_visit_summary(
    id: int,
    visit_update: schemas.VisitSummaryUpdate,
    generate_ai_summary: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
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
4. Hindi Storytelling Routine using the same warm, simple routine layout.

Strict Output Format (follow exactly, do not add extra markdown or headers):
[English Storytelling Summary]
<warm greeting>
☀️ Morning: <details>
🌤️ Afternoon: <details>
🌙 Night: <details>
⚠️ Watch Out For: <warnings or "None — you are on track!">

[Hindi Summary (हिंदी सारांश)]
<greeting in Hindi>
☀️ सुबह (Morning): <details>
🌤️ दोपहर (Afternoon): <details>
🌙 रात (Night): <details>
⚠️ इन बातों का ध्यान रखें: <warnings or "कोई विशेष चेतावनी नहीं">"""

        url = "https://api.groq.com/openai/v1/chat/completions"
        groq_headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.25,
            "max_tokens": 1200
        }

        try:
            async with httpx.AsyncClient(timeout=28.0) as client:
                response = await client.post(url, headers=groq_headers, json=payload)
                response.raise_for_status()
                result = response.json()
            db_visit.patient_summary = result["choices"][0]["message"]["content"].strip()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to communicate with Groq AI API: {str(e)}"
            )

    db.commit()
    db.refresh(db_visit)

    log_action(db, current_user.id, "UPDATE_VISIT_SUMMARY", "visits", str(db_visit.id), f"Updated consultation summary and notes for visit {db_visit.visit_id}")
    return db_visit


@app.get("/api/visits/{id}/prescription-pdf")
def get_visit_prescription_pdf(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_visit = db.query(models.Visit).filter(models.Visit.id == id, models.Visit.is_active == True).first()
    if not db_visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    filename = f"prescription_{db_visit.visit_id}.pdf"
    pdf_path = os.path.join(RECEIPTS_DIR, filename)

    try:
        pdf_generator.generate_prescription_pdf(db_visit, db, pdf_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate prescription PDF: {str(e)}")

    return {"pdf_path": f"/receipts/{filename}"}


@app.post("/api/visits/ai-suggest-treatment", response_model=schemas.AISuggestResponse)
async def ai_suggest_treatment(
    req: schemas.AISuggestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
):
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Groq API key is not configured. Please set GROQ_API_KEY in your .env file."
        )

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
        "max_tokens": 800
    }

    try:
        async with httpx.AsyncClient(timeout=28.0) as client:
            response = await client.post(url, headers=groq_headers, json=payload)
            response.raise_for_status()
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
    except json.JSONDecodeError as je:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI prescription suggestions: {str(je)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to communicate with Groq AI API: {str(e)}"
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

@app.post("/api/services/recommend", response_model=schemas.RecommendationResponse)
async def get_service_recommendations(
    req: schemas.RecommendationRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist"]))
):
    # 1. Resolve patient age and gender if patient_id is provided
    age = req.age
    gender = req.gender
    if req.patient_id:
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
        
    # Format catalog for Groq prompt
    catalog_list = [f"- {s.name} (Category: {s.category}, Price: INR {s.price:.2f})" for s in db_services]
    catalog_str = "\n".join(catalog_list)

    # 3. Groq API Configuration
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Groq API key is not configured in the server environment variables."
        )

    # 4. Construct prompt
    prompt = f"""You are an experienced clinical desk assistant for an Indian diagnostic center and OPD clinic.
Your job is to recommend the most relevant services or tests from our catalog based on the patient's demographics and symptoms.

Patient Details:
- Age: {age}
- Gender: {gender}
- Chief Complaints / Symptoms: {req.symptoms}

Available Hospital Services Catalog:
{catalog_str}

CRITICAL RULES:
1. ONLY recommend services that exist EXACTLY in the provided catalog. Do NOT suggest tests, consultation types, or procedures that are not in the list above.
2. Suggest up to 5 services. If fewer than 5 are relevant, only suggest those.
3. Every recommendation must map EXACTLY to the service name in the catalog (case-sensitive).
4. If no specific diagnostic test in the catalog is relevant, recommend the most appropriate general or specialist consultation from the catalog.

Return response in clean JSON format only matching this schema:
{{
  "recommended_services": [
    {{
      "service_name": "Exact Name from Catalog",
      "reason": "Clear clinical justification tailored to the symptoms, age, and gender."
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
@app.post("/api/bills/ai-anomaly-check", response_model=schemas.AnomalyCheckResponse)
async def check_bill_anomaly(
    req: schemas.AnomalyCheckRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist"]))
):
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    if not api_key:
        # Return clear status without failing — anomaly check is optional
        return schemas.AnomalyCheckResponse(
            status="clear",
            issues=[],
            summary="AI anomaly check not available (GROQ_API_KEY not set).",
            safe_to_proceed=True
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
        "max_tokens": 400
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=groq_headers, json=payload)
            response.raise_for_status()
            result = response.json()
        data = json.loads(result["choices"][0]["message"]["content"])
        return schemas.AnomalyCheckResponse(
            status=data.get("status", "clear"),
            issues=data.get("issues", []),
            summary=data.get("summary", "Bill reviewed."),
            safe_to_proceed=data.get("safe_to_proceed", True)
        )
    except Exception:
        return schemas.AnomalyCheckResponse(
            status="clear", issues=[], summary="Anomaly check skipped.", safe_to_proceed=True
        )


# ----------------------------------------------------
# AI DASHBOARD REVENUE INSIGHT
# ----------------------------------------------------
@app.get("/api/dashboard/ai-insight", response_model=schemas.AIInsightResponse)
async def get_ai_dashboard_insight(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
):
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
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
        "max_tokens": 300
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
        if item.service_id:
            service = db.query(models.Service).filter(models.Service.id == item.service_id).first()
            if not service:
                raise HTTPException(status_code=400, detail=f"Service ID {item.service_id} not found")
            service_name = service.name
        else:
            raise HTTPException(status_code=400, detail="Each item must have a valid Service ID")
            
        grand_total += item.amount
        bill_items_to_create.append(
            models.BillItem(
                service_id=item.service_id,
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
    bill_id: Optional[int] = Query(None, description="Record a payment for an existing bill"),
    visit_id: Optional[int] = Query(None, description="Record an advance payment for a visit"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
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
        
        # Call reportlab generator
        pdf_generator.generate_receipt_pdf(db_payment, db, pdf_path)
        
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
        
        # Call ReportLab generator
        pdf_generator.generate_receipt_pdf(db_payment, db, pdf_path)
        
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
    
    # Generate the receipt PDF using ReportLab
    pdf_generator.generate_receipt_pdf(refund_payment_rec, db, pdf_path)
    
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
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
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
        degree=doctor_in.degree
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
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Receptionist", "Accountant"]))
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
        o = schemas.AuditLogResponse.from_orm(log)
        o.user_name = user_name
        output.append(o)
    return output


# ----------------------------------------------------
# METRICS & DASHBOARD
# ----------------------------------------------------
@app.get("/api/dashboard/metrics", response_model=schemas.DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.RoleChecker(["Admin", "Accountant"]))
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
        if pay.bill:
            pat_name = pay.bill.visit.patient.name
        elif pay.visit:
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
        
        if pay.bill:
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
