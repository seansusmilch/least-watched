### Media Items Table and Filters – Architecture and Extension Guide

This guide explains how the Media Items Table and Filters are wired, and how to extend them safely.

### High-level flow

- **Data fetch (client)**: `src/components/media/MediaPageClient.tsx`

  - Uses `useQuery({ queryKey: ['processed-media-items'], queryFn: getProcessedMediaItems })` to fetch processed items.
  - Derives filter option values with `getUniqueFilterOptions(items)`.
  - Renders `MediaPageContent` with `items` and available options.

- **Composition**: `src/components/media/MediaPageContent.tsx`

  - Wraps content in `MediaFilterProvider` so children can read/update filters and sorting.
  - Renders `MediaFiltersClient` (controls) and `MediaTableWithFilters` (data grid).

- **Filter state provider**: `src/components/media/filters/MediaFilterProvider.tsx`

  - Context around `useMediaFilters()` exposing: `filters`, `sortCriteria`, `updateFilter`, `resetFilters`, `applyQuickFilter`, `handleSort`.

- **Filter logic and option utilities**: `src/lib/utils/mediaFilters.ts`

  - `filterMediaItems`, `sortMediaItems`, `filterAndSortMediaItems`.
  - `getUniqueFilterOptions(items)` builds selectable lists for genres/qualities/sources/folders.
  - `createDefaultFilters()` initializes a `FilterOptions` object.

- **Table with filters**: `src/components/media/table/MediaTableWithFilters.tsx`

  - Reads `filters` + `sortCriteria` from context.
  - Uses `filterAndSortMediaItems(items, filters, sortCriteria)`.
  - Initializes table via `useMediaTable(filteredAndSortedItems)` and renders `MediaTableBase`.

- **Table state and config**: `src/hooks/useMediaTable.ts`
  - Wraps TanStack Table. Handles sorting, column filters, global filter, row selection, and column visibility.
  - Persists column visibility via `loadColumnVisibility`/`saveColumnVisibility` in `src/lib/utils/columnConfig.ts`.
  - Columns come from `createMediaTableColumns()` in `src/components/media/table/mediaTableColumns.tsx`.

### Key types

- `MediaItem` schema and `MediaItem` type: `src/lib/types/media.ts`.
- `FilterOptions` and `SortCriteria`: `src/lib/types/media.ts`.
- Column labels and defaults: `availableColumns` and `ColumnConfig` in `src/lib/utils/columnConfig.ts` and `src/lib/types/media.ts`.

### Filters: what exists today

- Implemented in `src/lib/utils/mediaFilters.ts`:
  - Basic: search term (`contains|exact|regex`), media type, source.
  - Watch state: watched/unwatched/partial, unwatched days, watch count, last watched.
  - Quality/size: size (with unit), quality, quality score, size per hour.
  - Content: year, genres, ratings (IMDb/TMDB), runtime.
  - TV-specific: completion percentage, seasons, episodes, monitored flag.
  - Management: date added (via `getEffectiveDateAdded` and date preference), folders, deletion score.
  - Legacy: `filterType`, `minSize`, `folderFilter` for backward compatibility.

Notes:

- Date range filters accept both Date and ISO strings; helpers coerce when needed.
- Folder filtering uses path matching helpers in `src/lib/utils`.
- Default sort is determined by deletion score settings via `getDeletionScoreSettings()` inside `useMediaFilters`.

### Table: columns and behavior

- Columns are defined in `src/components/media/table/mediaTableColumns.tsx` using TanStack helpers.
  - Selection column, then title/type/year/size/quality/completion/rating/source/folder/date fields/last watched/unwatched days/deletion score, etc.
  - Use `formatDate` and `formatFileSize` from `src/lib/utils/formatters`.
- Column visibility:
  - Default visibility is defined in `availableColumns` in `src/lib/utils/columnConfig.ts`.
  - Actual visibility is persisted in `localStorage` under `least-watched-column-visibility`.
  - `ColumnVisibilityDropdown` renders a popover to toggle columns.
- Global search: implemented in `useMediaTable` to search across `title`, `type`, `source`, `parentFolder`.

### UI controls: `MediaFiltersClient`

- Renders the filter UI and dispatches to `updateFilter`, `applyQuickFilter`, `resetFilters`, and `handleSort` from context.
- Consumes available `genres`, `qualities`, `sources`, `folders` from props (produced by `getUniqueFilterOptions`).

### How to add a new filter

1. Extend types:

   - Add a field to `FilterOptions` in `src/lib/types/media.ts`.
   - Initialize it in `createDefaultFilters()` in `src/lib/utils/mediaFilters.ts`.

2. Implement logic:

   - Add a helper (if needed) and apply it inside `filterMediaItems()`.
   - If a new derived value is required, ensure `MediaItem` exposes it (or compute it in the media processor).

3. UI wiring:

   - Add inputs in `MediaFiltersClient` that call `updateFilter({ newField: value })`.
   - If the filter needs selectable options, extend `getUniqueFilterOptions()` and pass the new array down via `MediaPageClient`/`MediaPageContent`.

4. Sorting (optional):
   - If the new field should be sortable, ensure it exists on `MediaItem` and handle display/sort in the table column definition.

### How to add a new column

1. Define a column in `mediaTableColumns.tsx` using `columnHelper.accessor` or `display`.
2. Add a matching entry in `availableColumns` with a stable `id`, `label`, and `defaultVisible`.
3. If the column is derived, compute the value in the media processor or ensure it’s available on `MediaItem`.

### Query and state management

- Use `@tanstack/react-query` for fetching processed items; key is `['processed-media-items']` in `MediaPageClient`.
- Keep table state inside `useMediaTable`; keep filter/sort state inside `useMediaFilters` via context.
- After server-side changes that affect processed items, invalidate `['processed-media-items']` to refresh UI.

### Date preference and sorting

- `filterMediaItems()` relies on `getEffectiveDateAdded(item, datePreference)` to support ARR vs Emby vs oldest.
- `useMediaFilters` sets default sort: `deletionScore desc` when deletion scoring is enabled, otherwise `unwatchedDays desc`.

### Performance considerations

- Filtering and sorting run in-memory on the array returned by `getProcessedMediaItems`.
- Keep `MediaItem` fields normalized and prefer numbers/dates for sort-heavy fields.
- Use `useMemo` where provided; avoid re-creating large objects in props/state unnecessarily.

### Common pitfalls

- BigInt sizes: convert carefully when comparing; `applySizeFilter` handles unit conversion.
- Date strings vs Date objects: helpers coerce where possible, but ensure inputs are valid ISO strings when coming from cache.
- Column IDs must match what TanStack sees; keep `availableColumns` and `mediaTableColumns.tsx` in sync.

### File map (quick reference)

- Page composition: `src/app/page.tsx`, `src/components/media/MediaPageClient.tsx`, `src/components/media/MediaPageContent.tsx`
- Filter context: `src/components/media/filters/MediaFilterProvider.tsx`, `src/hooks/useMediaFilters.ts`
- Filter utils: `src/lib/utils/mediaFilters.ts`
- Table: `src/components/media/table/MediaTableWithFilters.tsx`, `src/hooks/useMediaTable.ts`, `src/components/media/table/MediaTableBase.tsx`, `src/components/media/table/mediaTableColumns.tsx`, `src/components/media/table/ColumnVisibilityDropdown.tsx`
- Column config: `src/lib/utils/columnConfig.ts`
- Types: `src/lib/types/media.ts`
