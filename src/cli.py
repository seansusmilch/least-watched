import asyncio
import time

from src.config import get_config
from src.display import display_settings, display_results, display_summary
from src.media_processor import get_unwatched_media
from src.providers.playbackreporting import PlaybackReportingProvider


async def main():
    """Main entry point for the CLI application."""
    # Get configuration
    config = get_config()

    # Display current settings
    display_settings(
        config["days_threshold"],
        config["ignore_newer_than_days"],
        config["concurrent_limit"],
        config["batch_size"],
    )

    main_start_time = time.time()

    try:
        # Get unwatched media
        unwatched = await get_unwatched_media(
            days_threshold=config["days_threshold"],
            ignore_newer_than_days=config["ignore_newer_than_days"],
            concurrent_limit=config["concurrent_limit"],
            batch_size=config["batch_size"],
        )

        # Display results
        display_results(unwatched)

        # Display summary
        total_time = time.time() - main_start_time
        display_summary(unwatched, total_time)

    finally:
        # Clean up the async client
        provider = PlaybackReportingProvider()
        await provider.client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
