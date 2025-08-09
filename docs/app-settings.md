## App Settings: Architecture, Consumers, and Extension Guide

### Purpose

Central key–value store for all user-configurable settings. Backed by Prisma/SQLite in `app_settings`. Used by app-level preferences, deletion score configuration, and media-service instance settings.

### Database Model

```startLine:11:endLine:20:prisma/schema.prisma
model AppSettings {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("app_settings")
}
```

### Access Layer

- **Prisma service**: `appSettingsService` in `src/lib/database.ts`
  - `getAll()`, `getByKey(key)`, `getValue(key, default)`, `setValue(key, value, description)`, `delete(key)`
- **Typed KV facade**: `kvSettingsStore` in `src/lib/utils/kv-settings.ts`
  - Adds helpers: `getJson`, `setJson`, `getBoolean`, `setBoolean`, `listByPrefix`, `deleteByPrefix`, `listExcludingPrefixes`, `batchUpsert`
- Guidance: New code should prefer `kvSettingsStore` (typed helpers + prefix utilities) over using Prisma directly.

### Current Namespaces and Keys

- **App (global)**

  - `date-preference` ∈ {'arr','emby','oldest'}
    - Read/write via `src/lib/actions/settings/app-settings.ts` (`getDatePreference`, `updateDatePreference`, `getAppSettings`, `updateAppSettings`)
    - Used by media processing and scoring to determine effective added date

- **Deletion Score** (flattened, namespaced)

  - Prefix: `deletion_score.`
  - Examples:
    - `deletion_score.enabled` (boolean)
    - `deletion_score.days_unwatched.enabled` (boolean)
    - `deletion_score.days_unwatched.max_points` (number)
    - `deletion_score.days_unwatched.breakpoints` (JSON array)
    - Similar keys for: `never_watched`, `size_on_disk`, `age_since_added`, `folder_space`
  - Managed in `src/lib/actions/settings/deletion-score.ts`

- **Media Services – multi-instance** (Sonarr/Radarr)

  - Prefix: `<service>-<instanceId>-<field>` where `<service>` ∈ {'sonarr','radarr'}
  - Fields: `name`, `url`, `apiKey`, `enabled`, `selectedFolders`
  - CRUD and grouping implemented in `src/lib/utils/prefixed-settings.ts`

- **Media Services – single-instance** (Emby)
  - Keys: `emby-name`, `emby-url`, `emby-apiKey`, `emby-enabled`, `emby-selectedLibraries` (preferred), `emby-selectedFolders` (legacy)
  - Service in `src/lib/utils/single-emby-settings.ts`
  - Note: Libraries are now canonical; folders retained for backward compatibility

### Primary Consumers

- Server actions

  - `src/lib/actions/settings/app-settings.ts`: App settings and date preference; triggers deletion-score recalculation when needed
  - `src/lib/actions/settings/deletion-score.ts`: Full deletion score configuration via flattened keys; validation and recalculation
  - `src/lib/actions/settings/backup.ts`: Export/import all settings using a versioned envelope

- Media processing and scoring

  - `src/lib/media-processor/media-processor.ts`: Reads `getDatePreference()` and deletion score settings
  - `src/lib/services/deletion-score-service.ts`: Uses `getDatePreference()` in recalculation batches
  - UI breakdown: `src/components/media/summary/DeletionScoreBreakdown.tsx` reads both deletion score settings and date preference

- Settings UI
  - `src/app/settings/page.tsx`: Hosts tabs for Services, Deletion Scoring, Advanced, Backup
  - Advanced tab uses `src/hooks/useAdvancedSettings.ts` (React Query integration for date preference)

### Validation

- App-level date preference schema: `z.enum(['arr','emby','oldest'])` in `src/lib/actions/settings/app-settings.ts`
- General app key/value schema (admin/utility): `AppSettingsSchema` in `src/lib/validation/schemas.ts`
- Deletion scoring: `DeletionScoreSettingsSchema` with breakpoints and point caps in `src/lib/validation/schemas.ts`
- Backup envelope schema: `AllSettingsEnvelopeSchema` in `src/lib/validation/schemas.ts`

### Backup and Restore

- Implemented in `src/lib/actions/settings/backup.ts`
  - Export includes: `app.datePreference`, `app.other` (all non-prefixed keys except known core), deletion score, and all service instances
  - Import applies app settings, then deletion score, then service instances; revalidates `/settings`
  - See `docs/app-settings-backup-restore.md` for full plan and rationale

### Invariants and Conventions

- Keys are globally unique strings; values are stored as strings. Booleans and JSON are stringified.
- Prefer explicit namespaces:
  - Deletion score: `deletion_score.*`
  - Services (multi): `<service>-<id>-<field>`
  - Emby (single): `emby-*`
  - App: currently `date-preference` (no prefix). Future app keys should consider `app.<key>` naming for clarity, but maintain backward compatibility.
- All writes should occur in server actions and use `kvSettingsStore`; call `revalidatePath('/settings')` after mutations affecting UI.
- Changing `date-preference` or deletion score settings should trigger deletion-score recalculation when enabled.

### Adding a New Setting (Checklist)

- App-level setting

  - Define schema in `src/lib/actions/settings/app-settings.ts` (or extend a typed manager)
  - Add typed getters/setters using `kvSettingsStore`
  - Include in backup export (`exportAllSettings`) and import (`importAllSettings`)
  - Update UI and React Query keys; invalidate queries on write

- Deletion score setting

  - Extend flattened key set in `src/lib/actions/settings/deletion-score.ts`
  - Update `DeletionScoreSettingsSchema` and calculator usage
  - Ensure backup import/export handles it
  - Re-run recalculation logic after updates

- Service setting
  - For multi-instance: extend `prefixed-settings.ts` field handling and types
  - For Emby: extend `single-emby-settings.ts` (maintain legacy compatibility)
  - Update validation in `src/lib/validation/schemas.ts`
  - Include in backup import/export mapping

### Known Gaps and Future Work

- Consider migrating app keys to `app.*` namespace; maintain read/write compatibility with existing unprefixed keys.
- Add typed AppSettings manager to centralize app-specific keys beyond `date-preference`.
- Add dry-run/preview for backup import and optional redaction of secrets.
- Consolidate boolean/number parsing into reusable helpers (already present in `kvSettingsStore`).

### Quick Reference of Key Code Paths

- `src/lib/database.ts` → `appSettingsService`
- `src/lib/utils/kv-settings.ts` → KV facade
- `src/lib/actions/settings/app-settings.ts` → app/date preference actions
- `src/lib/actions/settings/deletion-score.ts` → deletion score actions
- `src/lib/utils/prefixed-settings.ts` → Sonarr/Radarr instance settings
- `src/lib/utils/single-emby-settings.ts` → Emby single-instance settings
- `src/lib/actions/settings/backup.ts` → backup/import all settings
