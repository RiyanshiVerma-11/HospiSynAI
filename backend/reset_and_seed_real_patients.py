"""
reset_and_seed_real_patients.py
Cleans up duplicate/junk visits and seeds the 5 real patient accounts with their credentials, emails, and statuses.
"""

import os
import datetime
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

import database
import models
import auth

def run():
    db = database.SessionLocal()
    try:
        print("[1/5] Cleaning up duplicate and test visits...")
        # 1. Delete all payments, receipts, bills, and visits for Ananya Sharma and walk-in/test patients
        junk_patients = db.query(models.Patient).filter(
            models.Patient.name.ilike("%Ananya%") |
            models.Patient.name.ilike("%Token Test%") |
            models.Patient.name.ilike("%Walk-In%") |
            models.Patient.name.ilike("%Anand%")
        ).all()
        
        for p in junk_patients:
            visits = db.query(models.Visit).filter(models.Visit.patient_id == p.id).all()
            for v in visits:
                # Delete payments, bills, bill_items
                bills = db.query(models.Bill).filter(models.Bill.visit_id == v.id).all()
                for b in bills:
                    db.query(models.BillItem).filter(models.BillItem.bill_id == b.id).delete()
                    db.query(models.Payment).filter(models.Payment.bill_id == b.id).delete()
                    db.delete(b)
                db.query(models.Payment).filter(models.Payment.visit_id == v.id).delete()
                db.delete(v)
            # Delete corresponding user if exists
            db.query(models.User).filter(
                (models.User.username == p.patient_id) | 
                (models.User.username == (p.email or ""))
            ).delete()
            db.delete(p)

        db.commit()
        print("  Cleaned up junk patients and visits successfully.")

        # 2. Get default doctor and admin user for foreign keys
        doc = db.query(models.Doctor).first()
        admin_user = db.query(models.User).filter(models.User.role == "Admin").first()
        admin_id = admin_user.id if admin_user else 1
        doc_id = doc.id if doc else 1

        # 3. Target Real Patient Data
        real_patients = [
            {
                "name": "Palak",
                "username": "palak",
                "password": "palak@123",
                "email": "mailtopalak0002@gmail.com",
                "mobile": "9876543201",
                "age": 24,
                "gender": "Female",
                "uhid": "PAT-20260926-00001",
                "status": "Completed",
                "triage": "Normal",
                "complaint": "Seasonal viral fever and mild body ache",
                "diagnosis": "Acute Viral URI (Resolved)",
                "rx": "Paracetamol 650mg TDS x 3 days\nCetirizine 10mg OD x 3 days",
                "tests": "Complete Blood Count (CBC)",
                "bill_status": "Paid",
                "bill_amount": 800.0,
                "bill_paid": 800.0
            },
            {
                "name": "Mahesh Sharma",
                "username": "mahesh",
                "password": "mahesh@123",
                "email": "maimahesh1192@gmail.com",
                "mobile": "9876543202",
                "age": 52,
                "gender": "Male",
                "uhid": "PAT-20260926-00002",
                "status": "Completed",
                "triage": "Normal",
                "complaint": "Type 2 Diabetes routine follow-up and mild joint stiffness",
                "diagnosis": "Type 2 Diabetes Mellitus - Controlled",
                "rx": "Metformin 500mg BD after meals\nCalcium + Vitamin D3 OD",
                "tests": "HbA1c Glycated Hemoglobin, Lipid Profile",
                "bill_status": "Paid",
                "bill_amount": 1200.0,
                "bill_paid": 1200.0
            },
            {
                "name": "Yashvi",
                "username": "yashvi",
                "password": "yashvi@123",
                "email": "yashviii1289@gmail.com",
                "mobile": "9876543203",
                "age": 22,
                "gender": "Female",
                "uhid": "PAT-20260926-00003",
                "status": "Waiting",
                "triage": "Normal",
                "complaint": "Severe sore throat, difficulty swallowing, and dry cough",
                "diagnosis": None,
                "rx": None,
                "tests": None,
                "bill_status": None,
                "bill_amount": 0.0,
                "bill_paid": 0.0
            },
            {
                "name": "Pari",
                "username": "pari",
                "password": "pari@123",
                "email": "pari43093@gmail.com",
                "mobile": "9876543204",
                "age": 19,
                "gender": "Female",
                "uhid": "PAT-20260926-00004",
                "status": "Waiting",
                "triage": "Critical",
                "complaint": "CRITICAL: Acute chest heaviness, severe shortness of breath & dizziness",
                "diagnosis": None,
                "rx": None,
                "tests": "ECG, Serum Troponin I",
                "bill_status": None,
                "bill_amount": 0.0,
                "bill_paid": 0.0
            },
            {
                "name": "Rohit",
                "username": "rohit",
                "password": "rohit@123",
                "email": "mailrohitkumar002@gmail.com",
                "mobile": "9876543205",
                "age": 30,
                "gender": "Male",
                "uhid": "PAT-20260926-00005",
                "status": "Completed",
                "triage": "Normal",
                "complaint": "Severe migraine and tension headache since 2 days",
                "diagnosis": "Acute Migraine without Aura",
                "rx": "Naproxen 500mg SOS with food\nDomperidone 10mg BD before food",
                "tests": "Fundoscopy OPD",
                "bill_status": "Pending",
                "bill_amount": 750.0,
                "bill_paid": 0.0
            }
        ]

        print("[2/5] Creating / updating 5 real patient records...")
        token_counter = 101
        for rp in real_patients:
            # Check or create patient
            patient = db.query(models.Patient).filter(
                (models.Patient.email == rp["email"]) |
                (models.Patient.mobile_number == rp["mobile"]) |
                (models.Patient.patient_id == rp["uhid"])
            ).first()

            if not patient:
                patient = models.Patient(
                    patient_id=rp["uhid"],
                    name=rp["name"],
                    age=rp["age"],
                    gender=rp["gender"],
                    mobile_number=rp["mobile"],
                    email=rp["email"],
                    address="Green Park, New Delhi",
                    is_active=True
                )
                db.add(patient)
                db.commit()
                db.refresh(patient)
            else:
                patient.name = rp["name"]
                patient.age = rp["age"]
                patient.gender = rp["gender"]
                patient.email = rp["email"]
                patient.mobile_number = rp["mobile"]
                patient.is_active = True
                db.commit()

            # Create User login for patient by username, email, and uhid
            # 1. username login: rp["username"]
            u1 = db.query(models.User).filter(models.User.username == rp["username"]).first()
            if not u1:
                u1 = models.User(
                    username=rp["username"],
                    password_hash=auth.get_password_hash(rp["password"]),
                    role="Patient",
                    name=rp["name"]
                )
                db.add(u1)
            else:
                u1.password_hash = auth.get_password_hash(rp["password"])
                u1.role = "Patient"
                u1.name = rp["name"]

            # 2. email login: rp["email"]
            u2 = db.query(models.User).filter(models.User.username == rp["email"]).first()
            if not u2:
                u2 = models.User(
                    username=rp["email"],
                    password_hash=auth.get_password_hash(rp["password"]),
                    role="Patient",
                    name=rp["name"]
                )
                db.add(u2)
            else:
                u2.password_hash = auth.get_password_hash(rp["password"])

            # 3. UHID login: rp["uhid"]
            u3 = db.query(models.User).filter(models.User.username == rp["uhid"]).first()
            if not u3:
                u3 = models.User(
                    username=rp["uhid"],
                    password_hash=auth.get_password_hash(rp["password"]),
                    role="Patient",
                    name=rp["name"]
                )
                db.add(u3)
            else:
                u3.password_hash = auth.get_password_hash(rp["password"])

            db.commit()

            # Create / refresh a clean active Visit
            visit = db.query(models.Visit).filter(
                models.Visit.patient_id == patient.id,
                models.Visit.is_active == True
            ).first()

            if not visit:
                visit_id = f"VIS-20260926-{patient.id:05d}"
                visit = models.Visit(
                    visit_id=visit_id,
                    patient_id=patient.id,
                    doctor_id=doc_id,
                    token_number=token_counter,
                    visit_date=datetime.datetime.utcnow(),
                    reason=rp["complaint"],
                    chief_complaints=rp["complaint"],
                    diagnosis=rp["diagnosis"],
                    medicines_list=rp["rx"],
                    tests_list=rp["tests"],
                    advice="Drink plenty of warm fluids, light nutritious diet, and get adequate rest.",
                    follow_up_date="After 5 days" if rp["status"] == "Completed" else None,
                    patient_summary=f"Patient {rp['name']} visited OPD for {rp['complaint']}.",
                    status=rp["status"],
                    triage_severity=rp["triage"],
                    is_active=True
                )
                db.add(visit)
                db.commit()
                db.refresh(visit)
            else:
                visit.status = rp["status"]
                visit.triage_severity = rp["triage"]
                visit.chief_complaints = rp["complaint"]
                visit.diagnosis = rp["diagnosis"]
                visit.medicines_list = rp["rx"]
                visit.tests_list = rp["tests"]
                db.commit()

            token_counter += 1

            # Create Bill if completed
            if rp["bill_status"]:
                bill = db.query(models.Bill).filter(models.Bill.visit_id == visit.id).first()
                if not bill:
                    b_id = f"BILL-20260926-{visit.id:05d}"
                    bill = models.Bill(
                        bill_id=b_id,
                        visit_id=visit.id,
                        grand_total=rp["bill_amount"],
                        advance_applied=0.0,
                        payment_status=rp["bill_status"],
                        balance_amount=rp["bill_amount"] - rp["bill_paid"],
                        created_by=admin_id,
                        is_active=True
                    )
                    db.add(bill)
                    db.commit()
                    db.refresh(bill)

                    # Add doctor consultation bill item
                    b_item = models.BillItem(
                        bill_id=bill.id,
                        service_id=1,
                        service_name="Doctor Consultation Fee",
                        amount=rp["bill_amount"]
                    )
                    db.add(b_item)
                    db.commit()

                    # Add payment record if paid
                    if rp["bill_paid"] > 0:
                        payment = models.Payment(
                            payment_id=f"PAY-20260926-{bill.id:05d}",
                            bill_id=bill.id,
                            visit_id=visit.id,
                            payment_type="Full",
                            payment_method="UPI",
                            amount_paid=rp["bill_paid"],
                            transaction_reference=f"UPI{datetime.datetime.utcnow().strftime('%y%m%d%H%M%S')}",
                            recorded_by=admin_id,
                            payment_date=datetime.datetime.utcnow()
                        )
                        db.add(payment)
                        db.commit()
                else:
                    bill.payment_status = rp["bill_status"]
                    bill.balance_amount = rp["bill_amount"] - rp["bill_paid"]
                    db.commit()

        print("[3/5] Cleaning up orphan visits...")
        # Keep clean list of active patients
        valid_patient_ids = [p.id for p in db.query(models.Patient).all()]
        db.query(models.Visit).filter(~models.Visit.patient_id.in_(valid_patient_ids)).delete(synchronize_session=False)
        db.commit()

        print("=== DATABASE CLEANUP & SEEDING COMPLETED SUCCESSFULLY! ===")
        print("Active Patients:")
        for p in db.query(models.Patient).all():
            v = db.query(models.Visit).filter(models.Visit.patient_id == p.id).first()
            print(f" -> {p.name} ({p.patient_id}) | Mobile: {p.mobile_number} | Email: {p.email} | Status: {v.status if v else 'No Visit'} | Triage: {v.triage_severity if v else '-'}")

    finally:
        db.close()

if __name__ == "__main__":
    run()
