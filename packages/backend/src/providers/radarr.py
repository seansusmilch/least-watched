from arrapi import RadarrAPI
from src.config import get_config


def get_radarr_api():
    config = get_config()
    return RadarrAPI(config.get("radarr_url"), config.get("radarr_api_key"))


if __name__ == "__main__":
    api = get_radarr_api()
    print(api.all_movies())
