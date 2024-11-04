from src.common import EMBY_URL, EMBY_DEVICE, get_client


async def query_playbacks(query: str) -> dict:
    client = await get_client()

    params = {
        "aggregate_data": "true",
        "days": 365,
        "end_date": "2024-10-30",
        "filter_name": f"{query}*",
        **EMBY_DEVICE,
    }

    res = await client.get(
        f"{EMBY_URL}/emby/user_usage_stats/UserPlaylist", params=params
    )
    return res.json()


if __name__ == "__main__":
    import asyncio

    print(asyncio.run(query_playbacks("The Office")))
