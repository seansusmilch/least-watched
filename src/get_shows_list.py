from src.get_libraries import get_libraries
from src.common import EMBY_URL, EMBY_DEVICE, get_client


async def get_shows_list():
    client = get_client()
    libraries = await get_libraries()

    shows = []
    for library in libraries:
        if library.get("CollectionType") != "tvshows":
            continue
        params = {
            "IncludeItemTypes": "Series",
            "StartIndex": 0,
            "SortBy": "SortName",
            "SortOrder": "Ascending",
            "ParentId": library["Id"],
            **EMBY_DEVICE,
        }

        res = await client.get(f"{EMBY_URL}/emby/Items", params=params)
        shows += res.json()["Items"]

    return shows


if __name__ == "__main__":
    import asyncio

    results = sorted(asyncio.run(get_shows_list()), key=lambda x: x["Name"])

    for show in results:
        # print(show)
        print(show["Id"], show["Name"])
