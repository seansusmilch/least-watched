from arrapi import SonarrAPI
import os


def get_sonarr_api():
    return SonarrAPI(os.getenv("SONARR_URL"), os.getenv("SONARR_API_KEY"))


if __name__ == "__main__":
    api = get_sonarr_api()
    print(api.all_series())
