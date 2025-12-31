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

---

## 1. Data Loading and State Management

### Requirements

- Media items are fetched using TanStack Query with the query key `['processed-media-items']`.
- The fetch function is `getProcessedMediaItems()` (server action).
- Available filter options (genres, qualities, sources, folders) are derived from the fetched items using `getUniqueFilterOptions()`.
- Filter and sort state is managed via React Context (`MediaFilterProvider`) using the `useMediaFilters` hook.
- TanStack Table manages internal table state (column visibility, row selection, column filters, global filter) separately from the filter context.
- Filtering and sorting are applied at the data level before passing to TanStack Table via `filterAndSortMediaItems()`.

### Data Flow

1. `MediaPageClient` fetches data with TanStack Query
2. `getUniqueFilterOptions()` extracts available filter values
3. `MediaPageContent` wraps content in `MediaFilterProvider`
4. `MediaTableWithFilters` applies context filters/sorting to items
5. `MediaTableBase` receives pre-filtered data and manages table-level state

### Edge Cases

- Empty data set: When no items are returned, the table renders without errors with zero rows.
- Query refetch: After server-side changes, invalidating `['processed-media-items']` refreshes the UI.
- Loading state: While `isLoading` is true, skeleton UI is displayed.

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

### Watch State Logic

The `applyWatchStateFilter` function determines watch state as follows:

- **isWatched**: `watchCount > 0` OR `lastWatched` is defined (not null/undefined)
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

1. If both `min` and `max` are undefined, match all
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

### Filter Combination

All filters are AND-combined: an item must match ALL active filters to be included in results.

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
| title         | title                | Yes             | Sortable, filterable, flex-grows with min-width 200px  |
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
- Returns locale-formatted short date
- Returns "N/A" for null/invalid dates

### File Size Formatting

Uses `formatFileSize()`:

- > = 1TB: Display as TB with 2 decimal places
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
- Badge only appears when at least one row is selected.

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
const value = row.getValue(columnId);
return String(value).toLowerCase().includes(search);
```

### Edge Cases

- `null`/`undefined` column values: Returns `false` (excluded from matches).
- Empty search: Returns `true` for all rows.
- Only specified columns are searched; other columns ignored.

---

## 9. Virtualization

### Requirements

- Uses `@tanstack/react-virtual` for performance with large datasets.
- Estimated row height: 40px.
- Overscan: 25 rows above and below viewport.
- Container height: 70vh.
- Horizontal scroll synchronization between header and body.

### Scroll Synchronization

- Uses refs for header and table container elements.
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
- Uses custom event `openDeletionBreakdown` with `{ detail: { item: MediaItem } }` for cross-component communication.
- Event listener attached to `window` in `MediaTableBase` component.

### Dialog Content

1. **Header**: "Deletion Score Breakdown" title with item title in badge
2. **Overall Score Card**: Score out of 100, progress bar, priority label
3. **Category Cards**: One for each enabled category
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
- Info button: Toggles detailed explanation
- Category-specific details in muted text
- Expanded explanation in highlighted block

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
- Quick filters section is collapsible (closed by default via `defaultOpen={false}`).
- Each preset has an icon field (unused in current UI, shows Zap icon for all).

---

## 12. Loading States

### Requirements

- Skeleton UI shown while data is loading (`isLoading` from TanStack Query).
- Page-level: Animated pulse div (h-32) + `MediaTableSkeleton` component.
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

The `MediaFiltersClient` component is displayed in a **Sheet (Side Drawer)**, organized as follows:

### 1. Sheet Header

- Title: "Filters" with Filter icon
- Description: Active filter count or default text
- Action: "Reset" button (appears when filters are active)

### 2. Scrollable Content Area

**Active Filters Display:**

- Displays a list of dismissible badges (chips) for all currently active filters.
- Allows users to quickly remove specific filters without navigating the accordions.

**Quick Filters:**

- Horizontal wrap of chips (buttons) for presets like "Unwatched", "Large Files", etc.

**Filter Sections (Accordion):**
The filters are grouped into expandable accordion sections. "Common Filters" is open by default.

1.  **Common Filters**

    - Search Title input + Search Type selector
    - Media Types (Movies/TV)
    - Sources
    - Root Folders

2.  **Watch Status**

    - Watch States (Watched/Unwatched/Partial)
    - Unwatched Days slider

3.  **Quality & Size**

    - Qualities
    - Quality Score slider
    - Size slider (GB)

4.  **Content Details**

    - Genres
    - Year slider
    - Runtime slider

5.  **TV Specific**

    - "Only Monitored" switch
    - Completion % slider
    - Season Count slider

6.  **Management**
    - Deletion Score slider

### 3. Sheet Footer

- Status text: "Showing {totalItems} items matching filters"

### UI Patterns

- **Sheet**: Slides in from the right, better for mobile.
- **Accordion**: Keeps the UI clean by hiding less common filters.
- **ScrollArea**: Ensures filters are accessible on small screens.
- **Reset Button**: One-click clear all.

---

## File Reference

| Purpose            | File Path                                                            |
| ------------------ | -------------------------------------------------------------------- |
| Types              | `src/lib/types/media.ts`                                             |
| Filter logic       | `src/lib/utils/mediaFilters.ts`                                      |
| Filter hook        | `src/hooks/useMediaFilters.ts`                                       |
| Filter context     | `src/components/media/filters/MediaFilterProvider.tsx`               |
| Filter UI          | `src/components/media/filters/MediaFiltersClient.tsx`                |
| Table hook         | `src/hooks/useMediaTable.ts`                                         |
| Table columns      | `src/components/media/table/mediaTableColumns.tsx`                   |
| Table base         | `src/components/media/table/MediaTableBase.tsx`                      |
| Table with filters | `src/components/media/table/MediaTableWithFilters.tsx`               |
| Column config      | `src/lib/utils/columnConfig.ts`                                      |
| Column dropdown    | `src/components/media/table/ColumnVisibilityDropdown.tsx`            |
| Skeleton           | `src/components/media/table/MediaTableSkeleton.tsx`                  |
| Score breakdown    | `src/components/media/summary/DeletionScoreBreakdown.tsx`            |
| Page client        | `src/components/media/MediaPageClient.tsx`                           |
| Page content       | `src/components/media/MediaPageContent.tsx`                          |
| Formatters         | `src/lib/utils/formatters.ts`                                        |
| Path utils         | `src/lib/utils.ts` (isMediaPathInFolder, normalizePathForComparison) |
