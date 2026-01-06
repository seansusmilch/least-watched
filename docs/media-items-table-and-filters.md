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
13. [Filter UI Organization](#13-filter-ui-organization)
14. [Media Title Hover Card](#14-media-title-hover-card)
15. [Deletion Preview and Confirmation](#15-deletion-preview-and-confirmation)
16. [Fullscreen Mode](#16-fullscreen-mode)

---

## 1. Data Loading and State Management

### Requirements

- Media items are fetched using TanStack Query with the query key `['processed-media-items']`.
- The fetch function is `getProcessedMediaItems()` (server action).
- Emby settings are fetched with query key `['emby-settings']` via `getEmbySettings()`.
- Available filter options (genres, qualities, sources, folders) are derived from the fetched items using `getUniqueFilterOptions()`.
- Filter and sort state is managed via React Context (`MediaFilterProvider`) using the `useMediaFilters` hook.
- TanStack Table manages internal table state (column visibility, row selection, column filters, global filter) separately from the filter context.
- Filtering and sorting are applied at the data level before passing to TanStack Table via `filterAndSortMediaItems()`.

### Data Flow

1. `MediaPageClient` fetches data with TanStack Query (media items and Emby settings in parallel)
2. `getUniqueFilterOptions()` extracts available filter values
3. `MediaPageContent` wraps content in `MediaFilterProvider`
4. `MediaTableWithFilters` applies context filters/sorting to items via `useMemo`
5. `MediaTableBase` receives pre-filtered data and manages table-level state via `useMediaTable`

### Edge Cases

- Empty data set: When no items are returned, the table renders without errors with zero rows.
- Query refetch: After server-side changes (e.g., deletion), invalidating `['processed-media-items']`, `['media-items']`, and `['media-summary']` refreshes the UI.
- Loading state: While `isLoading` is true (either items or Emby settings loading), skeleton UI is displayed.
- Missing Emby configuration: Table functions without poster URLs when Emby settings are unavailable.

---

## 2. Media Item Data Model

### Required Fields

| Field                         | Type         | Description                            |
| ----------------------------- | ------------ | -------------------------------------- |
| `id`                          | string       | Unique identifier                      |
| `title`                       | string       | Display name                           |
| `type`                        | string       | `'movie'` or `'tv'`                    |
| `year`                        | number?      | Release year (nullable)                |
| `dateAddedEmby`               | Date/string? | When added to Emby                     |
| `dateAddedArr`                | Date/string? | When added to Sonarr/Radarr            |
| `effectiveDateAdded`          | Date/string? | Computed preferred date                |
| `lastWatched`                 | Date/string? | Last watch timestamp                   |
| `sizeOnDisk`                  | bigint?      | Size in bytes                          |
| `source`                      | string?      | Source name (Sonarr/Radarr instance)   |
| `mediaPath`                   | string?      | Full file path                         |
| `parentFolder`                | string?      | Parent folder name for display         |
| `watchCount`                  | number       | Number of times watched                |
| `unwatchedDays`               | number       | Days since last watched or added       |
| `quality`                     | string?      | Quality profile (e.g., "1080p")        |
| `qualityScore`                | number?      | Quality score 0-100                    |
| `episodesOnDisk`              | number?      | TV only: episodes available            |
| `totalEpisodes`               | number?      | TV only: total episodes                |
| `seasonCount`                 | number?      | TV only: number of seasons             |
| `completionPercentage`        | number?      | TV only: % of episodes watched         |
| `monitored`                   | boolean?     | Whether actively monitored             |
| `imdbRating`                  | number?      | IMDb rating                            |
| `tmdbRating`                  | number?      | TMDB rating                            |
| `playProgress`                | number?      | Play progress percentage               |
| `fullyWatched`                | boolean?     | Whether fully watched                  |
| `runtime`                     | number?      | Runtime in minutes                     |
| `sizePerHour`                 | number?      | Size efficiency metric (GB/hour)       |
| `genres`                      | unknown?     | Array of genre strings                 |
| `overview`                    | string?      | Description/synopsis                   |
| `folderRemainingSpacePercent` | number?      | Available space in folder (percentage) |
| `deletionScore`               | number?      | Calculated deletion priority (0-100)   |
| `embyId`                      | string?      | Emby identifier for image URLs         |
| `sonarrId`                    | number?      | Sonarr identifier                      |
| `radarrId`                    | number?      | Radarr identifier                      |

### Date Preference System

The `getEffectiveDateAdded()` function determines which date to use based on user preference:

- `'arr'`: Prefer Sonarr/Radarr date, fall back to Emby if arr date is null
- `'emby'`: Prefer Emby date, fall back to Sonarr/Radarr if emby date is null
- `'oldest'`: Use the older of the two dates; if only one exists, use that one

### Edge Cases

- Dates may be `Date` objects or ISO strings (from cache); all date handling accepts both via type checking.
- `sizeOnDisk` can be `number` or `bigint`; convert using `Number()` before arithmetic operations.
- `genres` field is `unknown`; validated as array of strings or single string before use; empty array if invalid.

---

## 3. Filter System

### Filter State Structure

All filter state is managed in `FilterOptions` interface with the following categories:

### Basic Filters

| Filter     | Type                                 | Behavior                   |
| ---------- | ------------------------------------ | -------------------------- |
| searchTerm | string                               | Searches item titles only  |
| searchType | `'contains'` / `'exact'` / `'regex'` | How search term is matched |
| mediaTypes | Set<'movie'/'tv'>                    | Empty set = all types      |
| sources    | Set<string>                          | Empty set = all sources    |

### Watch Status Filters

| Filter             | Type                                 | Behavior                     |
| ------------------ | ------------------------------------ | ---------------------------- |
| watchStates        | Set<'watched'/'unwatched'/'partial'> | Empty set = all states       |
| unwatchedDaysRange | { min?: number, max?: number }       | Filter by days since watched |
| lastWatchedRange   | { start?: Date, end?: Date }         | Date range filter            |
| watchCountRange    | { min?: number, max?: number }       | Filter by view count         |

### Quality & Size Filters

| Filter            | Type                                 | Behavior            |
| ----------------- | ------------------------------------ | ------------------- |
| sizeRange         | { min?: number, max?: number, unit } | Filter by file size |
| qualities         | Set<string>                          | Empty set = all     |
| qualityScoreRange | { min?: number, max?: number }       | 0-100 score filter  |
| sizePerHourRange  | { min?: number, max?: number }       | Efficiency filter   |

The `sizeRange.unit` field is either `'GB'` or `'MB'` (default: `'GB'`).

### Content Filters

| Filter       | Type                                         | Behavior                                              |
| ------------ | -------------------------------------------- | ----------------------------------------------------- |
| yearRange    | { min?: number, max?: number }               | Release year filter                                   |
| genres       | Set<string>                                  | OR match - item must have at least one selected genre |
| ratingRange  | { imdb?: {min?, max?}, tmdb?: {min?, max?} } | Rating filters (applied independently)                |
| runtimeRange | { min?: number, max?: number }               | Runtime in minutes                                    |

### TV-Specific Filters

| Filter            | Type                           | Behavior                                   |
| ----------------- | ------------------------------ | ------------------------------------------ |
| completionRange   | { min?: number, max?: number } | Percentage of episodes watched             |
| seasonCountRange  | { min?: number, max?: number } | Number of seasons                          |
| episodeCountRange | { min?: number, max?: number } | Episodes on disk                           |
| monitored         | boolean \| undefined           | `undefined` = all, `true` = only monitored |

### Management Filters

| Filter             | Type                           | Behavior                                |
| ------------------ | ------------------------------ | --------------------------------------- |
| dateAddedRange     | { start?: Date, end?: Date }   | Uses effective date based on preference |
| folders            | Set<string>                    | Filter by parent folder                 |
| deletionScoreRange | { min?: number, max?: number } | Priority score filter                   |

### Legacy Filters (Backward Compatibility)

These continue to work alongside new filters:

| Filter       | Type                         | Behavior                     |
| ------------ | ---------------------------- | ---------------------------- |
| filterType   | `'all'` / `'movie'` / `'tv'` | Old-style type filter        |
| minSize      | string                       | Minimum size in GB as string |
| folderFilter | string                       | Single folder path match     |

Legacy size filter uses: `sizeOnDisk >= parseFloat(minSize) * 1024 * 1024 * 1024`

### Meta Fields

| Field         | Type                   | Behavior                              |
| ------------- | ---------------------- | ------------------------------------- |
| filterMode    | `'basic'` / `'advanced'` | Filter UI mode                      |
| savedPresetId | string?                | ID of currently applied preset        |

### Watch State Logic

The `applyWatchStateFilter` function determines watch state as follows:

- **isWatched**: `watchCount > 0` OR `lastWatched` is not null/undefined
- **isPartial**: TV shows only where `completionPercentage > 0 AND completionPercentage < 100`
- **Watched filter**: Matches if `isWatched AND NOT isPartial`
- **Unwatched filter**: Matches if `NOT isWatched`
- **Partial filter**: Matches if `isPartial`

### Search Type Behavior

- **Contains**: Case-insensitive substring match (`title.toLowerCase().includes(term.toLowerCase())`)
- **Exact**: Case-insensitive exact match (`title.toLowerCase() === term.toLowerCase()`)
- **Regex**: Uses provided pattern with case-insensitive flag; falls back to "contains" on invalid regex (catches exception silently)

### Folder Matching

Folder filters use `isMediaPathInFolder()` which:

1. Normalizes both paths (backslashes to forward slashes, lowercase, removes trailing slashes)
2. Checks if normalized media path starts with normalized folder path
3. Matches against both `mediaPath` and `parentFolder` fields

### Genre Matching

- Genres are OR-matched: item matches if it has at least one genre in the filter set
- `genres` field is validated: must be array of strings or a single string
- Items with no valid genres fail the filter if genres filter is active

### Range Filter Behavior

All range filters (`applyRangeFilter`) follow this logic:

1. If both `min` and `max` are undefined/falsy, match all
2. If value is `undefined` or `null`, fail the filter when any bound is set
3. If `min` is set, value must be >= min
4. If `max` is set, value must be <= max

### Date Range Filter Behavior

Date range filters (`applyDateRangeFilter`) follow this logic:

1. If both `start` and `end` are undefined, match all
2. If value is `undefined`, fail the filter
3. Convert string dates to Date objects for comparison
4. If `null` after conversion, fail the filter
5. Value must be >= start (if set) and <= end (if set)

### Size Filter Behavior

Size filter (`applySizeFilter`) converts bytes to specified unit:

- Multiplier: GB = 1024³, MB = 1024²
- Compares `Number(sizeInBytes) / multiplier` against min/max
- Returns true if no bounds are set
- Returns false if `sizeInBytes` is undefined

### Filter Combination

All filters are AND-combined: an item must match ALL active filters to be included in results.

### Active Filter Count

The UI displays a count of active filters, incrementing for each of:
- Non-empty search term
- Non-empty media types set
- Non-empty sources set
- Non-empty watch states set
- Unwatched days range with min or max
- Size range with min or max
- Non-empty qualities set
- Quality score range with min or max
- Year range with min or max
- Non-empty genres set
- IMDB rating range with min or max
- Runtime range with min or max
- Completion range with min or max
- Non-empty folders set
- Deletion score range with min or max
- Monitored filter defined (not undefined)

### Edge Cases

- Empty Sets for multi-select filters mean "match all" (no filtering applied).
- Range filters with both `min` and `max` undefined mean "match all".
- `null` or `undefined` values: Items with missing values fail range/date filters when any bound is set.
- Regex errors: Invalid regex patterns fall back to "contains" matching silently.
- Source filter: Matches against `item.source || ''` (empty string for null sources).
- Quality filter: Matches against `item.quality || ''` (empty string for null quality).

---

## 4. Sorting

### Requirements

- Default sort is determined on component mount by checking `getDeletionScoreSettings()`:
  - If deletion scoring is enabled: `deletionScore desc`
  - Otherwise: `unwatchedDays desc`
- Sort changes via `handleSort(field)` function:
  - If same field: toggle between asc/desc
  - If different field: set to desc (default)

### Sort Toggle Behavior

1. First click on column: desc
2. Second click on same column: asc
3. Third click on same column: desc again
4. Click different column: desc on new column

### Sort Comparison Logic

The `sortMediaItems` function handles sorting:

- Numbers: Direct numeric comparison (`aValue - bValue`)
- Dates: `getTime()` comparison (assumes Date objects)
- Strings and others: `String(aValue || '').localeCompare(String(bValue || ''))`
- Modifier: multiply by -1 for desc order

### Edge Cases

- `null`/`undefined` values: When `aValue === bValue` (including both null/undefined), returns 0 (equal)
- Mixed types: Falls back to string comparison
- Date objects assumed: If both values are Date instances, uses getTime(); cached data may be strings

---

## 5. Table Display

### Columns

| Column ID     | Field                | Default Visible | Features                                               |
| ------------- | -------------------- | --------------- | ------------------------------------------------------ |
| select        | -                    | Always          | Checkbox, cannot be hidden (`enableHiding: false`)     |
| title         | title                | Yes             | Sortable, filterable, flex-grows with min-width 200px, hover card |
| type          | type                 | Yes             | Badge with icon (Film for movie, Tv for series)        |
| year          | year                 | No              | Sortable, displays "N/A" when null                     |
| size          | sizeOnDisk           | Yes             | Formatted using `formatFileSize()` (GB/TB)             |
| quality       | quality              | No              | Badge, variant based on qualityScore (>80 = default)   |
| completion    | completionPercentage | No              | Progress bar for TV, badge for movies                  |
| rating        | imdbRating           | No              | Star emoji (⭐) with rating, "N/A" when null           |
| source        | source               | Yes             | Badge variant="outline", "Unknown" when null           |
| folder        | parentFolder         | No              | Badge variant="outline", "N/A" when null               |
| dateAdded     | effectiveDateAdded   | Yes             | Formatted date using `formatDate()`                    |
| dateAddedEmby | dateAddedEmby        | No              | Formatted date                                         |
| dateAddedArr  | dateAddedArr         | No              | Formatted date                                         |
| lastWatched   | lastWatched          | Yes             | Eye icon + date, or "Never" when null                  |
| unwatchedDays | unwatchedDays        | Yes             | Badge with Clock icon and color coding                 |
| deletionScore | deletionScore        | Yes             | Badge with priority indicator, clickable for breakdown |

### Column Sizing

- Title column: `flex: 1` with `min-width: 200px`
- All other columns: Fixed widths defined in column definitions (size property)
- Minimum table width: `Math.max(totalColumnWidth, 1000)` pixels

### Column Sizes (from column definitions)

| Column        | Size (px) |
| ------------- | --------- |
| select        | 60        |
| title         | 350       |
| type          | 120       |
| year          | 80        |
| size          | 120       |
| quality       | 120       |
| completion    | 150       |
| rating        | 100       |
| source        | 120       |
| folder        | 200       |
| dateAdded     | 140       |
| dateAddedEmby | 160       |
| dateAddedArr  | 160       |
| lastWatched   | 150       |
| unwatchedDays | 160       |
| deletionScore | 160       |

### Unwatched Days Badge Colors

- `> 365 days`: variant="destructive" (red)
- `> 30 days`: variant="secondary"
- `<= 30 days`: variant="outline"

### Deletion Score Badge Colors

- `> 70`: variant="destructive" + "High Priority" text label
- `> 40`: variant="secondary"
- `<= 40`: variant="outline"

### Quality Badge Colors

- `qualityScore > 80`: variant="default"
- `qualityScore <= 80`: variant="secondary"

### Completion Column Behavior

- TV shows with `completionPercentage` defined: Progress bar + percentage text
- Movies: Badge showing "Complete" (if fullyWatched) or "Unwatched"
- Missing data: "N/A" in muted text

### Date Formatting

Uses Luxon library via `formatDate()`:

- Accepts Date objects or ISO strings
- Converts strings via `DateTime.fromISO()`, objects via `DateTime.fromJSDate()`
- Returns locale-formatted short date (`DateTime.DATE_SHORT`)
- Returns "N/A" for null/invalid dates

### File Size Formatting

Uses `formatFileSize()`:

- >= 1TB: Display as TB with 2 decimal places
- < 1TB: Display as GB with 1 decimal place

### Edge Cases

- Missing values display "N/A", "Unknown", or "Never" as contextually appropriate
- Title column truncates with CSS (`truncate` class)
- Columns support sorting and filtering via TanStack Table

---

## 6. Column Visibility

### Requirements

- Column visibility is persisted to `localStorage` under key `least-watched-column-visibility`.
- On load, saved visibility is merged with defaults (new columns get default visibility from `availableColumns` config).
- "Select" column has `enableHiding: false` and cannot be hidden.
- Users toggle visibility via a Popover with checkboxes for each hideable column.
- Reset button calls `table.resetColumnVisibility()` which restores to TanStack Table's initial state.
- Close button dismisses the popover.

### Column Configuration

The `availableColumns` array in `columnConfig.ts` defines:

- `id`: Column identifier
- `label`: Display name in visibility dropdown
- `defaultVisible`: Whether visible by default

### Persistence Logic

`loadColumnVisibility()`:

1. Check if `window` exists (SSR guard)
2. Read from localStorage
3. Parse JSON; on error, return defaults
4. Merge saved preferences with default visibility (ensures new columns are included)
5. Only apply saved preferences for columns that exist in defaults

`saveColumnVisibility()`:

1. Check if `window` exists (SSR guard)
2. Stringify and save to localStorage
3. On error, log warning and continue

### Edge Cases

- Corrupted localStorage: Falls back to default visibility (catches JSON parse errors).
- New columns added: Automatically get default visibility since merge uses defaults as base.
- Server-side rendering: `localStorage` access is guarded with `typeof window !== 'undefined'`.
- Column visibility changes: Saved on every change via useEffect in `useMediaTable`.

---

## 7. Row Selection

### Requirements

- Multi-row selection via checkboxes in the select column.
- Header checkbox has three states:
  - Unchecked: No rows selected
  - Checked: All rows selected (`table.getIsAllRowsSelected()`)
  - Indeterminate: Some rows selected (`table.getIsSomeRowsSelected()`)
- Selection badge in header shows: "{count} selected ({formatted size})"
- Selection controls only appear when at least one row is selected.
- Delete button appears alongside selection badge when items are selected.

### Available Helper Functions (from useMediaTable)

| Function                          | Return Type | Description                                         |
| --------------------------------- | ----------- | --------------------------------------------------- |
| `getSelectedItems()`              | MediaItem[] | Returns array of selected item objects              |
| `getSelectedItemIds()`            | string[]    | Returns array of selected item IDs                  |
| `getSelectedItemSize()`           | number      | Returns total size in bytes of selected items       |
| `clearSelection()`                | void        | Deselects all rows (`toggleAllRowsSelected(false)`) |
| `selectAll()`                     | void        | Selects all rows (`toggleAllRowsSelected(true)`)    |
| `selectItemsByIds(ids: string[])` | void        | Clears selection, then selects specified IDs        |

### Size Calculation

`getSelectedItemSize()` uses:

```
rows.reduce((sum, row) => sum + (Number(row.original.sizeOnDisk) || 0), 0)
```

### Edge Cases

- Selected rows that are filtered out: Selection state persists in TanStack Table but may reference rows not in current view.
- Missing `sizeOnDisk`: Treated as 0 in size calculations.
- `selectItemsByIds`: First clears all, then iterates through IDs finding matching rows in current model.

---

## 8. Global Search

### Requirements

- Persistent search input in table header card.
- Searches across specific columns: `title`, `type`, `source`, `folder` (parentFolder).
- Case-insensitive substring matching.
- This is table-level filtering, separate from the filter context's `searchTerm` (which only searches titles).

### Implementation Details

- Uses TanStack Table's `globalFilter` state.
- Custom `globalFilterFn` checks if `columnId` is in the allowed set before matching.
- Returns `true` for all rows when search is empty.
- Converts value to string before comparison.

### Search Behavior

```
const search = String(filterValue ?? '').toLowerCase();
if (!search) return true;
const value = row.getValue(columnId);
if (value === null || value === undefined) return false;
return String(value).toLowerCase().includes(search);
```

### Edge Cases

- `null`/`undefined` column values: Returns `false` (excluded from matches).
- Empty search: Returns `true` for all rows.
- Only specified columns are searched; other columns ignored.
- Column not in allowed set: Returns `false` for that column.

---

## 9. Virtualization

### Requirements

- Uses `@tanstack/react-virtual` for performance with large datasets.
- Estimated row height: 40px.
- Overscan: 25 rows above and below viewport.
- Default container height: 70vh.
- Fullscreen container height: `calc(100vh - 12rem)`.
- Horizontal scroll synchronization between header and body.

### Virtualization Configuration

Constants defined in `@/lib/constants/table`:
- `VIRTUALIZER_CONFIG.estimateSize`: 40
- `VIRTUALIZER_CONFIG.overscan`: 25
- `SCROLL_SYNC_THROTTLE_MS`: 10
- `MIN_TABLE_WIDTH`: 1000

### Scroll Synchronization

- Uses `useTableScrollSync` hook with refs for header and table container elements.
- Throttled sync (10ms minimum between syncs) to prevent jank.
- Bidirectional: container scroll syncs to header, header scroll syncs to container.
- Uses passive event listeners for scroll events.
- Cleanup removes event listeners on unmount.

### Virtual Row Rendering

Each virtual row:

- Positioned absolutely with `transform: translateY()`
- Uses `virtualizer.measureElement` ref for dynamic height measurement
- Has `data-index` attribute for the row index

### Edge Cases

- Empty table: Virtualizer handles zero-row case gracefully.
- Dynamic row heights: Rows are measured after render via `measureElement`.
- Minimum table width enforced: `Math.max(totalWidth, 1000)`

---

## 10. Deletion Score Breakdown Dialog

### Requirements

- Opens when clicking a deletion score badge in the table.
- Uses `useDeletionBreakdown` hook that listens for custom event `openDeletionBreakdown` with `{ detail: { item: MediaItem } }`.
- Event listener attached to `window` in the hook.

### Dialog Content

1. **Header**: "Deletion Score Breakdown" title with item title in badge
2. **Overall Score Card**: Score out of 100, progress bar, priority label
3. **Category Cards**: One for each enabled category with expandable explanations
4. **Summary Card**: Usage instructions (shown when categories exist)

### Score Categories

| Category Key  | Icon       | Title               | Details Shown                           |
| ------------- | ---------- | ------------------- | --------------------------------------- |
| daysUnwatched | Clock      | Days Unwatched      | Days count, category, last watched date |
| neverWatched  | Eye        | Never Watched Bonus | Whether bonus applies                   |
| sizeOnDisk    | HardDrive  | Size on Disk        | Formatted size, category                |
| ageSinceAdded | Calendar   | Age Since Added     | Days count, category, added date        |
| folderSpace   | FolderOpen | Folder Space        | Remaining percent, category             |

### Category Card Features

- Header: Icon + title + badge showing "pointsEarned/maxPoints"
- Info button: Toggles detailed explanation (managed by `expandedCategories` state)
- Category-specific details in muted text
- Expanded explanation in highlighted block with accent border

### Priority Labels and Colors

| Score Range | Color (Badge Variant) | Label           |
| ----------- | --------------------- | --------------- |
| > 70        | destructive           | High Priority   |
| > 40        | secondary             | Medium Priority |
| <= 40       | outline               | Low Priority    |

### Data Loading

1. On dialog open, fetches `getDeletionScoreSettings()` and `getDatePreference()` in parallel
2. Converts item to scoring format via `convertMediaItemToScoringFormat()`
3. Calculates breakdown via `deletionScoreCalculator.calculateScoreBreakdown()`
4. Filters to enabled categories only for display

### Edge Cases

- Loading state: Spinner (Loader2) shown while fetching settings.
- No enabled categories: Message directing user to Settings → Deletion Score Configuration.
- Missing breakdown data: Fallback message with Info icon.
- Error during load: Logs to console, loading state ends.

---

## 11. Quick Filters

### Available Presets

| ID                  | Label               | Description             | Filters Applied                                                        |
| ------------------- | ------------------- | ----------------------- | ---------------------------------------------------------------------- |
| unwatched           | Unwatched           | Items never watched     | `watchStates: Set(['unwatched'])`                                      |
| old-unwatched       | Old & Unwatched     | Unwatched for 365+ days | `watchStates: Set(['unwatched'])` + `unwatchedDaysRange: { min: 365 }` |
| low-quality         | Low Quality         | Quality score below 60  | `qualityScoreRange: { max: 60 }`                                       |
| large-files         | Large Files         | Files over 10GB         | `sizeRange: { min: 10, unit: 'GB' }`                                   |
| high-deletion-score | High Deletion Score | Deletion score over 70  | `deletionScoreRange: { min: 70 }`                                      |

### Behavior

- Clicking a quick filter **merges** its filters with current state (does not reset other filters).
- Uses `applyQuickFilter()` from filter context which spreads new filters over existing state.
- Quick filters section displays with Zap icon and "Quick Filters" heading.
- Each preset rendered as outline button with rounded-full styling.

---

## 12. Loading States

### Requirements

- Skeleton UI shown while data is loading (`isLoading` from TanStack Query).
- Page-level: Animated pulse div (h-32) + `MediaTableSkeleton` component (not shown in fullscreen mode).
- Skeleton matches table structure with placeholder rows.
- 8 skeleton rows displayed during load.

### Skeleton Structure

- Card with header containing skeleton title and disabled Columns button
- Grid-based layout mimicking table columns (8 columns)
- Header row with varied-width skeletons
- 8 body rows with consistent skeleton pattern

---

## 13. Filter UI Organization

### Component Structure

The `MediaFiltersClient` component is displayed in a **Sheet (Side Drawer)** from the right side, organized as follows:

### 1. Sheet Header

- Title: "Filters" with Filter icon
- Description: Active filter count or "Refine your media list"
- Action: "Reset" button with RotateCcw icon (appears when filters are active)

### 2. Scrollable Content Area

**Active Filters Display:**

- Displays a list of dismissible badges (chips) for all currently active filters.
- Each badge shows filter label and X icon.
- Clicking badge removes that specific filter.
- Heading: "Active Filters" in muted text.

**Quick Filters:**

- Horizontal wrap of outline buttons for presets.
- Heading: "Quick Filters" with Zap icon.

**Filter Sections (Accordion):**
The filters are grouped into expandable accordion sections. "Common Filters" is open by default (`defaultValue={['common']}`).

1.  **Common Filters** (default open)

    - Search Title input with search icon + Search Type selector (Contains/Exact/Regex)
    - Media Types (Movies/TV) via MultiSelect
    - Sources via MultiSelect
    - Root Folders via MultiSelect

2.  **Watch Status** (Eye icon)

    - Watch States (Watched/Unwatched/Partial) via MultiSelect
    - Unwatched Days slider (0-1000)

3.  **Quality & Size** (HardDrive icon)

    - Qualities via MultiSelect
    - Quality Score slider (0-100)
    - Size slider (0-100 GB)

4.  **Content Details** (Star icon)

    - Genres via MultiSelect
    - Year slider (1900-current year)
    - Runtime slider (0-300 min)

5.  **TV Specific** (Tv icon)

    - "Only Monitored" switch
    - Completion % slider (0-100)
    - Seasons slider (1-20)

6.  **Management** (Settings icon)
    - Deletion Score slider (0-100)

### 3. Sheet Footer

- Status text: "Showing {totalItems} items matching filters"
- Background: muted/20 with top border

### UI Patterns

- **Sheet**: Slides in from the right, max-width md on desktop.
- **Accordion**: Multiple sections can be open simultaneously (`type='multiple'`).
- **ScrollArea**: Ensures filters are accessible on small screens.
- **RangeSlider**: Custom component for dual-thumb sliders with min/max display.
- **Reset Button**: One-click clear all filters.

---

## 14. Media Title Hover Card

### Requirements

- Displays on hover over media item title in the table.
- Opens after 300ms delay, closes after 100ms delay.
- Only shows if item has poster URL (Emby configured with embyId) or overview.

### Content Structure

1. **Poster Image**: Left side, 140px width on desktop, full width on mobile
2. **Header**: Title, type badge with icon, year, quality badge
3. **Stats**: IMDb rating, TMDB rating, runtime, watch count, size on disk
4. **TV Show Info**: Season count and episodes on disk (TV only)
5. **Genre Badges**: Up to displayed genres as badges
6. **Overview**: Description text, line-clamped to 3-4 lines

### Edge Cases

- No Emby configuration: Title renders as plain text without hover functionality.
- No overview and no poster: Title renders as plain text.
- Image load error: Handled gracefully (image hidden on error).

---

## 15. Deletion Preview and Confirmation

### Requirements

- Opens when Delete button is clicked with items selected.
- Shows all selected items with their posters and deletion scores.
- Requires explicit confirmation before deletion.

### Dialog Content

1. **Header**: Warning icon with "Confirm Deletion" title in destructive color
2. **Description**: Item count and warning message
3. **Items List**: Scrollable area with each item showing:
   - Poster image (or placeholder icon)
   - Title
   - Deletion score badge (clickable to open breakdown)
   - Top 3 scoring factors with values
4. **Summary**: Item count and total size to be freed
5. **Footer**: Cancel and Delete buttons

### Deletion Score Display in Preview

- Calculates scores for all items on dialog open
- Uses cancellation ref to handle dialog close during calculation
- Shows loading spinner while calculating
- Displays top 3 contributing factors (sorted by points earned)

### Post-Deletion Behavior

1. Dialog closes
2. Invalidates queries: `['media-items']`, `['processed-media-items']`, `['media-summary']`
3. Refetches active `['media-items']` queries
4. Resets row selection
5. Shows toast notification:
   - Success: "Successfully deleted X items (Y Sonarr, Z Radarr)"
   - Partial: Warning with success and failure counts
   - Failure: Error toast

---

## 16. Fullscreen Mode

### Requirements

- Table can display in fullscreen mode via dedicated `/media` route.
- Fullscreen mode adjusts table height to fill available viewport.
- Navigation button changes based on mode.

### Visual Differences

| Aspect           | Normal Mode        | Fullscreen Mode                |
| ---------------- | ------------------ | ------------------------------ |
| Table Height     | 70vh               | calc(100vh - 12rem)            |
| Container        | space-y-6          | h-full flex flex-col           |
| Card             | default            | h-full flex flex-col           |
| Card Content     | default            | flex-1 min-h-0                 |
| Navigation       | "Expand" → /media  | "Back to Dashboard" → /        |
| Loading Skeleton | With summary pulse | Without summary pulse          |

### Navigation

- Normal mode: Shows Maximize2 icon with "Expand" linking to `/media`
- Fullscreen mode: Shows ArrowLeft icon with "Back to Dashboard" linking to `/`

---
