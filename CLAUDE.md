# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Purpose:** A Next.js application for managing and tracking least-watched media from Sonarr, Radarr, and Emby. It helps users identify content to delete based on a configurable deletion score.

**Tech Stack:**
- **Framework:** Next.js 15 with App Router and Turbopack
- **Language:** TypeScript with strict mode
- **Package Manager:** bun
- **UI:** React 19, Tailwind CSS 4, Radix UI, shadcn/ui
- **State Management:** Zustand, @tanstack/react-query
- **Database:** SQLite with Prisma ORM
- **External APIs:** Generated TypeScript clients for Radarr/Sonarr via `@hey-api/openapi-ts`, `emby-sdk-stainless` for Emby

## Development Commands

Run these commands exactly as written - do not pipe extra commands before or after:

```bash
# Development
bun dev                 # Starts development server (Turbopack)
bun build              # Production build (includes db:generate and gen-api:all)
bun start              # Start production server

# Code Quality
bun lint               # Type check AND lint (use frequently to check work)

# Database
bun run db:generate    # Generate Prisma client (required after schema changes)
bun run db:migrate:dev # Create and apply migration in dev
bun run db:migrate     # Deploy migrations (production)
bun run db:reset       # Reset database with seed data
bun run db:seed        # Seed database with test data
bun run db:status      # Check migration status

# API Client Generation
bun run gen-api:radarr # Generate Radarr TypeScript client from OpenAPI spec
bun run gen-api:sonarr # Generate Sonarr TypeScript client from OpenAPI spec
bun run gen-api:all    # Generate both clients

# Unit Testing (Vitest)
bun run test           # Run all unit tests once
bun run test:watch     # Run unit tests in watch mode
bun run test:ui        # Run unit tests with Vitest UI

# E2E Testing (Playwright)
bun test:e2e           # Run Playwright tests
bun test:e2e:ui        # Run Playwright with UI
bun test:e2e:codegen   # Generate Playwright tests
```

## Testing

### Unit Tests
Vitest is used for unit testing pure business logic. Test files live alongside the code they test (`*.test.ts`).

**Covered modules:**
- `src/lib/deletion-score-calculator.ts` — scoring algorithm, breakpoints, date preference
- `src/lib/utils/mediaFilters.ts` — all filter/sort logic
- `src/lib/media-processor/arr-matching.ts` — Radarr/Sonarr ID matching
- `src/lib/utils/media-scoring.ts` — type normalization utilities
- `src/lib/utils/text-sanitization.ts` — text sanitization helpers
- `src/lib/media-processor/arr-enrichment.ts` — Arr metadata enrichment

**Important:** Use `bun run test` (not `bun test`) to invoke Vitest. `bun test` triggers Bun's native test runner which will also pick up Playwright spec files and fail.

### E2E Tests
Playwright tests live in `e2e/` and cover the home page and settings page. They require the dev server to be running (handled automatically by `playwright.config.ts`).

## Architecture

### Import Alias
- `@/` maps to `./src` - always use this instead of relative paths

### Directory Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components organized by feature
│   ├── media/           # Media browsing and filtering
│   ├── settings/        # Settings pages (deletion score, media services, etc.)
│   ├── ui/              # Reusable shadcn/ui components
│   └── providers/       # React context providers (TanStack Query)
├── lib/
│   ├── actions/         # Server actions (mutative operations)
│   ├── services/        # External API services and business logic
│   ├── media-processor/ # Core media processing pipeline
│   ├── utils/           # Utility functions
│   └── types/           # Shared type definitions
├── hooks/               # Custom React hooks
├── generated/           # Generated code (Prisma, Radarr/Sonarr APIs)
└── database.ts          # Prisma client and database services
```

### Core Architecture Patterns

**Media Processing Pipeline:**
1. `MediaProcessor` (`src/lib/media-processor/`) orchestrates fetching media from Emby
2. Matches items against Sonarr/Radarr for enrichment
3. Calculates deletion scores using `DeletionScoreCalculator`
4. Stores results in database via server actions
5. Progress is tracked via Zustand store and broadcast to clients

**Settings Storage:**
- Sonarr/Radarr: Multiple instances via `prefixedSettingsService` (key-value pattern in AppSettings)
- Emby: Single instance via `singleEmbySettingsService`
- Deletion score: JSON serialized in AppSettings

**External API Integration:**
- Radarr/Sonarr: Auto-generated TypeScript clients from OpenAPI specs in `openapi/`
- Emby: `emby-sdk-stainless` package (docs: https://raw.githubusercontent.com/sqzw-x/emby-typescript/refs/heads/next/api.md)

## Critical Rules

### External API Safety (NEVER VIOLATE)
- **NEVER** write code that modifies data in Sonarr, Radarr, or Emby
- Only use **GET requests** to external media APIs
- No delete, update, or create operations on external services
- Validate all data from external APIs before processing
- Implement fallback behavior when external services are unavailable

### Code Style
- Write self-documenting code with clear names - comments only when absolutely necessary
- Always use static imports at top of file - no dynamic imports
- Follow DRY principle rigorously
- Use proper TypeScript types for all data structures
- Handle errors with try-catch blocks

### State Management
- Use `@tanstack/react-query` for all async data fetching
- Use `useQuery` for fetching, `useMutation` for updates
- Co-locate queries near components that use them
- Use descriptive query keys to avoid cache collisions
- Invalidate/refetch queries after mutations

### Database Changes
1. Modify `prisma/schema.prisma`
2. Create migration: `bunx prisma migrate dev --name descriptive-name`
3. Generate client: `bun run db:generate`

### API Client Regeneration
After modifying OpenAPI specs or configuration:
```bash
bun run gen-api:all
```
This regenerates the TypeScript clients in `src/generated/radarr/` and `src/generated/sonarr/`.

## Key Types and Services

**Deletion Score Calculation:**
- `DeletionScoreCalculator` in `src/lib/deletion-score-calculator.ts`
- Factors: days unwatched, never watched bonus, size on disk, age since added, folder space
- Score breakdowns available for UI display

**Media Processing:**
- `MediaProcessor` orchestrates the fetch/enrich/score pipeline
- Exports progress updates via Zustand store for real-time UI updates
- Limit: `MEDIA_PROCESSOR_ITEM_LIMIT` (check `src/lib/media-processor/constants.ts`)

**Services:**
- `EmbyService` - Emby API client wrapper
- `SonarrService` / `RadarrService` - Arr API clients using generated SDKs
- `FolderSpaceService` - Disk space monitoring
- `DeletionScoreService` - Score settings management
- `eventsService` - Event logging for debugging
