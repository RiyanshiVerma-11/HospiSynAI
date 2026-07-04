import os
import sys
import pytest
from typing import List

# Add current folder to sys.path so we can import from backend
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

import auth
import schemas
from main import run_local_anomaly_checks

def test_password_hashing():
    """Verify password hashing and verification functionality."""
    password = "mySecretPassword123"
    hashed = auth.get_password_hash(password)
    
    assert hashed != password
    assert auth.verify_password(password, hashed) is True
    assert auth.verify_password("wrongPassword", hashed) is False

def test_jwt_generation():
    """Verify JWT access token generation and validation headers."""
    data = {"sub": "testuser", "role": "Admin"}
    token = auth.create_access_token(data)
    
    assert token is not None
    assert isinstance(token, str)

class MockBillItemAnomaly:
    def __init__(self, service_name: str, amount: float):
        self.service_name = service_name
        self.amount = amount

def test_anomaly_check_duplicate_billing():
    """Verify that duplicate billing items are flagged."""
    items = [
        MockBillItemAnomaly("Complete Blood Count (CBC)", 350.0),
        MockBillItemAnomaly("Complete Blood Count (CBC)", 350.0),
        MockBillItemAnomaly("Doctor Consultation", 500.0)
    ]
    issues = run_local_anomaly_checks(items, patient_age=35, patient_gender="Male", diagnosis="Fever")
    assert any("Duplicate Billing" in issue for issue in issues)

def test_anomaly_check_icu_opd_mismatch():
    """Verify that clinically unlikely combinations like ICU Bed + OPD Consult are flagged."""
    items = [
        MockBillItemAnomaly("ICU Bed rent per day", 6000.0),
        MockBillItemAnomaly("Physician Consultation OPD fee", 500.0)
    ]
    issues = run_local_anomaly_checks(items, patient_age=45, patient_gender="Female", diagnosis="Sepsis")
    assert any("ICU Bed Charges and OPD Consultation/Registration" in issue for issue in issues)

def test_anomaly_check_room_rent_gst():
    """Verify that room rent exceeding 5000 INR daily flags GST compliance requirements."""
    items_normal = [
        MockBillItemAnomaly("AC Room Rent General Ward", 4500.0),
        MockBillItemAnomaly("Doctor Consultation", 500.0)
    ]
    issues_normal = run_local_anomaly_checks(items_normal, patient_age=30, patient_gender="Male", diagnosis="Pneumonia")
    assert not any("GST Compliance: Non-ICU AC Room Rent" in issue for issue in issues_normal)

    items_high = [
        MockBillItemAnomaly("AC Deluxe Room Rent", 5500.0),
        MockBillItemAnomaly("Doctor Consultation", 500.0)
    ]
    issues_high = run_local_anomaly_checks(items_high, patient_age=30, patient_gender="Male", diagnosis="Pneumonia")
    assert any("GST Compliance: Non-ICU AC Room Rent" in issue for issue in issues_high)

def test_anomaly_check_cosmetic_surgery_gst():
    """Verify 18% GST warning on cosmetic procedures unless reconstructive diagnosis exists."""
    # Scenario A: Cosmetic surgery with general diagnosis (needs 18% GST alert)
    items = [
        MockBillItemAnomaly("Cosmetic rhinoplasty", 15000.0)
    ]
    issues_cosmetic = run_local_anomaly_checks(items, patient_age=25, patient_gender="Female", diagnosis="Aesthetic request")
    assert any("attracts 18% GST unless clinically certified" in issue for issue in issues_cosmetic)

    # Scenario B: Cosmetic surgery with accident/injury reconstruction (GST Exempt)
    issues_exempt = run_local_anomaly_checks(items, patient_age=25, patient_gender="Female", diagnosis="Trauma nasal fracture reconstruction")
    assert any("is GST exempt due to reconstructive diagnosis" in issue for issue in issues_exempt)

def test_anomaly_check_missing_consultation_fee():
    """Verify warning when lab/diagnostic items are billed without a consultation fee."""
    items_only_lab = [
        MockBillItemAnomaly("Blood Sugar Test", 120.0),
        MockBillItemAnomaly("Lipid Profile Test", 850.0)
    ]
    issues = run_local_anomaly_checks(items_only_lab, patient_age=50, patient_gender="Male", diagnosis="Diabetes")
    assert any("Diagnostic/lab tests are billed without any Doctor Consultation" in issue for issue in issues)

def test_anomaly_check_pediatric_warning():
    """Verify that prescribing adult tablets to pediatric patients (< 12 years) triggers clinical safety alerts."""
    # Scenario A: Pediatric patient (Age 8) billed for adult tablets
    items_adult = [
        MockBillItemAnomaly("Augmentin 625mg tablet", 250.0),
        MockBillItemAnomaly("Doctor Consultation", 500.0)
    ]
    issues_pediatric = run_local_anomaly_checks(items_adult, patient_age=8, patient_gender="Male", diagnosis="Tonsillitis")
    assert any("Pediatric patient (Age 8) billed for adult tablet formulation" in issue for issue in issues_pediatric)

    # Scenario B: Pediatric patient (Age 8) billed for pediatric syrup (should not trigger warning)
    items_pediatric = [
        MockBillItemAnomaly("Augmentin Oral Suspension syrup", 180.0),
        MockBillItemAnomaly("Doctor Consultation", 500.0)
    ]
    issues_pediatric_ok = run_local_anomaly_checks(items_pediatric, patient_age=8, patient_gender="Male", diagnosis="Tonsillitis")
    assert not any("billed for adult tablet formulation" in issue for issue in issues_pediatric_ok)


def test_jwt_role_security_restrictions():
    """Verify role authorization checks fail with 403 Forbidden for unauthorized users."""
    from fastapi import HTTPException
    import models

    # Instantiate a RoleChecker for Admin role only
    checker = auth.RoleChecker(["Admin"])

    # Mock user objects
    admin_user = models.User(username="admin", role="Admin", name="Admin User")
    receptionist_user = models.User(username="recep", role="Receptionist", name="Receptionist User")

    # Admin checker should allow Admin user (should pass without exception)
    checker(admin_user)

    # Admin checker should block Receptionist user with 403
    with pytest.raises(HTTPException) as exc_info:
        checker(receptionist_user)
    assert exc_info.value.status_code == 403
    assert "not authorized to access this resource" in exc_info.value.detail


def test_mocked_ai_suggestions():
    """Verify that clinical AI suggestion response payload matches the schema structure."""
    raw_payload = {
        "diagnosis": "Acute Pharyngitis",
        "medicines_list": "1. Azee 500mg - OD AC for 3 Days\n2. Dolo 650mg - TID PC SOS for 3 Days",
        "tests_list": "1. Throat swab culture",
        "advice": "1. Warm saline gargles",
        "follow_up_date": "Review in 3 days"
    }

    # Validate output parsing into Pydantic model
    suggest = schemas.AISuggestResponse(
        diagnosis=raw_payload["diagnosis"],
        medicines_list=raw_payload["medicines_list"],
        tests_list=raw_payload["tests_list"],
        advice=raw_payload["advice"],
        follow_up_date=raw_payload["follow_up_date"]
    )

    assert suggest.diagnosis == "Acute Pharyngitis"
    assert "Azee 500mg" in suggest.medicines_list
    assert "Throat swab" in suggest.tests_list
    assert suggest.advice == "1. Warm saline gargles"
    assert suggest.follow_up_date == "Review in 3 days"
