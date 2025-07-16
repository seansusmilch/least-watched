# Media Processor Module

This module has been split from the original large `media-processor.ts` file into smaller, more manageable files for better organization and maintainability.

## File Structure

```
src/lib/media-processor/
├── index.ts                 # Main exports and public API
├── media-processor.ts       # Main MediaProcessor class (orchestrator)
├── types.ts                 # All TypeScript interfaces and types
├── constants.ts             # Configuration constants and utility functions
├── sonarr-processor.ts      # Sonarr-specific processing logic
├── radarr-processor.ts      # Radarr-specific processing logic  
├── emby-processor.ts        # Emby playback info retrieval
├── storage.ts               # Database operations and storage logic
└── README.md               # This file
```

## File Descriptions

### `index.ts`
- Main entry point for the module
- Exports the `MediaProcessor` class and all related types
- Provides a clean public API for consumers

### `media-processor.ts`
- Contains the main `MediaProcessor` class
- Orchestrates the processing of media from different sources
- Handles progress tracking and coordination between processors
- Manages the overall workflow

### `types.ts`
- All TypeScript interface definitions
- Includes types for processed media items, API responses, and configuration
- Centralized type definitions for consistency

### `constants.ts`
- Configuration constants (like `TESTING_LIMIT`)
- Quality scoring mappings
- Utility functions for calculations

### `sonarr-processor.ts`
- Handles processing of TV shows from Sonarr instances
- Extracts series information and enhanced metadata
- Calculates completion percentages and size efficiency

### `radarr-processor.ts`
- Handles processing of movies from Radarr instances
- Extracts movie information and quality data
- Processes ratings and metadata

### `emby-processor.ts`
- Handles Emby playback information retrieval
- Queries Emby for watch history and play counts
- Uses SQL queries for efficient data extraction

### `storage.ts`
- Database operations using Prisma
- Handles storing and retrieving media items
- Manages upsert operations and deletion score calculations

## Usage

The module can be used exactly as before:

```typescript
import { MediaProcessor } from '@/lib/media-processor';

// Create a new processor instance
const processor = new MediaProcessor();

// Process all media
const results = await processor.processAllMedia();

// Get stored media items
const storedItems = await processor.getStoredMediaItems();
```

Or you can import individual components if needed:

```typescript
import { 
  MediaProcessor, 
  SonarrProcessor, 
  RadarrProcessor, 
  EmbyProcessor,
  MediaStorage 
} from '@/lib/media-processor';
```

## Benefits of This Structure

1. **Separation of Concerns**: Each file has a single responsibility
2. **Maintainability**: Easier to find and modify specific functionality
3. **Testability**: Individual components can be tested in isolation
4. **Reusability**: Components can be used independently if needed
5. **Readability**: Smaller files are easier to understand and navigate

## Backward Compatibility

The original `media-processor.ts` file now simply re-exports the `MediaProcessor` class from this module, ensuring existing imports continue to work without changes. 