from arrapi import SonarrAPI
from src.config import get_config


def get_sonarr_api():
    config = get_config()
    return SonarrAPI(config.get("sonarr_url"), config.get("sonarr_api_key"))


if __name__ == "__main__":
    api = get_sonarr_api()
    print(api.all_series())
