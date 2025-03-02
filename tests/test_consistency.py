import asyncio
import sys
import os
import random
import time

from src.providers.radarr import get_radarr_api
from src.providers.sonarr import get_sonarr_api

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.providers.playbackreporting import PlaybackReportingProvider


async def main():
    provider = PlaybackReportingProvider()
    sonarr = get_sonarr_api()
    radarr = get_radarr_api()
    all_media = sonarr.all_series() + radarr.all_movies()

    # Define the batch size
    BATCH_SIZE = 30
    RUNS = 10

    # Select a random batch of titles from all media
    titles = random.sample([media.title for media in all_media], BATCH_SIZE)

    # Store results from each run
    all_results = []

    start_time = time.time()

    # Run the test 20 times concurrently
    tasks = [provider.batch_get_playbacks(titles, days=365) for _ in range(RUNS)]
    results_list = await asyncio.gather(*tasks)

    end_time = time.time()
    duration = end_time - start_time

    for i, results in enumerate(results_list):
        print(f"\nTest #{i+1}:")

        # Convert results to a simple format for comparison
        run_results = {}
        for title, playbacks in results.items():
            run_results[title] = len(playbacks)
            print(f"{title}: {len(playbacks)}")

        all_results.append(run_results)

    # Check if all results are zeros
    not_all_zeros = any(
        any(playbacks == 0 for playbacks in result.values()) for result in all_results
    )

    # Check if all results are the same
    first_result = all_results[0]
    all_same = all(result == first_result for result in all_results)

    print("\n" + "=" * 50)
    print(f"All results are not zeros: {not_all_zeros}")
    print(f"All results are the same: {all_same}")

    if not all_same:
        print("\nDifferences found:")
        for i, result in enumerate(all_results):
            if result != first_result:
                print(f"Run #{i+1} differs from first run:")
                for title in titles:
                    if result.get(title) != first_result.get(title):
                        print(
                            f"  {title}: {first_result.get(title)} vs {result.get(title)}"
                        )

    print(f"Test duration: {duration:.2f} seconds")


if __name__ == "__main__":
    asyncio.run(main())
