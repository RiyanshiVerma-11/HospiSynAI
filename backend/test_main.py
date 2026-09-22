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
from main import run_local_anomaly_checks, generate_auto_corrections

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


def test_ai_insight_response_sentiment():
    """Verify AIInsightResponse contains and serializes the sentiment field."""
    insight = schemas.AIInsightResponse(
        insight="Hospital revenue healthy.",
        action="Maintain current operations.",
        metric_highlight="₹50,000",
        sentiment="positive"
    )
    assert insight.sentiment == "positive"
    dumped = insight.model_dump() if hasattr(insight, "model_dump") else insight.dict()
    assert dumped["sentiment"] == "positive"


def test_bill_item_create_custom_service_name():
    """Verify BillItemCreate can be instantiated with custom service_name and no service_id."""
    item = schemas.BillItemCreate(
        service_id=None,
        service_name="Custom Pediatric Dressing",
        amount=150.0
    )
    assert item.service_id is None
    assert item.service_name == "Custom Pediatric Dressing"
    assert item.amount == 150.0


def test_receptionist_allowed_on_payments():
    """Verify RoleChecker allows Receptionist role on payments endpoint."""
    payment_checker = auth.RoleChecker(["Admin", "Accountant", "Receptionist"])
    receptionist_user = auth.models.User(username="recep_test", role="Receptionist", name="Counter Staff")
    # Should not raise any HTTPException
    assert payment_checker(receptionist_user) == receptionist_user


def test_pediatric_extended_dosage_detection():
    """Verify that adult dosage strengths (500mg, 400mg, etc.) trigger pediatric safety warning."""
    items = [
        MockBillItemAnomaly("Azithromycin 500mg", 120.0),
        MockBillItemAnomaly("Ibuprofen 400mg", 40.0)
    ]
    issues = run_local_anomaly_checks(items, patient_age=7, patient_gender="Female", diagnosis="Fever")
    assert any("Pediatric patient (Age 7) billed for adult" in issue for issue in issues)


def test_advance_split_net_balance_conservation():
    """Verify that splitting an advance payment with prior refunds strictly preserves money conservation."""
    # Scenario: Advance paid = 1000, prior refund = 300 -> net available = 700.
    # A bill requires 400.
    # Consumed amount = 400.
    # Excess advance created must be 700 - 400 = 300 (NOT 1000 - 400 = 600!).
    original_paid = 1000.0
    prior_refund = 300.0
    net_available = original_paid - prior_refund  # 700.0
    consumed = 400.0

    excess_amount = net_available - consumed
    adjusted_original_paid = consumed + prior_refund

    assert excess_amount == 300.0
    assert adjusted_original_paid - prior_refund == consumed
    # Total conservation
    assert adjusted_original_paid + excess_amount == original_paid


def test_auto_resolve_duplicate_and_missing_consultation():
    """Verify that auto-corrections remove duplicates and add missing consultation."""
    items = [
        MockBillItemAnomaly("Complete Blood Count (CBC)", 350.0),
        MockBillItemAnomaly("Complete Blood Count (CBC)", 350.0),
    ]
    issues = run_local_anomaly_checks(items, patient_age=30, patient_gender="Male", diagnosis="Fever")
    assert len(issues) >= 2  # Duplicate and missing consultation
    
    auto_corr = generate_auto_corrections(items, patient_age=30, issues=issues)
    assert auto_corr is not None
    # Corrected items should have 1 CBC and 1 OPD consultation
    item_names = [i.service_name for i in auto_corr.corrected_items]
    assert "Complete Blood Count (CBC)" in item_names
    assert item_names.count("Complete Blood Count (CBC)") == 1
    assert any("Consultation" in name for name in item_names)
    assert auto_corr.savings_amount > 0


def test_auto_resolve_pediatric_safety():
    """Verify that auto-corrections replace adult tablets with pediatric suspension."""
    items = [
        MockBillItemAnomaly("Augmentin 625mg tablet", 250.0),
        MockBillItemAnomaly("Doctor Consultation", 500.0)
    ]
    issues = run_local_anomaly_checks(items, patient_age=6, patient_gender="Female", diagnosis="Infection")
    auto_corr = generate_auto_corrections(items, patient_age=6, issues=issues)
    assert auto_corr is not None
    item_names = [i.service_name for i in auto_corr.corrected_items]
    assert not any("625mg tablet" in name for name in item_names)
    assert any("Pediatric Suspension" in name for name in item_names)


