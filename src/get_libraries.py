import json
from src.common import EMBY_URL, EMBY_DEVICE, get_client


async def get_libraries():
    client = get_client()

    params = {
        **EMBY_DEVICE,
    }

    res = await client.get(f"{EMBY_URL}/emby/Library/VirtualFolders", params=params)

    return filter(
        lambda x: x.get("CollectionType") in ["tvshows", "movies"], res.json()
    )


if __name__ == "__main__":
    import asyncio

    results = asyncio.run(get_libraries())
    for library in results:
        print(library["Id"], library.get("CollectionType") or "???", library["Name"])
