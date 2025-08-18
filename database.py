from models import User
from sqlmodel import SQLModel,create_engine,Session
from pathlib import Path
from config import settings
# from sqlalchemy.orm import sessionmaker


BASE_DIR = Path(__file__).resolve().parent

engine = create_engine(settings.database_url,echo= True,connect_args={"check_same_thread":False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session