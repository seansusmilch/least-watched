import path from 'path';
import type { ProcessedMediaItem } from './types';
import type { SonarrSeries, RadarrMovie } from './types';
import { pickOverview } from '@/lib/utils/text-sanitization';

export function enrichFromRadarr(
  processed: ProcessedMediaItem,
  match: RadarrMovie
): void {
  processed.mediaPath = match.path || processed.mediaPath;
  processed.parentFolder = match.path
    ? path.dirname(match.path)
    : processed.parentFolder;
  processed.sizeOnDisk = match.sizeOnDisk || processed.sizeOnDisk;
  processed.quality =
    match.movieFile?.quality?.quality?.name ?? undefined;
  processed.monitored = match.monitored;
  processed.dateAddedArr = match.added ? new Date(match.added) : undefined;
  processed.radarrId = match.id;
  processed.overview = pickOverview({
    arrOverview: match.overview,
    embyOverview: processed.overview,
  });
}

export function enrichFromSonarr(
  processed: ProcessedMediaItem,
  match: SonarrSeries
): void {
  processed.mediaPath = match.path || processed.mediaPath;
  processed.parentFolder = match.path
    ? path.dirname(match.path)
    : processed.parentFolder;
  processed.sizeOnDisk =
    match.statistics?.sizeOnDisk || processed.sizeOnDisk;
  processed.episodesOnDisk =
    match.statistics?.episodeFileCount || undefined;
  processed.totalEpisodes =
    match.statistics?.totalEpisodeCount || undefined;
  processed.seasonCount = match.statistics?.seasonCount || undefined;
  processed.completionPercentage = match.statistics?.totalEpisodeCount
    ? Math.round(
        ((match.statistics?.episodeFileCount || 0) /
          match.statistics?.totalEpisodeCount) *
          100
      )
    : undefined;
  processed.monitored = match.monitored;
  processed.dateAddedArr = match.added ? new Date(match.added) : undefined;
  processed.sonarrId = match.id;
  processed.overview = pickOverview({
    arrOverview: match.overview,
    embyOverview: processed.overview,
  });
}
