from src.providers.sonarr import get_sonarr_api
from src.providers.radarr import get_radarr_api
from src.providers.playbackreporting import PlaybackReportingProvider
import os
import asyncio
from datetime import datetime, timedelta
from typing import NamedTuple
from tqdm import tqdm


class MediaItem(NamedTuple):
    date_created: datetime
    root_folder: str
    title: str
    size_gb: float
    media_type: str


def determine_share(path: str) -> str:
    return path.split("/")[1]


def display_settings(days_threshold: int, ignore_newer_than_days: int):
    print("\nCurrent Settings:")
    print("-" * 40)
    print(f"Check for unwatched in last: {days_threshold} days")
    print(f"Ignore media newer than: {ignore_newer_than_days} days")
    print("-" * 40)


async def get_unwatched_media(
    days_threshold: int = 30, ignore_newer_than_days: int = 7
) -> list[MediaItem]:
    # Initialize providers
    sonarr = get_sonarr_api()
    radarr = get_radarr_api()
    playback = PlaybackReportingProvider()
    unwatched = []

    # Calculate cutoff date for recently added media
    cutoff_date = datetime.now() - timedelta(days=ignore_newer_than_days)

    # Get all series and movies
    all_series = sonarr.all_series()
    all_movies = radarr.all_movies()

    # Calculate total items to process
    total_items = len(all_series) + len(all_movies)
    processed_items = 0

    print(f"\nProcessing {len(all_series)} shows and {len(all_movies)} movies...")

    # Create progress bar
    progress_bar = tqdm(total=total_items, desc="Checking media", unit="item")

    # Process TV shows
    for show in all_series:
        # Skip if the media was added too recently
        if show.added > cutoff_date:
            progress_bar.update(1)
            processed_items += 1
            continue

        playbacks = await playback.get_playbacks(show.title, days=days_threshold)
        if not playbacks:  # No playbacks found in the specified period
            unwatched.append(
                MediaItem(
                    media_type="show",
                    date_created=show.added,
                    root_folder=determine_share(show.rootFolderPath),
                    title=show.title,
                    size_gb=show.sizeOnDisk / (1024 * 1024 * 1024),
                )
            )

        progress_bar.update(1)
        processed_items += 1
        progress_bar.set_postfix({"unwatched": len(unwatched)})

    # Process movies
    for movie in all_movies:
        # Skip if the media was added too recently
        if movie.added > cutoff_date:
            progress_bar.update(1)
            processed_items += 1
            continue

        playbacks = await playback.get_playbacks(movie.title, days=days_threshold)
        if not playbacks:  # No playbacks found in the specified period
            unwatched.append(
                MediaItem(
                    media_type="movie",
                    date_created=movie.added,
                    root_folder=determine_share(movie.path),
                    title=movie.title,
                    size_gb=movie.sizeOnDisk / (1024 * 1024 * 1024),
                )
            )

        progress_bar.update(1)
        processed_items += 1
        progress_bar.set_postfix({"unwatched": len(unwatched)})

    progress_bar.close()
    print(
        f"Found {len(unwatched)} unwatched items out of {total_items} total media items."
    )

    return sorted(
        unwatched,
        key=lambda x: (x.size_gb,),
    )


def display_results(media_items: list[MediaItem]):
    if not media_items:
        print("\nNo unwatched media found matching the criteria.")
        return

    print("\nUnwatched Media (sorted by date created, size, and root folder):")
    print("-" * 80)
    print(
        f"{'Type':<8} {'Date Created':<20} {'Root Folder':<12} {'Size (GB)':<10} {'Title':<25}"
    )
    print("-" * 80)

    for item in media_items:
        date_str = item.date_created.strftime("%Y-%m-%d %H:%M")
        print(
            f"{item.media_type:<8} {date_str:<20} {item.root_folder:<12} {item.size_gb:<10.2f} {item.title[:25]}"
        )


async def main():
    # Get days threshold from environment variable, default to 365 if not set
    days_threshold = int(os.getenv("UNWATCHED_DAYS_THRESHOLD", "365"))
    # Get ignore threshold from environment variable, default to 7 if not set
    ignore_newer_than_days = int(os.getenv("IGNORE_NEWER_THAN_DAYS", "365"))

    # Display current settings
    display_settings(days_threshold, ignore_newer_than_days)

    try:
        unwatched = await get_unwatched_media(days_threshold, ignore_newer_than_days)
        display_results(unwatched)
    finally:
        # Clean up the async client
        provider = PlaybackReportingProvider()
        await provider.client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
