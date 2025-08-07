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
        UserId: embyInstance.userId || '',
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
    data: any,
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
