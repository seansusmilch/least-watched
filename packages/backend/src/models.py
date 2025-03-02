from datetime import datetime
from typing import NamedTuple
from sqlalchemy import Column, Integer, String, Float, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


class MediaItem(NamedTuple):
    date_created: datetime
    root_folder: str
    title: str
    size_gb: float
    media_type: str


# SQLAlchemy models
Base = declarative_base()


class MediaItemDB(Base):
    __tablename__ = "media_items"

    id = Column(Integer, primary_key=True)
    date_created = Column(DateTime, nullable=False)
    root_folder = Column(String, nullable=False)
    title = Column(String, nullable=False)
    size_gb = Column(Float, nullable=False)
    media_type = Column(String, nullable=False)
    last_checked = Column(DateTime, default=datetime.utcnow)

    @classmethod
    def from_media_item(cls, item: MediaItem):
        return cls(
            date_created=item.date_created,
            root_folder=item.root_folder,
            title=item.title,
            size_gb=item.size_gb,
            media_type=item.media_type,
        )


# Database setup
DATABASE_URL = "sqlite:///./media_data.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)
