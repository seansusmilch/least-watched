# Media Processor Requirements

This document specifies the requirements and expected behaviors of the media processing pipeline. It serves as a reliable guide for preserving functionality during refactors.

---

## 1. Media Processing Trigger

### 1.1 Starting Processing

- The user can initiate media processing from the UI via a "Process Media" button.
- Processing starts in the background and returns immediately to the UI without blocking.
- Only one processing run should be active at a time (determined by progress state).
- Before processing starts, any existing progress state is cleared.

### 1.2 Prerequisites

- At least one Emby instance must be enabled for processing to proceed.
- If no Emby instance is enabled, processing exits immediately with no items processed.

---

## 2. Media Ingestion

### 2.1 Source System

- Media items are fetched exclusively from the configured Emby instance.
- The system supports a single Emby instance at a time.

### 2.2 Item Types

- Both TV Series (`Type === 'Series'`) and Movies (`Type === 'Movie'`) are processed.
- Items are fetched from Emby with both types requested simultaneously.

### 2.3 Library Filtering

- If `selectedLibraries` is configured on the Emby instance, only items from those libraries are processed.
- If no libraries are selected, all libraries are scanned.

### 2.4 Item Limit

- An optional environment variable `MEDIA_PROCESSOR_ITEM_LIMIT` can restrict the number of items processed per run.
- When set, the limit applies **separately** to each media type:
  - Up to N TV Series items
  - Up to N Movie items
- When unset, all matching items of both types are processed without limit.

### 2.5 Pagination

- Emby items are fetched with pagination using a page size of 500 items.
- Pagination continues until all matching items are retrieved.

---

## 3. Data Enrichment

### 3.1 Enrichment Sources

Media items are enriched from two sources:

1. **Sonarr** — for TV series
2. **Radarr** — for movies

### 3.2 Pre-fetching Strategy

- All series from all enabled Sonarr instances are fetched upfront and indexed by provider IDs.
- All movies from all enabled Radarr instances are fetched upfront and indexed by provider IDs.
- This pre-fetching enables O(1) lookups during item processing.

### 3.3 Matching Strategy

Items are matched between Emby and Sonarr/Radarr using provider IDs:

| Media Type | Match Priority Order |
| ---------- | -------------------- |
| TV Series  | TVDB → TMDB → IMDB   |
| Movies     | TMDB → IMDB          |

- IMDB matching is case-insensitive.
- The first successful match is used; no fallback to title-based matching.

### 3.4 Enriched Data from Arr Systems

When a match is found, the following fields are populated:

**Common fields:**

- `mediaPath` — file system path
- `parentFolder` — parent directory of the media (derived from path)
- `sizeOnDisk` — total size in bytes
- `monitored` — whether the item is monitored in Sonarr/Radarr
- `dateAddedArr` — date the item was added to Sonarr/Radarr
- Sonarr or Radarr internal ID

**TV-specific fields:**

- `episodesOnDisk` — number of episode files present
- `totalEpisodes` — total episode count for the series
- `seasonCount` — number of seasons
- `completionPercentage` — percentage of episodes on disk (rounded to nearest integer)

**Movie-specific fields:**

- `quality` — quality profile name from Radarr (from movieFile.quality.quality.name)

### 3.5 Unmatched Items

- Items without a match in Sonarr/Radarr retain only Emby-sourced data.
- No error is raised for unmatched items; they are stored with available data.
- Unmatched items have `sizeOnDisk` of 0.

---

## 4. Playback Data Aggregation

### 4.1 Data Source

- Playback data is retrieved from Emby's `user_usage_stats` plugin via custom SQL queries.
- The plugin must be installed and accessible for playback data to be available.

### 4.2 Aggregated Fields

- `lastWatched` — most recent playback date
- `watchCount` — number of completed playbacks

### 4.3 Watch Count Criteria

A playback is counted as a "watch" when:

- Play duration is greater than 300 seconds (5 minutes) AND
- Play duration is less than 28,800 seconds (8 hours)

### 4.4 Aggregation Strategy by Type

| Type      | Strategy                     | Identifier Required |
| --------- | ---------------------------- | ------------------- |
| TV Series | Title-based pattern matching | `title`             |
| Movies    | Direct item ID lookup        | `embyId`            |

**TV Series Aggregation:**

- Uses pattern `[title] - s%` to match episode playback records by series title.
- Aggregates all episode playbacks for the series.
- Title is SQL-escaped (single quotes doubled, semicolons removed).

**Movie Aggregation:**

- Looks up playback records by the exact Emby item ID.
- ID is SQL-escaped before query execution.

### 4.5 Batching for Large Item Sets

- For item ID-based lookups, IDs are processed in batches of 800.
- Results are aggregated across batches (latest lastWatched, summed watchCount).

### 4.6 Error Handling

- Missing required identifiers (title for series, embyId for movies) result in null playback data with an error logged.
- Unknown or missing media type results in null playback data with an error logged.
- No fallback strategies are attempted.

