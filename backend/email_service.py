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
from icalendar import Calendar, Event, vText
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
    Core SMTP sender.
    attachments: list of (filename, file_bytes, mime_type) tuples
    Returns True on success, False on failure.
    """
    if not _is_smtp_configured():
        print("⚠️  SMTP not configured — skipping email send.")
        return False

    try:
        msg = MIMEMultipart("mixed")
        msg["From"] = formataddr((SMTP_FROM_NAME, SMTP_USER))
        msg["To"] = to_email
        msg["Subject"] = subject

        # HTML body
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        # Attachments
        if attachments:
            for filename, file_bytes, mime_type in attachments:
                main_type, sub_type = mime_type.split("/", 1)
                part = MIMEBase(main_type, sub_type)
                part.set_payload(file_bytes)
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", "attachment", filename=filename)
                msg.attach(part)

        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}: {subject}")
        return True

    except Exception as e:
        print(f"❌ Email send failed to {to_email}: {e}")
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
    Optionally attaches prescription PDF and a follow-up calendar invite.
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
        <p style="margin: 6px 0 0; opacity: 0.85;">Your Prescription Summary</p>
      </div>

      <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
        <p style="font-size: 16px;">Dear <strong>{patient_name}</strong>,</p>
        <p>Dr. <strong>{doctor_name}</strong> has completed your consultation. Here is a summary of your prescription:</p>

        <div style="background: #f0f7ff; border-left: 4px solid #0f3460; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #0f3460;">🩺 Diagnosis</h3>
          <p style="margin: 0;">{diagnosis or 'As discussed during consultation'}</p>
        </div>

        <div style="background: #fff8f0; border-left: 4px solid #e67e22; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #e67e22;">💊 Medicines Prescribed</h3>
          <pre style="margin: 0; white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px;">{medicines or 'Please refer to attached prescription'}</pre>
        </div>

        <div style="background: #f0fff4; border-left: 4px solid #27ae60; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #27ae60;">✅ Doctor's Advice</h3>
          <p style="margin: 0;">{advice or 'Follow up as scheduled'}</p>
        </div>

        {f'''<div style="background: #fdf0ff; border-left: 4px solid #8e44ad; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px; color: #8e44ad;">📅 Follow-up Appointment</h3>
          <p style="margin: 0;"><strong>{follow_up_display}</strong><br>A calendar invite has been attached to this email.</p>
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

    # Attach PDF prescription if available
    if prescription_pdf_bytes:
        attachments.append((
            f"prescription_{patient_name.replace(' ', '_')}.pdf",
            prescription_pdf_bytes,
            "application/pdf"
        ))

    # Attach .ics calendar invite for follow-up
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

    return _send_email(
        to_email=patient_email,
        subject=f"Your Prescription from Dr. {doctor_name} — {hospital_name}",
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
        subject=f"Invoice {bill_id} — {hospital_name}",
        html_body=html,
        attachments=attachments or None,
    )
