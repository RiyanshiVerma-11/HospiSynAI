from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    name: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


# User Schemas
class UserBase(BaseModel):
    username: str
    role: str
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# Patient Schemas
class PatientBase(BaseModel):
    name: str
    age: int
    gender: str
    mobile_number: str
    address: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    patient_id: str
    created_at: datetime
    is_active: bool

    class Config:
        orm_mode = True


# Doctor Schemas
class DoctorBase(BaseModel):
    name: str
    degree: str

class DoctorCreate(DoctorBase):
    pass

class DoctorResponse(DoctorBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True


# Visit Schemas
class VisitBase(BaseModel):
    reason: Optional[str] = None
    diagnosis: Optional[str] = None
    chief_complaints: Optional[str] = None
    medicines_list: Optional[str] = None
    tests_list: Optional[str] = None
    advice: Optional[str] = None
    follow_up_date: Optional[str] = None
    patient_summary: Optional[str] = None

class VisitSummaryUpdate(BaseModel):
    diagnosis: Optional[str] = None
    chief_complaints: Optional[str] = None
    medicines_list: Optional[str] = None
    tests_list: Optional[str] = None
    advice: Optional[str] = None
    follow_up_date: Optional[str] = None
    patient_summary: Optional[str] = None

class VisitCreate(VisitBase):
    patient_id: int
    doctor_id: Optional[int] = None

class VisitResponse(VisitBase):
    id: int
    visit_id: str
    patient_id: int
    doctor_id: Optional[int] = None
    visit_date: datetime
    is_active: bool
    doctor: Optional[DoctorResponse] = None

    class Config:
        orm_mode = True



# Service Schemas
class ServiceBase(BaseModel):
    category: str
    name: str
    price: float

class ServiceCreate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True


# Bill Item Schemas
class BillItemBase(BaseModel):
    service_id: Optional[int] = None
    service_name: str
    amount: float

class BillItemCreate(BaseModel):
    service_id: Optional[int] = None
    amount: float  # Stored price (overridable)

class BillItemResponse(BillItemBase):
    id: int

    class Config:
        orm_mode = True


# Bill Schemas
class BillBase(BaseModel):
    visit_id: int

class BillCreate(BillBase):
    items: List[BillItemCreate]

class BillResponse(BaseModel):
    id: int
    bill_id: str
    visit_id: int
    grand_total: float
    advance_applied: float
    payment_status: str
    balance_amount: float
    created_by: int
    created_at: datetime
    is_active: bool
    items: List[BillItemResponse]
    patient_name: Optional[str] = None
    patient_id_str: Optional[str] = None

    class Config:
        orm_mode = True


# Payment Schemas
class PaymentBase(BaseModel):
    amount_paid: float
    payment_method: str  # Cash, UPI, Card, Net Banking, Wallet
    transaction_reference: Optional[str] = None

class PaymentCreate(PaymentBase):
    payment_type: str  # Advance, Partial, Full

class PaymentResponse(PaymentBase):
    id: int
    payment_id: str
    visit_id: Optional[int]
    bill_id: Optional[int]
    payment_type: str
    payment_date: datetime
    recorded_by: int
    is_active: bool

    class Config:
        orm_mode = True


# Receipt Schemas
class ReceiptResponse(BaseModel):
    id: int
    receipt_id: str
    payment_id: int
    receipt_type: str
    pdf_path: str
    created_at: datetime

    class Config:
        orm_mode = True


# Refund Schemas
class RefundBase(BaseModel):
    amount_refunded: float
    reason: str

class RefundCreate(RefundBase):
    payment_id: int

class RefundResponse(RefundBase):
    id: int
    refund_id: str
    payment_id: int
    refund_date: datetime
    handled_by: int

    class Config:
        orm_mode = True


# Setting Schemas
class SettingBase(BaseModel):
    key: str
    value: str

class SettingResponse(SettingBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    target_table: str
    target_id: Optional[str]
    details: Optional[str]
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        orm_mode = True


# Dashboard Metrics Schema
class DashboardMetrics(BaseModel):
    total_patients: int
    today_patients: int
    total_revenue: float
    today_revenue: float
    pending_dues: float
    cash_collection_today: float
    online_collection_today: float
    refund_amount_today: float
    payment_method_breakdown: Dict[str, float]
    payment_method_counts: Dict[str, int]
    recent_transactions: List[dict]


# AI Recommendation Schemas
class RecommendationRequest(BaseModel):
    patient_id: Optional[int] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    symptoms: str

class RecommendationItem(BaseModel):
    service_id: int
    service_name: str
    category: str
    price: float
    reason: str

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]
    explanation: str


# AI Consultation & Prescription Suggester Schemas
class AISuggestRequest(BaseModel):
    chief_complaints: str
    diagnosis: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

class AISuggestResponse(BaseModel):
    diagnosis: str
    medicines_list: str
    tests_list: str
    advice: str
    follow_up_date: str


# AI Billing Anomaly Checker Schemas
class BillItemAnomaly(BaseModel):
    service_name: str
    amount: float

class AnomalyCheckRequest(BaseModel):
    items: List[BillItemAnomaly]
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    diagnosis: Optional[str] = None

class AnomalyCheckResponse(BaseModel):
    status: str  # "clear" | "warning" | "critical"
    issues: List[str]
    summary: str
    safe_to_proceed: bool


# AI Dashboard Insight Schema
class AIInsightResponse(BaseModel):
    insight: str
    action: str
    metric_highlight: str
    sentiment: str  # "positive" | "neutral" | "negative"


