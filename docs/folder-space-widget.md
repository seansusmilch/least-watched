# Folder Space Widget (Current State)

This document captures the current end-to-end behavior of the **Folder Space** feature: settings → API calls → server aggregation/filtering → dashboard rendering.

## What the dashboard renders

The dashboard uses a streamed server component wrapper to fetch folder space data and render the widget.

- **Page**: `src/app/page.tsx` renders the widget inside a `Suspense` boundary.
- **Server wrapper**: `src/components/folder-space/FolderSpaceWidgetWithInitialData.tsx`
- **Client UI**: `src/components/folder-space/FolderSpaceWidget.tsx`

### Rendering rules (client)

`FolderSpaceWidget` receives `initialData: FolderWithSpaceEnhanced[]`.

- It filters down to **selected** folders: `initialData.filter((f) => f.isSelected)`.
- If the filtered list is empty, it shows the placeholder “No folders selected…” card.
- Otherwise, it groups by `driveRoot` and renders per-folder cards with:
  - `usedSpacePercent` (progress bar)
  - `usedSpace`, `freeSpace`, `totalSpace`
  - badges for instance type + instance name

## Where the data comes from

### Settings source

Selected folders are stored per instance in app settings (KV-style) and loaded via:

- `sonarrSettingsService.getEnabled()`
- `radarrSettingsService.getEnabled()`

These return `ServiceSettings` objects with:

- `selectedFolders?: string[]`
- `enabled: boolean`
- `name`, `url`, `apiKey`, etc.

Folder selection UI is driven by server action `fetchFolders`:

- **Server action**: `src/lib/actions/settings/folders.ts`
- Fetches both:
  - `getRootFolders(instance)`
  - `getDiskSpace(instance)`
- Returns a list of **root folders** with disk space totals attached when a best-match disk space entry can be found.

This ensures the selection dialog is based on “root folders configured in your Sonarr/Radarr instance”, not raw disk-space drive entries.

### External API calls

Folder space on the dashboard is computed by calling, per enabled instance:

- `sonarrApiClient.getRootFolders(instance)`
- `sonarrApiClient.getDiskSpace(instance)`
- `radarrApiClient.getRootFolders(instance)`
- `radarrApiClient.getDiskSpace(instance)`

These are aggregated in:

- `src/lib/services/folder-space-service.ts` → `folderSpaceService.getAllFoldersWithSpace()`

## Folder space aggregation (server)

### Output type

The dashboard expects `FolderWithSpaceEnhanced[]` (from `src/lib/types/media-processing.ts`), which includes:

- identity: `path`, `instanceName`, `instanceType`
- space: `freeSpace`, `totalSpace`, `usedSpace`, `%`
- metadata: `enabled`, `driveRoot`, `isSystemDrive`, `isRootFolder`, `isDiskSpaceFolder`
- selection: `isSelected`

### Selection matching logic

Selection is computed server-side. Because folder paths can differ in formatting (trailing slashes, casing, `\` vs `/`, drive roots vs mount paths), `getAllFoldersWithSpace()` uses:

- `normalizeFolderPath(...)` to normalize Windows and POSIX-like paths
- `isFolderPathSelected(...)` to perform resilient matching:
  - exact normalized match
  - prefix match (selected parent folder matches child folder path and vice versa)
  - a POSIX convenience match for “top-level segment selections” (e.g. `/bigz` matching `/mnt/bigz/...`)

### Display-ready filtering

Some API-returned “folders” do not contain enough information to render the dashboard card correctly (common symptoms: `totalSpace: 0`, negative `usedSpace`, missing/invalid percent fields).

To avoid broken or misleading cards, `getAllFoldersWithSpace()` **filters the result down to display-ready selected entries** via a typesafe predicate:

- keeps only folders where:
  - `isSelected === true`
  - `path` is non-empty
  - `totalSpace`, `freeSpace`, `usedSpace`, `usedSpacePercent`, `freeSpacePercent` are finite numbers
  - `totalSpace > 0`
  - `freeSpace >= 0` and `usedSpace >= 0`
  - percents are within `[0, 100]`

The practical effect: the dashboard shows only entries with real disk totals (typically disk-space endpoints), and drops “root folder only” entries that cannot calculate totals.

### Shared-folder detection

After filtering, the service groups by normalized `path` and marks:

- `isShared: boolean`
- `instanceCount: number`
- `sharedInstances?: string[]`

This is computed only for the filtered displayable set.

## Logging / debugging (dev only)

To debug path selection and payload shapes, the folder space pipeline logs in development:

### Server-side logs

- In `folder-space-service.ts`:

  - `📦 Folder space settings snapshot` (enabled instances + selected folder counts/samples)
  - `🧩 Sonarr folder space computed` / `🧩 Radarr folder space computed` (counts + samples, including computed selected count)
  - `🧭 Folder space selection summary`:
    - `total`: number of returned entries
    - `selected`: number selected (will typically equal `total` after filtering)
    - `droppedNotDisplayable`: entries removed by the “display-ready” filter

- In `FolderSpaceWidgetWithInitialData.tsx`:
  - `🧱 FolderSpaceWidgetWithInitialData payload` (total/selected/sample)

### Client-side logs

- In `FolderSpaceWidget.tsx`:
  - `🧩 FolderSpaceWidget received` (total/selected/sample)

All logs are gated behind `process.env.NODE_ENV !== 'production'`.

## Folder selection UX & persistence

Folder selection happens in Settings → Media Services:

- UI: `src/components/settings/media-services/shared/folder-selection-dialog.tsx`
  - Loads folders via `fetchFolders(...)`
  - Saves selection via `onSave(selectedFolders)` and shows a local saving state

Settings persistence and optimistic UI:

- UI: `src/components/settings/media-services/shared/service-settings.tsx`
  - Uses `useOptimistic` for add/update/delete and folder selection updates.
  - All `setOptimisticSettings(...)` calls are wrapped in a local `startTransition(...)` to avoid React “optimistic update” runtime errors when updates happen after an `await`.

## Current behavior summary

- The dashboard shows **only selected folders** that have **complete disk space totals** and valid percent values.
- Path matching for selection is resilient across common formatting differences.
- Folder selection UI presents **root folders** (with totals enriched when possible).
- Dev-only logs provide full visibility into:
  - instance settings loaded
  - service output shapes
  - selection matching results
  - how many entries were dropped as non-displayable
