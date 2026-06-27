import os
import datetime
from reportlab.lib.pagesizes import A5, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Line, Rect, String as DString
from sqlalchemy.orm import Session
import models
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

devanagari_registered = False
font_bold_path = None

# Try to find and register a Devanagari-supporting font
font_reg_path = None

if os.name == 'nt':  # Windows
    # Common Windows Hindi fonts
    possible_paths = [
        "C:\\Windows\\Fonts\\Nirmala.ttf",
        "C:\\Windows\\Fonts\\mangal.ttf"
    ]
    for p in possible_paths:
        if os.path.exists(p):
            font_reg_path = p
            break
            
    possible_bold_paths = [
        "C:\\Windows\\Fonts\\Nirmalab.ttf",
        "C:\\Windows\\Fonts\\mangalb.ttf"
    ]
    for p in possible_bold_paths:
        if os.path.exists(p):
            font_bold_path = p
            break
else:  # Linux (Docker)
    # Common paths for Noto Sans Devanagari in Debian (fonts-noto-core)
    possible_paths = [
        "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansDevanagariUI-Regular.ttf"
    ]
    for p in possible_paths:
        if os.path.exists(p):
            font_reg_path = p
            break
            
    possible_bold_paths = [
        "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Bold.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansDevanagariUI-Bold.ttf"
    ]
    for p in possible_bold_paths:
        if os.path.exists(p):
            font_bold_path = p
            break

try:
    if font_reg_path:
        pdfmetrics.registerFont(TTFont('Devanagari', font_reg_path))
        devanagari_registered = True
        print(f"Registered Devanagari regular font: {font_reg_path}")
    if font_bold_path:
        pdfmetrics.registerFont(TTFont('Devanagari-Bold', font_bold_path))
        print(f"Registered Devanagari bold font: {font_bold_path}")
except Exception as e:
    print(f"Warning: Failed to register Devanagari font: {e}")

