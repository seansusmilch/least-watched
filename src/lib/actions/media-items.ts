'use server';

import { radarrSettingsService, sonarrSettingsService } from '../database';
import { sonarrApiClient, radarrApiClient } from '../services';

export async function deleteRadarrMediaItem(id: number): Promise<void> {
  const radarrSettings = await radarrSettingsService.getAll();
  try {
    const deletionPromises = radarrSettings.map((setting) =>
      radarrApiClient.deleteMovie(setting, id, {
        deleteFiles: true,
      })
    );
    await Promise.all(deletionPromises);
  } catch (error) {
    console.error(`Failed to delete Radarr item (${id})`, error);
  }
}

export async function deleteSonarrMediaItem(id: number): Promise<void> {
  const sonarrSettings = await sonarrSettingsService.getAll();
  try {
    const deletionPromises = sonarrSettings.map((setting) =>
      sonarrApiClient.deleteSeries(setting, id, { deleteFiles: true })
    );
    await Promise.all(deletionPromises);
  } catch (error) {
    console.error(`Failed to delete Sonarr series (${id})`, error);
  }
}
