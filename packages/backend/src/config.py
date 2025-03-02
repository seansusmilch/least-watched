import os
import json
from pathlib import Path

# Default configuration values
DEFAULT_UNWATCHED_DAYS_THRESHOLD = 365
DEFAULT_IGNORE_NEWER_THAN_DAYS = 365
DEFAULT_CONCURRENT_LIMIT = 5
DEFAULT_BATCH_SIZE = 40
DEFAULT_TIMEZONE = "UTC"

# Config file path
CONFIG_FILE = Path("config.json")


def get_config():
    """Get configuration values from config file, environment variables, or use defaults."""
    config = {
        # Application settings
        "days_threshold": int(
            os.getenv("UNWATCHED_DAYS_THRESHOLD", str(DEFAULT_UNWATCHED_DAYS_THRESHOLD))
        ),
        "ignore_newer_than_days": int(
            os.getenv("IGNORE_NEWER_THAN_DAYS", str(DEFAULT_IGNORE_NEWER_THAN_DAYS))
        ),
        "concurrent_limit": int(
            os.getenv("CONCURRENT_LIMIT", str(DEFAULT_CONCURRENT_LIMIT))
        ),
        "batch_size": int(os.getenv("BATCH_SIZE", str(DEFAULT_BATCH_SIZE))),
        "timezone": os.getenv("TIMEZONE", DEFAULT_TIMEZONE),
        # API settings
        "emby_url": os.getenv("EMBY_URL", ""),
        "emby_token": os.getenv("EMBY_TOKEN", ""),
        "sonarr_url": os.getenv("SONARR_URL", ""),
        "sonarr_api_key": os.getenv("SONARR_API_KEY", ""),
        "radarr_url": os.getenv("RADARR_URL", ""),
        "radarr_api_key": os.getenv("RADARR_API_KEY", ""),
    }

    # Override with values from config file if it exists
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r") as f:
                file_config = json.load(f)
                config.update(file_config)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error reading config file: {e}")

    return config


def save_config(config):
    """Save configuration to a file."""
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=4)
        return True
    except IOError as e:
        print(f"Error saving config file: {e}")
        return False


def update_config(new_config):
    """Update configuration with new values."""
    config = get_config()
    config.update(new_config)
    return save_config(config)
