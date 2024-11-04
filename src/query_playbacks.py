import requests
from src.common import EMBY_URL, EMBY_DEVICE

params = {
    "aggregate_data": "true",
    "days": 365,
    "end_date": "2024-10-30",
    "filter_name": "Spongebob*",
    **EMBY_DEVICE,
}

response = requests.get(f"{EMBY_URL}/emby/user_usage_stats/UserPlaylist", params=params)
print(response.json())
