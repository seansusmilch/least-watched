## Handling Emby title collisions in playback queries

### Problem

When querying Emby playback activity by title using a prefix match, short titles collide with longer titles that share the same prefix. Example: querying for "It" also returns playback rows for "It's Always Sunny in Philadelphia".

### Goals

- **Correctness**: Associate playback stats with the exact intended item.
- **Resilience**: Work even when provider IDs are missing.
- **Performance**: Keep requests low-latency; avoid wide scans.

### Current state (as of src/lib/services/emby-service.ts)

- We search playback via a custom SQL against the `user_usage_stats` plugin filtering by `ItemName LIKE '<title>%'`. This is collision-prone for short titles.
- We have `getEmbyMediaDataEnhanced` that can resolve items by provider IDs (tvdb/tmdb/imdb) first, but playback lookup still falls back to title-based search.

## Strategy

### 1) Resolve the exact Emby item first (prefer IDs over titles)

- Use `EmbyService.findItemByProviderIds` to get an exact `Emby.BaseItem` whenever we have tvdb/tmdb/imdb from Sonarr/Radarr.
- If multiple candidates exist, prefer:
  - Matching `IncludeItemTypes` by the expected media type (movie vs series)
  - Items within configured library IDs (if provided)
  - Closest `ProductionYear` to the source year

Result: we obtain `ItemId` deterministically.

### 2) Query playback by ItemId, never by prefix title

Once we know `ItemId`, query the plugin using `WHERE ItemId = ?` instead of `ItemName LIKE ...`.

SQL (single item):

```sql
WITH RecentActivity AS (
  SELECT ROWID, DateCreated, ItemId, ItemName, PlayDuration
  FROM PlaybackActivity
  WHERE ItemId = '<<ITEM_ID>>'
  ORDER BY DateCreated DESC
  LIMIT 1
),
WatchCount AS (
  SELECT COUNT(*) AS WatchCount
  FROM PlaybackActivity
  WHERE ItemId = '<<ITEM_ID>>'
  AND PlayDuration > 300 AND PlayDuration < 28800
)
SELECT r.ROWID, r.DateCreated, r.ItemId, r.ItemName, r.PlayDuration, w.WatchCount
FROM RecentActivity r
CROSS JOIN WatchCount w;
```

Batching (optional, for performance):

```sql
-- IN batching for multiple item IDs in one round trip
SELECT ItemId, MAX(DateCreated) AS LastDate
FROM PlaybackActivity
WHERE ItemId IN ('<<ID1>>','<<ID2>>', '<<ID3>>')
GROUP BY ItemId;
```

### 2.1) Series aggregation: fetch episode IDs, then query once (aggregate only)

For series, playback occurs at the episode level. To compute series-level stats:

1. Resolve the series `Id` (prefer provider IDs; otherwise strict title match via SDK).
2. Fetch all episode ItemIds for the series via SDK, e.g. using filters with `ParentId = <seriesId>` and `IncludeItemTypes = Episode`. Consider filtering out specials (SeasonNumber = 0) if desired.
3. Run a single aggregated SQL against the plugin using an `IN` list of episode IDs.
4. Optionally chunk the `IN` list if it exceeds practical payload size (e.g., batches of 500–1000 IDs) and merge results application-side.

Aggregate series-level stats (single round trip, no per-episode rows):

```sql
WITH Activity AS (
  SELECT ItemId, DateCreated, PlayDuration
  FROM PlaybackActivity
  WHERE ItemId IN (<<EPISODE_ID_LIST>>)
),
SeriesTotals AS (
  SELECT
    MAX(DateCreated) AS SeriesLastWatched,
    SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS SeriesWatchCount
  FROM Activity
SELECT
  (SELECT SeriesLastWatched FROM SeriesTotals) AS SeriesLastWatched,
  (SELECT SeriesWatchCount FROM SeriesTotals) AS SeriesWatchCount
;
```

Implementation notes:

- Use the SDK to list episodes reliably; avoid title-based guessing for series.
- Deduplicate episode IDs, and optionally filter to aired/monitored episodes to reduce noise.
- Update parsing to handle series-level columns (e.g., `SeriesLastWatched`, `SeriesWatchCount`). Keep parsers separate from the single-item path. We do not need per-episode rows.
- Add batching logic and merge partial aggregates in memory: `max(LastWatched)` across batches; `sum(WatchCount)` across batches.

### 3) Behavior when ItemId queries return no rows

- Treat as "no playbacks" for that movie or series (aggregate over episodes). Do not attempt title-based fallbacks.

### 4) Configurability and safe rollout

- Use ItemId-only mode for playback lookups. Title-based modes are not supported.

## Implementation plan (concrete edits)

### A) Add ItemId-aware playback method

- Introduce `getPlaybackInfoByItemId(itemId, embyInstance)` that uses the ItemId SQL above.
- Keep `getPlaybackInfo(title, embyInstance)` as a thin wrapper that first resolves an `ItemId` via SDK search and then delegates to the ItemId method. Remove dependency on prefix `LIKE`.

### A1) Add batched ItemIds playback method (movie = length 1; series = many)

- Introduce `getPlaybackInfoByItemIds(itemIds: string[], embyInstance)` that aggregates across all provided IDs and returns a single result:
  - For a movie, call with a singleton array `[movieId]`.
  - For a series, call with all episode IDs for the series.
- SQL (aggregate across IDs):

```sql
WITH Activity AS (
  SELECT ItemId, DateCreated, PlayDuration
  FROM PlaybackActivity
  WHERE ItemId IN (<<ITEM_ID_LIST>>)
),
Totals AS (
  SELECT
    MAX(DateCreated) AS LastWatched,
    SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount
  FROM Activity
)
SELECT LastWatched, WatchCount FROM Totals;
```

- Response shaping:
  - Parse `LastWatched` to `Date | undefined`.
  - Use `WatchCount` (number, default 0 if null).
  - For a singleton array, include `embyId = itemIds[0]`. For multi-ID arrays, omit `embyId`.
- Batching: If `itemIds.length` exceeds a safe threshold (e.g., 500–1000), split into chunks, run multiple queries, then reduce in memory:
  - `lastWatched = max(lastWatchedChunk...)`
  - `watchCount = sum(watchCountChunk...)`
- Reuse existing timeout and error-handling logic from the custom-query path.

### B) Wire provider-ID path to the ItemId method

- In `getEmbyMediaDataEnhanced`, if `findItemByProviderIds` returns a match, call `getPlaybackInfoByItemId(matchedItem.Id, embyInstance)` directly.
- Return `{ embyId: matchedItem.Id, metadata: matchedItem }` when no playback rows exist.

### C) Defensive query building

- Continue escaping quotes; prefer exact equality or ItemId filters. Avoid prefix `LIKE` for playback queries.
- Retain the request timeout and error handling already present.

## Risks and mitigations

- Plugin schema variance: rely only on `PlaybackActivity` columns we already use (`ItemId`, `ItemName`, `DateCreated`, `PlayDuration`).
- Missing plugin: surface a clear error and gracefully return null.
- Performance: prefer ItemId path, optionally batch queries; cache providerId→ItemId mappings in memory during a processing run.

## Actionable checklist

- [ ] Add `getPlaybackInfoByItemId(itemId, embyInstance)` using ItemId SQL
- [ ] Rework `getPlaybackInfo(title, embyInstance)` to resolve item first, then delegate
- [ ] Update `getEmbyMediaData`/`getEmbyMediaDataEnhanced` to pass ItemId when known
- [ ] Ensure there is no title-based fallback path in playback queries
- [ ] Tests for collisions, short titles, and provider-ID flow
