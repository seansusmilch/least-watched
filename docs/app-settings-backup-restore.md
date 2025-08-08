### All Settings Backup & Restore – Implementation Plan

#### Goal

Add a simple, robust backup and restore workflow for ALL application settings, inspired by the existing Deletion Scoring export/import pattern.

#### Scope

- App settings in `prisma.appSettings` (e.g., `date-preference`).
- Deletion Scoring configuration (all factors, points, breakpoints).
- Media service settings:
  - Sonarr: multiple instances (name, url, apiKey, enabled, selectedFolders).
  - Radarr: multiple instances (name, url, apiKey, enabled, selectedFolders).
  - Emby: single instance (name, url, apiKey, enabled, selectedLibraries | selectedFolders).
    - Emby-first architecture applies to data usage; this is purely settings backup/restore.

#### File format (JSON)

- Envelope structure with versioning and metadata, exporting ALL settings:

```
{
  "version": "1.0",
  "exportedAt": "2025-08-08T00:00:00.000Z",
  "type": "all-settings",
  "data": {
    "app": {
      "datePreference": "arr",
      "other": [
        { "key": "some-future-key", "value": "...", "description": "..." }
      ]
    },
    "deletionScore": {
      "enabled": true,
      "daysUnwatchedEnabled": true,
      "daysUnwatchedMaxPoints": 30,
      "daysUnwatchedBreakpoints": [{ "value": 30, "percent": 0 }],
      "neverWatchedEnabled": true,
      "neverWatchedPoints": 20,
      "sizeOnDiskEnabled": true,
      "sizeOnDiskMaxPoints": 35,
      "sizeOnDiskBreakpoints": [{ "value": 1, "percent": 0 }],
      "ageSinceAddedEnabled": true,
      "ageSinceAddedMaxPoints": 15,
      "ageSinceAddedBreakpoints": [{ "value": 180, "percent": 33 }],
      "folderSpaceEnabled": false,
      "folderSpaceMaxPoints": 10,
      "folderSpaceBreakpoints": [{ "value": 10, "percent": 100 }]
    },
    "services": {
      "sonarr": [
        { "name": "My Sonarr", "url": "https://...", "apiKey": "...", "enabled": true, "selectedFolders": ["/tv"] }
      ],
      "radarr": [
        { "name": "My Radarr", "url": "https://...", "apiKey": "...", "enabled": true, "selectedFolders": ["/movies"] }
      ],
      "emby": {
        "name": "My Emby",
        "url": "https://...",
        "apiKey": "...",
        "enabled": true,
        "selectedLibraries": ["TV Shows", "Movies"],
        "selectedFolders": ["/media/tv", "/media/movies"]
      }
    }
  }
}
```

- Rationale
  - Single export file covers app + deletion scoring + all services.
  - Data model mirrors existing types and storage patterns, while hiding internal `id`s.

#### Centralized Key-Value Settings Module

Create a generalized, single source-of-truth module that wraps `prisma.appSettings` and provides typed helpers for all settings categories. All category managers (App, Deletion Score, Sonarr, Radarr, Emby) will depend on this module.

- Key naming conventions

  - App: `app.<key>` (e.g., `app.datePreference`).
  - Deletion Score: `deletion_score.<section>.<field>` (existing convention, preserved).
  - Services (multi-instance): `<service>-<id>-<field>` (existing convention for Sonarr/Radarr; also supported for Emby if needed).
  - Services (single-instance): `<service>-<field>` (current Emby pattern), or use the multi-instance pattern with a dedicated single-instance adapter enforcing one instance.

- Core API (store)

  ```ts
  interface KvSettingsStore {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, description?: string): Promise<void>;
    getJson<T>(key: string): Promise<T | null>;
    setJson<T>(key: string, value: T, description?: string): Promise<void>;
    getBoolean(key: string, fallback?: boolean): Promise<boolean>;
    setBoolean(
      key: string,
      value: boolean,
      description?: string
    ): Promise<void>;
    listByPrefix(prefix: string): Promise<
      Array<{
        key: string;
        value: string;
        description?: string;
        createdAt: Date;
        updatedAt: Date;
      }>
    >;
    delete(key: string): Promise<void>;
    deleteByPrefix(prefix: string): Promise<void>;
    listExcludingPrefixes(
      prefixes: string[]
    ): Promise<Array<{ key: string; value: string; description?: string }>>;
    batchUpsert(
      items: Array<{ key: string; value: string; description?: string }>
    ): Promise<void>;
  }
  ```

- Category managers built on top

  - AppSettingsManager: typed getters/setters for `datePreference` and future app keys; delegates to `KvSettingsStore`.
  - DeletionScoreSettingsManager: maps the flat key set to a typed `DeletionScoreSettings` object using store helpers (boolean/number/json for breakpoints), preserving existing keys.
  - PrefixedServiceSettingsManager(service: 'sonarr' | 'radarr' | 'emby'): CRUD for multi-instances based on `<service>-<id>-<field>` using `KvSettingsStore.listByPrefix`, `batchUpsert`, and `deleteByPrefix`.
  - SingleInstanceSettingsManager(service: 'emby'): enforces a single instance while reusing the same field model; internally can use prefixed or unprefixed keys for backward compatibility.

