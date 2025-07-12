import { PrismaClient } from '../generated/prisma';
import {
  sonarrSettingsService,
  radarrSettingsService,
  embySettingsService,
} from './database';
import {
  getEnhancedProcessingSettings,
  type EnhancedProcessingSettings,
  getDeletionScoreSettings,
} from './actions/settings';
import { deletionScoreCalculator } from './deletion-score-calculator';
import { folderSpaceService } from './services/folder-space-service';
import { type FolderSpaceData } from './types/media-processing';
import path from 'path';

// Configuration constants
const TESTING_LIMIT = 25; // Limit number of items processed per instance for testing

const prisma = new PrismaClient();

// Global progress tracking
const progressStore = new Map<string, MediaProcessingProgress>();

// Type definitions
interface MediaProcessingProgress {
  phase: string;
  current: number;
  total: number;
  currentItem: string;
  percentage: number;
  isComplete?: boolean;
  error?: string;
}

interface ProcessedMediaItem {
  title: string;
  type: 'movie' | 'tv';
  tmdbId?: number;
  imdbId?: string;
  year?: number;
  mediaPath: string;
  parentFolder: string;
  sizeOnDisk: number;
  dateAdded: Date;
  source: string;
  sonarrId?: number;
  radarrId?: number;
  embyId?: string;
  lastWatched?: Date;
  watchCount?: number;

  // Enhanced fields for deletion decisions
  quality?: string;
  qualityScore?: number;

  // TV Show specific
  episodesOnDisk?: number;
  totalEpisodes?: number;
  seasonCount?: number;
  completionPercentage?: number;

  // Monitoring and availability
  monitored?: boolean;

  // Ratings
  imdbRating?: number;
  tmdbRating?: number;

  // Play progress from Emby
  playProgress?: number;
  fullyWatched?: boolean;

  // Size efficiency
  runtime?: number;
  sizePerHour?: number;

  // Metadata
  genres?: string[];
  overview?: string;
}

interface SonarrSeries {
  id: number;
  title: string;
  year: number;
  added: string;
  path: string;
  tvdbId?: number;
  tmdbId?: number;
  imdbId?: string;
  monitored?: boolean;
  seasons?: Array<{
    statistics?: {
      episodeFileCount: number;
    };
  }>;
  statistics: {
    seasonCount: number;
    episodeFileCount: number;
    episodeCount: number;
    totalEpisodeCount: number;
    sizeOnDisk: number;
  };
}

interface RadarrMovie {
  id: number;
  title: string;
  year: number;
  added: string;
  path: string;
  sizeOnDisk: number;
  tmdbId?: number;
  imdbId?: string;
  monitored?: boolean;
  movieFile?: {
    quality?: {
      quality?: {
        name: string;
      };
    };
  };
}

interface SonarrInstance {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RadarrInstance {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EmbyInstance {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  userId?: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StoredMediaItem {
  id: string;
  title: string;
  type: string;
  tmdbId?: number | null;
  imdbId?: string | null;
  year?: number | null;
  lastWatched?: Date | null;
  watchCount: number;
  sonarrId?: number | null;
  radarrId?: number | null;
  embyId?: string | null;
  mediaPath?: string | null;
  parentFolder?: string | null;
  sizeOnDisk?: bigint | null;
  dateAdded?: Date | null;
  source?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Enhanced fields
  quality?: string | null;
  qualityScore?: number | null;

  // TV Show specific
  episodesOnDisk?: number | null;
  totalEpisodes?: number | null;
  seasonCount?: number | null;
  completionPercentage?: number | null;

  // Monitoring and availability
  monitored?: boolean | null;

  // Ratings
  imdbRating?: number | null;
  tmdbRating?: number | null;

  // Play progress
  playProgress?: number | null;
  fullyWatched?: boolean | null;

  // Size efficiency
  runtime?: number | null;
  sizePerHour?: number | null;

  // Metadata
  genres?: string | null;
  overview?: string | null;

  // Deletion score
  deletionScore?: number | null;
}

export class MediaProcessor {
  private onProgress?: (progress: MediaProcessingProgress) => void;
  private enhancedSettings: EnhancedProcessingSettings | null = null;
  private progressId: string;

