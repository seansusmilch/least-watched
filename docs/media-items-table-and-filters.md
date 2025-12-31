# Media Items Table and Filters – Requirements Document

This document specifies the functional requirements for the Media Items Table and Filters feature. It serves as a reference for future refactoring to ensure existing functionality is preserved.

---

## Table of Contents

1. [Data Loading and State Management](#1-data-loading-and-state-management)
2. [Media Item Data Model](#2-media-item-data-model)
3. [Filter System](#3-filter-system)
4. [Sorting](#4-sorting)
5. [Table Display](#5-table-display)
6. [Column Visibility](#6-column-visibility)
7. [Row Selection](#7-row-selection)
8. [Global Search](#8-global-search)
9. [Virtualization](#9-virtualization)
10. [Deletion Score Breakdown Dialog](#10-deletion-score-breakdown-dialog)
11. [Quick Filters](#11-quick-filters)
12. [Loading States](#12-loading-states)

---

## 1. Data Loading and State Management

### Requirements

- Media items are fetched using TanStack Query with the query key `['processed-media-items']`.
- Available filter options (genres, qualities, sources, folders) are derived from the fetched items using `getUniqueFilterOptions()`.
- Filter and sort state is managed via React Context (`MediaFilterProvider`).
- Table state (TanStack Table internals) is separate from filter state.

### Edge Cases

- Empty data set: When no items are returned, the table must render without errors.
- Query refetch: After server-side changes, invalidating `['processed-media-items']` must refresh the UI.

---

## 2. Media Item Data Model

### Required Fields

| Field                         | Type         | Description                          |
| ----------------------------- | ------------ | ------------------------------------ |
| `id`                          | string       | Unique identifier                    |
| `title`                       | string       | Display name                         |
| `type`                        | string       | `'movie'` or `'tv'`                  |
| `year`                        | number?      | Release year                         |
| `dateAddedEmby`               | Date/string? | When added to Emby                   |
| `dateAddedArr`                | Date/string? | When added to Sonarr/Radarr          |
| `effectiveDateAdded`          | Date/string? | Computed preferred date              |
| `lastWatched`                 | Date/string? | Last watch timestamp                 |
| `sizeOnDisk`                  | bigint?      | Size in bytes                        |
| `source`                      | string?      | Source name (Sonarr/Radarr instance) |
| `mediaPath`                   | string?      | Full file path                       |
| `parentFolder`                | string?      | Parent folder name for display       |
| `watchCount`                  | number       | Number of times watched              |
| `unwatchedDays`               | number       | Days since last watched or added     |
| `quality`                     | string?      | Quality profile (e.g., "1080p")      |
| `qualityScore`                | number?      | Quality score 0-100                  |
| `episodesOnDisk`              | number?      | TV only: episodes available          |
| `totalEpisodes`               | number?      | TV only: total episodes              |
| `seasonCount`                 | number?      | TV only: number of seasons           |
| `completionPercentage`        | number?      | TV only: % of episodes watched       |
| `monitored`                   | boolean?     | Whether actively monitored           |
| `imdbRating`                  | number?      | IMDb rating                          |
| `tmdbRating`                  | number?      | TMDB rating                          |
| `playProgress`                | number?      | Play progress percentage             |
| `fullyWatched`                | boolean?     | Whether fully watched                |
| `runtime`                     | number?      | Runtime in minutes                   |
| `sizePerHour`                 | number?      | Size efficiency metric               |
| `genres`                      | unknown?     | Array of genre strings               |
| `overview`                    | string?      | Description/synopsis                 |
| `folderRemainingSpacePercent` | number?      | Available space in folder            |
| `deletionScore`               | number?      | Calculated deletion priority         |

### Date Preference System

The `getEffectiveDateAdded()` function determines which date to use based on user preference:

- `'arr'`: Prefer Sonarr/Radarr date, fall back to Emby
- `'emby'`: Prefer Emby date, fall back to Sonarr/Radarr
- `'oldest'`: Use the older of the two dates

### Edge Cases

- Dates may be `Date` objects or ISO strings (from cache); all date handling must accept both.
- `sizeOnDisk` can be `number` or `bigint`; convert using `Number()` before comparisons.
- `genres` field is `unknown`; must validate as array or string before use.

---

## 3. Filter System

### Basic Filters

| Filter      | Type                                 | Behavior                   |
| ----------- | ------------------------------------ | -------------------------- |
| Search Term | string                               | Searches item titles       |
| Search Type | `'contains'` / `'exact'` / `'regex'` | How search term is matched |
| Media Types | Set<'movie'/'tv'>                    | Empty = all types          |
| Sources     | Set<string>                          | Empty = all sources        |

### Watch Status Filters

| Filter               | Type                                 | Behavior                     |
| -------------------- | ------------------------------------ | ---------------------------- |
| Watch States         | Set<'watched'/'unwatched'/'partial'> | Empty = all states           |
| Unwatched Days Range | { min?, max? }                       | Filter by days since watched |
| Last Watched Range   | { start?, end? }                     | Date range filter            |
| Watch Count Range    | { min?, max? }                       | Filter by view count         |

### Quality & Size Filters

| Filter              | Type                            | Behavior              |
| ------------------- | ------------------------------- | --------------------- |
| Size Range          | { min?, max?, unit: 'GB'/'MB' } | Filter by file size   |
| Qualities           | Set<string>                     | Empty = all qualities |
| Quality Score Range | { min?, max? }                  | 0-100 score filter    |
| Size Per Hour Range | { min?, max? }                  | Efficiency filter     |

### Content Filters

| Filter        | Type                                         | Behavior                                              |
| ------------- | -------------------------------------------- | ----------------------------------------------------- |
| Year Range    | { min?, max? }                               | Release year filter                                   |
| Genres        | Set<string>                                  | OR match - item must have at least one selected genre |
| Rating Range  | { imdb?: {min?, max?}, tmdb?: {min?, max?} } | Rating filters                                        |
| Runtime Range | { min?, max? }                               | Runtime in minutes                                    |

### TV-Specific Filters

| Filter              | Type           | Behavior                                   |
| ------------------- | -------------- | ------------------------------------------ |
| Completion Range    | { min?, max? } | Percentage of episodes watched             |
| Season Count Range  | { min?, max? } | Number of seasons                          |
| Episode Count Range | { min?, max? } | Episodes on disk                           |
| Monitored           | boolean?       | `undefined` = all, `true` = only monitored |

### Management Filters

| Filter               | Type             | Behavior                                |
| -------------------- | ---------------- | --------------------------------------- |
| Date Added Range     | { start?, end? } | Uses effective date based on preference |
| Folders              | Set<string>      | Filter by parent folder                 |
| Deletion Score Range | { min?, max? }   | Priority score filter                   |

### Legacy Filters (Backward Compatibility)

These must continue to work alongside new filters:

| Filter       | Type                         | Behavior                     |
| ------------ | ---------------------------- | ---------------------------- |
| filterType   | `'all'` / `'movie'` / `'tv'` | Old-style type filter        |
| minSize      | string                       | Minimum size in GB as string |
| folderFilter | string                       | Single folder path match     |

### Watch State Logic

- **Watched**: `watchCount > 0` OR `lastWatched` is defined, AND NOT partial
- **Unwatched**: `watchCount === 0` AND `lastWatched` is undefined
- **Partial**: TV shows only where `0 < completionPercentage < 100`

### Search Type Behavior

- **Contains**: Case-insensitive substring match
- **Exact**: Case-insensitive exact match
- **Regex**: Uses provided regex pattern; falls back to "contains" on invalid regex

### Folder Matching

Folder filters match if the item's `mediaPath` or `parentFolder` starts with the filter path after normalization (forward slashes, lowercase).

### Edge Cases

- Empty Sets for multi-select filters mean "match all" (no filtering).
- Range filters with both `min` and `max` undefined mean "match all".
- `null` or `undefined` values: Items with missing values fail range filters if either bound is set.
- Regex errors: Invalid regex patterns fall back to "contains" matching silently.
- All filters are AND-combined; item must match ALL active filters.

---

## 4. Sorting

### Requirements

- Default sort: `deletionScore desc` when deletion scoring is enabled, otherwise `unwatchedDays desc`.
- Sort is determined on mount by checking `getDeletionScoreSettings()`.
- Clicking a column header toggles sort: first click = desc, second = asc, third = desc again.
- Clicking a different column resets to desc on that column.

### Sortable Fields

All `MediaItem` fields can be sorted. The sort function handles:

- Numbers: Numeric comparison
- Dates: `getTime()` comparison
- Strings: `localeCompare()`

### Edge Cases

- `null`/`undefined` values: Treated as equal to each other.
- Mixed types: Falls back to string comparison.

---

## 5. Table Display

### Columns

| Column ID     | Field                | Default Visible | Features                                 |
| ------------- | -------------------- | --------------- | ---------------------------------------- |
| select        | -                    | Always          | Checkbox, cannot be hidden               |
| title         | title                | Yes             | Sortable, filterable, flex-grows         |
| type          | type                 | Yes             | Badge with icon (Film/TV)                |
| year          | year                 | No              | Sortable                                 |
| size          | sizeOnDisk           | Yes             | Formatted (GB/TB)                        |
| quality       | quality              | No              | Badge, color based on score              |
| completion    | completionPercentage | No              | Progress bar for TV, badge for movies    |
| rating        | imdbRating           | No              | Star icon with rating                    |
| source        | source               | Yes             | Badge                                    |
| folder        | parentFolder         | No              | Badge                                    |
| dateAdded     | effectiveDateAdded   | Yes             | Formatted date                           |
| dateAddedEmby | dateAddedEmby        | No              | Formatted date                           |
| dateAddedArr  | dateAddedArr         | No              | Formatted date                           |
| lastWatched   | lastWatched          | Yes             | Eye icon + date or "Never"               |
| unwatchedDays | unwatchedDays        | Yes             | Badge with color coding                  |
| deletionScore | deletionScore        | Yes             | Badge with priority indicator, clickable |

### Column Sizing

- Title column uses flex-grow with min-width 200px.
- All other columns have fixed widths defined in column config.
- Total minimum table width is enforced at 1000px.

### Unwatched Days Badge Colors

- `> 365 days`: destructive (red)
- `> 30 days`: secondary
- `<= 30 days`: outline

### Deletion Score Badge Colors

- `> 70`: destructive + "High Priority" label
- `> 40`: secondary
- `<= 40`: outline

### Edge Cases

- Missing values display "N/A" or "Unknown" or "Never" as appropriate.
- Quality column shows "Unknown" when quality is null.
- Completion column shows "N/A" for items without completion data.

---

## 6. Column Visibility

### Requirements

- Column visibility is persisted to `localStorage` under key `least-watched-column-visibility`.
- On load, saved visibility is merged with defaults (new columns get default visibility).
- "Select" column cannot be hidden.
- Users can toggle visibility via a popover with checkboxes.
- Reset button restores default visibility.

### Edge Cases

- Corrupted localStorage: Falls back to default visibility.
- New columns added: Default visibility is applied automatically.
- Server-side rendering: `localStorage` access is guarded with `typeof window !== 'undefined'`.

---

## 7. Row Selection

### Requirements

- Multi-row selection via checkboxes.
- Header checkbox toggles all visible rows.
- Indeterminate state when some rows are selected.
- Selection badge shows count and total size of selected items.
- Available helper functions:
  - `getSelectedItems()`: Returns selected `MediaItem[]`
  - `getSelectedItemIds()`: Returns selected IDs
  - `getSelectedItemSize()`: Returns total size in bytes
  - `clearSelection()`: Deselects all
  - `selectAll()`: Selects all
  - `selectItemsByIds(ids)`: Select specific items by ID

### Edge Cases

- Selected rows that are filtered out remain in selection state.
- Size calculation handles missing/null `sizeOnDisk` gracefully.

---

## 8. Global Search

### Requirements

- Persistent search input in table header.
- Searches across columns: `title`, `type`, `source`, `folder` (parentFolder).
- Case-insensitive substring matching.
- This is separate from the filter system's search (which only searches titles).

### Edge Cases

- `null`/`undefined` column values: Excluded from matches.
- Empty search: Shows all rows.

---

## 9. Virtualization

### Requirements

- Uses `@tanstack/react-virtual` for performance.
- Estimated row height: 40px.
- Overscan: 25 rows above and below viewport.
- Scroll synchronization between header and body (horizontal scroll).

### Edge Cases

- Empty table: Virtualizer handles zero-row case.
- Dynamic row heights: Rows are measured after render.
- Header/body scroll sync uses throttling to prevent jank.

---

## 10. Deletion Score Breakdown Dialog

### Requirements

- Opens when clicking a deletion score badge.
- Uses custom event `openDeletionBreakdown` for cross-component communication.
- Shows overall score with progress bar and priority label.
- Shows breakdown by category:
  - Days Unwatched
  - Never Watched Bonus
  - Size on Disk
  - Age Since Added
  - Folder Space
- Each category shows points earned vs max points.
- Info icon expands detailed explanation for each category.
- Only enabled categories are displayed.

### Priority Labels

- `> 70`: "High Priority"
- `> 40`: "Medium Priority"
- `<= 40`: "Low Priority"

### Edge Cases

- Loading state: Spinner shown while fetching settings.
- No enabled categories: Message directing user to settings.
- Missing breakdown data: Appropriate fallback message.

---

## 11. Quick Filters

### Available Presets

| ID                  | Name                | Description             | Filters Applied                           |
| ------------------- | ------------------- | ----------------------- | ----------------------------------------- |
| unwatched           | Unwatched           | Items never watched     | watchStates: Set(['unwatched'])           |
| old-unwatched       | Old & Unwatched     | Unwatched for 365+ days | watchStates + unwatchedDaysRange.min: 365 |
| low-quality         | Low Quality         | Quality score below 60  | qualityScoreRange.max: 60                 |
| large-files         | Large Files         | Files over 10GB         | sizeRange.min: 10, unit: 'GB'             |
| high-deletion-score | High Deletion Score | Deletion score over 70  | deletionScoreRange.min: 70                |

### Behavior

- Clicking a quick filter merges its filters with current state (does not reset).
- Quick filters section is collapsible (closed by default).

---

## 12. Loading States

### Requirements

- Skeleton UI shown while data is loading.
- Skeleton matches table structure with placeholder rows.
- 8 skeleton rows displayed during load.

---

## Filter UI Organization

The filters dialog has the following structure:

1. **Header**: Filter icon, title, active filter count badge, "Clear All" button
2. **Active filters summary**: Text list of currently active filter types
3. **Quick Filters** (collapsible, closed by default): Preset filter buttons
4. **Basic Filters** (collapsible, closed by default):
   - Search input with type selector
   - Media type multi-select
   - Source multi-select
5. **Advanced Filters** (collapsible): Accordion with sections:
   - Watch Status (watch states, unwatched days slider)
   - Quality & Size (qualities, quality score, size sliders)
   - Content Details (year, runtime sliders, genres)
   - TV Show Specific (completion %, season count, monitored toggle)
   - Management (folders, deletion score slider)
6. **Footer**: Total items count

---

## File Reference

| Purpose            | File Path                                                 |
| ------------------ | --------------------------------------------------------- |
| Types              | `src/lib/types/media.ts`                                  |
| Filter logic       | `src/lib/utils/mediaFilters.ts`                           |
| Filter hook        | `src/hooks/useMediaFilters.ts`                            |
| Filter context     | `src/components/media/filters/MediaFilterProvider.tsx`    |
| Filter UI          | `src/components/media/filters/MediaFiltersClient.tsx`     |
| Table hook         | `src/hooks/useMediaTable.ts`                              |
| Table columns      | `src/components/media/table/mediaTableColumns.tsx`        |
| Table base         | `src/components/media/table/MediaTableBase.tsx`           |
| Table with filters | `src/components/media/table/MediaTableWithFilters.tsx`    |
| Column config      | `src/lib/utils/columnConfig.ts`                           |
| Column dropdown    | `src/components/media/table/ColumnVisibilityDropdown.tsx` |
| Skeleton           | `src/components/media/table/MediaTableSkeleton.tsx`       |
| Score breakdown    | `src/components/media/summary/DeletionScoreBreakdown.tsx` |
| Page client        | `src/components/media/MediaPageClient.tsx`                |
| Page content       | `src/components/media/MediaPageContent.tsx`               |
| Formatters         | `src/lib/utils/formatters.ts`                             |
| Path utils         | `src/lib/utils.ts` (isMediaPathInFolder)                  |
