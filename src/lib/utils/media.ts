export function parseGenres(genres: unknown): string[] {
  if (!genres) return [];

  if (Array.isArray(genres)) {
    return genres.filter((g): g is string => typeof g === 'string');
  }

  if (typeof genres === 'string') {
    try {
      const parsed = JSON.parse(genres);
      return Array.isArray(parsed)
        ? parsed.filter((g): g is string => typeof g === 'string')
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function buildEmbyPosterUrl(
  embyUrl: string,
  embyApiKey: string,
  embyId: string,
  maxWidth: number = 300
): string {
  return `${embyUrl}/Items/${embyId}/Images/Primary?maxWidth=${maxWidth}&api_key=${embyApiKey}`;
}
