from src.common import EMBY_DEVICE, EMBY_URL, get_client


async def get_episodes(
    id: str | int,
    calculate_size: bool = False,
):
    client = get_client()

    params = {
        "MediaTypes": "Video",
        "IncludeItemTypes": "Episode",
        "ExcludeItemTypes": "Season",
        "ParentId": id,
        "Fields": "DateCreated",
        **EMBY_DEVICE,
    }

    if calculate_size:
        params["Fields"] += ",MediaSources"
        params["ExcludeFields"] = "VideoChapters,VideoMediaSources,MeadiaStreams"

    res = await client.get(f"{EMBY_URL}/emby/Items", params=params)

    if calculate_size:
        total_bytes = 0
        for item in res.json()["Items"]:
            if "MediaSources" not in item:
                continue
            for media_source in item["MediaSources"]:
                total_bytes += media_source["Size"]
        total_gigabytes = total_bytes / (1024**3)
        return res.json(), total_gigabytes

    return res.json()


if __name__ == "__main__":
    import asyncio

    results = asyncio.run(get_episodes(225892, calculate_size=True))
    for episode in results[0]["Items"]:
        print(episode)
        print(episode["Type"], episode["Name"])
    print(f"Total gigabytes: {results[1]:.2f}")
