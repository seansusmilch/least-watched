/** Escape a value for use inside a SQL string literal (single-quote doubling). */
export function sanitizeSqlParam(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Convert a title into a SQL LIKE pattern that ignores punctuation.
 * Every run of non-alphanumeric, non-space characters becomes a single `%` wildcard,
 * so "Steins;Gate", "Steins:Gate", and "Steins—Gate" all produce "Steins%Gate".
 * Whitespace is collapsed and the result is trimmed.
 */
export function titleToLikePattern(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]+/g, '%')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build a WHERE clause matching series playback rows.
 * Uses LIKE with `%` wildcards in place of punctuation so symbol differences
 * (colons, dashes, em-dashes, semicolons, etc.) don't prevent matching.
 * Series rows are stored as "[title] - sXXeYY - [episode]" in PlaybackActivity.
 */
export function buildSeriesWhereClause(title: string): string {
  const pattern = sanitizeSqlParam(titleToLikePattern(title));
  return `(lower(ItemName) LIKE lower('${pattern}%s%'))`;
}

/**
 * Build a WHERE clause matching movie playback rows.
 * Uses LIKE with `%` wildcards in place of punctuation so symbol differences don't prevent matching.
 */
export function buildMovieWhereClause(title: string, safeId: string | null): string {
  const pattern = sanitizeSqlParam(titleToLikePattern(title));
  const conditions = [`lower(ItemName) LIKE lower('${pattern}')`];
  if (safeId) conditions.push(`ItemId = '${safeId}'`);
  return `(${conditions.join(' OR ')}) AND ItemType = 'Movie'`;
}

export function buildPlaybackSql(whereClause: string): string {
  return `SELECT
      MAX(DateCreated) AS LastWatched,
      SUM(CASE WHEN PlayDuration > 300 AND PlayDuration < 28800 THEN 1 ELSE 0 END) AS WatchCount
    FROM (
      SELECT DateCreated, PlayDuration
      FROM PlaybackActivity
      WHERE ${whereClause}
    ) AS Activity`;
}
