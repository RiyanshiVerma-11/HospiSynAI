import os
import datetime
from reportlab.lib.pagesizes import A5, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Line, Rect, String as DString
from sqlalchemy.orm import Session
import models

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
    # Fetch Settings
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
    
    # Custom styles
    style_normal = ParagraphStyle('DocNormal', parent=styles['Normal'], fontSize=8, leading=10, textColor=colors.HexColor('#374151'))
    style_bold = ParagraphStyle('DocBold', parent=style_normal, fontName='Helvetica-Bold')
    
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
    amt_box_drawing.add(DString(12, 12, f"Rs. {abs(payment.amount_paid):,.2f}", fontName="Helvetica-Bold", fontSize=14, fillColor=colors.HexColor('#0f766e')))
    
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
