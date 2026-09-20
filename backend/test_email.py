"""
Quick test: Send a sample prescription email to verify SMTP is working.
Run from the project root: python backend/test_email.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# Load .env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

from email_service import send_prescription_email, send_invoice_email

print("[TEST] Testing SMTP connection and email delivery...")
print(f"   Sending FROM: {os.getenv('SMTP_USER')}")
print(f"   Sending TO:   {os.getenv('SMTP_USER')}  (self-test)\n")

# Test 1: Prescription email
result1 = send_prescription_email(
    patient_name="Aarav Sharma",
    patient_email=os.getenv("SMTP_USER"),       # send to yourself for testing
    doctor_name="Dr. Shweta Grover",
    hospital_name="Vedam Diagnostics",
    diagnosis="Acute Viral Pharyngitis with mild fever",
    medicines="1. Paracetamol 500mg — BD (Morning & Night) x 5 days\n2. Azithromycin 250mg — OD (Morning) x 3 days\n3. Cetirizine 10mg — OD (Night) x 5 days",
    advice="Drink warm water. Avoid cold foods. Rest for 2 days. No school for 3 days.",
    follow_up_date="2026-09-28",                # 7 days from now — generates .ics
    language_summary="🌅 Subah: Paracetamol aur Azithromycin khana khane ke baad lein.\n🌞 Dopahar: Paani peete rahein, aaram karein.\n🌙 Raat: Cetirizine aur Paracetamol raat ko lein.\n⚠️ Dhyan Rakhein: Gardan mein dard badhne par wapas doctor ke paas jayein.",
)

print("[OK] Prescription email sent!" if result1 else "[FAIL] Prescription email FAILED")

print()

# Test 2: Invoice email
result2 = send_invoice_email(
    patient_name="Aarav Sharma",
    patient_email=os.getenv("SMTP_USER"),
    hospital_name="Vedam Diagnostics",
    bill_id="BILL-20260921-00001",
    total_amount=1200.0,
    paid_amount=900.0,
    balance_due=300.0,
    payment_status="Partial Paid",
)

print("[OK] Invoice email sent!" if result2 else "[FAIL] Invoice email FAILED")
