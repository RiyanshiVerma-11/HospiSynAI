import httpx, os, json, datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv('../.env')

import database, models, main

db = database.SessionLocal()
try:
    total_patients = db.query(models.Patient).filter(models.Patient.is_active == True).count()
    print("Total Patients:", total_patients)
    
    # Let's run a quick mock of the prompt and request
    api_key = os.getenv("GROQ_API_KEY")
    model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    
    today_start = datetime.datetime.combine(datetime.date.today(), datetime.time.min)
    today_end = datetime.datetime.combine(datetime.date.today(), datetime.time.max)
    
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
    
    total_revenue = db.query(func.sum(models.Payment.amount_paid)).filter(
        models.Payment.payment_type != "Refund", models.Payment.is_active == True
    ).scalar() or 0.0
    
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
    
    res = httpx.post(url, headers=groq_headers, json=payload)
    print("Status:", res.status_code)
    try:
        print(json.dumps(res.json(), indent=2, ensure_ascii=True))
    except Exception as e:
        print("Error decoding or printing JSON:", e)

finally:
    db.close()
