## Emby Integration Overview

This document explains how this project interfaces with Emby. It focuses on the two core areas we rely on:

- Metadata and library browsing via the Emby HTTP API (through `emby-sdk-stainless`)
- Playback aggregation via the Playback Reporting plugin (aka `user_usage_stats`)

See also:

- docs/emby-playback-reporting.md for raw request/response examples from the plugin
- docs/emby-first-arch.md for historical notes

## Tech Summary

- Client: `emby-sdk-stainless`
- Timeout: 10 seconds for Emby HTTP calls
- Playback Reporting endpoint: `POST /emby/user_usage_stats/submit_custom_query`
- Database: The plugin exposes a limited SQL interface (single-statement, SQLite dialect)

## What We Query And Why

We need two distinct playback aggregation paths. These are enforced and there are no fallbacks:

- TV series: aggregate playback by title using the convention `"[title] - s%"` (ItemName pattern of plugin rows). This avoids enumerating thousands of episode IDs for big series.
- Movies: aggregate playback by `embyId` (single item id).

These constraints are implemented in `src/lib/services/emby-service.ts` and exposed via `EmbyService.getAggregatedPlaybackInfo`.

## Public API (for app code)

### `EmbyService.getAggregatedPlaybackInfo(input, embyInstance)`

- Input shape:

  - `title?: string`
  - `type?: 'movie' | 'tv'`
  - `embyId?: string`

- Behavior:

  - If `type === 'tv'`:
    - Requires `title`; if missing, logs an error and returns null
    - Queries playback plugin with the pattern `lower(ItemName) LIKE lower('[title] - s%')`
  - If `type === 'movie'`:
    - Requires `embyId`; if missing, logs an error and returns null
    - Queries playback plugin aggregating all rows with `ItemId == embyId`
  - Other `type` values: logs an error and returns null

- Return shape: `{ lastWatched?: Date; watchCount?: number; embyId: string; metadata?: Emby.BaseItem } | null`

### Other helpers (metadata, browsing, connectivity)

- `EmbyService.listLibraries(embyInstance)`
- `EmbyService.listLibraryItems({ embyInstance, libraryIds, types, pageSize })`
- `EmbyService.findItemByExactTitle(title, embyInstance)`
- `EmbyService.testConnection(embyInstance)`

Note: Provider-ID lookups (tvdb/tmdb/imdb) exist for metadata-only use cases, but are not used for playback aggregation.

## Playback Aggregation Queries

The plugin enforces a single-statement SQL policy. We therefore:

- Avoid CTEs (no `WITH`)
- Avoid multiple statements and trailing semicolons
- Use a single `SELECT` with a subquery for filtering
- Escape single quotes and strip semicolons from dynamic inputs
- Normalize case with `lower(...)`
- Count a row as a “watch” only when `PlayDuration` indicates meaningful play time

### Series (by title)

We aggregate series playback by matching the ItemName convention of `user_usage_stats`:

```
[title] - sXXeYY - [Episode Title]
```

SQL used:

```sql
SELECT
  MAX(DateCreated) AS LastWatched,
  SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount
FROM (
  SELECT DateCreated, PlayDuration
  FROM PlaybackActivity
  WHERE lower(ItemName) LIKE lower('[title] - s%')
) AS Activity
```

Inputs:

- `title` is required
- We escape `'` and strip `;`

### Movies (by embyId)

SQL used:

```sql
SELECT
  MAX(DateCreated) AS LastWatched,
  SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount
FROM (
  SELECT DateCreated, PlayDuration
  FROM PlaybackActivity
  WHERE ItemId IN ('[embyId]')
) AS Activity
```

Inputs:

- `embyId` is required
- For batching (rare for movies), we aggregate partials client-side

## Error Handling

- API-level errors (HTTP non-OK) are logged with status code and reason
- Plugin-level errors are surfaced via the `message` field in the JSON response; we log this and treat as failure
- Timeouts are enforced via `AbortController` (10s)

## Escaping and Sanitization

- Titles are sanitized as follows:
  - Replace `'` with `''` for SQL string literals
  - Remove `;` to avoid plugin multi-statement rejection
- Item IDs are quoted and `'` are escaped similarly (should already be numeric or GUID-like IDs)

## Why No Fallbacks

