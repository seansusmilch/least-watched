import { type EmbyInstance, type EmbyPlaybackInfo } from './types';

export class EmbyProcessor {
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
}