- Validation

  - Each manager validates via Zod schemas in `src/lib/validation/schemas.ts` before persisting.
  - Store remains unopinionated; category managers own validation and coercion.

- Migration notes
  - Refactor existing helpers (`single-emby-settings`, `prefixed-settings`, deletion score actions) to call through `KvSettingsStore`.
  - Keep existing key names to avoid migrations; add normalization where needed (e.g., Emby libraries/folders JSON parsing).
  - Centralize boolean/number parsing to avoid duplication.

#### Server actions (Next.js server actions)

Create a small server module (e.g., `src/lib/actions/settings/backup.ts`) exposing:

1. Export

   - `exportAllSettings()` returns the JSON envelope above:
     - `app`: use `getAppSettings()` for known keys; collect additional non-prefixed app keys via `appSettingsService.getAll()` filtered to exclude `sonarr-`, `radarr-`, `emby-`, `deletion_score.`
     - `deletionScore`: use `getDeletionScoreSettings()`.
     - `services.sonarr`: map from `sonarrSettingsService.getAll()` to array without internal ids.
     - `services.radarr`: map from `radarrSettingsService.getAll()`.
     - `services.emby`: map from `embySettingsService.get()` (single instance) to a single object or `null`.

2. Import

   - `importAllSettings(payload: unknown)` that:
     - Validates the envelope via Zod (version, type === 'all-settings', data structure).
     - App: apply `updateAppSettings` for known fields; upsert any `other` keys via `setAppSetting`.
     - Deletion scoring: apply `setDeletionScoreSettings` and then call `triggerDeletionScoreRecalculation()`.
     - Services:
       - Sonarr/Radarr: upsert by `name` (match existing via `getByName`; if found, `update`; else `create`).
       - Emby: if instance exists (`embySettingsService.exists()`), `update`; else `create`.
     - `revalidatePath('/settings')` at the end.

3. Types & validation
   - Define Zod schemas for the envelope and each section in `src/lib/validation/schemas.ts`.
   - Reuse existing types: `DeletionScoreSettings`, `ServiceSettings`, Emby settings interfaces, and app settings.
   - Both export and import rely on the centralized `KvSettingsStore` to read/write settings consistently.

#### Client UI (Settings hub)

- Add “Export All Settings” and “Import All Settings” buttons in a central settings page (e.g., top of Settings or a new Backup section).
  - Export
    - Calls `exportAllSettings()` and downloads a Blob, mirroring the deletion score export UX (filename: `least-watched-settings-YYYY-MM-DD.json`).
  - Import
    - Opens a dialog with file input and a confirmation step noting that API keys will be overwritten.
    - Reads file client-side, parses JSON, performs a light guard, then posts to `importAllSettings()`.
    - Show success/error toasts, and provide a short report (counts created/updated per service).
    - On success, invalidate/refetch queries for app, services, and deletion score settings per state management rules.

#### TanStack Query integration (state-management)

- Co-locate queries with components.
- Invalidate after successful import:
  - `['app-settings']`
  - `['deletion-score-settings']`
  - `['sonarr-settings']`, `['radarr-settings']`, `['emby-settings']`

#### UX details

- Prominent warning: importing overwrites settings, including API keys.
- Allow dry-run preview (optional nice-to-have): show which settings would change.
- Non-blocking progress state with clear success/error messages.
- Error handling for:
  - Invalid JSON, wrong `type`, missing fields, or wrong `version`.
  - Partial failures (continue upserts; aggregate and surface a concise message).

#### Versioning & compatibility

- Start with `version: "1.0"` and `type: 'all-settings'`.
- Import should:
  - Accept unknown fields within sections and ignore them.
  - Be tolerant of missing sections (e.g., no `services.emby`).
  - For services, upsert by `name` (ids are internal; new ids may be generated on create).
  - Reserve pathway for future breaking versions (show a helpful error if unsupported `version`).

#### Security & privacy

- API keys and server URLs are included; treat exports as sensitive secrets.
- Only authenticated and authorized users can export/import.
- Keep all writes in server actions; never write from client.
- Consider opt-out checkboxes for importing API keys (optional enhancement).

#### Testing

- Unit tests for Zod schemas (app, deletionScore, services) and full envelope.
- Unit tests for `importAllSettings` upsert flows (mocks for appSettingsService, sonarr/radarr/emby services, deletion score service).
- Manual QA:
  - Export → wipe DB → Import → values restored (including multiple Sonarr/Radarr instances and Emby).
  - Import with partial sections present (only app, only services, etc.).
  - Changing `datePreference` and/or deletion scoring triggers background recalculation.

#### Incremental rollout

1. Server actions + schemas (export/import all settings).
2. UI buttons & dialogs in a central Settings Backup section.
3. README: new "All Settings Export/Import" section (update examples and guidance).
4. Optional: CLI under `scripts/` to export/import from terminal.

#### Future extensions

- Selective import (checkboxes per section or per instance).
- Redaction options (exclude API keys on export).
- Automatic scheduled backups to disk or remote storage.

#### References

- Deletion Scoring export/import in `src/components/settings/deletion-score/deletion-score-settings.tsx` (client Blob download pattern and import dialog flow).
- App settings actions in `src/lib/actions/settings/app-settings.ts`.
- Service settings services in `src/lib/database.ts` and `src/lib/utils/prefixed-settings.ts`.
