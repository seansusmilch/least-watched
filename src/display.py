from typing import List
from src.models import MediaItem


def display_settings(
    days_threshold: int,
    ignore_newer_than_days: int,
    concurrent_limit: int = 20,
    batch_size: int = 50,
):
    """Display the current settings."""
    print("\nCurrent Settings:")
    print("-" * 40)
    print(f"Check for unwatched in last: {days_threshold} days")
    print(f"Ignore media newer than: {ignore_newer_than_days} days")
    print(f"Concurrent tasks limit: {concurrent_limit}")
    print(f"Batch size for playback queries: {batch_size}")
    print("-" * 40)


def display_results(media_items: List[MediaItem]):
    """Display the results of unwatched media."""
    if not media_items:
        print("\nNo unwatched media found matching the criteria.")
        return

    print("\nUnwatched Media (sorted by size):")
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


def display_summary(unwatched: List[MediaItem], total_time: float):
    """Display summary information about unwatched media."""
    # Calculate and display total size that can be cleaned up
    total_size_gb = sum(item.size_gb for item in unwatched)
    print("\nSummary:")
    print("-" * 40)
    print(f"Total unwatched items: {len(unwatched)}")
    print(f"Total size that can be cleaned up: {total_size_gb:.2f} GB")

    # Display total execution time
    print(f"Total execution time: {total_time:.2f} seconds")
    print("-" * 40)
