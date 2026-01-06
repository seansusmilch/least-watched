// Main MediaProcessor class
export { MediaProcessor } from './media-processor';

// Types
export type {
  MediaProcessingProgress,
  ItemProcessingStats,
  ProcessingRunStats,
} from '@/lib/types/media-processing';

export type { ProcessedMediaItem, EmbyPlaybackInfo, EmbyMetadata } from '@/lib/types/media';

export type { SonarrSeries, RadarrMovie } from '@/lib/types/arr';

export type { SonarrInstance, RadarrInstance } from '@/lib/types/instances';

// Constants and utilities
export { MEDIA_PROCESSOR_ITEM_LIMIT } from './constants';
export { getQualityScore } from './utils';

// Individual processors (if needed for specific use cases)
export { MediaStorage } from './storage';

// Export default as MediaProcessor for convenience
export { MediaProcessor as default } from './media-processor';
