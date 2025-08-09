## Emby‑First Migration Plan

### Overview

We are migrating the media pipeline to enumerate media from Emby libraries first, then enrich with Sonarr/Radarr metadata. This aligns the app with actual on-disk, user-facing content, simplifies matching logic, and improves performance by avoiding Arr‑first N+1 patterns.

### Goals

- Make Emby the authoritative source of media items.
- Allow selecting which Emby libraries to scan.
- Enrich Emby items with Arr data (size/quality/monitored/episodes) when IDs match.
- Preserve deletion scoring, filters, and UI behavior.
- Reduce complexity and improve performance.

---

## Scope and Impact

### Affected Areas

- Settings: Emby configuration (new `selectedLibraries`), server actions and UI.
- Services: `EmbyService` additions for library listing and item enumeration.
- Media processor: Emby‑first orchestration, Arr enrichment maps, storage tweaks.
- Minor UI changes in settings (library selector).
- Optional: Storage upsert improvements to prevent duplicates.

### Unaffected Areas

- Prisma schema (no DB migration required).
- Folder space service (continues to use Arr root folders).
- Deletion score calculation logic.

---

## Settings and Validation Changes

### New Field

- Emby single‑instance settings gain `selectedLibraries: string[]`.

### Backward Compatibility

- Continue reading legacy `emby-selectedFolders` if present, but write new data under `emby-selectedLibraries`.
- Keep code tolerant of either key while migrating.

### Server Actions and Types

- Update types:
  - `EmbySettingsInput`: use `selectedLibraries?: string[]` (deprecate `selectedFolders`).
- Update zod schemas:
  - `EmbySettingsCreateSchema` and `EmbySettingsUpdateSchema` → include `selectedLibraries`.
- Update single-instance settings service:
  - Read `emby-selectedLibraries` (fallback to `emby-selectedFolders`).
  - Create/update/delete keys for `emby-selectedLibraries`.

---

## UI: Library Selection

### Emby Settings Card

- Add “Select Libraries” button (similar to Arr “Select Folders”).
- Display count as “Selected Libraries”.

### Library Selection Dialog

- New dialog component listing Emby libraries from `/Library/VirtualFolders`.
- Multi-select and persist to `selectedLibraries`.
- Handle different Emby versions by extracting a robust library ID (ItemId/Id/LibraryOptions.LibraryId/name fallback).

---

## Services

### Emby Libraries Fetch (Server Action)

- New server action: `fetchEmbyLibraries()` returns `{ id, name }[]`.
- Uses single Emby instance credentials.

### Emby Library Item Enumeration

- New method: `EmbyService.listLibraryItems({ embyInstance, libraryIds, types=['Movie','Series'], pageSize=500 })`
  - Calls `items.list` with `Recursive=true`, `IncludeItemTypes`, `Fields=DateCreated,ProviderIds,Path,ProductionYear,RunTimeTicks,MediaSources`.
  - Paginates via `StartIndex/Limit`.
  - Filters by selected `LibraryIds` when available.

---

## Media Processor Refactor (Emby‑First)

### New Flow

1. Load:
   - Single enabled Emby instance.
   - Selected libraries (or all if none set).
   - Enabled Sonarr/Radarr instances (for enrichment only).
   - Date preference and deletion score settings.
   - Folder space data (unchanged; still from Arr).
2. Enumerate Emby items (movies/series) from selected libraries.
3. Build enrichment maps once:
   - Fetch all Sonarr series and Radarr movies.
   - Build maps keyed by provider IDs (tvdb/tmdb/imdb).
4. For each Emby item:
   - Create a base item from Emby metadata.
   - Match and enrich from Arr:
     - Movies: sizeOnDisk, path, parentFolder, quality, monitored, dateAddedArr.
     - Series: statistics (sizeOnDisk, episodes, total, seasons, completion%), monitored, dateAddedArr.
   - Optionally fetch playback (ID‑first) if enabled, to fill `lastWatched` and `watchCount`.
   - Store immediately (compute deletion score using date preference).
5. Mark progress complete.

### Progress and Limits

- Use Emby item count for progress totals.
- Keep `TESTING_LIMIT` or replace with paging size for local/dev testing.