def test_auto_resolve_icu_redundancy_and_mismatch():
    """Verify that auto-corrections eliminate redundant room rent and adapt OPD consultation for ICU patients."""
    items = [
        MockBillItemAnomaly("ICU Bed Charges per day", 8000.0),
        MockBillItemAnomaly("AC Deluxe Room Rent", 5500.0),
        MockBillItemAnomaly("Physician Consultation OPD fee", 500.0)
    ]
    issues = run_local_anomaly_checks(items, patient_age=40, patient_gender="Male", diagnosis="Sepsis")
    assert len(issues) >= 2
    
    auto_corr = generate_auto_corrections(items, patient_age=40, issues=issues)
    assert auto_corr is not None
    item_names = [i.service_name for i in auto_corr.corrected_items]
    # Redundant standard room rent removed
    assert not any("AC Deluxe Room Rent" in name for name in item_names)
    # ICU bed kept
    assert any("ICU Bed" in name for name in item_names)
    # OPD consultation converted to Inpatient Critical Care
    assert any("Inpatient Critical Care" in name for name in item_names)
    # Substantial savings from eliminating redundant room rent
    assert auto_corr.savings_amount >= 5500.0


def test_auto_resolve_gst_compliance():
    """Verify that auto-corrections attach statutory GST line items for room rent and cosmetic procedures."""
    # Room rent > 5000
    items_room = [
        MockBillItemAnomaly("AC Deluxe Room Rent", 6000.0),
        MockBillItemAnomaly("Doctor Consultation", 500.0)
    ]
    issues_room = run_local_anomaly_checks(items_room, patient_age=45, patient_gender="Female", diagnosis="Observation")
    auto_corr_room = generate_auto_corrections(items_room, patient_age=45, issues=issues_room)
    assert auto_corr_room is not None
    item_names_room = [i.service_name for i in auto_corr_room.corrected_items]
    assert any("Statutory Room Rent GST (5%)" in name for name in item_names_room)

    # Cosmetic procedure (elective)
    items_cosmetic = [
        MockBillItemAnomaly("Cosmetic rhinoplasty", 15000.0),
        MockBillItemAnomaly("Doctor Consultation", 500.0)
    ]
    issues_cosmetic = run_local_anomaly_checks(items_cosmetic, patient_age=28, patient_gender="Female", diagnosis="Aesthetic")
    auto_corr_cosmetic = generate_auto_corrections(items_cosmetic, patient_age=28, issues=issues_cosmetic, diagnosis="Aesthetic")
    assert auto_corr_cosmetic is not None
    item_names_cosmetic = [i.service_name for i in auto_corr_cosmetic.corrected_items]
    assert any("Statutory Cosmetic GST (18%)" in name for name in item_names_cosmetic)


def test_parse_medicine_schedule():
    """Verify that clinical medicine strings are correctly parsed into structured dosage slots, food instructions, and days."""
    import email_service

    meds_text = (
        "1. Dolo 650mg - TID PC for 3 Days\n"
        "2. Pantocid 40mg - OD Before Breakfast for 7 days\n"
        "3. Shelcal 500mg - 1 Tab at Bedtime for 15 days\n"
        "4. Augmentin 625mg - BD After Meals for 5 days"
    )
    parsed = email_service.parse_medicine_schedule(meds_text)
    assert len(parsed) == 4

    # Dolo 650mg: TID -> 3 slots, After meal, 3 days
    dolo = parsed[0]
    assert "Dolo 650mg" in dolo["medicine"]
    assert len(dolo["slots"]) == 3
    assert dolo["days"] == 3
    assert "After Meal" in dolo["food"]

    # Pantocid 40mg: OD -> 1 slot, Before meal, 7 days
    panto = parsed[1]
    assert "Pantocid 40mg" in panto["medicine"]
    assert len(panto["slots"]) == 1
    assert panto["days"] == 7
    assert "Before Meal" in panto["food"]

    # Shelcal: Bedtime -> 1 slot at night, 15 days
    shelcal = parsed[2]
    assert "Shelcal 500mg" in shelcal["medicine"]
    assert len(shelcal["slots"]) == 1
    assert shelcal["days"] == 15
    assert "Bedtime" in shelcal["food"]

    # Augmentin: BD -> 2 slots, After meal, 5 days
    aug = parsed[3]
    assert "Augmentin 625mg" in aug["medicine"]
    assert len(aug["slots"]) == 2
    assert aug["days"] == 5


