from src.common import EMBY_URL, EMBY_DEVICE, get_client


async def get_shows_list():
    client = await get_client()

    params = {
        "IncludeItemTypes": "Series",
        "StartIndex": 0,
        "SortBy": "SortName",
        "SortOrder": "Ascending",
        "ParentId": 6,
        **EMBY_DEVICE,
    }

    res = await client.get(f"{EMBY_URL}/emby/Items", params=params)
    return res.json()


if __name__ == "__main__":
    import asyncio

    results = asyncio.run(get_shows_list())
    for show in results["Items"]:
        print(show["Id"], show["Name"])
