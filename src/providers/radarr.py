from arrapi import RadarrAPI
import os


def get_radarr_api():
    return RadarrAPI(os.getenv("RADARR_URL"), os.getenv("RADARR_API_KEY"))


if __name__ == "__main__":
    api = get_radarr_api()
    print(api.all_movies())
