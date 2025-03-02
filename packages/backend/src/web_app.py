import asyncio
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
import os
from pathlib import Path
import pytz
import json

from fastapi import FastAPI, Request, Depends, Form, BackgroundTasks
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_config, update_config
from src.models import init_db, get_db, MediaItemDB
from src.media_processor import get_unwatched_media
from src.db_service import DatabaseService


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

# Create static directory if it doesn't exist
static_dir = Path("static")
static_dir.mkdir(exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize templates
templates = Jinja2Templates(directory="templates")

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


@app.get("/")
async def index(request: Request, db: Session = Depends(get_db)):
    """Render the index page."""
    global scan_complete

    # Reset scan complete flag when viewing results
    scan_complete = False

    # Get media items from database
    all_items = DatabaseService.get_all_media_items(db)
    movie_items = DatabaseService.get_media_items_by_type(db, "movie")
    show_items = DatabaseService.get_media_items_by_type(db, "show")

    # Get statistics
    total_size = DatabaseService.get_total_size(db)
    last_updated = DatabaseService.get_last_updated(db)
    counts = DatabaseService.get_count_by_type(db)

    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "media_items": all_items,
            "movie_items": movie_items,
            "show_items": show_items,
            "total_count": len(all_items),
            "total_size": total_size,
            "last_updated": last_updated,
            "counts": counts,
        },
    )


@app.get("/scan")
async def scan_page(request: Request, db: Session = Depends(get_db)):
    """Render the scan page."""
    global scan_in_progress, scan_complete, last_scan_time, scan_results, scan_progress

    config = get_config()

    # Get statistics if scan is complete
    if scan_complete and scan_results["total_count"] == 0:
        all_items = DatabaseService.get_all_media_items(db)
        scan_results["total_count"] = len(all_items)
        scan_results["total_size"] = DatabaseService.get_total_size(db)

    return templates.TemplateResponse(
        "scan.html",
        {
            "request": request,
            "config": config,
            "scan_in_progress": scan_in_progress,
            "scan_complete": scan_complete,
            "last_updated": last_scan_time,
            "total_count": scan_results["total_count"],
            "total_size": scan_results["total_size"],
            "progress": scan_progress,
        },
    )


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


@app.post("/scan")
async def start_scan(
    request: Request,
    background_tasks: BackgroundTasks,
    days_threshold: int = Form(...),
    ignore_newer_than_days: int = Form(...),
    concurrent_limit: int = Form(...),
    batch_size: int = Form(...),
):
    """Start a scan with the provided settings."""
    global scan_in_progress, scan_complete, scan_progress

    # Update config with new values
    config_update = {
        "days_threshold": days_threshold,
        "ignore_newer_than_days": ignore_newer_than_days,
        "concurrent_limit": concurrent_limit,
        "batch_size": batch_size,
    }
    update_config(config_update)

    # Start scan in background if not already running
    if not scan_in_progress:
        scan_in_progress = True
        scan_complete = False
        background_tasks.add_task(
            run_scan,
            days_threshold,
            ignore_newer_than_days,
            concurrent_limit,
            batch_size,
        )

    return templates.TemplateResponse(
        "scan.html",
        {
            "request": request,
            "config": get_config(),
            "scan_in_progress": scan_in_progress,
            "scan_complete": scan_complete,
            "last_updated": last_scan_time,
            "total_count": scan_results["total_count"],
            "total_size": scan_results["total_size"],
            "progress": scan_progress,
        },
    )


@app.get("/settings")
async def settings_page(request: Request):
    """Render the settings page."""
    config = get_config()

    return templates.TemplateResponse(
        "settings.html",
        {
            "request": request,
            "config": config,
        },
    )


@app.post("/settings")
async def update_settings(
    request: Request,
    emby_url: str = Form(...),
    emby_token: str = Form(...),
    sonarr_url: str = Form(...),
    sonarr_api_key: str = Form(...),
    radarr_url: str = Form(...),
    radarr_api_key: str = Form(...),
    timezone: str = Form(...),
):
    """Update settings with the provided values."""
    # Update config with new values
    config_update = {
        "emby_url": emby_url,
        "emby_token": emby_token,
        "sonarr_url": sonarr_url,
        "sonarr_api_key": sonarr_api_key,
        "radarr_url": radarr_url,
        "radarr_api_key": radarr_api_key,
        "timezone": timezone,
    }
    update_config(config_update)

    # Redirect to settings page
    return RedirectResponse(url="/settings", status_code=303)


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


# Add Jinja2 filters
@app.on_event("startup")
async def startup_event():
    """Add custom filters to Jinja2 templates."""

    def format_datetime(value):
        if isinstance(value, datetime):
            # Get the configured timezone
            config = get_config()
            timezone_str = config.get("timezone", "UTC")

            try:
                # Convert UTC time to the configured timezone
                timezone = pytz.timezone(timezone_str)
                if value.tzinfo is None:
                    # Assume UTC if no timezone info
                    value = pytz.utc.localize(value)
                # Convert to the target timezone
                value = value.astimezone(timezone)
                return value.strftime("%Y-%m-%d %H:%M %Z")
            except pytz.exceptions.UnknownTimeZoneError:
                # Fallback to UTC if timezone is invalid
                return value.strftime("%Y-%m-%d %H:%M UTC")
        return value

    templates.env.filters["format_datetime"] = format_datetime
    templates.env.globals["now"] = lambda fmt: datetime.now().strftime(fmt)


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
    days_threshold: int = Form(...),
    ignore_newer_than_days: int = Form(...),
    concurrent_limit: int = Form(...),
    batch_size: int = Form(...),
):
    """Start a scan via API."""
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
        "days_threshold": days_threshold,
        "ignore_newer_than_days": ignore_newer_than_days,
        "concurrent_limit": concurrent_limit,
        "batch_size": batch_size,
    }
    update_config(config_update)

    # Start scan in background
    background_tasks.add_task(
        run_scan,
        days_threshold,
        ignore_newer_than_days,
        concurrent_limit,
        batch_size,
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
async def update_config_api(request: Request):
    """Update application configuration."""
    data = await request.json()
    config_update = data.get("config", {})

    # Don't update sensitive fields if they are masked
    if config_update.get("emby_token") == "***":
        config_update.pop("emby_token")
    if config_update.get("sonarr_api_key") == "***":
        config_update.pop("sonarr_api_key")
    if config_update.get("radarr_api_key") == "***":
        config_update.pop("radarr_api_key")

    success = update_config(config_update)
    return {"success": success}
