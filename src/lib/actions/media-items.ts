'use server';

import { MediaItem } from '@/lib/types/media';
import {
  radarrSettingsService,
  sonarrSettingsService,
  prisma,
} from '../database';
import { sonarrApiClient, radarrApiClient } from '../services';
import { revalidatePath } from 'next/cache';

export async function deleteRadarrMediaItem(id: number): Promise<boolean> {
  const radarrSettings = await radarrSettingsService.getAll();
  try {
    const deletionPromises = radarrSettings.map((setting) =>
      radarrApiClient.deleteMovie(setting, id, {
        deleteFiles: true,
      })
    );
    await Promise.all(deletionPromises);

    await prisma.mediaItem.deleteMany({
      where: { radarrId: id },
    });

    return true;
  } catch (error) {
    console.error(`Failed to delete Radarr item (${id})`, error);
    return false;
  }
}

export async function deleteSonarrMediaItem(id: number): Promise<boolean> {
  const sonarrSettings = await sonarrSettingsService.getAll();
  try {
    const deletionPromises = sonarrSettings.map((setting) =>
      sonarrApiClient.deleteSeries(setting, id, { deleteFiles: true })
    );
    await Promise.all(deletionPromises);

    await prisma.mediaItem.deleteMany({
      where: { sonarrId: id },
    });

    return true;
  } catch (error) {
    console.error(`Failed to delete Sonarr series (${id})`, error);
    return false;
  }
}

export async function deleteMediaItems(mediaItems: MediaItem[]) {
  let sonarrCount = 0;
  let radarrCount = 0;
  let failedCount = 0;

  await Promise.all(
    mediaItems.map(async (item) => {
      if (!item.sonarrId && !item.radarrId) {
        failedCount++;
        console.error(`Failed to delete media item (${item.title})`, item);
        return;
      }

      if (!!item.sonarrId) {
        const success = await deleteSonarrMediaItem(item.sonarrId);
        if (success) {
          sonarrCount++;
        } else {
          failedCount++;
        }
      } else if (!!item.radarrId) {
        const success = await deleteRadarrMediaItem(item.radarrId);
        if (success) {
          radarrCount++;
        } else {
          failedCount++;
        }
      }
    })
  );

  // If any items were successfully deleted, revalidate
  if (sonarrCount || radarrCount) {
    revalidatePath('/');
  }

  return {
    sonarrCount,
    radarrCount,
    failedCount,
  };
}
