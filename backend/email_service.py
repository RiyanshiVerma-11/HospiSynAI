"""
email_service.py — HospiSynAI SMTP Email Service
Sends prescription handouts, invoices, and appointment reminders to patients.
All credentials are loaded from environment variables — nothing is hardcoded.
"""

import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from email.utils import formataddr
from email.header import Header
import re
from icalendar import Calendar, Event, vText, Alarm
import datetime
import uuid


# ── Env-based config (never hardcoded) ────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "HospiSynAI")


def _is_smtp_configured() -> bool:
    """Returns True only if SMTP credentials are present in environment."""
    return bool(SMTP_USER and SMTP_PASSWORD)


def _send_email(
    to_email: str,
    subject: str,
    html_body: str,
    attachments: list[tuple[str, bytes, str]] | None = None,
) -> bool:
    """
    Low-level SMTP sender with TLS on port 587.
    Returns True on success, False on failure. Never crashes the caller.
    """
    if not _is_smtp_configured():
        print(f"[email_service] SMTP not configured. Skipped sending email to '{to_email}'.")
        return False

    msg = MIMEMultipart("mixed")
    msg["From"] = formataddr((str(Header(SMTP_FROM_NAME, "utf-8")), SMTP_USER))
    msg["To"] = to_email
    msg["Subject"] = subject

    # Attach HTML body
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    # Attach any binary files (PDFs, .ics)
    for filename, filebytes, mimetype in (attachments or []):
        maintype, subtype = mimetype.split("/", 1)
        part = MIMEBase(maintype, subtype)
        part.set_payload(filebytes)
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
        msg.attach(part)

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.ehlo()
            server.starttls(context=context)
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())
        print(f"[email_service] Successfully sent email to '{to_email}' (Subject: {subject})")
        return True
    except Exception as e:
        print(f"[email_service] Failed to send email to '{to_email}': {e}")
        return False


def _build_ics(
    summary: str,
    description: str,
    dtstart: datetime.date,
    location: str = "OPD Clinic",
) -> bytes:
    """Generates a .ics calendar invite file as bytes."""
    cal = Calendar()
    cal.add("prodid", "-//HospiSynAI//hospisynai//EN")
    cal.add("version", "2.0")
    cal.add("method", "REQUEST")

    event = Event()
    event.add("summary", summary)
    event.add("description", description)
    event.add("dtstart", dtstart)
    event.add("dtend", dtstart)
    event.add("dtstamp", datetime.datetime.now(datetime.timezone.utc))
    event["uid"] = str(uuid.uuid4())
    event["location"] = vText(location)

    cal.add_component(event)
    return cal.to_ical()


def parse_medicine_schedule(medicines_text: str) -> list[dict]:
    """
    Parses medicine prescription lines into structured dosage schedules with exact daily alarm timings.
    Supports Indian clinical formats: OD, BD/BID, TID, QID, SOS, Before/After Meals, Morning/Night.
    """
    if not medicines_text:
        return []
    lines = medicines_text.strip().split("\n")
    results = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Remove leading numbering like '1.', '1)', '-', '*'
        cleaned = re.sub(r"^[\d\.\)\-\*]+\s*", "", line).strip()
        if not cleaned:
            continue

        # Extract duration in days
        days = 5  # default duration
        dur_match = re.search(r"(\d+)\s*(?:days?|din|दिन|mahine|months?|weeks?|hafte)", cleaned, re.I)
        if dur_match:
            val = int(dur_match.group(1))
            matched_str = dur_match.group(0).lower()
            if "month" in matched_str or "mahine" in matched_str:
                days = min(val * 30, 90)
            elif "week" in matched_str or "hafte" in matched_str:
                days = val * 7
            else:
                days = min(val, 90)

        # Extract food instructions
        food = "After Meal (Khane ke baad)"
        lower = cleaned.lower()
        if any(k in lower for k in ["before meal", "before food", "ac", "khali pet", "before breakfast", "empty stomach"]):
            food = "Before Meal (Khali pet)"
        elif any(k in lower for k in ["bedtime", "sone se pehle", "hs", "at night", "raat ko"]):
            food = "At Bedtime (Raat ko sone se pehle)"
        elif any(k in lower for k in ["after meal", "after food", "pc", "khane ke baad", "post meal"]):
            food = "After Meal (Khane ke baad)"

        # Dosage slots: (label, hour, minute)
        slots = []
        if any(k in lower for k in ["qid", "4 times", "char bar", "4 bar"]):
            slots = [("Morning", 8, 0), ("Afternoon", 13, 0), ("Evening", 17, 30), ("Night", 21, 0)]
        elif any(k in lower for k in ["tid", "thrice", "3 times", "teen bar", "3 bar", "subah dopahar raat"]):
            slots = [("Morning", 8, 30), ("Afternoon", 13, 30), ("Night", 20, 30)]
        elif any(k in lower for k in ["bd", "bid", "twice", "2 times", "do bar", "2 bar", "subah shaam", "subah raat"]):
            slots = [("Morning", 8, 30), ("Night", 20, 30)]
        elif any(k in lower for k in ["bedtime", "night only", "hs", "raat ko"]):
            slots = [("Night", 21, 30)]
        elif any(k in lower for k in ["afternoon", "dopahar"]):
            slots = [("Afternoon", 13, 30)]
        else:
            slots = [("Morning", 8, 30)]

        # Extract clean medicine name
        parts = re.split(r"\s*[-—–]\s*|\s+for\s+", cleaned, maxsplit=1)
        med_name = parts[0].strip()

        results.append({
            "medicine": med_name,
            "slots": slots,
            "food": food,
            "days": days
        })
    return results


