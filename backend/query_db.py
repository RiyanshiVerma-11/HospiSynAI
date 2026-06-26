import os
import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import models

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/hospisyn"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("--- POSTGRES DATABASES ---")
from sqlalchemy import text
try:
    dbs = db.execute(text("SELECT datname FROM pg_database WHERE datistemplate = false")).fetchall()
    for row in dbs:
        print(row[0])
except Exception as dberr:
    print("Error querying database list:", dberr)

# Inspect postgres db
print("\n--- TABLES IN 'postgres' DB ---")
try:
    pg_url = DATABASE_URL.replace("/hospisyn", "/postgres")
    pg_engine = create_engine(pg_url)
    with pg_engine.connect() as conn:
        tables = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).fetchall()
        for t in tables:
            print(t[0])
except Exception as pgerr:
    print("Error inspecting postgres database:", pgerr)

print("\n--- PATIENTS ---")
patients = db.query(models.Patient).all()
for p in patients:
    print(f"ID: {p.id}, PatientID: {p.patient_id}, Name: {p.name}, Mobile: {p.mobile_number}, Active: {p.is_active}, DeletedAt: {p.deleted_at}")

print("\n--- SETTINGS ---")
settings = db.query(models.Setting).all()
for s in settings:
    print(f"Key: {s.key}, Value: {s.value}")

print("\n--- DOCTORS ---")
doctors = db.query(models.Doctor).all()
for d in doctors:
    print(f"ID: {d.id}, Name: {d.name}, Degree: {d.degree}, Active: {d.is_active}")

print("\n--- VISITS ---")
visits = db.query(models.Visit).all()
for v in visits:
    print(f"ID: {v.id}, VisitID: {v.visit_id}, PatientID: {v.patient_id}, DoctorID: {v.doctor_id}, Active: {v.is_active}, DeletedAt: {v.deleted_at}")

print("\n--- BILLS ---")
bills = db.query(models.Bill).all()
for b in bills:
    print(f"ID: {b.id}, BillID: {b.bill_id}, Total: {b.grand_total}, Active: {b.is_active}, DeletedAt: {b.deleted_at}")

print("\n--- PAYMENTS ---")
payments = db.query(models.Payment).all()
for pay in payments:
    print(f"ID: {pay.id}, PayID: {pay.payment_id}, BillID: {pay.bill_id}, VisitID: {pay.visit_id}, Amount: {pay.amount_paid}, Type: {pay.payment_type}, Active: {pay.is_active}, DeletedAt: {pay.deleted_at}")

print("\n--- RECEIPTS ---")
receipts = db.query(models.Receipt).all()
for r in receipts:
    print(f"ID: {r.id}, ReceiptID: {r.receipt_id}, PayID: {r.payment_id}, Type: {r.receipt_type}, Path: {r.pdf_path}")

print("\n--- REFUNDS ---")
refunds = db.query(models.Refund).all()
for ref in refunds:
    print(f"ID: {ref.id}, RefundID: {ref.refund_id}, PayID: {ref.payment_id}, Amount: {ref.amount_refunded}, Reason: {ref.reason}")

print("\n--- USERS ---")
users = db.query(models.User).all()
for u in users:
    print(f"ID: {u.id}, Username: {u.username}, Role: {u.role}, Name: {u.name}")

print("\n--- BILL ITEMS ---")
items = db.query(models.BillItem).all()
for item in items:
    print(f"ID: {item.id}, BillID: {item.bill_id}, Service: {item.service_name}, Amount: {item.amount}")

print("\n--- AUDIT LOGS ---")
logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(30).all()
for log in logs:
    print(f"Time: {log.created_at}, UserID: {log.user_id}, Action: {log.action}, TargetTable: {log.target_table}, TargetID: {log.target_id}, Details: {log.details}")

print("\n--- FILES IN /app/receipts ---")
import glob
receipts_dir = "/app/receipts"
if os.path.exists(receipts_dir):
    files = glob.glob(os.path.join(receipts_dir, "*"))
    for f in files:
        print(f"{os.path.basename(f)} - Size: {os.path.getsize(f)} bytes, Modified: {datetime.datetime.fromtimestamp(os.path.getmtime(f))}")
else:
    print("/app/receipts does not exist")

print("\n--- FILES IN ./receipts (local) ---")
local_receipts_dir = "./receipts"
if os.path.exists(local_receipts_dir):
    files = glob.glob(os.path.join(local_receipts_dir, "*"))
    for f in files:
        print(f"{os.path.basename(f)} - Size: {os.path.getsize(f)} bytes, Modified: {datetime.datetime.fromtimestamp(os.path.getmtime(f))}")
else:
    print("./receipts does not exist")

db.close()

