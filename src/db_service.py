from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.models import MediaItem, MediaItemDB


class DatabaseService:
    @staticmethod
    def save_media_items(db: Session, items: List[MediaItem]):
        """Save media items to the database."""
        # Clear existing items
        db.query(MediaItemDB).delete()

        # Add new items
        for item in items:
            db_item = MediaItemDB.from_media_item(item)
            db.add(db_item)

        db.commit()

    @staticmethod
    def get_all_media_items(db: Session) -> List[MediaItemDB]:
        """Get all media items from the database."""
        return db.query(MediaItemDB).order_by(MediaItemDB.size_gb.desc()).all()

    @staticmethod
    def get_media_items_by_type(db: Session, media_type: str) -> List[MediaItemDB]:
        """Get media items by type."""
        return (
            db.query(MediaItemDB)
            .filter(MediaItemDB.media_type == media_type)
            .order_by(MediaItemDB.size_gb.desc())
            .all()
        )

    @staticmethod
    def get_total_size(db: Session) -> float:
        """Get total size of all media items."""
        result = db.query(func.sum(MediaItemDB.size_gb)).scalar()
        return result or 0.0

    @staticmethod
    def get_last_updated(db: Session) -> Optional[datetime]:
        """Get the last time the database was updated."""
        result = db.query(func.max(MediaItemDB.last_checked)).scalar()
        return result

    @staticmethod
    def get_count_by_type(db: Session) -> dict:
        """Get count of media items by type."""
        results = (
            db.query(MediaItemDB.media_type, func.count(MediaItemDB.id))
            .group_by(MediaItemDB.media_type)
            .all()
        )

        return {media_type: count for media_type, count in results}
