import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text, Numeric
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Admin, Receptionist, Accountant
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    bills_created = relationship("Bill", back_populates="creator")
    payments_recorded = relationship("Payment", back_populates="recorder")
    refunds_handled = relationship("Refund", back_populates="handler")
    audit_logs = relationship("AuditLog", back_populates="user")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, unique=True, index=True, nullable=False) # PAT-YYYYMMDD-XXXXX
    name = Column(String, index=True, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    mobile_number = Column(String, index=True, nullable=False)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    visits = relationship("Visit", back_populates="patient")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    degree = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(String, unique=True, index=True, nullable=False) # VIS-YYYYMMDD-XXXXX
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    visit_date = Column(DateTime, default=datetime.datetime.utcnow)
    reason = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="visits")
    bills = relationship("Bill", back_populates="visit")
    payments = relationship("Payment", back_populates="visit")
    doctor = relationship("Doctor", backref="visits")



class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False)  # Doctor Consultation, OPD Charges, IPD Charges, ICU Charges, Laboratory Tests, Radiology/X-Ray/MRI, Pharmacy/Medicines, Other Hospital Services
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(String, unique=True, index=True, nullable=False) # BILL-YYYYMMDD-XXXXX
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False)
    grand_total = Column(Float, default=0.0, nullable=False)
    advance_applied = Column(Float, default=0.0, nullable=False)
    payment_status = Column(String, default="Pending", nullable=False)  # Paid, Pending, Partial Paid
    balance_amount = Column(Float, default=0.0, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    visit = relationship("Visit", back_populates="bills")
    creator = relationship("User", back_populates="bills_created")
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="bill")


class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=True) # Nullable if custom item
    service_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)

    # Relationships
    bill = relationship("Bill", back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String, unique=True, index=True, nullable=False) # PAY-YYYYMMDD-XXXXX
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)  # Populated for Advance payments
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)    # Populated for Bill payments
    amount_paid = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)  # Cash, UPI, Card, Net Banking, Wallet
    payment_type = Column(String, nullable=False)    # Advance, Partial, Full, Refund
    transaction_reference = Column(String, nullable=True) # e.g. UPI Ref ID, Card Txn ID
    payment_date = Column(DateTime, default=datetime.datetime.utcnow)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relationships
    visit = relationship("Visit", back_populates="payments")
    bill = relationship("Bill", back_populates="payments")
    recorder = relationship("User", back_populates="payments_recorded")
    receipts = relationship("Receipt", back_populates="payment", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="payment")


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    receipt_id = Column(String, unique=True, index=True, nullable=False) # REC-YYYYMMDD-XXXXX
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    receipt_type = Column(String, nullable=False)  # OPD, Lab, Advance Payment, Final Settlement, Refund Receipt
    pdf_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    payment = relationship("Payment", back_populates="receipts")


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    refund_id = Column(String, unique=True, index=True, nullable=False) # REF-YYYYMMDD-XXXXX
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    amount_refunded = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    refund_date = Column(DateTime, default=datetime.datetime.utcnow)
    handled_by = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    payment = relationship("Payment", back_populates="refunds")
    handler = relationship("User", back_populates="refunds_handled")


class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable if system log
    action = Column(String, nullable=False)  # e.g., CREATE_PATIENT, UPDATE_SETTINGS
    target_table = Column(String, nullable=False)
    target_id = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
