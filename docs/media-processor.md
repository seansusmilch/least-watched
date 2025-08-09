## Media Processor

High-signal notes for future work on the media processing pipeline that ingests Emby library items, enriches them with Sonarr/Radarr data and playback info, computes a deletion score, and upserts to the database.

### Purpose and responsibilities

- **Ingest**: Fetch Emby items (Movies, Series) from a single configured Emby instance.
- **Enrich**: Join with Sonarr/Radarr data using provider IDs (tvdb/tmdb/imdb) to populate file path, size, monitored, and TV stats.
- **Playback**: Aggregate last watched and watch count via Emby `user_usage_stats` plugin.
- **Score**: Compute a deletion score with user-configurable factors (days unwatched, never watched, size, age, folder space).
- **Persist**: Upsert processed records to `MediaItem` keyed by `embyId`.
- **Progress**: Expose coarse-grained progress phases for UI feedback.

### Key modules (src/lib/media-processor)

- `media-processor.ts`: Orchestrates the full pipeline (enumerate Emby → enrich → playback aggregation → store → progress updates).
- `storage.ts`: Converts `ProcessedMediaItem` into Prisma upsert payload and computes the deletion score using settings (and folder space).
- `constants.ts`: Config constants, quality score map helper, and folder space utility.
- `types.ts`: Shared types for processed items, progress, Sonarr/Radarr type aliases.
- `progress-store.ts`: In-memory progress holder used by actions/UI.
- `index.ts`: Export surface.

### Entry points and invocation flow

- UI action button calls `startMediaProcessing` (`src/lib/actions/media-processing.ts`), which starts a background task and immediately returns.
- Background task constructs `new MediaProcessor()` and calls `processAllMedia()`.
- Progress is written into `ProgressStore`; UI reads via `getProgress()` (`src/lib/actions/progress.ts`) and `useProgress()`.

### High-level processing sequence

1. Load enabled Sonarr/Radarr instances, date preference, and the single enabled Emby instance.
2. Early exit if no Emby instance is enabled.
3. Fetch all Sonarr Series and Radarr Movies; build matching maps by tvdb/tmdb/imdb for join enrichment.
4. Enumerate Emby library items (Movies, Series) with optional library filtering and paging (pageSize 500). Current run is limited by `TESTING_LIMIT`.
5. For each Emby item:
   - Create a base `ProcessedMediaItem` with ids, title, paths, year, and `embyId`.
   - Enrich from Sonarr (Series) or Radarr (Movies) via provider id maps to populate path, size, TV stats, monitored, and added date from Arr.
   - Aggregate playback (`lastWatched`, `watchCount`) via `EmbyService.getAggregatedPlaybackInfo()`.
   - Call `MediaStorage.storeProcessedItem()` → computes deletion score and upserts to DB.
6. Mark progress complete.

### External services and settings

- Emby
  - Single-instance settings via `single-emby-settings` (KV): `name`, `url`, `apiKey`, `enabled`, `selectedLibraries` (preferred) or legacy `selectedFolders`.
  - Listing: `EmbyService.listLibraryItems()` pages through items with fields `DateCreated, ProviderIds, Path, ProductionYear, MediaSources`.
  - Playback aggregation requires the Emby `user_usage_stats` plugin; custom SQL endpoints are used to compute `LastWatched` and `WatchCount`.
  - Series aggregation uses an ItemName convention of `[title] - s%` for episodes; movies aggregate by concrete `ItemId`.
- Sonarr/Radarr
  - Multiple instances supported; fetched in parallel. Used for enrichment and folder space data.
  - Clients live in `src/lib/services/{sonarr,radarr}-service.ts` with resilient `safeApiCall` wrappers.
- Folder space
  - `folderSpaceService.getFolderSpaceData()` gathers space per selected root folders from Sonarr/Radarr.
  - `calculateFolderRemainingSpacePercent(parentFolder, folderSpaceData)` assigns a remaining percent for scoring.
