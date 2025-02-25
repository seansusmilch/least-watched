import httpx
import os

EMBY_TOKEN = os.getenv("EMBY_TOKEN")
EMBY_URL = os.getenv("EMBY_URL")


class PlaybackReportingProvider:

    def __init__(self):
        self.url = EMBY_URL
        self.api_key = EMBY_TOKEN
        self.client = self._get_client()

    def _get_client(self):
        client = httpx.AsyncClient()
        client.headers.update(self._get_emby_device())
        return client

    def _get_emby_device(self) -> dict:
        return {
            "X-Emby-Client": "Least Watched",
            "X-Emby-Device-Name": "Least Watched",
            "X-Emby-Device-Id": "d40b36d8-7e85-4803-9243-e37202ea1533",
            "X-Emby-Client-Version": "0.0.1",
            "X-Emby-Token": self.api_key,
            "X-Emby-Language": "en-us",
        }

    async def get_playbacks(self, query: str, days: int = 365) -> list[dict]:
        params = {"aggregate_data": "true", "days": days, "filter_name": f"{query}*"}

        res = await self.client.get(
            f"{self.url}/emby/user_usage_stats/UserPlaylist", params=params
        )
        return res.json()


if __name__ == "__main__":
    import asyncio
    import os

    provider = PlaybackReportingProvider()
    print(asyncio.run(provider.get_playbacks("The Office")))
