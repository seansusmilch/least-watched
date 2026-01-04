'use server';

import { MediaItem } from '@/lib/types/media';
import {
  radarrSettingsService,
  sonarrSettingsService,
  prisma,
} from '../database';
import { sonarrApiClient, radarrApiClient, eventsService } from '../services';
import { revalidatePath } from 'next/cache';

export async function deleteRadarrMediaItem(id: number): Promise<boolean> {
  const radarrSettings = await radarrSettingsService.getAll();

  const mediaItem = await prisma.mediaItem.findFirst({
    where: { radarrId: id },
    select: { title: true },
  });

  const titleText = mediaItem?.title ? ` "${mediaItem.title}"` : '';

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

    await eventsService.logInfo(
      'user-action',
      `Deleted Radarr movie${titleText} (ID: ${id})`
    );
    return true;
  } catch (error) {
    await eventsService.logError(
      'user-action',
      `Failed to delete Radarr movie${titleText} (ID: ${id}): ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

export async function deleteSonarrMediaItem(id: number): Promise<boolean> {
  const sonarrSettings = await sonarrSettingsService.getAll();

  const mediaItem = await prisma.mediaItem.findFirst({
    where: { sonarrId: id },
    select: { title: true },
  });

  const titleText = mediaItem?.title ? ` "${mediaItem.title}"` : '';

  try {
    const deletionPromises = sonarrSettings.map((setting) =>
      sonarrApiClient.deleteSeries(setting, id, { deleteFiles: true })
    );
    await Promise.all(deletionPromises);

    await prisma.mediaItem.deleteMany({
      where: { sonarrId: id },
    });

    await eventsService.logInfo(
      'user-action',
      `Deleted Sonarr series${titleText} (ID: ${id})`
    );
    return true;
  } catch (error) {
    await eventsService.logError(
      'user-action',
      `Failed to delete Sonarr series${titleText} (ID: ${id}): ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

type DeleteResult = 'sonarr' | 'radarr' | 'failed';

export async function deleteMediaItems(mediaItems: MediaItem[]) {
  const results = await Promise.all(
    mediaItems.map(async (item): Promise<DeleteResult> => {
      if (!item.sonarrId && !item.radarrId) {
        await eventsService.logError(
          'user-action',
          `Failed to delete media item "${item.title}": No Sonarr or Radarr ID found`
        );
        return 'failed';
      }

      if (item.sonarrId) {
        const success = await deleteSonarrMediaItem(item.sonarrId);
        return success ? 'sonarr' : 'failed';
      }

      if (item.radarrId) {
        const success = await deleteRadarrMediaItem(item.radarrId);
        return success ? 'radarr' : 'failed';
      }

      return 'failed';
    })
  );

  const sonarrCount = results.filter((r) => r === 'sonarr').length;
  const radarrCount = results.filter((r) => r === 'radarr').length;
  const failedCount = results.filter((r) => r === 'failed').length;

  // If any items were successfully deleted, revalidate
  if (sonarrCount || radarrCount) {
    revalidatePath('/');
    await eventsService.logInfo(
      'user-action',
      `Bulk delete completed: ${sonarrCount} Sonarr, ${radarrCount} Radarr, ${failedCount} failed`
    );
  } else if (failedCount > 0) {
    await eventsService.logWarning(
      'user-action',
      `Bulk delete failed: ${failedCount} items could not be deleted`
    );
  }

  return {
    sonarrCount,
    radarrCount,
    failedCount,
  };
}
