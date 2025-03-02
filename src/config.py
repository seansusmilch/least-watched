import os

# Default configuration values
DEFAULT_UNWATCHED_DAYS_THRESHOLD = 365
DEFAULT_IGNORE_NEWER_THAN_DAYS = 365
DEFAULT_CONCURRENT_LIMIT = 5
DEFAULT_BATCH_SIZE = 40


def get_config():
    """Get configuration values from environment variables or use defaults."""
    return {
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
    }
