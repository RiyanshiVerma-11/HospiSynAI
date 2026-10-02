import os
from dotenv import load_dotenv

# Load environment variables from project root .env if present
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(backend_dir)
dotenv_path = os.path.join(project_root, '.env')

if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)
else:
    load_dotenv()

import re
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

raw_db_url = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/hospisyn"
)

# Render fix: postgres:// -> postgresql://
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

def get_candidate_db_urls():
    urls = []
    # If it's a bare Render internal host like dpg-d8uog880697c73eqc5ng-a without a domain
    match = re.search(r'@(dpg-[a-z0-9]+-a)(:[0-9]+)?(/|$)', raw_db_url)
    if match:
        bare_host = match.group(1)
        port_part = match.group(2) or ''
        slash_part = match.group(3) or ''
        for region in ['oregon', 'singapore', 'frankfurt', 'ohio']:
            full_host = f"{bare_host}.{region}-postgres.render.com{port_part}{slash_part}"
            urls.append(raw_db_url.replace(match.group(0), f"@{full_host}"))
    urls.append(raw_db_url)
    return urls

def create_db_engine():
    if raw_db_url.startswith("sqlite"):
        return create_engine(raw_db_url, connect_args={"check_same_thread": False})
    
    candidate_urls = get_candidate_db_urls()
    for test_url in candidate_urls:
        try:
            display_url = test_url.split('@')[-1] if '@' in test_url else test_url
            print(f"[HospiSyn DB] Testing database connection to: {display_url}")
            pg_engine = create_engine(
                test_url,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
                connect_args={"connect_timeout": 5}
            )
            with pg_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"[HospiSyn DB] Successfully connected to PostgreSQL at {display_url}")
            return pg_engine
        except Exception as e:
            display_url = test_url.split('@')[-1] if '@' in test_url else test_url
            print(f"[HospiSyn DB] Connection to {display_url} failed: {e}")
            continue

    print("[HospiSyn DB] All PostgreSQL connection attempts failed. Falling back to local SQLite database.")
    sqlite_file = os.path.join(backend_dir, "hospisyn.db")
    sqlite_url = f"sqlite:///{sqlite_file}"
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = create_db_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
