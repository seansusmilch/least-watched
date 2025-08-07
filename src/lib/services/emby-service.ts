import Emby from 'emby-sdk-stainless';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';
import {
  type EmbyPlaybackInfo,
  type EmbyMetadata,
} from '@/lib/media-processor/types';

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export class EmbyService {
  private static createClient(embyInstance: EmbySettings): Emby {
    return new Emby({
      baseURL: embyInstance.url,
      apiKey: embyInstance.apiKey || '',
      timeout: DEFAULT_TIMEOUT,
    });
  }

  /** List Emby libraries (virtual folders) */
  static async listLibraries(
    embyInstance: EmbySettings
  ): Promise<Array<{ id: string; name: string }>> {
    try {
      const response = await fetch(
        `${embyInstance.url}/Library/VirtualFolders?api_key=${embyInstance.apiKey}`
      );
      const libraries: Array<{
        Name?: string;
        Id?: string;
        ItemId?: string;
        LibraryOptions?: { LibraryId?: string };
      }> = await response.json();
      return (libraries || []).map((lib) => ({
        id:
          lib.Id ||
          lib.ItemId ||
          lib.LibraryOptions?.LibraryId ||
          (lib.Name ? lib.Name.toLowerCase().replace(/\s+/g, '-') : ''),
        name: lib.Name || 'Unknown',
      }));
    } catch (e) {
      console.error('Failed to list Emby libraries', e);
      return [];
    }
  }

  /** List items from specific libraries, with paging */
  static async listLibraryItems(opts: {
    embyInstance: EmbySettings;
    libraryIds: string[];
    types?: Array<'Movie' | 'Series'>;
    pageSize?: number;
  }): Promise<Emby.BaseItem[]> {
    const {
      embyInstance,
      libraryIds,
      types = ['Movie', 'Series'],
      pageSize = 500,
    } = opts;
    const client = this.createClient(embyInstance);
    const items: Emby.BaseItem[] = [];
    let startIndex = 0;

    // Attempt to filter by LibraryIds if provided
    const libFilter: string[] | undefined =
      libraryIds && libraryIds.length > 0 ? libraryIds : undefined;

    while (true) {
      const params: Record<string, string | number | boolean> = {
        Recursive: true,
        IncludeItemTypes: types.join(','),
        Fields:
          'DateCreated,ProviderIds,Path,ProductionYear,RunTimeTicks,MediaSources',
        StartIndex: startIndex,
        Limit: pageSize,
      };
      if (libFilter) params['LibraryIds'] = libFilter.join(',');

      const result: Emby.QueryResultBaseItem = await client.items.list(
        params as Record<string, unknown>
      );

      const page: Emby.BaseItem[] = (result?.Items as Emby.BaseItem[]) ?? [];
      items.push(...page);

      if (page.length < pageSize) break;
      startIndex += pageSize;
    }

    return items;
  }

  /**
   * Finds a single Emby item by external provider IDs (tvdb/tmdb/imdb)
   * Priority: TV (tvdb -> tmdb -> imdb), Movies (tmdb -> imdb)
   */
  static async findItemByProviderIds(
    {
      tvdbId,
      tmdbId,
      imdbId,
      type,
    }: {
      tvdbId?: number | null;
      tmdbId?: number | null;
      imdbId?: string | null;
      type?: 'movie' | 'tv';
    },
    embyInstance: EmbySettings | null
  ): Promise<EmbyMetadata | null> {
    if (!embyInstance) return null;
    const embyClient = this.createClient(embyInstance);

    const includeTypes =
      type === 'movie' ? 'Movie' : type === 'tv' ? 'Series' : 'Movie,Series';

    const searchOrder: Array<{ key: 'tvdb' | 'tmdb' | 'imdb'; value: string }> =
      [];

    if (tmdbId) searchOrder.push({ key: 'tmdb', value: String(tmdbId) });
    if (imdbId) searchOrder.push({ key: 'imdb', value: imdbId });
    if (tvdbId) searchOrder.push({ key: 'tvdb', value: String(tvdbId) });

    for (const entry of searchOrder) {
      try {
        // Targeted query using SearchTerm to reduce result size
        const targetedParams: Record<string, string | number | boolean> = {
          Recursive: true,
          IncludeItemTypes: includeTypes,
          Fields: 'DateCreated,ProviderIds,Path,ProductionYear',
          SearchTerm: `${entry.key}:${entry.value}`,
          Limit: 50,
        };
        let items: Emby.QueryResultBaseItem = await embyClient.items.list(
          targetedParams as Record<string, unknown>
        );
        console.log(
          `     🔎 Emby targeted provider-id search (${entry.key}:${
            entry.value
          }) returned ${items.Items?.length ?? 0} items (types=${includeTypes})`
        );

        if (!items.Items || items.Items.length === 0) {
          // Fallback to a broader page and filter client-side
          const broadParams: Record<string, string | number | boolean> = {
            Recursive: true,
            IncludeItemTypes: includeTypes,
            Fields: 'DateCreated,ProviderIds,Path,ProductionYear',
            StartIndex: 0,
            Limit: 1000,
          };
          items = await embyClient.items.list(
            broadParams as Record<string, unknown>
          );
          console.log(
            `     🔎 Emby broad provider-id scan (${entry.key}:${
              entry.value
            }) returned ${
              items.Items?.length ?? 0
            } items (types=${includeTypes})`
          );
        }

        const match = items.Items?.find((it: Emby.BaseItem) => {
          const providers = (
            it as Emby.BaseItem & {
              ProviderIds?: Record<string, string>;
            }
          ).ProviderIds;
          if (!providers) return false;
          const normalizedProviders: Record<string, string> =
            Object.fromEntries(
              Object.entries(providers).map(([k, v]) => [
                k.toLowerCase(),
                String(v),
              ])
            );
          const equalsNum = (a: string, b: string) => Number(a) === Number(b);
          if (entry.key === 'imdb') {
            const imdbVal =
              normalizedProviders['imdb'] ||
              normalizedProviders['imdbid'] ||
              normalizedProviders['imdb_id'];
            return (
              typeof imdbVal === 'string' &&
              imdbVal.toLowerCase() === entry.value.toLowerCase()
            );
          }
          if (entry.key === 'tmdb') {
            const tmdbVal =
              normalizedProviders['tmdb'] ||
              normalizedProviders['themoviedb'] ||
              normalizedProviders['tmdbid'];
            return (
              typeof tmdbVal === 'string' && equalsNum(tmdbVal, entry.value)
            );
          }
          if (entry.key === 'tvdb') {
            const tvdbVal =
              normalizedProviders['tvdb'] ||
              normalizedProviders['thetvdb'] ||
              normalizedProviders['tvdbid'];
            return (
              typeof tvdbVal === 'string' && equalsNum(tvdbVal, entry.value)
            );
          }
          return false;
        });

        if (match) {
          console.log(
            `     ✅ Emby match by ${entry.key.toUpperCase()} id ${
              entry.value
            }: ${match.Name}`
          );
          return match as Emby.BaseItem;
        }
      } catch (err) {
        console.log(
          `     ⚠️ Emby provider-id lookup failed for ${entry.key}:${entry.value}`,
          err
        );
      }
    }

    return null;
  }

  /**
   * Fetches item metadata from Emby using the SDK
   */
  static async getItemMetadata(
    title: string,
    embyInstance: EmbySettings | null
  ): Promise<EmbyMetadata | null> {
    if (!embyInstance) {
      console.log('     ℹ️ No Emby instance available');
      return null;
    }

    console.log(`     🔍 Fetching metadata for "${title}" from Emby`);

    try {
      const embyClient = this.createClient(embyInstance);

      const itemsData: Emby.QueryResultBaseItem = await embyClient.items.list({
        Fields: 'DateCreated',
        Recursive: true,
        SearchTerm: title,
        Limit: 50,
      });

      if (!itemsData || !itemsData.Items) {
        console.log(`     ❌ No items found for "${title}" in Emby`);
        return null;
      }

      const itemData: Emby.BaseItem | undefined = itemsData.Items.find(
        (item: Emby.BaseItem) => item.Name === title
      );

      if (!itemData) {
        console.log(`     ❌ No item found for "${title}" in Emby`);
        return null;
      }

      console.log(
        `     ✅ Successfully fetched metadata for item: ${
          itemData.Name || itemData.OriginalTitle || 'Unknown'
        }`
      );
      console.log(`     📋 Type: ${itemData.Type || 'Unknown'}`);
      console.log(
        `     ⏱️ Runtime: ${
          itemData.RunTimeTicks
            ? Math.round(Number(itemData.RunTimeTicks) / 10000000 / 60) +
              ' minutes'
            : 'Unknown'
        }`
      );

      return itemData;
    } catch (error) {
      console.error(`     ❌ Error fetching metadata from Emby:`, error);
      return null;
    }
  }

  /**
   * Fetches playback information using custom query endpoint
   */
  static async getPlaybackInfo(
    title: string,
    embyInstance: EmbySettings | null
  ): Promise<EmbyPlaybackInfo | null> {
    if (!embyInstance) {
      console.log('     ℹ️ No Emby instance available');
      return null;
    }

    console.log(`     🔍 Searching for "${title}" in Emby`);

    try {
      return await this.fetchPlaybackInfoViaCustomQuery(title, embyInstance);
    } catch (error) {
      console.error(`     ❌ Error querying Emby:`, error);
      return null;
    }
  }

  // Removed ItemId-based variant to rely solely on title-based custom query

  /**
   * Fetches combined media data (metadata + playback info)
   */
  static async getEmbyMediaData({
    title,
    embyInstance,
  }: {
    title: string;
    embyInstance: EmbySettings | null;
  }): Promise<EmbyPlaybackInfo | null> {
    const playbackResponse = await this.getPlaybackInfo(title, embyInstance);
    const itemId = playbackResponse?.embyId;
    if (!itemId) return playbackResponse;

    const itemMetadata = await this.getItemMetadata(title, embyInstance);
    if (!itemMetadata) return playbackResponse;

    return {
      ...playbackResponse,
      embyId: itemMetadata.Id,
      metadata: itemMetadata,
    };
  }

  /**
   * Enhanced: Try provider-id mapping first, then title fallback
   */
  static async getEmbyMediaDataEnhanced({
    title,
    type,
    tvdbId,
    tmdbId,
    imdbId,
    embyInstance,
  }: {
    title: string;
    type?: 'movie' | 'tv';
    tvdbId?: number | null;
    tmdbId?: number | null;
    imdbId?: string | null;
    embyInstance: EmbySettings | null;
  }): Promise<EmbyPlaybackInfo | null> {
    const matchedItem = await this.findItemByProviderIds(
      { tvdbId, tmdbId, imdbId, type },
      embyInstance
    );

    if (matchedItem?.Id) {
      const playback = await this.getPlaybackInfo(
        (matchedItem.Name as string) ||
          (matchedItem.OriginalTitle as string) ||
          title,
        embyInstance
      );
      if (playback) {
        return {
          ...playback,
          embyId: matchedItem.Id,
          metadata: matchedItem,
        };
      }
      return { embyId: matchedItem.Id, metadata: matchedItem };
    }

    // Fallback to title-based approach
    return this.getEmbyMediaData({ title, embyInstance });
  }

  /**
   * Tests connection to Emby instance
   */
  static async testConnection(embyInstance: EmbySettings): Promise<boolean> {
    try {
      const embyClient = this.createClient(embyInstance);

      // Test connection by making a simple API call
      const systemInfo = await embyClient.system.info;

      if (systemInfo) {
        console.log(`     ✅ Successfully connected to Emby server`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`     ❌ Failed to connect to Emby:`, error);
      return false;
    }
  }

  /**
   * Private method to handle custom SQL query for playback stats
   */
  private static async fetchPlaybackInfoViaCustomQuery(
    title: string,
    embyInstance: EmbySettings
  ): Promise<EmbyPlaybackInfo | null> {
    // Use custom SQL query to get both playback activity and watch count in one query
    const customQueryUrl = `${embyInstance.url}/emby/user_usage_stats/submit_custom_query`;

    // Escape single and double quotes in the title for SQL
    const escapedTitle = title.replace(/'/g, "''").replace(/"/g, '""');

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

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(customQueryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Emby-Token': embyInstance.apiKey || '',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(
          `     ❌ Emby custom query failed: ${response.status} ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      return this.parsePlaybackResponse(data, title);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(
          `     ⏰ Emby request timed out after ${DEFAULT_TIMEOUT}ms`
        );
      } else {
        console.error(`     ❌ Error making custom query request:`, error);
      }
      throw error;
    }
  }

  /**
   * Private method to parse playback response data
   */
  private static parsePlaybackResponse(
    data: {
      results: Array<Array<string | number>>;
      colums?: string[]; // Note: "colums" appears to be a typo but keeping as is
    },
    title: string
  ): EmbyPlaybackInfo | null {
    if (data.results && data.results.length > 0) {
      const result = data.results[0];

      // Map the result based on the columns (now includes WatchCount)
      const columnIndex = {
        rowid: data.colums?.indexOf('ROWID') ?? 0,
        dateCreated: data.colums?.indexOf('DateCreated') ?? 1,
        itemId: data.colums?.indexOf('ItemId') ?? 2,
        itemName: data.colums?.indexOf('ItemName') ?? 3,
        playDuration: data.colums?.indexOf('PlayDuration') ?? 4,
        watchCount: data.colums?.indexOf('WatchCount') ?? 5,
      };

      const lastWatchedStr = String(result[columnIndex.dateCreated]);
      const itemId = String(result[columnIndex.itemId]);
      const itemName = String(result[columnIndex.itemName]);
      const playDuration = String(result[columnIndex.playDuration]);
      const watchCount = parseInt(String(result[columnIndex.watchCount])) || 1;

      console.log(`     ✅ Found playback activity for: ${itemName}`);
      console.log(`     📅 Last watched: ${lastWatchedStr}`);
      console.log(`     🆔 Item ID: ${itemId}`);
      console.log(`     ⏱️ Play duration: ${playDuration} seconds`);
      console.log(`     🔢 Total watch count: ${watchCount}`);

      // Parse the date
      const lastWatched = lastWatchedStr ? new Date(lastWatchedStr) : undefined;

      return {
        lastWatched,
        watchCount,
        embyId: itemId,
      };
    } else {
      console.log(`     ❌ No playback activity found in Emby for: ${title}`);
      return null;
    }
  }
}