def build_medicine_schedule_ics(
    medicines: str,
    follow_up_date: str | None = None,
    patient_name: str = "Patient",
    doctor_name: str = "Doctor",
    hospital_name: str = "Hospital"
) -> bytes:
    """
    Generates a full .ics iCalendar file containing recurring daily medicine dosage alarms
    and follow-up appointment reminders. Synchronizes with Google Calendar, Apple Calendar, Outlook.
    """
    cal = Calendar()
    cal.add("prodid", "-//HospiSynAI//MedicineReminders//EN")
    cal.add("version", "2.0")
    cal.add("method", "PUBLISH")
    cal.add("x-wr-calname", f"HospiSynAI - {patient_name} Medicine & Health Schedule")

    today = datetime.date.today()
    parsed_meds = parse_medicine_schedule(medicines)

    for med in parsed_meds:
        med_title = med["medicine"]
        food_inst = med["food"]
        dur_days = med["days"]

        for slot_label, hour, minute in med["slots"]:
            start_dt = datetime.datetime.combine(today, datetime.time(hour, minute))
            end_dt = start_dt + datetime.timedelta(minutes=15)

            ev = Event()
            ev.add("summary", f"💊 Take {med_title} ({slot_label})")
            ev.add("description", (
                f"Medicine: {med_title}\n"
                f"Dosage Time: {slot_label}\n"
                f"Instruction: {food_inst}\n"
                f"Duration: {dur_days} days\n"
                f"Prescribed by: {doctor_name}\n"
                f"Hospital: {hospital_name}\n\n"
                f"Elder Care Tip: Keep water handy and take pill on time as advised."
            ))
            ev.add("dtstart", start_dt)
            ev.add("dtend", end_dt)
            ev.add("dtstamp", datetime.datetime.now(datetime.timezone.utc))
            ev.add("rrule", {"freq": "daily", "count": dur_days})
            ev["uid"] = str(uuid.uuid4())
            ev["location"] = vText("Home / Medicine Box")

            # Notification Alarm 1: At the exact time
            alarm_exact = Alarm()
            alarm_exact.add("action", "DISPLAY")
            alarm_exact.add("description", f"🔔 Medicine Reminder: Take {med_title} ({food_inst})")
            alarm_exact.add("trigger", datetime.timedelta(minutes=0))
            ev.add_component(alarm_exact)

            # Notification Alarm 2: 10 minutes before (heads-up for elder/caregiver)
            alarm_early = Alarm()
            alarm_early.add("action", "DISPLAY")
            alarm_early.add("description", f"⏰ In 10 min: Take {med_title} ({food_inst})")
            alarm_early.add("trigger", datetime.timedelta(minutes=-10))
            ev.add_component(alarm_early)

            cal.add_component(ev)

    # Also include the Follow-up Appointment event if present
    if follow_up_date:
        try:
            fu_date = datetime.datetime.strptime(follow_up_date, "%Y-%m-%d").date()
            fu_start = datetime.datetime.combine(fu_date, datetime.time(10, 0))
            fu_end = fu_start + datetime.timedelta(minutes=30)

            fu_ev = Event()
            fu_ev.add("summary", f"🏥 Follow-up Appointment with {doctor_name}")
            fu_ev.add("description", (
                f"Patient: {patient_name}\n"
                f"Doctor: {doctor_name}\n"
                f"Location: {hospital_name} OPD\n"
                f"Note: Please bring your previous prescription and any lab reports."
            ))
            fu_ev.add("dtstart", fu_start)
            fu_ev.add("dtend", fu_end)
            fu_ev.add("dtstamp", datetime.datetime.now(datetime.timezone.utc))
            fu_ev["uid"] = str(uuid.uuid4())
            fu_ev["location"] = vText(f"{hospital_name} OPD")

            # 2 hours before reminder
            fu_alarm = Alarm()
            fu_alarm.add("action", "DISPLAY")
            fu_alarm.add("description", f"Reminder: Follow-up visit with {doctor_name} today at 10:00 AM")
            fu_alarm.add("trigger", datetime.timedelta(minutes=-120))
            fu_ev.add_component(fu_alarm)

            cal.add_component(fu_ev)
        except Exception as e:
            print(f"⚠️ Could not add follow-up to medicine calendar: {e}")

    return cal.to_ical()


