import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import models
import pdf_generator

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/hospisyn"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    # Get first active visit
    visit = db.query(models.Visit).filter(models.Visit.is_active == True).first()
    if visit:
        print(f"Found visit ID: {visit.id}, Visit ID str: {visit.visit_id}")
        output_pdf = "./test_prescription.pdf"
        print(f"Generating PDF to: {output_pdf}")
        pdf_generator.generate_prescription_pdf(visit, db, output_pdf)
        print("PDF generated successfully!")
        if os.path.exists(output_pdf):
            print(f"File size: {os.path.getsize(output_pdf)} bytes")
            os.remove(output_pdf)
    else:
        print("No active visits found in the database.")
except Exception as e:
    import traceback
    print("Error generating PDF:")
    traceback.print_exc()
finally:
    db.close()
