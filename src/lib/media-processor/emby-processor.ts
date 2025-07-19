import { type EmbyPlaybackInfo, type EmbyMetadata } from './types';
import { type EmbySettings } from '../utils/single-emby-settings';

export class EmbyProcessor {
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
      // Fetch item metadata using the proper endpoint
      const itemUrl = `${embyInstance.url}/emby/Items`;
      const query = new URLSearchParams({
        Fields: 'DateCreated',
        Recursive: 'true',
        SearchTerm: title,
        Limit: '50',
      });
      const itemResponse = await fetch(`${itemUrl}?${query}`, {
        method: 'GET',
        headers: {
          'X-Emby-Token': embyInstance.apiKey,
        },
      });

      if (!itemResponse.ok) {
        console.log(
          `     ❌ Failed to fetch item metadata from Emby: ${itemResponse.status}`
        );
        return null;
      }

      const itemsData = await itemResponse.json();

      if (!itemsData) {
        console.log(`     ❌ No items found for "${title}" in Emby`);
        return null;
      }

      const itemData = itemsData.Items?.find(
        (item: { Name: string }) => item.Name === title
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
            ? Math.round(itemData.RunTimeTicks / 10000000 / 60) + ' minutes'
            : 'Unknown'
        }`
      );

      return {
        id: itemData.Id,
        name: itemData.Name,
        originalTitle: itemData.OriginalTitle,
        type: itemData.Type,
        year: itemData.ProductionYear,
        genres: itemData.Genres || [],
        rating: itemData.CommunityRating,
        officialRating: itemData.OfficialRating,
        overview: itemData.Overview,
        dateCreated: itemData.DateCreated,
        premiereDate: itemData.PremiereDate,
        path: itemData.Path,
        fileName: itemData.FileName,
        providerIds: itemData.ProviderIds || {},
      };
    } catch (error) {
      console.error(`     ❌ Error fetching metadata from Emby:`, error);
      return null;
    }
  }

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
        return null;
      }

      const data = await response.json();
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
        const lastWatched = lastWatchedStr
          ? new Date(lastWatchedStr)
          : undefined;

        return {
          lastWatched,
          watchCount,
          embyId: itemId,
        };
      } else {
        console.log(`     ❌ No playback activity found in Emby for: ${title}`);
        return null;
      }
    } catch (error) {
      console.error(`     ❌ Error querying Emby:`, error);
      return null;
    }
  }

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
      embyId: itemMetadata.id,
      metadata: itemMetadata,
    };
  }
}