def number_to_words(number: float) -> str:
    """Converts a number to Indian Rupee word format."""
    number = abs(number)
    if number == 0:
        return "Zero"
    
    units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", 
             "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
    
    def convert_below_thousand(n):
        if n < 20:
            return units[n]
        elif n < 100:
            return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")
        else:
            return units[n // 100] + " Hundred" + (" and " + convert_below_thousand(n % 100) if n % 100 != 0 else "")
            
    def convert_large(n):
        if n == 0:
            return ""
        elif n < 1000:
            return convert_below_thousand(n)
        elif n < 100000:  # 1 Lakh = 100,000
            thousands = n // 1000
            remainder = n % 1000
            t_str = convert_below_thousand(thousands) + " Thousand"
            r_str = convert_below_thousand(remainder)
            return t_str + (" " + r_str if remainder != 0 else "")
        elif n < 10000000:  # 1 Crore = 10,000,000
            lakhs = n // 100000
            remainder = n % 100000
            l_str = convert_below_thousand(lakhs) + " Lakh"
            r_str = convert_large(remainder)
            return l_str + (" " + r_str if remainder != 0 else "")
        else:
            crores = n // 10000000
            remainder = n % 10000000
            c_str = convert_below_thousand(crores) + " Crore"
            r_str = convert_large(remainder)
            return c_str + (" " + r_str if remainder != 0 else "")

    int_part = int(number)
    frac_part = int(round((number - int_part) * 100))
    
    word_str = convert_large(int_part)
    if not word_str:
        word_str = "Zero"
        
    word_str += " Rupees"
    if frac_part > 0:
        word_str += " and " + convert_below_thousand(frac_part) + " Paise"
    word_str += " Only"
    return word_str

def get_setting(db: Session, key: str, default: str) -> str:
    setting = db.query(models.Setting).filter(models.Setting.key == key).first()
    return setting.value if setting else default

def draw_logo_drawing():
    """Draws a stylized M logo vectorially."""
    logo_drawing = Drawing(60, 30)
    # M shape
    logo_drawing.add(Line(10, 5, 20, 25, strokeColor=colors.HexColor('#0f766e'), strokeWidth=3))
    logo_drawing.add(Line(20, 25, 30, 15, strokeColor=colors.HexColor('#0f766e'), strokeWidth=3))
    logo_drawing.add(Line(30, 15, 40, 25, strokeColor=colors.HexColor('#0f766e'), strokeWidth=3))
    logo_drawing.add(Line(40, 25, 50, 5, strokeColor=colors.HexColor('#0f766e'), strokeWidth=3))
    return logo_drawing

def generate_receipt_pdf(payment: models.Payment, db: Session, output_path: str):
    # Fetch patient details & determine visit doctor
    visit = None
    if payment.bill:
        visit = payment.bill.visit
    elif payment.visit:
        visit = payment.visit

    if visit and visit.doctor:
        doc_name = visit.doctor.name
        doc_degree = visit.doctor.degree
    else:
        # Fetch Settings Fallback
        doc_name = get_setting(db, "doctor_name", "Dr. Shweta Grover")
        doc_degree = get_setting(db, "doctor_degree", "MBBS, MD (Pathology), PhD\nPDF (Dermatopathology, Hamburg, Germany)\nConsultant Pathologist")

    hosp_name = get_setting(db, "hospital_name", "Vedam Diagnostics")
    logo_text = get_setting(db, "logo_text", "Sincere Care...")
    address_info = get_setting(db, "collection_centre", "Collection Centre:\n4 Harilok, Dhanvantari Saket Road,\nNear Rohtash Sweets,\nMeerut 250003")
    contact_no = get_setting(db, "contact_number", "+91 98765 43210")
    gstin = get_setting(db, "gst_number", "27AAAAA1111A1Z1")


    # Fetch patient details
    patient = None
    visit = None
    bill = None
    
    if payment.bill:
        bill = payment.bill
        visit = bill.visit
        patient = visit.patient
    elif payment.visit:
        visit = payment.visit
        patient = visit.patient

    # Determine Receipt Type Label
    receipt_label = "Receipt"
    if payment.payment_type == "Advance":
        receipt_label = "Advance Receipt"
    elif payment.payment_type == "Refund":
        receipt_label = "Refund Receipt"
    elif payment.payment_type == "Full":
        receipt_label = "Final Settlement"

    # Setup document
    # A5 Landscape: 595 x 420 points
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(A5),
        leftMargin=30,
        rightMargin=30,
        topMargin=25,
        bottomMargin=20
    )

    styles = getSampleStyleSheet()
    
    normal_font = 'Devanagari' if devanagari_registered else 'Helvetica'
    bold_font = 'Devanagari-Bold' if (devanagari_registered and font_bold_path) else (normal_font if devanagari_registered else 'Helvetica-Bold')

    # Custom styles
    style_normal = ParagraphStyle('DocNormal', parent=styles['Normal'], fontName=normal_font, fontSize=8, leading=10, textColor=colors.HexColor('#374151'))
    style_bold = ParagraphStyle('DocBold', parent=style_normal, fontName=bold_font)
    
    # Header Styles
    style_doc_name = ParagraphStyle('DocName', parent=style_bold, fontSize=12, leading=14, textColor=colors.HexColor('#1f2937'))
    style_doc_degree = ParagraphStyle('DocDegree', parent=style_normal, fontSize=7, leading=9, textColor=colors.HexColor('#4b5563'))
    
    style_logo_title = ParagraphStyle('LogoTitle', parent=style_bold, fontSize=11, leading=13, alignment=1, textColor=colors.HexColor('#0f766e'))
    style_logo_sub = ParagraphStyle('LogoSub', parent=style_normal, fontSize=6, leading=8, alignment=1, textColor=colors.HexColor('#6b7280'))
    
    style_addr = ParagraphStyle('Addr', parent=style_normal, fontSize=7.5, leading=9.5, alignment=2, textColor=colors.HexColor('#4b5563'))

    story = []

    # 1. Header Row Table
    # Column widths: Left 180, Center 150, Right 200
    doc_degree_paragraphs = [Paragraph(line.strip(), style_doc_degree) for line in doc_degree.split('\n')]
    left_flowables = [Paragraph(doc_name, style_doc_name)] + doc_degree_paragraphs
    
    # Center section (Logo, Receipt Box, Receipt Number)
    logo_flowables = [
        draw_logo_drawing(),
        Paragraph(hosp_name, style_logo_title),
        Paragraph(logo_text, style_logo_sub),
        Spacer(1, 5)
    ]
    
    # Right section (Address)
    addr_paragraphs = [Paragraph(line.strip(), style_addr) for line in address_info.split('\n')]
    if gstin:
        addr_paragraphs.append(Paragraph(f"GSTIN: {gstin}", style_addr))
    if contact_no:
        addr_paragraphs.append(Paragraph(f"Tel: {contact_no}", style_addr))
    
    header_table_data = [
        [left_flowables, logo_flowables, addr_paragraphs]
    ]
    header_table = Table(header_table_data, colWidths=[185, 160, 190])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'CENTER'),
        ('ALIGN', (2,0), (2,0), 'RIGHT'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))

    # 2. Receipt Label / Number / Date Row
    # We will draw a line, then display Date, Receipt Type, and Receipt ID
    date_str = payment.payment_date.strftime("%d-%b-%Y %I:%M %p")
    receipt_no = payment.receipts[0].receipt_id if payment.receipts else payment.payment_id

    # Create a nice colored receipt bar
    bar_data = [
        [
            Paragraph(f"<b>Dated:</b> {date_str}", style_normal),
            Paragraph(f"<b>{receipt_label.upper()}</b>", ParagraphStyle('BarTitle', parent=style_bold, fontSize=10, alignment=1, textColor=colors.HexColor('#0f766e'))),
            Paragraph(f"<b>No:</b> {receipt_no}", ParagraphStyle('BarNo', parent=style_bold, alignment=2))
        ]
    ]
    bar_table = Table(bar_data, colWidths=[180, 175, 180])
    bar_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#0d9488')),
        ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#e5e7eb')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(bar_table)
    story.append(Spacer(1, 10))

    # 3. Main Details Section (Replicating paper template dotted fields)
    p_name = patient.name if patient else "N/A"
    p_details = f"{p_name} ({patient.gender}, {patient.age} Yrs)" if patient else "N/A"
    p_id_str = f" [ID: {patient.patient_id}]" if patient else ""
    p_full_str = f"{p_details}{p_id_str}"
    
    amount_in_words = number_to_words(payment.amount_paid)
    
    # Formatting details of the payment
    details_str = f"{payment.payment_method}"
    if payment.transaction_reference:
        details_str += f" (Ref: {payment.transaction_reference})"
    
    if bill:
        details_str += f" against Bill: {bill.bill_id}"
        items_desc = ", ".join([f"{item.service_name} (₹{item.amount})" for item in bill.items])
        if len(items_desc) > 85:
            items_desc = items_desc[:82] + "..."
        details_str += f" for {items_desc}"
    elif visit:
        details_str += f" as Advance for Visit: {visit.visit_id} ({visit.reason or 'Routine checkup'})"

    # We will construct paragraphs with a custom style that simulates underlines or clean tables
    body_style_lbl = ParagraphStyle('BodyLbl', parent=style_bold, fontSize=9.5, leading=16, textColor=colors.HexColor('#1f2937'))
    body_style_val = ParagraphStyle('BodyVal', parent=style_normal, fontSize=9.5, leading=16, textColor=colors.HexColor('#111827'))

    body_data = [
        [Paragraph("Received with thanks from", body_style_lbl), Paragraph(p_full_str, body_style_val)],
        [Paragraph("A sum of Rs.", body_style_lbl), Paragraph(amount_in_words, body_style_val)],
        [Paragraph("As", body_style_lbl), Paragraph(details_str, body_style_val)]
    ]
    
    body_table = Table(body_data, colWidths=[150, 385])
    body_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBELOW', (1,0), (1,-1), 0.5, colors.HexColor('#cbd5e1')), # Underlines for values
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(body_table)
    story.append(Spacer(1, 20))

    # 4. Footer Section (Amount Box + Dues Details + Signature Block)
    # Dues status for Accountant review
    dues_text = ""
    if bill:
        dues_text = f"Total Billed: ₹{bill.grand_total:.2f}  |  Paid So Far: ₹{(bill.grand_total - bill.balance_amount):.2f}  |  Dues: ₹{bill.balance_amount:.2f}"
    
    # Left Amount Box
    amt_box_drawing = Drawing(140, 36)
    # Draw border rectangle
    amt_box_drawing.add(Rect(0, 0, 140, 36, fillColor=colors.HexColor('#f3f4f6'), strokeColor=colors.HexColor('#0d9488'), strokeWidth=1.5, rx=3, ry=3))
    # Draw Text
    amt_box_drawing.add(DString(12, 12, f"Rs. {abs(payment.amount_paid):,.2f}", fontName=bold_font, fontSize=14, fillColor=colors.HexColor('#0f766e')))
    
    # Right Signature Column
    sig_style = ParagraphStyle('Sig', parent=style_normal, fontSize=9, alignment=2)
    sig_flowables = [
        Spacer(1, 15),
        Paragraph("_______________________", sig_style),
        Paragraph("Authorized Signature", ParagraphStyle('SigLbl', parent=style_bold, fontSize=8.5, alignment=2, textColor=colors.HexColor('#4b5563')))
    ]

    dues_style = ParagraphStyle('Dues', parent=style_bold, fontSize=8, textColor=colors.HexColor('#b91c1c'), alignment=0)
    
    footer_data = [
        [amt_box_drawing, Paragraph(dues_text, dues_style), sig_flowables]
    ]
    footer_table = Table(footer_data, colWidths=[150, 220, 165])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(footer_table)

    # Build PDF
    doc.build(story)


