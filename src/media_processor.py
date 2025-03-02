import asyncio
import time
from datetime import datetime, timedelta
from typing import List, Optional, Union, Callable
from tqdm import tqdm

from arrapi import Series, Movie
from src.models import MediaItem
from src.utils import determine_share
from src.providers.sonarr import get_sonarr_api
from src.providers.radarr import get_radarr_api
from src.providers.playbackreporting import PlaybackReportingProvider


async def process_media_batch(
    playback_provider: PlaybackReportingProvider,
    batch: List[Union[Series, Movie]],
    days_threshold: int,
    cutoff_date: datetime,
    progress_bar: tqdm,
    progress_callback: Optional[Callable] = None,
    total_items: int = 0,
    processed_items_counter: Optional[dict] = None,
    unwatched_counter: Optional[dict] = None,
) -> List[Optional[MediaItem]]:
    """Process a batch of media items"""
    # Use shared counters for tracking progress across batches
    if processed_items_counter is None:
        processed_items_counter = {"count": 0}
    if unwatched_counter is None:
        unwatched_counter = {"count": 0}

    filtered_batch = []
    # Filter out titles that will always return 0 results
    for item in batch:  # Create a copy of the list for safe iteration
        # Skip if the media was added too recently
        if item.added > cutoff_date:
            print(f"Skipping {item.title} because it was added too recently")
            progress_bar.update(1)
            processed_items_counter["count"] += 1
            if progress_callback:
                progress_callback(
                    total_items,
                    processed_items_counter["count"],
                    item.title,
                    unwatched_counter["count"],
                )
            continue

        # Skip if there are no files for the item
        if not item.sizeOnDisk:
            print(f"Skipping {item.title} because it has no files")
            progress_bar.update(1)
            processed_items_counter["count"] += 1
            if progress_callback:
                progress_callback(
                    total_items,
                    processed_items_counter["count"],
                    item.title,
                    unwatched_counter["count"],
                )
            continue

        filtered_batch.append(item)

    titles = [item.title for item in filtered_batch]

    # Get playbacks for all titles in batch
    playbacks_by_title = await playback_provider.batch_get_playbacks(
        titles, days=days_threshold
    )

    results = []
    for item in filtered_batch:
        media_type = "show" if isinstance(item, Series) else "movie"
        playbacks = playbacks_by_title.get(item.title, [])

        if not playbacks:  # No playbacks found in the specified period
            results.append(
                MediaItem(
                    media_type=media_type,
                    date_created=item.added,
                    root_folder=determine_share(item.path),
                    title=item.title,
                    size_gb=item.sizeOnDisk / (1024 * 1024 * 1024),
                )
            )
            unwatched_counter["count"] += 1
        else:
            results.append(None)

        progress_bar.update(1)
        processed_items_counter["count"] += 1
        if progress_callback:
            progress_callback(
                total_items,
                processed_items_counter["count"],
                item.title,
                unwatched_counter["count"],
            )

    return [item for item in results if item is not None]


async def get_unwatched_media(
    days_threshold: int = 30,
    ignore_newer_than_days: int = 7,
    concurrent_limit: int = 20,
    batch_size: int = 50,
    progress_callback: Optional[Callable] = None,
) -> List[MediaItem]:
    """Get unwatched media based on the specified criteria."""
    # Initialize providers
    start_time = time.time()
    sonarr = get_sonarr_api()
    radarr = get_radarr_api()
    playback = PlaybackReportingProvider()
    unwatched = []

    # Calculate cutoff date for recently added media
    cutoff_date = datetime.now() - timedelta(days=ignore_newer_than_days)

    # Get all series and movies
    print("Fetching media data from Sonarr and Radarr...")
    all_series = sonarr.all_series()
    all_movies = radarr.all_movies()

    # Process all media using a semaphore to limit concurrency
    all_media = list(all_series) + list(all_movies)

    # Calculate total items to process
    total_items = len(all_media)

    # Create shared counters for tracking progress across batches
    processed_items_counter = {"count": 0}
    unwatched_counter = {"count": 0}

    # Call progress callback with initial values
    if progress_callback:
        progress_callback(total_items, 0, "Starting scan...", 0)

    print(f"\nProcessing {len(all_series)} shows and {len(all_movies)} movies...")

    # Create progress bar
    progress_bar = tqdm(total=total_items, desc="Checking media", unit="item")

    # Create a semaphore to limit the number of concurrent tasks
    semaphore = asyncio.Semaphore(concurrent_limit)

    # Split media into batches for more efficient processing
    batches = [
        all_media[i : i + batch_size] for i in range(0, len(all_media), batch_size)
    ]

    # Create tasks for processing batches
    async def process_batch(batch):
        async with semaphore:
            return await process_media_batch(
                playback,
                batch,
                days_threshold,
                cutoff_date,
                progress_bar,
                progress_callback,
                total_items,
                processed_items_counter,
                unwatched_counter,
            )

    # Process all batches concurrently (within limits)
    batch_tasks = [asyncio.create_task(process_batch(batch)) for batch in batches]
    batch_results = await asyncio.gather(*batch_tasks)

    # Flatten results
    for batch_result in batch_results:
        unwatched.extend(batch_result)

    progress_bar.close()

    # Print timing information
    elapsed = time.time() - start_time
    print(f"Processing completed in {elapsed:.2f} seconds")
    print(
        f"Found {len(unwatched)} unwatched items out of {total_items} total media items."
    )

    # Final progress update
    if progress_callback:
        progress_callback(total_items, total_items, "Scan complete", len(unwatched))

    return sorted(
        unwatched,
        key=lambda x: (x.size_gb,),
    )
