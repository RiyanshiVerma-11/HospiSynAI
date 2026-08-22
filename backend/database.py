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

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgrespassword@localhost:5432/hospisyn"
)

def create_db_engine():
    if DATABASE_URL.startswith("sqlite"):
        return create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    
    try:
        pg_engine = create_engine(
            DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True
        )
        with pg_engine.connect() as conn:
            pass
        print(f"[HospiSyn DB] Connected to PostgreSQL at {DATABASE_URL}")
        return pg_engine
    except Exception as e:
        print(f"[HospiSyn DB] PostgreSQL unavailable ({e}). Falling back to local SQLite database.")
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