- Large series can include thousands of episode IDs; building an `IN (...)` predicate is fragile and may fail or be truncated
- The title convention `"[title] - s%"` is stable and scales regardless of series size
- Strict paths provide consistent performance and reduce API chatter

## Operational Notes

- Library listing and item browsing are paginated (`Limit`/`StartIndex`) to control memory usage
- Default item page sizes:
  - Libraries: Emby defaults
  - Items: 500 per page (configurable)
- Adjust `AGG_DEFAULT_BATCH_SIZE` if batching IDs for movies becomes necessary

## Testing Tips

1. Use `EmbyService.testConnection` to verify credentials and base URL
2. Validate series title path on a known show using docs/emby-playback-reporting.md patterns
3. Confirm aggregation results by comparing against Emby’s UI playback reports
4. Watch for plugin error `"SQL contains more than one statment"` (typo retained by plugin); if seen:
   - Ensure there are no CTEs or semicolons in the query
   - Ensure only a single `SELECT` statement is sent

## Future Work Considerations

- Optional tightening: add `ItemType = 'Episode'` for series queries if needed
- Consider caching frequent series aggregates to reduce plugin load
- Expose minimal health endpoint to verify plugin availability at startup

## Quick Usage Examples

### TypeScript (app code)

```ts
import { EmbyService } from '@/lib/services/emby-service';
import { singleEmbySettingsService } from '@/lib/utils/single-emby-settings';

const emby = await singleEmbySettingsService.getEnabled();

// Movie
const movieAgg = await EmbyService.getAggregatedPlaybackInfo(
  { type: 'movie', embyId: '123456' },
  emby
);

// Series
const seriesAgg = await EmbyService.getAggregatedPlaybackInfo(
  { type: 'tv', title: 'Dirty Jobs' },
  emby
);
```

### Raw curl (plugin)

```bash
# Series (title pattern)
curl -X POST 'https://EMBY/emby/user_usage_stats/submit_custom_query' \
  -H 'Content-Type: application/json' \
  -H 'X-Emby-Token: ${API_KEY}' \
  --data-raw '{
    "CustomQueryString":"SELECT MAX(DateCreated) AS LastWatched, SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount FROM ( SELECT DateCreated, PlayDuration FROM PlaybackActivity WHERE lower(ItemName) LIKE lower(\"Dirty Jobs - s%\") ) AS Activity",
    "ReplaceUserId": true
  }'

# Movie (single item id)
curl -X POST 'https://EMBY/emby/user_usage_stats/submit_custom_query' \
  -H 'Content-Type: application/json' \
  -H 'X-Emby-Token: ${API_KEY}' \
  --data-raw '{
    "CustomQueryString":"SELECT MAX(DateCreated) AS LastWatched, SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount FROM ( SELECT DateCreated, PlayDuration FROM PlaybackActivity WHERE ItemId IN (\"123456\") ) AS Activity",
    "ReplaceUserId": true
  }'
```

## Troubleshooting

- "SQL contains more than one statment" (plugin typo):
  - Ensure there is a single SELECT and no semicolons
  - Do not use CTEs (WITH ...)
  - Confirm dynamic values (title/id) do not include `;`
- No results for a TV series you expect has watches:
  - Verify the exact series title used in Emby and try that string
  - Check that `ItemName` rows in the plugin follow the `"[title] - s.."` pattern in your server
  - Consider adding `AND ItemType = 'Episode'` if you find ambiguous title collisions
- Timeout logs:
  - Server busy, network issues, or plugin slowness; retry manually via curl to isolate
- `columns` vs `colums` mismatch:
  - The plugin may return either key; code normalizes both

## Maintenance Checklist

- When changing aggregation logic:
  - Keep the two strict paths (movie by `embyId`, tv by `title`)
  - Preserve single-statement SQL constraint
  - Sanitize all dynamic inputs (escape `'`, remove `;`)
  - Update this doc and `docs/emby-playback-reporting.md` curl examples
- When adjusting performance knobs:
  - Consider `AGG_DEFAULT_BATCH_SIZE` for ID-based aggregation
  - Consider caching frequently-queried series
- When debugging data:
  - Use `EmbyService.findItemByExactTitle` for metadata verification (not for playback in TV path)
  - Log Emby API responses sparingly; avoid leaking API keys