- Deletion score settings
  - Stored in flattened keys (KV `AppSettings`), fetched via `getDeletionScoreSettings()`.
  - Factors: days unwatched, never watched bonus, size on disk, age since added, folder space. Total max points must equal 100 when enabled.
  - Date preference (`arr` | `emby` | `oldest`) comes from `getDatePreference()` and affects age calculations.

### Data model and upsert details

- Prisma model `MediaItem` (`prisma/schema.prisma`)
  - Unique key: `embyId` (string). Upsert uses this as the identifier.
  - Indexed ids: `tmdbId`, `imdbId`, `tvdbId` for cross-service joins.
  - `sizeOnDisk` is stored as `BigInt`. Ensure values are non-negative; code safely converts from number to BigInt.
  - `deletionScore` is `Float` and always present (set to `-1` when scoring disabled during ingest).

### Identity matching and enrichment rules

- Type detection: Emby `Type === 'Series'` → `tv`, else `movie`.
- Matching order:
  - TV: tvdb → tmdb → imdb (case-insensitive for imdb).
  - Movie: tmdb → imdb.
- Enrichment fields populated when a match exists:
  - Path and `parentFolder`, `sizeOnDisk`.
  - TV stats: `episodesOnDisk`, `totalEpisodes`, `seasonCount`, `completionPercentage`.
  - Common: `monitored`, `dateAddedArr`, and Arr numeric IDs.

### Playback aggregation specifics

- Implemented in `src/lib/services/emby-service.ts`.
- Uses custom SQL via the Emby plugin for batch aggregation with timeouts and defensive parsing.
- Series aggregation is title-based to avoid enumerating all episodes; ensure titles in Emby match the canonical series title.
- Movies prefer concrete `ItemId` when available; otherwise try provider-id match, then exact title.

### Progress reporting

- `ProgressStore` is in-memory only (non-persistent). Server restarts clear progress.
- Phases used today: Initializing → Enumerating Emby → Processing Emby Items → Complete.
- UI polls `getProgress()`; completed state set with `isComplete: true`.

### Configuration knobs and current limitations

- **TESTING_LIMIT**: Hard cap on processed Emby items (default 10) for safety during development.
- **Series-only ingestion**: Current filter restricts to `Type === 'Series'` with a TODO to add movies.
- **In-memory progress**: Not multiprocess-safe; no persistence or deduping across runs.
- **Quality scoring**: `constants.getQualityScore()` exists, but `qualityScore` is not computed in `media-processor.ts` yet.
- **Selected scope**: Emby item enumeration can be limited by `selectedLibraries`. If unset, all libraries are scanned.
- **Logging**: Verbose console logging is present throughout; consider gating behind an env flag for production.

### Extension points and recommended next steps

- **Add movie ingestion**: Remove the `Type === 'Series'` filter and implement movie enrichment parity, including `runtime` and `sizePerHour` if available.
- **Compute quality score**: Populate `quality` and `qualityScore` using Arr media file quality and `getQualityScore()`.
- **Improve folder space accuracy**: Consider persisting enhanced disk space info and normalizing paths across OSes; handle UNC and mount points.
- **Make TESTING_LIMIT configurable**: Read from an app setting or env var; set `undefined` for full runs.
- **Persist progress**: Store progress in the DB or KV for resilience; add run IDs and timestamps.
- **Batching and backpressure**: Process Emby items in chunks to control memory; await DB upserts in controlled concurrency.
- **Multi-Emby support**: Current design assumes a single Emby instance; abstract to support multiple if needed.
- **Robust matching**: Add fuzzy title matching as a last resort; log unmatched items for review.
- **Observability**: Add metrics and structured logs; expose run summaries and error counts in UI.

### How to run during development

- Start the app: `bun dev`.
- In the UI Media page, click “Process Media” to trigger background processing.
- Alternatively, call `startMediaProcessing()` from a server action (it returns immediately while work continues in background).

### Gotchas

- Ensure the Emby `user_usage_stats` plugin is installed and reachable; without it, playback aggregation will be empty for series.
- The upsert key is `embyId`. If Emby items are removed and recreated, downstream dedupe relies on this ID’s stability.
- `datePreference` impacts scoring; if you change it, a recalculation is triggered elsewhere, but it won’t re-scan media—only scores.
