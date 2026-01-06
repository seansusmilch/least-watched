import type { SonarrSeries, RadarrMovie } from '@/lib/types/arr';

export interface ArrMaps {
  tvMapByTvdb: Map<number, SonarrSeries>;
  tvMapByTmdb: Map<number, SonarrSeries>;
  tvMapByImdb: Map<string, SonarrSeries>;
  movieMapByTmdb: Map<number, RadarrMovie>;
  movieMapByImdb: Map<string, RadarrMovie>;
}

export function buildArrMaps(
  allSeries: SonarrSeries[],
  allMovies: RadarrMovie[]
): ArrMaps {
  const tvMapByTvdb = new Map<number, SonarrSeries>();
  const tvMapByTmdb = new Map<number, SonarrSeries>();
  const tvMapByImdb = new Map<string, SonarrSeries>();

  for (const s of allSeries) {
    if (s.tvdbId) tvMapByTvdb.set(s.tvdbId, s);
    if (s.tmdbId) tvMapByTmdb.set(s.tmdbId, s);
    if (s.imdbId) tvMapByImdb.set(String(s.imdbId).toLowerCase(), s);
  }

  const movieMapByTmdb = new Map<number, RadarrMovie>();
  const movieMapByImdb = new Map<string, RadarrMovie>();

  for (const m of allMovies) {
    if (m.tmdbId) movieMapByTmdb.set(m.tmdbId, m);
    if (m.imdbId) movieMapByImdb.set(String(m.imdbId).toLowerCase(), m);
  }

  return {
    tvMapByTvdb,
    tvMapByTmdb,
    tvMapByImdb,
    movieMapByTmdb,
    movieMapByImdb,
  };
}