  constructor(
    onProgress?: (progress: MediaProcessingProgress) => void,
    progressId?: string
  ) {
    this.onProgress = onProgress;
    this.progressId = progressId || 'default';
  }

  private async ensureEnhancedSettings(): Promise<void> {
    if (!this.enhancedSettings) {
      this.enhancedSettings = await getEnhancedProcessingSettings();
    }
  }

  private updateProgress(
    phase: string,
    current: number,
    total: number,
    currentItem: string = ''
  ) {
    const progress: MediaProcessingProgress = {
      phase,
      current,
      total,
      currentItem,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    };

    // Store progress globally
    progressStore.set(this.progressId, progress);

    // Call callback if provided
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  static getProgress(
    progressId: string = 'default'
  ): MediaProcessingProgress | null {
    return progressStore.get(progressId) || null;
  }

  static clearProgress(progressId: string = 'default'): void {
    progressStore.delete(progressId);
  }

  static getActiveProcess(): {
    progressId: string;
    progress: MediaProcessingProgress;
  } | null {
    for (const [progressId, progress] of Array.from(progressStore.entries())) {
      if (!progress.isComplete && !progress.error) {
        return { progressId, progress };
      }
    }
    return null;
  }

  private getQualityScore(quality?: string): number {
    const qualityMap: Record<string, number> = {
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
    return qualityMap[quality || 'Unknown'] || 20;
  }

  async processAllMedia(): Promise<ProcessedMediaItem[]> {
    const allProcessedItems: ProcessedMediaItem[] = [];

    this.updateProgress('Initializing', 0, 100, 'Starting media processing...');

    // Ensure settings are loaded
    await this.ensureEnhancedSettings();

    // Get all enabled instances
    const [sonarrInstances, radarrInstances, embyInstances] = await Promise.all(
      [
        sonarrSettingsService.getEnabled(),
        radarrSettingsService.getEnabled(),
        embySettingsService.getEnabled(),
      ]
    );

    // Calculate total items across all instances
    this.updateProgress(
      'Calculating total items',
      0,
      100,
      'Counting media items...'
    );

    let totalItems = 0;

    // Count Sonarr items
    for (const sonarrInstance of sonarrInstances) {
      try {
        const response = await fetch(`${sonarrInstance.url}/api/v3/series`, {
          headers: { 'X-Api-Key': sonarrInstance.apiKey },
        });
        if (response.ok) {
          const series = await response.json();
          totalItems += Math.min(series.length, TESTING_LIMIT); // Limit for testing
        }
      } catch (error) {
        console.error(
          `Error counting Sonarr items for ${sonarrInstance.name}:`,
          error
        );
      }
    }

    // Count Radarr items
    for (const radarrInstance of radarrInstances) {
      try {
        const response = await fetch(`${radarrInstance.url}/api/v3/movie`, {
          headers: { 'X-Api-Key': radarrInstance.apiKey },
        });
        if (response.ok) {
          const movies = await response.json();
          totalItems += Math.min(movies.length, TESTING_LIMIT); // Limit for testing
        }
      } catch (error) {
        console.error(
          `Error counting Radarr items for ${radarrInstance.name}:`,
          error
        );
      }
    }

    let processedItemCount = 0;

    // Process Sonarr instances
    for (const sonarrInstance of sonarrInstances) {
      try {
        const sonarrItems = await this.processSonarrInstance(
          sonarrInstance,
          embyInstances,
          processedItemCount,
          totalItems
        );
        allProcessedItems.push(...sonarrItems);
        processedItemCount += sonarrItems.length;
      } catch (error) {
        console.error(
          `Error processing Sonarr instance ${sonarrInstance.name}:`,
          error
        );
      }
    }

    // Process Radarr instances
    for (const radarrInstance of radarrInstances) {
      try {
        const radarrItems = await this.processRadarrInstance(
          radarrInstance,
          embyInstances,
          processedItemCount,
          totalItems
        );
        allProcessedItems.push(...radarrItems);
        processedItemCount += radarrItems.length;
      } catch (error) {
        console.error(
          `Error processing Radarr instance ${radarrInstance.name}:`,
          error
        );
      }
    }

    // Store all processed items
    this.updateProgress(
      'Storing Data',
      processedItemCount,
      totalItems,
      'Saving to database...'
    );
    await this.storeProcessedItems(allProcessedItems);

    this.updateProgress(
      'Items Stored',
      processedItemCount,
      totalItems,
      `Processed ${allProcessedItems.length} items`
    );

    // Mark as complete
    const completedProgress: MediaProcessingProgress = {
      phase: 'Complete',
      current: totalItems,
      total: totalItems,
      currentItem: `Processed ${allProcessedItems.length} items`,
      percentage: 100,
      isComplete: true,
    };
    progressStore.set(this.progressId, completedProgress);

    return allProcessedItems;
  }

  private async processSonarrInstance(
    sonarrInstance: SonarrInstance,
    embyInstances: EmbyInstance[],
    processedItemCount: number,
    totalItems: number
  ): Promise<ProcessedMediaItem[]> {
    const processedItems: ProcessedMediaItem[] = [];

    try {
      console.log(
        `🔍 Fetching series from Sonarr instance: ${sonarrInstance.name}`
      );
      console.log(`📡 API URL: ${sonarrInstance.url}/api/v3/series`);

      // Get series from Sonarr
      const response = await fetch(`${sonarrInstance.url}/api/v3/series`, {
        headers: {
          'X-Api-Key': sonarrInstance.apiKey,
        },
      });

      if (!response.ok) {
        console.error(
          `❌ Sonarr API request failed: ${response.status} ${response.statusText}`
        );
        throw new Error(`Failed to fetch from Sonarr: ${response.statusText}`);
      }

      const series: SonarrSeries[] = await response.json();
      console.log(
        `📊 Received ${series.length} series from Sonarr ${sonarrInstance.name}`
      );

      // Limit to first 10 entries for testing
      const limitedSeries = series.slice(0, TESTING_LIMIT);
      console.log(
        `🔢 Processing first ${limitedSeries.length} series for testing`
      );

      for (let i = 0; i < limitedSeries.length; i++) {
        const series = limitedSeries[i];
        const currentItemIndex = processedItemCount + i + 1;

        // Update progress for this specific item
        this.updateProgress(
          'Processing TV Shows',
          currentItemIndex,
          totalItems,
          `Processing: ${series.title}`
        );

        console.log(`\n📺 Processing series ${i + 1}/${limitedSeries.length}:`);
        console.log(`   Title: ${series.title}`);
        console.log(`   ID: ${series.id}`);
        console.log(`   Year: ${series.year}`);
        console.log(`   Path: ${series.path}`);
        console.log(`   Size on Disk: ${series.statistics.sizeOnDisk} bytes`);
        console.log(`   Added: ${series.added}`);
        console.log(`   TMDB ID: ${series.tmdbId}`);
        console.log(`   IMDB ID: ${series.imdbId}`);
        console.log(`   Raw data:`, JSON.stringify(series, null, 2));

        // Calculate completion percentage
        const episodesOnDisk = series.statistics.episodeFileCount;
        const totalEpisodes = series.statistics.totalEpisodeCount;
        const completionPercentage =
          totalEpisodes > 0
            ? Math.round((episodesOnDisk / totalEpisodes) * 100)
            : 0;

        const processedItem: ProcessedMediaItem = {
          title: series.title,
          type: 'tv',
          tmdbId: series.tmdbId,
          imdbId: series.imdbId,
          year: series.year,
          mediaPath: series.path,
          parentFolder: path.dirname(series.path),
          sizeOnDisk: series.statistics.sizeOnDisk,
          dateAdded: new Date(series.added),
          source: sonarrInstance.name,
          sonarrId: series.id,

          // Enhanced TV show fields
          episodesOnDisk,
          totalEpisodes,
          seasonCount: series.statistics.seasonCount,
          completionPercentage,
          monitored:
            series.monitored !== undefined ? series.monitored : undefined,
        };

        // Get enhanced details if enabled
        if (this.enhancedSettings?.enableDetailedMetadata) {
          try {
            const detailResponse = await fetch(
              `${sonarrInstance.url}/api/v3/series/${series.id}`,
              {
                headers: { 'X-Api-Key': sonarrInstance.apiKey },
              }
            );

            if (detailResponse.ok) {
              const details = await detailResponse.json();
              processedItem.runtime = details.runtime;
              processedItem.genres = details.genres;
              processedItem.overview = details.overview;

              // Extract ratings
              if (details.ratings) {
                processedItem.imdbRating = details.ratings.imdb?.value;
                processedItem.tmdbRating = details.ratings.tmdb?.value;
              }

              console.log(
                `   ✅ Enhanced metadata retrieved for: ${series.title}`
              );
            }
          } catch {
            console.log(
              `   ⚠️ Could not fetch enhanced details for: ${series.title}`
            );
          }
        }

        // Calculate size efficiency
        if (processedItem.runtime && processedItem.episodesOnDisk) {
          const totalRuntime =
            processedItem.runtime * processedItem.episodesOnDisk;
          const sizeInGB = processedItem.sizeOnDisk / (1024 * 1024 * 1024);
          processedItem.sizePerHour =
            totalRuntime > 0 ? (sizeInGB / totalRuntime) * 60 : 0;
        }

        // Try to get playback information from Emby
        if (this.enhancedSettings?.enablePlaybackProgress) {
          console.log(`   🎬 Querying Emby for playback info...`);
          const embyData = await this.getEmbyPlaybackInfo(
            series.title,
            embyInstances
          );
          if (embyData) {
            console.log(
              `   ✅ Found Emby data:`,
              JSON.stringify(embyData, null, 2)
            );
            processedItem.embyId = embyData.embyId;
            processedItem.lastWatched = embyData.lastWatched;
            processedItem.watchCount = embyData.watchCount || 0;
          } else {
            console.log(`   ❌ No Emby data found for: ${series.title}`);
          }
        }

        processedItems.push(processedItem);
        console.log(
          `   ✅ Processed item:`,
          JSON.stringify(processedItem, null, 2)
        );
      }
    } catch (error) {
      console.error(
        `❌ Error processing Sonarr instance ${sonarrInstance.name}:`,
        error
      );
    }

    console.log(
      `🎯 Completed processing ${processedItems.length} items from Sonarr ${sonarrInstance.name}`
    );
    return processedItems;
  }

  private async processRadarrInstance(
    radarrInstance: RadarrInstance,
    embyInstances: EmbyInstance[],
    processedItemCount: number,
    totalItems: number
  ): Promise<ProcessedMediaItem[]> {
    const processedItems: ProcessedMediaItem[] = [];

    try {
      console.log(
        `🔍 Fetching movies from Radarr instance: ${radarrInstance.name}`
      );
      console.log(`📡 API URL: ${radarrInstance.url}/api/v3/movie`);

      // Get movies from Radarr
      const response = await fetch(`${radarrInstance.url}/api/v3/movie`, {
        headers: {
          'X-Api-Key': radarrInstance.apiKey,
        },
      });

      if (!response.ok) {
        console.error(
          `❌ Radarr API request failed: ${response.status} ${response.statusText}`
        );
        throw new Error(`Failed to fetch from Radarr: ${response.statusText}`);
      }

      const movies: RadarrMovie[] = await response.json();
      console.log(
        `📊 Received ${movies.length} movies from Radarr ${radarrInstance.name}`
      );

      // Limit to first 10 entries for testing
      const limitedMovies = movies.slice(0, TESTING_LIMIT);
      console.log(
        `🔢 Processing first ${limitedMovies.length} movies for testing`
      );

      for (let i = 0; i < limitedMovies.length; i++) {
        const movie = limitedMovies[i];
        const currentItemIndex = processedItemCount + i + 1;

        // Update progress for this specific item
        this.updateProgress(
          'Processing Movies',
          currentItemIndex,
          totalItems,
          `Processing: ${movie.title}`
        );

        console.log(`\n🎬 Processing movie ${i + 1}/${limitedMovies.length}:`);
        console.log(`   Title: ${movie.title}`);
        console.log(`   ID: ${movie.id}`);
        console.log(`   Year: ${movie.year}`);
        console.log(`   Path: ${movie.path}`);
        console.log(`   Size on Disk: ${movie.sizeOnDisk} bytes`);
        console.log(`   Added: ${movie.added}`);
        console.log(`   TMDB ID: ${movie.tmdbId}`);
        console.log(`   IMDB ID: ${movie.imdbId}`);
        console.log(`   Raw data:`, JSON.stringify(movie, null, 2));

        const processedItem: ProcessedMediaItem = {
          title: movie.title,
          type: 'movie',
          tmdbId: movie.tmdbId,
          imdbId: movie.imdbId,
          year: movie.year,
          mediaPath: movie.path,
          parentFolder: path.dirname(movie.path),
          sizeOnDisk: movie.sizeOnDisk,
          dateAdded: new Date(movie.added),
          source: radarrInstance.name,
          radarrId: movie.id,

          // Enhanced movie fields
          quality: movie.movieFile?.quality?.quality?.name,
          monitored: movie.monitored,
        };

        // Set quality score
        if (this.enhancedSettings?.enableQualityAnalysis) {
          processedItem.qualityScore = this.getQualityScore(
            processedItem.quality
          );
        }

        // Get enhanced details if enabled
        if (this.enhancedSettings?.enableDetailedMetadata) {
          try {
            const detailResponse = await fetch(
              `${radarrInstance.url}/api/v3/movie/${movie.id}`,
              {
                headers: { 'X-Api-Key': radarrInstance.apiKey },
              }
            );

            if (detailResponse.ok) {
              const details = await detailResponse.json();
              processedItem.runtime = details.runtime;
              processedItem.genres = details.genres;
              processedItem.overview = details.overview;

              // Extract ratings
              if (details.ratings) {
                processedItem.imdbRating = details.ratings.imdb?.value;
                processedItem.tmdbRating = details.ratings.tmdb?.value;
              }

              console.log(
                `   ✅ Enhanced metadata retrieved for: ${movie.title}`
              );
            }
          } catch {
            console.log(
              `   ⚠️ Could not fetch enhanced details for: ${movie.title}`
            );
          }
        }

        // Calculate size efficiency
        if (processedItem.runtime) {
          const sizeInGB = processedItem.sizeOnDisk / (1024 * 1024 * 1024);
          processedItem.sizePerHour = (sizeInGB / processedItem.runtime) * 60;
        }

        // Try to get playback information from Emby
        if (this.enhancedSettings?.enablePlaybackProgress) {
          console.log(`   🎬 Querying Emby for playback info...`);
          const embyData = await this.getEmbyPlaybackInfo(
            movie.title,
            embyInstances
          );
          if (embyData) {
            console.log(
              `   ✅ Found Emby data:`,
              JSON.stringify(embyData, null, 2)
            );
            processedItem.embyId = embyData.embyId;
            processedItem.lastWatched = embyData.lastWatched;
            processedItem.watchCount = embyData.watchCount || 0;
          } else {
            console.log(`   ❌ No Emby data found for: ${movie.title}`);
          }
        }

        processedItems.push(processedItem);
        console.log(
          `   ✅ Processed item:`,
          JSON.stringify(processedItem, null, 2)
        );
      }
    } catch (error) {
      console.error(
        `❌ Error processing Radarr instance ${radarrInstance.name}:`,
        error
      );
    }

    console.log(
      `🎯 Completed processing ${processedItems.length} items from Radarr ${radarrInstance.name}`
    );
    return processedItems;
  }

  private async getEmbyPlaybackInfo(
    title: string,
    embyInstances: EmbyInstance[]
  ): Promise<{
    lastWatched?: Date;
    watchCount?: number;
    embyId?: string;
  } | null> {
    console.log(
      `     🔍 Searching for "${title}" in ${embyInstances.length} Emby instances`
    );

    for (let i = 0; i < embyInstances.length; i++) {
      const embyInstance = embyInstances[i];
      try {
        // Use custom SQL query to get both playback activity and watch count in one query
        const customQueryUrl = `${embyInstance.url}/emby/user_usage_stats/submit_custom_query`;

        // Escape single quotes in the title for SQL
        const escapedTitle = title.replace(/'/g, "''");

        // Build comprehensive SQL query to get all information in one go
        const sqlQuery = `
          WITH RecentActivity AS (
            SELECT ROWID, DateCreated, ItemId, ItemName, PlayDuration
            FROM PlaybackActivity 
            WHERE ItemName LIKE '${escapedTitle}%'
            ORDER BY DateCreated DESC
            LIMIT 1
          ),
          WatchCount AS (
            SELECT COUNT(*) as WatchCount
            FROM PlaybackActivity 
            WHERE ItemName LIKE '${escapedTitle}%'
            AND PlayDuration > 300 
            AND PlayDuration < 28800
          )
          SELECT 
            r.ROWID, 
            r.DateCreated, 
            r.ItemId, 
            r.ItemName, 
            r.PlayDuration,
            w.WatchCount
          FROM RecentActivity r
          CROSS JOIN WatchCount w
        `;

        const payload = {
          CustomQueryString: sqlQuery,
          ReplaceUserId: true,
        };

        console.log(
          `     📡 Querying Emby ${embyInstance.name} with combined SQL query`
        );
        console.log(`     📝 SQL Query: ${sqlQuery}`);

        const response = await fetch(customQueryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Emby-Token': embyInstance.apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.log(
            `     ❌ Emby custom query failed: ${response.status} ${response.statusText}`
          );
          continue;
        }

        const data = await response.json();
        console.log(
          `     📊 Combined query response:`,
          JSON.stringify(data, null, 2)
        );

        if (data.results && data.results.length > 0) {
          const result = data.results[0];

          // Map the result based on the columns (now includes WatchCount)
          const columnIndex = {
            rowid: data.colums?.indexOf('rowid') ?? 0,
            dateCreated: data.colums?.indexOf('DateCreated') ?? 1,
            itemId: data.colums?.indexOf('ItemId') ?? 2,
            itemName: data.colums?.indexOf('ItemName') ?? 3,
            playDuration: data.colums?.indexOf('PlayDuration') ?? 4,
            watchCount: data.colums?.indexOf('WatchCount') ?? 5,
          };

          const lastWatchedStr = result[columnIndex.dateCreated];
          const itemId = result[columnIndex.itemId];
          const itemName = result[columnIndex.itemName];
          const playDuration = result[columnIndex.playDuration];
          const watchCount = parseInt(result[columnIndex.watchCount]) || 1;

          console.log(`     ✅ Found playback activity for: ${itemName}`);
          console.log(`     📅 Last watched: ${lastWatchedStr}`);
          console.log(`     🆔 Item ID: ${itemId}`);
          console.log(`     ⏱️ Play duration: ${playDuration} seconds`);
          console.log(`     🔢 Total watch count: ${watchCount}`);

          // Parse the date
          const lastWatched = lastWatchedStr
            ? new Date(lastWatchedStr)
            : undefined;

          return {
            lastWatched,
            watchCount,
            embyId: itemId,
          };
        } else {
          console.log(
            `     ❌ No playback activity found in Emby ${embyInstance.name} for: ${title}`
          );
        }
      } catch (error) {
        console.error(
          `     ❌ Error querying Emby instance ${embyInstance.name}:`,
          error
        );
      }
    }

    console.log(
      `     ❌ No playback activity found in any Emby instance for: ${title}`
    );
    return null;
  }

  private async storeProcessedItems(
    items: ProcessedMediaItem[]
  ): Promise<void> {
    console.log(`📦 Starting to store ${items.length} items`);
    let totalStored = 0;

    // Get deletion score settings and folder space data for scoring
    const deletionScoreSettings = await getDeletionScoreSettings();
    const folderSpaceData = await folderSpaceService.getFolderSpaceData();

    for (const item of items) {
      try {
        // Build WHERE condition based on what IDs are available
        const whereConditions = [];

        if (item.sonarrId) {
          whereConditions.push({
            sonarrId: item.sonarrId,
            source: item.source,
          });
        }

        if (item.radarrId) {
          whereConditions.push({
            radarrId: item.radarrId,
            source: item.source,
          });
        }

        // Fallback to title and type if no specific IDs
        if (whereConditions.length === 0) {
          whereConditions.push({
            title: item.title,
            type: item.type,
            source: item.source,
          });
        }

        // Check if item already exists
        const existingItem = await prisma.mediaItem.findFirst({
          where: {
            OR: whereConditions,
          },
        });

        // Safely convert sizeOnDisk to BigInt
        const sizeOnDisk = item.sizeOnDisk
          ? BigInt(Math.max(0, item.sizeOnDisk))
          : null;

        // Calculate deletion score
        const folderRemainingSpacePercent =
          this.calculateFolderRemainingSpacePercent(
            item.parentFolder,
            folderSpaceData
          );

        const deletionScore = deletionScoreSettings.enabled
          ? deletionScoreCalculator.calculateScore(
              {
                id: existingItem?.id || 'temp',
                sizeOnDisk: sizeOnDisk,
                dateAdded: item.dateAdded,
                lastWatched: item.lastWatched,
                folderRemainingSpacePercent,
              },
              deletionScoreSettings
            )
          : null;

        const itemData = {
          title: item.title,
          type: item.type,
          tmdbId: item.tmdbId,
          imdbId: item.imdbId,
          year: item.year,
          mediaPath: item.mediaPath,
          parentFolder: item.parentFolder,
          sizeOnDisk: sizeOnDisk,
          dateAdded: item.dateAdded,
          source: item.source,
          embyId: item.embyId,
          lastWatched: item.lastWatched,
          watchCount: item.watchCount || 0,

          // Enhanced fields
          quality: item.quality,
          qualityScore: item.qualityScore,

          // TV Show specific
          episodesOnDisk: item.episodesOnDisk,
          totalEpisodes: item.totalEpisodes,
          seasonCount: item.seasonCount,
          completionPercentage: item.completionPercentage,

          // Monitoring and availability
          monitored: item.monitored,

          // Ratings
          imdbRating: item.imdbRating,
          tmdbRating: item.tmdbRating,

          // Play progress
          playProgress: item.playProgress,
          fullyWatched: item.fullyWatched,

          // Size efficiency
          runtime: item.runtime,
          sizePerHour: item.sizePerHour,

          // Metadata
          genres: item.genres ? JSON.stringify(item.genres) : null,
          overview: item.overview,

          // Deletion score
          deletionScore: deletionScore,
        };

        if (existingItem) {
          // Update existing item
          console.log(
            `🔄 Updating existing item: ${item.title} (ID: ${existingItem.id})`
          );
          await prisma.mediaItem.update({
            where: { id: existingItem.id },
            data: itemData,
          });
          console.log(`✅ Successfully updated: ${item.title}`);
        } else {
          // Create new item
          console.log(`➕ Creating new item: ${item.title}`);
          const newItem = await prisma.mediaItem.create({
            data: {
              ...itemData,
              sonarrId: item.sonarrId,
              radarrId: item.radarrId,
            },
          });
          console.log(
            `✅ Successfully created: ${item.title} (ID: ${newItem.id})`
          );
        }

        totalStored++;
        this.updateProgress(
          'Storing Data',
          totalStored,
          items.length,
          item.title
        );
      } catch (error) {
        console.error(`❌ Error storing item ${item.title}:`, error);
        console.error(`   Item data:`, JSON.stringify(item, null, 2));
        continue;
      }
    }

    console.log(
      `🎉 Finished storing all items. Total stored: ${totalStored}/${items.length}`
    );
  }

  async getStoredMediaItems(): Promise<StoredMediaItem[]> {
    return await prisma.mediaItem.findMany({
      orderBy: [{ parentFolder: 'asc' }, { title: 'asc' }],
    });
  }

  private calculateFolderRemainingSpacePercent(
    parentFolder: string | undefined,
    folderSpaceData: FolderSpaceData[]
  ): number | null {
    if (!parentFolder) return null;

    // Find matching folder space data
    const matchingFolder = folderSpaceData.find(
      (folder) =>
        parentFolder.startsWith(folder.path) ||
        folder.path.startsWith(parentFolder)
    );

    if (!matchingFolder || !matchingFolder.totalSpaceGB) {
      return null;
    }

    // Calculate remaining space percentage
    const remainingSpacePercent =
      (matchingFolder.freeSpaceGB / matchingFolder.totalSpaceGB) * 100;
    return Math.round(remainingSpacePercent * 100) / 100; // Round to 2 decimal places
  }
}

export default MediaProcessor;
