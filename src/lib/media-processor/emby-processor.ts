import {
  type EmbyInstance,
  type EmbyPlaybackInfo,
  type EmbyMetadata,
} from './types';

export class EmbyProcessor {
  static async getItemMetadata(
    itemId: string,
    embyInstances: EmbyInstance[]
  ): Promise<EmbyMetadata | null> {
    console.log(
      `     🔍 Fetching metadata for item ID "${itemId}" from ${embyInstances.length} Emby instances`
    );

    for (let i = 0; i < embyInstances.length; i++) {
      const embyInstance = embyInstances[i];
      try {
        // Get the current user ID first to construct the proper endpoint
        const usersUrl = `${embyInstance.url}/emby/Users`;
        const usersResponse = await fetch(usersUrl, {
          method: 'GET',
          headers: {
            'X-Emby-Token': embyInstance.apiKey,
          },
        });

        if (!usersResponse.ok) {
          console.log(
            `     ❌ Failed to get users from Emby ${embyInstance.name}: ${usersResponse.status}`
          );
          continue;
        }

        const users = await usersResponse.json();
        if (!users || users.length === 0) {
          console.log(`     ❌ No users found in Emby ${embyInstance.name}`);
          continue;
        }

        // Use the first user (or find admin user)
        const user = users[0];
        const userId = user.Id;

        // Fetch item metadata using the proper endpoint
        const itemUrl = `${embyInstance.url}/emby/Users/${userId}/Items/${itemId}`;
        const itemResponse = await fetch(itemUrl, {
          method: 'GET',
          headers: {
            'X-Emby-Token': embyInstance.apiKey,
          },
        });

        if (!itemResponse.ok) {
          console.log(
            `     ❌ Failed to fetch item metadata from Emby ${embyInstance.name}: ${itemResponse.status}`
          );
          continue;
        }

        const itemData = await itemResponse.json();

        if (itemData) {
          console.log(
            `     ✅ Successfully fetched metadata for item: ${
              itemData.Name || itemData.OriginalTitle || 'Unknown'
            }`
          );
          console.log(`     📋 Type: ${itemData.Type || 'Unknown'}`);
          console.log(`     📅 Year: ${itemData.ProductionYear || 'Unknown'}`);
          console.log(
            `     ⏱️ Runtime: ${
              itemData.RunTimeTicks
                ? Math.round(itemData.RunTimeTicks / 10000000 / 60) + ' minutes'
                : 'Unknown'
            }`
          );
          console.log(
            `     🎭 Genres: ${itemData.Genres?.join(', ') || 'Unknown'}`
          );
          console.log(
            `     ⭐ Rating: ${itemData.CommunityRating || 'Unrated'}`
          );

          return {
            id: itemData.Id,
            name: itemData.Name,
            originalTitle: itemData.OriginalTitle,
            type: itemData.Type,
            year: itemData.ProductionYear,
            runtime: itemData.RunTimeTicks
              ? Math.round(itemData.RunTimeTicks / 10000000 / 60)
              : null,
            genres: itemData.Genres || [],
            rating: itemData.CommunityRating,
            officialRating: itemData.OfficialRating,
            overview: itemData.Overview,
            taglines: itemData.Taglines || [],
            people: itemData.People || [],
            studios: itemData.Studios || [],
            dateCreated: itemData.DateCreated,
            premiereDate: itemData.PremiereDate,
            path: itemData.Path,
            fileName: itemData.FileName,
            mediaType: itemData.MediaType,
            isFolder: itemData.IsFolder,
            parentId: itemData.ParentId,
            seriesId: itemData.SeriesId,
            seasonId: itemData.SeasonId,
            episodeNumber: itemData.IndexNumber,
            seasonNumber: itemData.ParentIndexNumber,
            seriesName: itemData.SeriesName,
            seasonName: itemData.SeasonName,
            providerIds: itemData.ProviderIds || {},
            userData: itemData.UserData || {},
            embyInstance: embyInstance.name,
            rawData: itemData,
          };
        }
      } catch (error) {
        console.error(
          `     ❌ Error fetching metadata from Emby instance ${embyInstance.name}:`,
          error
        );
      }
    }

    console.log(
      `     ❌ No metadata found for item ID "${itemId}" in any Emby instance`
    );
    return null;
  }

  static async getPlaybackInfo(
    title: string,
    embyInstances: EmbyInstance[]
  ): Promise<EmbyPlaybackInfo | null> {
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

  static async getEmbyMediaData({
    title,
    embyInstances,
  }: {
    title: string;
    embyInstances: EmbyInstance[];
  }): Promise<EmbyPlaybackInfo | null> {
    const playbackResponse = await this.getPlaybackInfo(title, embyInstances);
    const itemId = playbackResponse?.embyId;
    if (!itemId) return playbackResponse;

    const itemMetadata = await this.getItemMetadata(itemId, embyInstances);
    if (!itemMetadata) return playbackResponse;

    return {
      ...playbackResponse,
      metadata: itemMetadata,
    };
  }
}