---

## 5. Deletion Score Calculation

### 5.1 Scoring Overview

- Each media item receives a deletion score between 0 and 100.
- Higher scores indicate higher priority for deletion.
- When scoring is disabled, items receive a score of `-1`.
- Invalid calculations (NaN, Infinity) or missing item data result in a score of 0.

### 5.2 Scoring Factors

The deletion score is composed of five configurable factors:

| Factor              | Description                                                               |
| ------------------- | ------------------------------------------------------------------------- |
| Days Unwatched      | Points based on time since last watched (or since added if never watched) |
| Never Watched Bonus | Flat bonus points if item has never been played                           |
| Size on Disk        | Points based on file size in GB                                           |
| Age Since Added     | Points based on how long the item has been in the library                 |
| Folder Space        | Points based on remaining disk space percentage                           |

### 5.3 Factor Configuration

Each factor (except Never Watched) uses breakpoints:

- Breakpoints define value thresholds and corresponding percentage of max points.
- Breakpoints are sorted from highest to lowest value for evaluation.
- The first breakpoint where the item's value is **greater than** the breakpoint value determines the score.
- If no breakpoint is exceeded, zero points are earned.

### 5.4 Date Preference

The "date added" value used for scoring can be configured:

- `arr` — Prefer Sonarr/Radarr date, fall back to Emby date
- `emby` — Prefer Emby date, fall back to Arr date
- `oldest` — Use whichever date is earlier

### 5.5 Days Unwatched Reference Date

- If the item has been watched, uses `lastWatched` date.
- If the item has never been watched, uses the effective "date added" (per date preference).

### 5.6 Folder Space Calculation

- Matches the item's parent folder to configured Sonarr/Radarr root folders.
- Calculates remaining space as a percentage of total disk space.
- If no matching folder is found, folder space factor is not applied.
- Folder matching uses path prefix comparison (folder starts with or contains item path).

### 5.7 Score Validation

- Scores are clamped to the range 0–100.
- Invalid calculations (NaN, Infinity) result in a score of 0.
- The total score is capped at 100 even if individual factors sum higher.

---

## 6. Data Persistence

### 6.1 Storage Model

- Media items are stored in the `MediaItem` database table.
- The unique key for upsert operations is `embyId`.

### 6.2 Upsert Behavior

- Existing items (matching `embyId`) are updated with new data.
- New items are created.
- No items are deleted during processing.

### 6.3 Size Handling

- `sizeOnDisk` is stored as `BigInt`.
- Negative values are converted to 0.
- Null/undefined values are stored as null.

### 6.4 Stored Fields

All processed data is persisted, including:

- Identifiers (title, embyId, tmdbId, imdbId, tvdbId, sonarrId, radarrId)
- Metadata (year, type, quality, overview, genres)
- File information (mediaPath, parentFolder, sizeOnDisk)
- Playback data (lastWatched, watchCount)
- TV stats (episodesOnDisk, totalEpisodes, seasonCount, completionPercentage)
- Dates (dateAddedEmby, dateAddedArr)
- Status (monitored)
- Calculated score (deletionScore)

### 6.5 Genres Storage

- Genres are stored as JSON.
- Empty or missing genres are stored as `Prisma.JsonNull`.

---

## 7. Progress Reporting

### 7.1 Progress Phases

Processing reports progress through the following phases in order:

1. **Initializing** — Setup and configuration loading
2. **Enumerating Emby** — Fetching and filtering items from Emby
3. **Processing Emby Items** — Enriching and storing each item
4. **Complete** — All items processed

### 7.2 Progress Data

Each progress update includes:

- `phase` — Current phase name
- `current` — Number of items processed
- `total` — Total items to process
- `currentItem` — Name of the item currently being processed
- `percentage` — Completion percentage (0–100, rounded to integer)
- `isComplete` — Boolean indicating processing is finished (only set in Complete phase)

### 7.3 Progress Storage

- Progress is stored in memory only.
- Progress is not persisted across server restarts.
- Progress can be polled by the UI via `getProgress()`.
- Progress is cleared before each new processing run.

### 7.4 Progress States

The UI can observe three states:

- `none` — No processing has occurred or progress was cleared
- `live` — Processing is currently in progress
- `completed` — Processing finished successfully

### 7.5 Enumeration Message

- The Enumerating Emby phase message displays the breakdown of found items: "Found X series and Y movies".

---

## 8. Folder Space Monitoring

### 8.1 Data Sources

Folder space data is gathered from:

- Sonarr instances — root folders and disk space endpoints
- Radarr instances — root folders and disk space endpoints

### 8.2 Folder Selection

- Each Sonarr/Radarr instance can have `selectedFolders` configured.
- Only selected folders are included in space monitoring.
- If no folders are selected, all root folders are included.

### 8.3 Space Metrics

For each folder, the following is tracked:

