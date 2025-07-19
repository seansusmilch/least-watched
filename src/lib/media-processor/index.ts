// Main MediaProcessor class
export { MediaProcessor } from './media-processor';

// Types
export type {
  MediaProcessingProgress,
  ProcessedMediaItem,
  SonarrSeries,
  RadarrMovie,
  SonarrInstance,
  RadarrInstance,
  EmbySettings,
  EmbyPlaybackInfo,
} from './types';

// Constants and utilities
export { TESTING_LIMIT, getQualityScore } from './constants';

// Individual processors (if needed for specific use cases)
export { SonarrProcessor } from './sonarr-processor';
export { RadarrProcessor } from './radarr-processor';
export { EmbyProcessor } from './emby-processor';
export { MediaStorage } from './storage';

// Export default as MediaProcessor for convenience
export { MediaProcessor as default } from './media-processor';
