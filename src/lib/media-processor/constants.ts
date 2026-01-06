// Configuration constants
export const MEDIA_PROCESSOR_ITEM_LIMIT: number | undefined = process.env
  .MEDIA_PROCESSOR_ITEM_LIMIT
  ? Number.parseInt(process.env.MEDIA_PROCESSOR_ITEM_LIMIT, 10)
  : undefined;

// Events configuration
export const EVENTS_PAGE_SIZE = 100;
export const EVENTS_MAX_COUNT = 10000;

// Quality mapping for scoring
export const QUALITY_SCORE_MAP: Record<string, number> = {
  'Bluray-2160p': 100,
  'WEBDL-2160p': 95,
  'WEBRip-2160p': 90,
  'Bluray-1080p': 85,
  'WEBDL-1080p': 80,
  'WEBRip-1080p': 75,
  'Bluray-720p': 70,
  'WEBDL-720p': 65,
  'WEBRip-720p': 60,
  'HDTV-1080p': 55,
  'HDTV-720p': 50,
  DVD: 40,
  SDTV: 30,
  Unknown: 20,
};
