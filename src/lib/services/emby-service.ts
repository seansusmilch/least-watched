import Emby from 'emby-sdk-stainless';
import { type EmbySettings } from '@/lib/utils/single-emby-settings';
import {
  type EmbyPlaybackInfo,
  type EmbyMetadata,
} from '@/lib/media-processor/types';

const DEFAULT_TIMEOUT = 10000; // 10 seconds

type EmbyCustomQueryResponse = {
  results: Array<Array<string | number>>;
  colums?: string[];
  columns?: string[];
};

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

  /** Aggregate playback info across multiple ItemIds (e.g., all episodes of a series) */
  static async getPlaybackInfoByItemIds(
    itemIds: string[],
    embyInstance: EmbySettings | null,
    opts?: { batchSize?: number }
  ): Promise<Pick<EmbyPlaybackInfo, 'lastWatched' | 'watchCount'>> {
    if (!embyInstance || itemIds.length === 0)
      return { lastWatched: undefined, watchCount: 0 };

    const batchSize = opts?.batchSize ?? 800;
    const chunks: string[][] = [];
    for (let i = 0; i < itemIds.length; i += batchSize) {
      chunks.push(itemIds.slice(i, i + batchSize));
    }

    let overallLastWatched: Date | undefined = undefined;
    let overallWatchCount = 0;

    for (const chunk of chunks) {
      const escapedIdList = chunk
        .map((id) => `'${String(id).replace(/'/g, "''")}'`)
        .join(',');
      const sqlQuery = `
        WITH Activity AS (
          SELECT ItemId, DateCreated, PlayDuration
          FROM PlaybackActivity
          WHERE ItemId IN (${escapedIdList})
        ),
        Totals AS (
          SELECT
            MAX(DateCreated) AS LastWatched,
            SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount
          FROM Activity
        )
        SELECT LastWatched, WatchCount FROM Totals;
      `;

      const data = await this.executeCustomQuery(sqlQuery, embyInstance);
      const partial = this.parseAggregatedPlaybackResponse(data);
      if (partial.lastWatched) {
        if (!overallLastWatched || partial.lastWatched > overallLastWatched) {
          overallLastWatched = partial.lastWatched;
        }
      }
      overallWatchCount += partial.watchCount ?? 0;
    }

    return { lastWatched: overallLastWatched, watchCount: overallWatchCount };
  }

  /** List episode ItemIds for a given series ItemId */
  static async listEpisodeIdsForSeries(
    seriesId: string,
    embyInstance: EmbySettings | null
  ): Promise<string[]> {
    if (!embyInstance) {
      console.log('     ℹ️ No Emby instance available for listing episode ids');
      return [];
    }
    const client = this.createClient(embyInstance);
    const episodeIds: string[] = [];
    let startIndex = 0;
    const pageSize = 500;

    console.log(
      `     🔹 Listing episode ItemIds for series=${seriesId} (pageSize=${pageSize})`
    );

    try {
      while (true) {
        console.log(
          `       ↪️ Fetching page startIndex=${startIndex} limit=${pageSize}`
        );
        const params: Record<string, string | number | boolean> = {
          // Use AncestorIds to be robust even if the series has nested seasons/virtual folders
          AncestorIds: seriesId,
          IncludeItemTypes: 'Episode',
          Fields: 'DateCreated',
          StartIndex: startIndex,
          Limit: pageSize,
          Recursive: true,
        };
        const result: Emby.QueryResultBaseItem = await client.items.list(
          params as Record<string, unknown>
        );
        const page: Emby.BaseItem[] = (result?.Items as Emby.BaseItem[]) ?? [];
        console.log(
          `       📦 Received ${page.length} episodes (cumulative=${
            episodeIds.length + page.length
          })`
        );
        for (const ep of page) {
          if (ep?.Id) episodeIds.push(String(ep.Id));
        }
        if (page.length < pageSize) {
          console.log('       🛑 Last page reached');
          break;
        }
        startIndex += pageSize;
      }
      console.log(`     ✅ Total episode ids found: ${episodeIds.length}`);
      return episodeIds;
    } catch (error) {
      console.error(
        `     ❌ Error while listing episode ids for series=${seriesId}:`,
        error
      );
      return episodeIds;
    }
  }

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
    const itemMetadata = await this.getItemMetadata(title, embyInstance);
    if (!itemMetadata?.Id) return null;

    const playbackAgg = await this.getPlaybackInfoByItemIds(
      [itemMetadata.Id],
      embyInstance
    );
    return {
      ...playbackAgg,
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
      const isTv = type === 'tv' || matchedItem.Type === 'Series';
      if (isTv) {
        const episodeIds = await this.listEpisodeIdsForSeries(
          matchedItem.Id as string,
          embyInstance
        );
        const aggregate = await this.getPlaybackInfoByItemIds(
          episodeIds,
          embyInstance
        );
        return {
          ...aggregate,
          embyId: matchedItem.Id,
          metadata: matchedItem,
        };
      } else {
        const playback = await this.getPlaybackInfoByItemIds(
          [matchedItem.Id as string],
          embyInstance
        );
        return {
          ...playback,
          embyId: matchedItem.Id,
          metadata: matchedItem,
        };
      }
    }

    // Fallback: attempt to resolve by exact title match via SDK, then query by ItemId
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

  /** Execute a custom SQL query against the Emby user_usage_stats plugin */
  private static async executeCustomQuery(
    sqlQuery: string,
    embyInstance: EmbySettings
  ): Promise<EmbyCustomQueryResponse | null> {
    const customQueryUrl = `${embyInstance.url}/emby/user_usage_stats/submit_custom_query`;
    const payload = { CustomQueryString: sqlQuery, ReplaceUserId: true };

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

      return (await response.json()) as EmbyCustomQueryResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(
          `     ⏰ Emby request timed out after ${DEFAULT_TIMEOUT}ms`
        );
      } else {
        console.error(`     ❌ Error making custom query request:`, error);
      }
      return null;
    }
  }

  private static parseAggregatedPlaybackResponse(
    data: EmbyCustomQueryResponse | null
  ): { lastWatched?: Date; watchCount: number } {
    try {
      const row = data?.results?.[0];
      const rawCols = (data?.colums ?? []) as string[];

      const normalizedCols = rawCols.map((c) =>
        typeof c === 'string' ? c.toLowerCase() : ''
      );
      const indexOfCi = (name: string, fallbackIndex: number): number => {
        const exact = rawCols.indexOf(name);
        if (exact >= 0) return exact;
        const ci = normalizedCols.indexOf(name.toLowerCase());
        if (ci >= 0) return ci;
        return fallbackIndex; // fallback to positional index when columns are missing
      };

      // For the aggregate query we always select: LastWatched, WatchCount
      const lastIdx = indexOfCi('LastWatched', 0);
      const countIdx = indexOfCi('WatchCount', 1);

      const lastStr = String(row?.[lastIdx] ?? '');
      const watchCountRaw = row?.[countIdx];
      const watchCount = Number.isFinite(Number(watchCountRaw))
        ? Number(watchCountRaw)
        : 0;
      return {
        lastWatched: lastStr ? new Date(lastStr) : undefined,
        watchCount,
      };
    } catch {
      return { lastWatched: undefined, watchCount: 0 };
    }
  }
}
