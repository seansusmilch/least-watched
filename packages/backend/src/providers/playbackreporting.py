from json import JSONDecodeError
import dateparser
import httpx
import os
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import re
import asyncio

EMBY_TOKEN = os.getenv("EMBY_TOKEN")
EMBY_URL = os.getenv("EMBY_URL")


@dataclass
class PlaybackRecord:
    rowid: str
    date_created: datetime
    user_name: str
    item_id: str
    item_type: str
    item_name: str
    playback_method: str
    client_name: str
    device_name: str
    play_duration: str
    pause_duration: str
    remote_address: Optional[str]
    transcode_reasons: Optional[str]


class PlaybackReportingResponse:
    def __init__(self, data: Dict[str, Any]):
        self.columns = data.get("colums", [])
        self.message = data.get("message", "")
        self.results = []

        # Parse results into PlaybackRecord objects
        for result in data.get("results", []):
            if len(result) >= 13:
                record = PlaybackRecord(
                    rowid=result[0],
                    date_created=dateparser.parse(result[1]),
                    user_name=result[2],
                    item_id=result[3],
                    item_type=result[4],
                    item_name=result[5],
                    playback_method=result[6],
                    client_name=result[7],
                    device_name=result[8],
                    play_duration=result[9],
                    pause_duration=result[10],
                    remote_address=result[11],
                    transcode_reasons=result[12],
                )
                self.results.append(record)

    def __len__(self) -> int:
        return len(self.results)

    def __getitem__(self, index) -> PlaybackRecord:
        return self.results[index]


class PlaybackReportingProvider:

    def __init__(self):
        self.url = EMBY_URL
        self.api_key = EMBY_TOKEN
        self.client = self._get_client()

    def _get_client(self):
        client = httpx.AsyncClient()
        client.headers.update(self._get_emby_device())
        client.timeout = 30
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
        print(res.text)
        return res.json()

    async def _custom_sql_query(self, query: str) -> PlaybackReportingResponse:
        # Minify the SQL query by removing unnecessary whitespace
        # Replace multiple whitespace with a single space
        sql_query = re.sub(r"\s+", " ", query)
        # # Remove spaces after opening and before closing parentheses
        # sql_query = re.sub(r"\( ", r"(", sql_query)
        # sql_query = re.sub(r" \)", r")", sql_query)
        # # Remove spaces around common SQL operators
        # sql_query = re.sub(r" , ", r", ", sql_query)
        # sql_query = re.sub(r" > ", r">", sql_query)
        # sql_query = re.sub(r" < ", r"<", sql_query)
        # sql_query = re.sub(r" = ", r"=", sql_query)
        # Trim leading/trailing whitespace
        sql_query = sql_query.strip()

        # Create request body with the query instead of using params
        request_body = {"CustomQueryString": sql_query}

        res = await self.client.post(
            f"{self.url}/emby/user_usage_stats/submit_custom_query",
            json=request_body,
        )
        try:
            return PlaybackReportingResponse(res.json())
        except JSONDecodeError:
            print("Error parsing response:", res)
            return PlaybackReportingResponse({})

    async def batch_get_playbacks(
        self, queries: list[str], days: int = 365, max_retries: int = 0
    ) -> Dict[str, List[PlaybackRecord]]:
        if not queries:
            return {}

        # Build a UNION query where each condition gets its own limit
        union_parts = []
        for query in queries:
            safe_query = query.replace('"', '""')

            union_parts.append(
                f"""
                SELECT * 
                FROM (
                    SELECT ROWID, * 
                    FROM PlaybackActivity 
                    WHERE DateCreated > date("now", "-{days} days") 
                        AND LOWER(ItemName) LIKE LOWER("{safe_query}%")
                    LIMIT 1
                    )
                """
            )

        # Combine all parts with UNION
        sql_query = " UNION ".join(union_parts)

        # Get combined results with retry logic
        retry_count = 0
        response = await self._custom_sql_query(sql_query)

        # Retry if results are empty
        while len(response.results) == 0 and retry_count < max_retries:
            print(
                f"Empty results received, retrying ({retry_count + 1}/{max_retries})..."
            )
            retry_count += 1
            # Add a small delay before retrying
            await asyncio.sleep(1)
            response = await self._custom_sql_query(sql_query)

        # Filter results for each query
        results_by_query = {}
        for query in queries:
            # Filter records where ItemName starts with the query
            matching_records = [
                record
                for record in response.results
                if record.item_name.lower().startswith(query.lower())
            ]
            results_by_query[query] = matching_records

        # for title, playbacks in results_by_query.items():
        #     print(title, len(playbacks))

        return results_by_query


if __name__ == "__main__":
    import asyncio
    import os

    provider = PlaybackReportingProvider()
    results = asyncio.run(
        provider.batch_get_playbacks(
            [
                "Severance",
            ],
            days=365,
        )
    )
    for title, playbacks in results.items():
        print(title, len(playbacks))
