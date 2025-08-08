Example Request 1

```bash
curl 'https://EMBY_DOMAIN/emby/user_usage_stats/submit_custom_query?stamp=1754630657953&X-Emby-Language=en-us&reqformat=json' \
  -H 'accept: application/json' \
  --data-raw '{"CustomQueryString":"SELECT ROWID, * \nFROM PlaybackActivity \nWHERE (ItemName LIKE \"Dirty Jobs%\")\nLIMIT 1000","ReplaceUserId":true}'
```

Example Response 1

```json
{
  "colums": [
    "rowid",
    "DateCreated",
    "UserName",
    "ItemId",
    "ItemType",
    "ItemName",
    "PlaybackMethod",
    "ClientName",
    "DeviceName",
    "PlayDuration",
    "PauseDuration",
    "RemoteAddress",
    "TranscodeReasons"
  ],
  "results": [
    [
      "25372",
      "2023-01-16 22:43:21.4643379",
      "Jon",
      "485078",
      "Episode",
      "Dirty Jobs - s01e02 - Sewer Inspector",
      "Transcode (v:h264 a:direct)",
      "Emby for macOS",
      "Quinn’s MacBook Air",
      "1",
      "0",
      null,
      null
    ],
    [
      "25373",
      "2023-01-16 22:43:25.9499318",
      "Jon",
      "485078",
      "Episode",
      "Dirty Jobs - s01e02 - Sewer Inspector",
      "Transcode (v:h264 a:direct)",
      "Emby for macOS",
      "Quinn’s MacBook Air",
      "2663",
      "2014",
      null,
      null
    ]
  ],
  "message": ""
}
```

Example Request 2

```bash
curl 'https://mb.thestu.xyz/emby/user_usage_stats/submit_custom_query?stamp=1754631187278&X-Emby-Language=en-us&reqformat=json' \
  -H 'accept: application/json' \
  --data-raw '{"CustomQueryString":"WITH Activity AS (\n          SELECT ItemId, DateCreated, PlayDuration\n          FROM PlaybackActivity\n          WHERE ItemId IN (485076,518375,485078)\n        ),\n        Totals AS (\n          SELECT\n            MAX(DateCreated) AS LastWatched,\n            SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount\n          FROM Activity\n        )\n        SELECT LastWatched, WatchCount FROM Totals;","ReplaceUserId":false}'
```

Example Response 2

```json
{
  "colums": ["LastWatched", "WatchCount"],
  "results": [["2024-03-15 23:08:27.0938503", "3"]],
  "message": ""
}
```

Error Response Example

```json
{
  colums: [],
  results: [],
  message: "Error Running Query</br>SQL contains more than one statment<pre>System.ArgumentException: SQL contains more than one statment\n' +
    '   at SQLitePCL.pretty.DatabaseConnection.PrepareStatement(IDatabaseConnection This, String sql)\n' +
    '   at playback_reporting.Data.ActivityRepository.RunCustomQuery(String query_string, List`1 col_names, List`1 results)</pre>"
}
```

## Getting Series playback.

- queries w too many episode ids might not work properly
- could fall back to querying by title