---

## Storage Improvements (Optional but Recommended)

### Upsert Keys

- Add an additional find condition using Emby identity to avoid duplicates:
  - Include `{ embyId: item.embyId, source: item.source }` in `findConditions` before title/type fallback.
- Consider adding a unique index in the future (e.g., `(embyId, source)`), but not required now.

---

## Performance Considerations

- Single enumeration of Sonarr/Radarr into in‑memory maps avoids N+1.
- Emby item listing uses paging and specific fields to limit payload size.
- Avoid calling playback query unless settings enable it (and use ID‑first).
- Batch progress updates are already throttled by design.

---

## Testing Strategy

### Unit

- Settings service: reading/writing `selectedLibraries` with fallback.
- Emby library listing parsing across Emby versions.
- Emby item enumeration field mapping (ProviderIds normalization).

### Integration

- End‑to‑end processing on a sample dataset with:
  - Items with full provider IDs present.
  - Items with partial/missing IDs (fallback behavior verified).
  - Mixed libraries selection (subset vs all).

### Regression

- Deletion score results are sane: verify different `datePreference` values.
- UI: Emby settings card shows and edits library selection correctly.
- Folder space cards remain correct.

---

## Rollout Plan

### Phase 1: Ship Behind a Soft Switch (Optional)

- Keep Arr enumeration code for a short overlap, gated by a feature flag.
- Default to Emby‑first in dev; flip in prod after QA sign‑off.

### Phase 2: Enable Emby‑First

- Set feature flag to Emby‑first (or remove flag if fully committed).
- Monitor performance, DB growth, error logs.

### Phase 3: Cleanup

- Remove Arr‑first enumeration paths and logging.
- Drop legacy `emby-selectedFolders` reads after one release if desired.

---

## Rollback Plan

- If Emby listing fails or returns unexpected results:
  - Temporarily disable Emby‑first via feature flag and fall back to Arr‑first.
  - Alternatively, disable playback enrichment (common source of timeouts).
- No DB migrations, so rollback is configuration-only.

---

## Known Risks and Mitigations

- Emby library IDs vary by version:
  - Mitigate by robust parsing and fallback to scanning all libraries if IDs missing.
- Duplicate items if existing rows were Arr‑sourced and we store Emby‑sourced rows:
  - Mitigate by including `embyId` in upsert find conditions.
  - Provide optional one‑time DB cleanup task if needed.
- Items lacking ProviderIds (ID‑matching):
  - They remain Emby‑only; enrichments will be partial. Acceptable.

---

## Developer Checklist

- Settings/types/schemas

  - Update `EmbySettingsInput` to `selectedLibraries`.
  - Update zod schemas.
  - Update single‑instance settings service read/write/delete and backward compatibility.

- Server actions

  - Add `fetchEmbyLibraries`.
  - Re‑export in settings actions index.

- UI

  - Add `LibrarySelectionDialog`.
  - Wire “Select Libraries” button in Emby settings card.
  - Display selected libraries count.

- Services

  - Implement `EmbyService.listLibraryItems`.

- Media processor

  - Emby‑first orchestration.
  - Build Arr enrichment maps once.
  - Upsert with `embyId` condition (optional improvement).

- QA
  - Run `bun lint`.
  - Seed database and validate with a small Emby instance.
  - Validate progress, counts, and deletion scores.

---

## Commands

- Dev:

  - `bun dev`
  - `bun lint` (typecheck + lint)

- DB:
  - No schema changes required.

---

## Appendix: Key Signatures

```ts
// New
type EmbyLibrary = { id: string; name: string };

async function fetchEmbyLibraries(): Promise<{
  success: boolean;
  data?: EmbyLibrary[];
  error?: string;
}>;

class EmbyService {
  static async listLibraryItems(opts: {
    embyInstance: EmbySettings;
    libraryIds: string[];
    types?: Array<'Movie' | 'Series'>;
    pageSize?: number;
  }): Promise<Emby.BaseItem[]>;
}
```

```ts
// Settings input change
export type EmbySettingsInput = {
  name: string;
  url: string;
  apiKey: string;
  enabled?: boolean;
  selectedLibraries?: string[];
};
```