- `totalSpace` — Total disk capacity
- `freeSpace` — Available space
- `usedSpace` — Space currently in use
- Percentages for free and used space

### 8.4 Path Normalization

- Folder paths are normalized for consistent matching.
- Windows paths use backslashes and are lowercased.
- POSIX paths use forward slashes.
- Trailing slashes are stripped (except for root directories like `C:\` or `/`).

### 8.5 Shared Folder Detection

- Folders appearing in multiple instances are flagged as shared.
- Shared folder information includes which instances share the folder.
- Instance count is tracked for shared folders.

### 8.6 Folder Display Filtering

Folders are only displayed if:

- They are selected (or no selection filter is applied).
- They have valid, finite numeric values for all space metrics.
- Total space is greater than 0.
- Used and free space percentages are within 0–100 range.

---

## 9. External Service Connectivity

### 9.1 Supported Instances

| Service | Multiple Instances | Purpose                        |
| ------- | ------------------ | ------------------------------ |
| Emby    | Single only        | Media source, playback data    |
| Sonarr  | Multiple           | TV enrichment, folder space    |
| Radarr  | Multiple           | Movie enrichment, folder space |

### 9.2 Instance Requirements

Each service instance requires:

- `name` — Display name
- `url` — Base URL for API access
- `apiKey` — Authentication key
- `enabled` — Whether the instance is active

### 9.3 Emby-Specific Configuration

- `selectedLibraries` — List of library IDs to scan (optional)
- Backward compatibility: `selectedFolders` is supported as a fallback for `selectedLibraries`

### 9.4 Sonarr/Radarr-Specific Configuration

- `selectedFolders` — List of root folder paths to monitor (optional)

### 9.5 Connection Timeouts

- Emby connections use a 10-second timeout.
- Arr API calls use resilient wrappers with error handling.
- Individual instance failures do not halt processing of other instances.

---

## 10. Edge Cases and Constraints

### 10.1 Items Without Emby ID

- Items lacking an `Id` from Emby are skipped with a warning logged.

### 10.2 Processing Errors

- Errors processing individual items are logged but do not halt the overall run.
- Other items continue to be processed after an error.
- Storage errors return a deletion score of -1 for the affected item.

### 10.3 Missing Playback Plugin

- If the Emby `user_usage_stats` plugin is not installed, playback aggregation returns empty results.
- Items are still processed but without playback data (lastWatched undefined, watchCount 0).

### 10.4 Provider ID Normalization

- All provider IDs from Emby are normalized to lowercase keys.
- IMDB IDs are matched case-insensitively.

### 10.5 Empty Libraries

- If no items match the configured filters, processing completes with zero items.

### 10.6 Deleted and Recreated Items

- If an Emby item is deleted and recreated with a new ID, it becomes a new record.
- The old record remains in the database until manually cleared.

### 10.7 Item Name Resolution

- Item name is determined from: `item.Name` → `item.OriginalTitle` → `'Unknown'`

---

## 11. Database Management

### 11.1 Clearing Media Items

- Users can clear all media items from the database.
- This action deletes all `MediaItem` records.
- Processing must be re-run to repopulate data.
- The cleared count is reported in the success message.

### 11.2 Score Recalculation

- Changing deletion score settings triggers a recalculation for existing items.
- Recalculation does not re-fetch data from external services.
- Only the score is recomputed using stored item data.

### 11.3 Settings Import

- Importing settings via Backup & Restore triggers deletion score recalculation.
- This applies only when scoring is enabled.

---

## 12. Processing Statistics

### 12.1 Tracked Metrics

The following metrics are tracked during each processing run:

- `totalTimeMs` — Total processing time in milliseconds
- `itemsProcessed` — Number of items successfully processed
- `itemsWithArrMatch` — Number of items matched to Sonarr/Radarr
- `itemsWithPlayback` — Number of items with playback data found
- `avgTimePerItemMs` — Average processing time per item
- `embyItemsFetched` — Total Emby items retrieved (after limiting)
- `sonarrSeriesFetched` — Total series from Sonarr pre-fetch
- `radarrMoviesFetched` — Total movies from Radarr pre-fetch

### 12.2 Completion Logging

On completion, the following summary is logged:

- Total time and item count with average time per item
- Arr match rate (matched/total)
- Playback data rate (found/total)
- Pre-fetch counts for Sonarr and Radarr
- Emby item breakdown by type (series count, movie count, total)

---

## 13. Current Limitations

The following are known limitations of the current implementation:

1. **Single Emby instance** — Only one Emby server can be configured.
2. **In-memory progress** — Progress is lost on server restart.
3. **No quality score computation** — Quality data is stored but not used in scoring.
4. **No title-based fallback matching** — Unmatched items remain unmatched.
5. **Sequential item processing** — Items are processed one at a time, not in parallel batches.
6. **No deletion actions** — The system identifies candidates but does not perform deletions.
