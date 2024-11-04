import json
from src.common import EMBY_DEVICE, EMBY_URL
import requests

params = {
    "Fields": "MediaSources",
    "ExcludeFields": "VideoChapters,VideoMediaSources,MeadiaStreams",
    "MediaTypes": "Video",
    "IncludeItemTypes": "Episode",
    "ParentId": 202309,
    "Limit": 100,
    **EMBY_DEVICE,
}

response = requests.get(f"{EMBY_URL}/emby/Items", params=params)
total_bytes = 0
for item in response.json()["Items"]:
    print(json.dumps(item, indent=4))
    if "MediaSources" not in item:
        continue
    for media_source in item["MediaSources"]:
        total_bytes += media_source["Size"]

print(f"Total bytes: {total_bytes}")
total_gigabytes = total_bytes / (1024**3)
print(f"Total gigabytes: {total_gigabytes:.2f}")
