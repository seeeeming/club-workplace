from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .config import settings

# SQLite 需要 check_same_thread=False 以支持 FastAPI 多线程
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI 依赖：提供数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
