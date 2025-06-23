import asyncio
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
from pathlib import Path
import pytz
import json
from pydantic import BaseModel

from fastapi import FastAPI, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_config, update_config
from src.models import init_db, get_db, MediaItemDB
from src.media_processor import get_unwatched_media
from src.db_service import DatabaseService


# Pydantic models for API requests
class ScanSettings(BaseModel):
    days_threshold: int
    ignore_newer_than_days: int
    concurrent_limit: int
    batch_size: int


class ConfigUpdate(BaseModel):
    config: Dict[str, Any]


# Initialize FastAPI app
app = FastAPI(title="Least-Watched Media")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Global variables for scan status
scan_in_progress = False
scan_complete = False
last_scan_time = None
scan_results = {"total_count": 0, "total_size": 0}

# Global variables for progress tracking
scan_progress = {
    "total_items": 0,
    "processed_items": 0,
    "percent_complete": 0,
    "current_item": "",
    "unwatched_found": 0,
}


@app.get("/api/scan-progress")
async def get_scan_progress():
    """Return the current scan progress as JSON."""
    global scan_in_progress, scan_complete, scan_progress, scan_results

    return JSONResponse(
        {
            "scan_in_progress": scan_in_progress,
            "scan_complete": scan_complete,
            "progress": scan_progress,
            "results": scan_results if scan_complete else None,
        }
    )


async def run_scan(
    days_threshold: int,
    ignore_newer_than_days: int,
    concurrent_limit: int,
    batch_size: int,
):
    """Run a scan with the provided settings."""
    global scan_in_progress, scan_complete, last_scan_time, scan_results, scan_progress

    try:
        # Reset progress
        scan_progress = {
            "total_items": 0,
            "processed_items": 0,
            "percent_complete": 0,
            "current_item": "",
            "unwatched_found": 0,
        }

        # Define progress callback function
        def progress_callback(total, processed, current_item, unwatched_count):
            scan_progress["total_items"] = total
            scan_progress["processed_items"] = processed
            scan_progress["percent_complete"] = (
                int((processed / total) * 100) if total > 0 else 0
            )
            scan_progress["current_item"] = current_item
            scan_progress["unwatched_found"] = unwatched_count

        # Get unwatched media with progress tracking
        unwatched = await get_unwatched_media(
            days_threshold=days_threshold,
            ignore_newer_than_days=ignore_newer_than_days,
            concurrent_limit=concurrent_limit,
            batch_size=batch_size,
            progress_callback=progress_callback,
        )

        # Save to database
        db = next(get_db())
        DatabaseService.save_media_items(db, unwatched)

        # Update scan results
        scan_results["total_count"] = len(unwatched)
        scan_results["total_size"] = sum(item.size_gb for item in unwatched)

        # Update scan status
        last_scan_time = datetime.utcnow()
        scan_complete = True
    except Exception as e:
        print(f"Error during scan: {e}")
    finally:
        scan_in_progress = False


# API endpoints for Next.js frontend
@app.get("/api/media")
async def get_media(db: Session = Depends(get_db)):
    """Get all media items."""
    media_items = DatabaseService.get_all_media_items(db)
    return {"media_items": [item.__dict__ for item in media_items]}


@app.get("/api/media/{media_type}")
async def get_media_by_type(media_type: str, db: Session = Depends(get_db)):
    """Get media items by type."""
    media_items = DatabaseService.get_media_items_by_type(db, media_type)
    return {"media_items": [item.__dict__ for item in media_items]}


@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    """Get media statistics."""
    total_size = DatabaseService.get_total_size(db)
    last_updated = DatabaseService.get_last_updated(db)
    counts = DatabaseService.get_count_by_type(db)
    total_count = sum(counts.values())

    return {
        "total_size": total_size,
        "last_updated": last_updated.isoformat() if last_updated else None,
        "counts": counts,
        "total_count": total_count,
    }


@app.post("/api/scan/start")
async def start_scan_api(
    background_tasks: BackgroundTasks,
    scan_settings: ScanSettings,
):
    """Start a scan via API. Accepts JSON request body with scan settings."""
    global scan_in_progress, scan_complete, scan_progress

    if scan_in_progress:
        return {"error": "Scan already in progress"}

    # Reset scan state
    scan_in_progress = True
    scan_complete = False
    scan_progress = {
        "percent_complete": 0,
        "processed_items": 0,
        "total_items": 0,
        "current_item": "Starting scan...",
        "unwatched_found": 0,
    }

    # Update config with scan parameters
    config_update = {
        "days_threshold": scan_settings.days_threshold,
        "ignore_newer_than_days": scan_settings.ignore_newer_than_days,
        "concurrent_limit": scan_settings.concurrent_limit,
        "batch_size": scan_settings.batch_size,
    }
    update_config(config_update)

    # Start scan in background
    background_tasks.add_task(
        run_scan,
        scan_settings.days_threshold,
        scan_settings.ignore_newer_than_days,
        scan_settings.concurrent_limit,
        scan_settings.batch_size,
    )

    return {"status": "Scan started"}


@app.get("/api/config")
async def get_config_api():
    """Get application configuration."""
    config = get_config()
    # Remove sensitive information
    if "emby_token" in config:
        config["emby_token"] = "***" if config["emby_token"] else ""
    if "sonarr_api_key" in config:
        config["sonarr_api_key"] = "***" if config["sonarr_api_key"] else ""
    if "radarr_api_key" in config:
        config["radarr_api_key"] = "***" if config["radarr_api_key"] else ""

    return {"config": config}


@app.post("/api/config")
async def update_config_api(config_data: ConfigUpdate):
    """Update application configuration."""
    config_update = config_data.config

    # Don't update sensitive fields if they are masked
    if config_update.get("emby_token") == "***":
        config_update.pop("emby_token")
    if config_update.get("sonarr_api_key") == "***":
        config_update.pop("sonarr_api_key")
    if config_update.get("radarr_api_key") == "***":
        config_update.pop("radarr_api_key")

    success = update_config(config_update)
    return {"success": success}