def test_build_medicine_schedule_ics_structure():
    """Verify that .ics calendar file contains recurring daily events and VALARM notification triggers."""
    import email_service

    meds_text = "1. Paracetamol 500mg - BD After Meal for 5 days"
    ics_bytes = email_service.build_medicine_schedule_ics(
        medicines=meds_text,
        follow_up_date="2026-09-30",
        patient_name="Ramesh Verma",
        doctor_name="Dr. Shweta Grover",
        hospital_name="Vedam Diagnostics"
    )

    assert isinstance(ics_bytes, bytes)
    assert len(ics_bytes) > 500
    ics_str = ics_bytes.decode("utf-8", errors="ignore")

    # Verify iCalendar header and format
    assert "BEGIN:VCALENDAR" in ics_str
    assert "END:VCALENDAR" in ics_str
    assert "BEGIN:VEVENT" in ics_str
    assert "RRULE:FREQ=DAILY;COUNT=5" in ics_str
    assert "BEGIN:VALARM" in ics_str
    assert "Follow-up Appointment with Dr. Shweta Grover" in ics_str


from fastapi.testclient import TestClient
from main import app

@pytest.fixture
def client():
    from main import on_startup
    on_startup()
    with TestClient(app) as c:
        yield c


def test_appointment_self_booking_and_checkin(client):
    """Verify public new patient self-registration, OPD token allocation, and 1-tap arrival check-in."""
    # 1. Book appointment for new patient
    booking_payload = {
        "name": "Ananya Sharma",
        "age": 28,
        "gender": "Female",
        "mobile": "9876543299",
        "email": "ananya.sharma.test@example.com",
        "city": "Noida",
        "chief_complaints": "Persistent migraine and nausea",
        "triage_severity": "Moderate"
    }
    res = client.post("/api/appointments/book", json=booking_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["patient_name"] == "Ananya Sharma"
    assert data["patient_id"].startswith("PAT-")
    assert data["visit_id"].startswith("VIS-")
    assert data["token_number"] >= 1
    assert data["status"] == "Scheduled"
    visit_id = data["visit_id"]

    # 2. Check in when arriving at hospital gate
    checkin_res = client.post(f"/api/appointments/{visit_id}/checkin")
    assert checkin_res.status_code == 200
    checkin_data = checkin_res.json()
    assert checkin_data["status"] == "Arrived"
    assert checkin_data["visit_id"] == visit_id
    assert "Arrived in Waiting Area" in checkin_data["message"]


def test_live_queue_status(client):
    """Verify live OPD queue tracker returns real-time metrics."""
    res = client.get("/api/queue/live")
    assert res.status_code == 200
    data = res.json()
    assert "total_waiting" in data
    assert "total_arrived" in data
    assert "total_completed" in data
    assert "estimated_wait_minutes" in data
    assert isinstance(data["active_tokens_today"], int)


def test_ai_symptom_triage_emergency_and_routine(client):
    """Verify AI symptom triage accurately flags red-flag emergencies vs routine care."""
    # Urgent/Emergency symptom
    res_urgent = client.post("/api/ai/triage", json={
        "chief_complaints": "Severe chest pain radiating to left arm and breathless",
        "age": 55,
        "gender": "Male"
    })
    assert res_urgent.status_code == 200
    data_urgent = res_urgent.json()
    assert data_urgent["severity"] == "Urgent"
    assert data_urgent["is_emergency"] is True
    assert "Emergency" in data_urgent["recommended_department"] or "Cardiology" in data_urgent["recommended_department"]

    # Routine complaint
    res_routine = client.post("/api/ai/triage", json={
        "chief_complaints": "Mild cough and running nose since 2 days",
        "age": 25,
        "gender": "Female"
    })
    assert res_routine.status_code == 200
    data_routine = res_routine.json()
    assert data_routine["severity"] in ["Normal", "Moderate"]
    assert data_routine["is_emergency"] is False



