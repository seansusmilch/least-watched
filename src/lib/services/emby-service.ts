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

export type EmbyAggregationInput = {
  title?: string;
  type?: 'movie' | 'tv';
  embyId?: string;
};

export class EmbyService {
  /** Input shape for generic aggregation requests */
  static readonly AGG_DEFAULT_BATCH_SIZE = 800;

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
  static async findItemByExactTitle(
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
  static async getAggregatedPlaybackForItemIds(
    itemIds: string[],
    embyInstance: EmbySettings | null,
    opts?: { batchSize?: number }
  ): Promise<Pick<EmbyPlaybackInfo, 'lastWatched' | 'watchCount'>> {
    if (!embyInstance || itemIds.length === 0)
      return { lastWatched: undefined, watchCount: 0 };

    const batchSize = opts?.batchSize ?? EmbyService.AGG_DEFAULT_BATCH_SIZE;
    const chunks: string[][] = [];
    for (let i = 0; i < itemIds.length; i += batchSize) {
      chunks.push(itemIds.slice(i, i + batchSize));
    }

    let overallLastWatched: Date | undefined = undefined;
    let overallWatchCount = 0;

    for (const chunk of chunks) {
      const escapedIdList = chunk
        .map((id) => `'${String(id).replace(/'/g, "''").replace(/;/g, '')}'`)
        .join(',');
      const sqlQuery = `SELECT
          MAX(DateCreated) AS LastWatched,
          SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount
        FROM (
          SELECT DateCreated, PlayDuration
          FROM PlaybackActivity
          WHERE ItemId IN (${escapedIdList})
        ) AS Activity`;

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

  // Removed per design: we no longer list episodes for series playback aggregation

  /**
   * Fetches combined media data (metadata + playback info)
   */
  static async getMediaAndPlaybackByTitle({
    title,
    embyInstance,
  }: {
    title: string;
    embyInstance: EmbySettings | null;
  }): Promise<EmbyPlaybackInfo | null> {
    const itemMetadata = await this.findItemByExactTitle(title, embyInstance);
    if (!itemMetadata?.Id) return null;

    const playbackAgg = await this.getAggregatedPlaybackForItemIds(
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
   * Generic aggregation API for both movies and series.
   * Consumers provide minimal identifying info and this method
   * chooses the best strategy (emby id or title-based).
   */
  static async getAggregatedPlaybackInfo(
    input: EmbyAggregationInput,
    embyInstance: EmbySettings | null
  ): Promise<EmbyPlaybackInfo | null> {
    if (!embyInstance) return null;

    const { type, title, embyId } = input;

    // Series: prefer title-based aggregation to avoid gigantic episode-id queries
    if (type === 'tv') {
      if (!title) {
        console.error(
          '     ❌ Unable to aggregate series playback without title. Provide title for series aggregation.'
        );
        return null;
      }
      const agg = await this.getAggregatedPlaybackBySeriesTitle(
        title,
        embyInstance as EmbySettings
      );
      return { ...agg, embyId: embyId ?? '' };
    }

    // Movies: require a concrete item id
    if (type === 'movie') {
      if (embyId) {
        const agg = await this.getAggregatedPlaybackForItemIds(
          [embyId],
          embyInstance
        );
        return { ...agg, embyId };
      }
      console.error(
        '     ❌ Unable to aggregate movie playback without embyId.'
      );
      return null;
    }

    // Unknown type: require explicit type, no fallbacks
    console.error(
      '     ❌ Unable to aggregate playback: unknown or missing type.'
    );
    return null;
  }

  /** Aggregate playback info for a series using the user_usage_stats ItemName convention "[title] - s%" */
  private static async getAggregatedPlaybackBySeriesTitle(
    seriesTitle: string,
    embyInstance: EmbySettings
  ): Promise<Pick<EmbyPlaybackInfo, 'lastWatched' | 'watchCount'>> {
    const safeTitle = this.escapeSqlString(seriesTitle).replace(/;/g, '');
    const likePattern = `${safeTitle} - s%`;
    const sqlQuery = `SELECT
        MAX(DateCreated) AS LastWatched,
        SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount
      FROM (
        SELECT DateCreated, PlayDuration
        FROM PlaybackActivity
        WHERE lower(ItemName) LIKE lower('${likePattern}')
      ) AS Activity`;

    const data = await this.executeCustomQuery(sqlQuery, embyInstance);
    return this.parseAggregatedPlaybackResponse(data);
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
      const data = await response.json();
      if (data.message) {
        console.error(`     ❌ Emby custom query failed: ${data.message}`);
        return null;
      }

      return data as EmbyCustomQueryResponse;
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
      const rawCols = (data?.columns ?? data?.colums ?? []) as string[];

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

  private static escapeSqlString(value: string): string {
    return String(value).replace(/'/g, "''");
  }
}