# ── Public API ─────────────────────────────────────────────────────────────────

def send_prescription_email(
    patient_name: str,
    patient_email: str,
    doctor_name: str,
    hospital_name: str,
    diagnosis: str,
    medicines: str,
    advice: str,
    follow_up_date: str | None,
    language_summary: str | None = None,
    prescription_pdf_bytes: bytes | None = None,
) -> bool:
    """
    Sends the prescription summary email to the patient.
    Attaches prescription PDF, medicine schedule calendar with recurring alarms,
    and a follow-up appointment calendar invite.
    """
    if not patient_email:
        return False

    follow_up_display = follow_up_date or "As advised by doctor"

    # Build HTML body
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #1a1a2e; background: #f8f9fa; padding: 24px;">

      <div style="background: linear-gradient(135deg, #0f3460, #16213e); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🏥 {hospital_name}</h1>
        <p style="margin: 6px 0 0; opacity: 0.85;">Your Prescription & Medicine Schedule</p>
      </div>

      <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear <strong>{patient_name}</strong>,</p>
        <p>Dr. <strong>{doctor_name}</strong> has completed your consultation. Here is your medical prescription summary:</p>

        <!-- Elder-friendly automated calendar reminder box -->
        <div style="background: #eff6ff; border: 2px solid #3b82f6; padding: 18px; border-radius: 10px; margin: 18px 0;">
          <div style="margin-bottom: 8px;">
            <h3 style="margin: 0; color: #1d4ed8; font-size: 16px;">⏰ Auto-Medicine Alarms & Follow-up Calendar Included!</h3>
          </div>
          <p style="margin: 0 0 8px; font-size: 13.5px; line-height: 1.5; color: #1e3a8a;">
            Aapke phone ke liye daily medicine reminders ka <strong>.ics calendar file</strong> is email me attach kiya gaya hai. 
            Email attachment me <strong>medicine_schedule_and_reminders.ics</strong> par click karke Google Calendar / Apple Calendar me save karein — aapke phone par dawai khane ke exact samay par notification alarm bajega!
          </p>
          <div style="background: white; padding: 10px 14px; border-radius: 6px; font-size: 12.5px; color: #334155; border: 1px solid #bfdbfe;">
            <strong>🔔 Automated Daily Alarm Schedule:</strong><br>
            • <strong>Morning (Subah):</strong> 08:30 AM (Khali Pet / Khane ke baad)<br>
            • <strong>Afternoon (Dopahar):</strong> 01:30 PM (Khane ke baad)<br>
            • <strong>Night (Raat):</strong> 08:30 PM / Bedtime 09:30 PM
          </div>
        </div>

        <div style="background: #f0f7ff; border-left: 4px solid #0f3460; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #0f3460;">🩺 Diagnosis</h3>
          <p style="margin: 0;">{diagnosis or 'As discussed during consultation'}</p>
        </div>

        <div style="background: #fff8f0; border-left: 4px solid #e67e22; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #e67e22;">💊 Prescribed Medicines</h3>
          <pre style="margin: 0; white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px;">{medicines or 'Please refer to attached prescription'}</pre>
        </div>

        <div style="background: #f0fff4; border-left: 4px solid #27ae60; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #27ae60;">✅ Doctor's Advice</h3>
          <p style="margin: 0;">{advice or 'Follow up as scheduled'}</p>
        </div>

        {f'''<div style="background: #fdf0ff; border-left: 4px solid #8e44ad; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #8e44ad;">📅 Follow-up Appointment</h3>
          <p style="margin: 0;"><strong>{follow_up_display}</strong><br>A calendar invite with 2-hour early reminder has been attached to this email.</p>
        </div>''' if follow_up_date else ''}

        {f'''<div style="background: #fffbf0; border-left: 4px solid #f39c12; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #f39c12;">📋 Patient Summary</h3>
          <p style="margin: 0; white-space: pre-wrap; font-size: 14px;">{language_summary}</p>
        </div>''' if language_summary else ''}

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This email was sent by <strong>{hospital_name}</strong> via HospiSynAI.<br>
          Please do not reply to this email. For queries, contact your doctor's clinic directly.<br>
          <em>All AI-generated suggestions are assistive — final medical decisions rest with your doctor.</em>
        </p>
      </div>
    </body>
    </html>
    """

    attachments = []

    # 1. Attach PDF prescription if available
    if prescription_pdf_bytes:
        attachments.append((
            f"prescription_{patient_name.replace(' ', '_')}.pdf",
            prescription_pdf_bytes,
            "application/pdf"
        ))

    # 2. Attach comprehensive medicine schedule calendar (.ics) with recurring daily alarms
    try:
        med_cal_bytes = build_medicine_schedule_ics(
            medicines=medicines,
            follow_up_date=follow_up_date,
            patient_name=patient_name,
            doctor_name=doctor_name,
            hospital_name=hospital_name
        )
        if med_cal_bytes:
            attachments.append((
                f"medicine_schedule_and_reminders.ics",
                med_cal_bytes,
                "text/calendar"
            ))
    except Exception as e:
        print(f"⚠️  Could not generate medicine schedule .ics: {e}")

    # 3. Attach standard .ics calendar invite for follow-up specifically
    if follow_up_date:
        try:
            follow_date_parsed = datetime.datetime.strptime(follow_up_date, "%Y-%m-%d").date()
            ics_bytes = _build_ics(
                summary=f"Follow-up with Dr. {doctor_name} — {hospital_name}",
                description=f"Patient: {patient_name}\nDiagnosis: {diagnosis}\nAdvice: {advice}",
                dtstart=follow_date_parsed,
                location=f"{hospital_name} OPD",
            )
            attachments.append(("followup_appointment.ics", ics_bytes, "text/calendar"))
        except Exception as e:
            print(f"⚠️  Could not generate .ics for follow-up date '{follow_up_date}': {e}")

    doc_display = doctor_name if doctor_name.lower().startswith("dr") else f"Dr. {doctor_name}"
    return _send_email(
        to_email=patient_email,
        subject=f"Your Prescription & Medicine Reminders from {doc_display} | {hospital_name}",
        html_body=html,
        attachments=attachments or None,
    )


def send_invoice_email(
    patient_name: str,
    patient_email: str,
    hospital_name: str,
    bill_id: str,
    total_amount: float,
    paid_amount: float,
    balance_due: float,
    payment_status: str,
    invoice_pdf_bytes: bytes | None = None,
) -> bool:
    """Sends the invoice/receipt email to the patient."""
    if not patient_email:
        return False

    status_color = {
        "Paid": "#27ae60",
        "Partial Paid": "#f39c12",
        "Pending": "#e74c3c",
    }.get(payment_status, "#666")

    html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; color: #1a1a2e; background: #f8f9fa; padding: 24px;">

      <div style="background: linear-gradient(135deg, #0f3460, #16213e); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🏥 {hospital_name}</h1>
        <p style="margin: 6px 0 0; opacity: 0.85;">Invoice / Payment Receipt</p>
      </div>

      <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
        <p>Dear <strong>{patient_name}</strong>,</p>
        <p>Here is the summary of your invoice from <strong>{hospital_name}</strong>.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f0f7ff;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Bill ID</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">{bill_id}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Total Amount</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">₹{total_amount:,.2f}</td>
          </tr>
          <tr style="background: #f0fff4;">
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Paid</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #27ae60;"><strong>₹{paid_amount:,.2f}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Balance Due</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: #e74c3c;"><strong>₹{balance_due:,.2f}</strong></td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Status</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: {status_color};"><strong>{payment_status}</strong></td>
          </tr>
        </table>

        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This email was sent by <strong>{hospital_name}</strong> via HospiSynAI.<br>
          Please retain this for your records.
        </p>
      </div>
    </body>
    </html>
    """

    attachments = []
    if invoice_pdf_bytes:
        attachments.append((
            f"invoice_{bill_id}.pdf",
            invoice_pdf_bytes,
            "application/pdf"
        ))

    return _send_email(
        to_email=patient_email,
        subject=f"Invoice {bill_id} | {hospital_name}",
        html_body=html,
        attachments=attachments or None,
    )