def generate_prescription_pdf(visit: models.Visit, db: Session, output_path: str):
    from reportlab.lib.pagesizes import A4
    
    # Fetch Settings
    doc_name = visit.doctor.name if visit.doctor else get_setting(db, "doctor_name", "Dr. Shweta Grover")
    doc_degree = visit.doctor.degree if visit.doctor else get_setting(db, "doctor_degree", "MBBS, MD (Pathology), PhD\nPDF (Dermatopathology, Hamburg, Germany)\nConsultant Pathologist")
    
    hosp_name = get_setting(db, "hospital_name", "Vedam Diagnostics")
    logo_text = get_setting(db, "logo_text", "Sincere Care...")
    address_info = get_setting(db, "collection_centre", "Collection Centre:\n4 Harilok, Dhanvantari Saket Road,\nNear Rohtash Sweets,\nMeerut 250003")
    contact_no = get_setting(db, "contact_number", "+91 98765 43210")
    gstin = get_setting(db, "gst_number", "27AAAAA1111A1Z1")

    patient = visit.patient

    # Setup document: A4 portrait (595 x 842 points)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=35,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    
    normal_font = 'Devanagari' if devanagari_registered else 'Helvetica'
    bold_font = 'Devanagari-Bold' if (devanagari_registered and font_bold_path) else (normal_font if devanagari_registered else 'Helvetica-Bold')

    # Custom styles
    style_normal = ParagraphStyle('PrescNormal', parent=styles['Normal'], fontName=normal_font, fontSize=9.5, leading=13.5, textColor=colors.HexColor('#374151'))
    style_bold = ParagraphStyle('PrescBold', parent=style_normal, fontName=bold_font)
    style_heading = ParagraphStyle('PrescHeading', parent=style_bold, fontSize=11, leading=15, textColor=colors.HexColor('#0d9488'))
    
    # Header Styles
    style_hosp_title = ParagraphStyle('HospTitle', parent=style_bold, fontSize=16, leading=18, textColor=colors.HexColor('#0f766e'))
    style_logo_sub = ParagraphStyle('LogoSub', parent=style_normal, fontSize=8, leading=10, textColor=colors.HexColor('#6b7280'))
    
    style_doc_name = ParagraphStyle('DocName', parent=style_bold, fontSize=12, leading=14, alignment=2, textColor=colors.HexColor('#1f2937'))
    style_doc_degree = ParagraphStyle('DocDegree', parent=style_normal, fontSize=8, leading=10.5, alignment=2, textColor=colors.HexColor('#4b5563'))
    
    style_addr = ParagraphStyle('Addr', parent=style_normal, fontSize=8, leading=10.5, textColor=colors.HexColor('#4b5563'))

    story = []

    # 1. Letterhead Header Row Table
    # Left: Hospital logo & details
    hosp_paragraphs = [
        Paragraph(hosp_name, style_hosp_title),
        Paragraph(logo_text, style_logo_sub),
        Spacer(1, 4)
    ]
    addr_paragraphs = [Paragraph(line.strip(), style_addr) for line in address_info.split('\n')]
    if contact_no:
        addr_paragraphs.append(Paragraph(f"Tel: {contact_no}", style_addr))
    if gstin:
        addr_paragraphs.append(Paragraph(f"GSTIN: {gstin}", style_addr))
        
    left_flowables = hosp_paragraphs + addr_paragraphs
    
    # Right: Doctor details
    doc_degree_paragraphs = [Paragraph(line.strip(), style_doc_degree) for line in doc_degree.split('\n')]
    right_flowables = [Paragraph(doc_name, style_doc_name)] + doc_degree_paragraphs
    
    header_table_data = [
        [left_flowables, right_flowables]
    ]
    header_table = Table(header_table_data, colWidths=[270, 245])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))

    # Divider bar
    divider = Drawing(515, 2)
    divider.add(Line(0, 0, 515, 0, strokeColor=colors.HexColor('#0d9488'), strokeWidth=1.5))
    story.append(divider)
    story.append(Spacer(1, 12))

    # 2. Patient Demographics & Visit Grid
    date_str = visit.visit_date.strftime("%d-%b-%Y %I:%M %p")
    p_name = patient.name if patient else "N/A"
    p_age_gender = f"{patient.age} Yrs / {patient.gender}" if patient else "N/A"
    p_id = patient.patient_id if patient else "N/A"
    v_id = visit.visit_id
    follow_up = visit.follow_up_date or "As advised"

    pat_table_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {p_name}", style_normal),
            Paragraph(f"<b>Patient ID:</b> {p_id}", style_normal)
        ],
        [
            Paragraph(f"<b>Age / Gender:</b> {p_age_gender}", style_normal),
            Paragraph(f"<b>Visit ID:</b> {v_id}", style_normal)
        ],
        [
            Paragraph(f"<b>Date:</b> {date_str}", style_normal),
            Paragraph(f"<b>Follow-up:</b> {follow_up}", style_normal)
        ]
    ]
    pat_table = Table(pat_table_data, colWidths=[257, 258])
    pat_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(pat_table)
    story.append(Spacer(1, 15))

    # 3. Clinical Sections
    clinical_sections = [
        ("Chief Complaints", visit.chief_complaints),
        ("Diagnosis", visit.diagnosis),
        ("Prescribed Medicines", visit.medicines_list),
        ("Recommended Tests", visit.tests_list),
        ("Clinical Advice / Lifestyle Instructions", visit.advice),
    ]

    for title, content in clinical_sections:
        if content and content.strip():
            story.append(Paragraph(title.upper(), style_heading))
            story.append(Spacer(1, 4))
            
            # Draw a subtle underline line for headers
            sect_line = Drawing(515, 1)
            sect_line.add(Line(0, 0, 515, 0, strokeColor=colors.HexColor('#e2e8f0'), strokeWidth=0.5))
            story.append(sect_line)
            story.append(Spacer(1, 5))
            
            # Format content with line breaks replaced by paragraphs or simple text block
            content_style = style_bold if title == "Diagnosis" else style_normal
            story.append(Paragraph(content.strip().replace('\n', '<br/>'), content_style))
            story.append(Spacer(1, 14))

    # 4. Patient-Friendly Bilingual AI Summary Card
    if visit.patient_summary and visit.patient_summary.strip():
        story.append(Spacer(1, 5))
        ai_title = ParagraphStyle('AITitle', parent=style_bold, fontSize=10, textColor=colors.HexColor('#0f766e'))
        ai_body = ParagraphStyle('AIBody', parent=style_normal, fontSize=9, leading=13, textColor=colors.HexColor('#334155'))
        
        ai_content = [
            Paragraph("<b>PATIENT-FRIENDLY SUMMARY (EN + हिंदी)</b>", ai_title),
            Spacer(1, 4),
            Paragraph(visit.patient_summary.strip().replace('\n', '<br/>'), ai_body)
        ]
        
        ai_table = Table([[ai_content]], colWidths=[515])
        ai_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdfa')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#99f6e4')),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(ai_table)
        story.append(Spacer(1, 20))

    # 5. Signoff
    story.append(Spacer(1, 10))
    sig_style = ParagraphStyle('PrescSig', parent=style_normal, fontSize=9, alignment=2)
    sig_label = ParagraphStyle('PrescSigLbl', parent=style_bold, fontSize=9, alignment=2, textColor=colors.HexColor('#4b5563'))
    
    sig_table_data = [
        ["", Paragraph("_______________________", sig_style)],
        ["", Paragraph("Authorized Signature", sig_label)],
        ["", Paragraph(hosp_name, ParagraphStyle('PrescSigHosp', parent=style_normal, fontSize=8, alignment=2, textColor=colors.HexColor('#9ca3af')))]
    ]
    sig_table = Table(sig_table_data, colWidths=[335, 180])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(sig_table)

    # Build PDF
    doc.build(story)
