import json
import requests
from common import EMBY_URL, EMBY_DEVICE

params = {
    "IncludeItemTypes": "Series",
    "Fields": "",
    "StartIndex": 0,
    "SortBy": "SortName",
    "SortOrder": "Ascending",
    "ParentId": 6,
    # 'EnableImageTypes': 'Primary,Backdrop,Thumb',
    "ImageTypeLimit": 1,
    "Recursive": "true",
    "Limit": 1,
    **EMBY_DEVICE,
}

response = requests.get(f"{EMBY_URL}/emby/Items", params=params)
for item in response.json()["Items"]:
    print(json.dumps(item, indent=4))
