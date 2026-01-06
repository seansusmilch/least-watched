import type { SonarrSeries, RadarrMovie } from '@/lib/types/arr';

export function normalizeProviderIds(
  providerIds: Record<string, string> | undefined
): Record<string, string> {
  if (!providerIds) return {};
  return Object.fromEntries(
    Object.entries(providerIds).map(([k, v]) => [k.toLowerCase(), String(v)])
  );
}

export function findRadarrMatch(
  tmdbId: number | null | undefined,
  imdbId: string | null | undefined,
  movieMapByTmdb: Map<number, RadarrMovie>,
  movieMapByImdb: Map<string, RadarrMovie>
): RadarrMovie | undefined {
  if (tmdbId != null && movieMapByTmdb.has(tmdbId)) {
    return movieMapByTmdb.get(tmdbId);
  }
  if (imdbId != null && movieMapByImdb.has(imdbId.toLowerCase())) {
    return movieMapByImdb.get(imdbId.toLowerCase());
  }
  return undefined;
}

export function findSonarrMatch(
  tvdbId: number | null | undefined,
  tmdbId: number | null | undefined,
  imdbId: string | null | undefined,
  tvMapByTvdb: Map<number, SonarrSeries>,
  tvMapByTmdb: Map<number, SonarrSeries>,
  tvMapByImdb: Map<string, SonarrSeries>
): SonarrSeries | undefined {
  if (tvdbId != null && tvMapByTvdb.has(tvdbId)) {
    return tvMapByTvdb.get(tvdbId);
  }
  if (tmdbId != null && tvMapByTmdb.has(tmdbId)) {
    return tvMapByTmdb.get(tmdbId);
  }
  if (imdbId != null && tvMapByImdb.has(imdbId.toLowerCase())) {
    return tvMapByImdb.get(imdbId.toLowerCase());
  }
  return undefined;
}
