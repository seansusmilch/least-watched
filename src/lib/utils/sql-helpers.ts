/** Escape a value for use inside a SQL string literal (single-quote doubling). */
export function sanitizeSqlParam(value: string): string {
  return value.replace(/'/g, "''");
}

/** Swap ': ' and ' - ' separators to produce an alternative title for fuzzy matching. */
function getAltTitle(title: string): string {
  return title.includes(': ')
    ? title.replace(/: /g, ' - ')
    : title.replace(/ - /g, ': ');
}

/**
 * Build a WHERE clause matching series playback rows.
 * Generates LIKE patterns for both ' - ' / ': ' separator variants so playbacks
 * recorded under an old title are still matched (e.g. "Show - Part" vs "Show: Part").
 */
export function buildSeriesWhereClause(safeTitle: string): string {
  const altTitle = getAltTitle(safeTitle);
  const patterns = [`lower(ItemName) LIKE lower('${safeTitle} - s%')`];
  if (altTitle !== safeTitle) patterns.push(`lower(ItemName) LIKE lower('${altTitle} - s%')`);
  return `(${patterns.join(' OR ')})`;
}

/**
 * Build a WHERE clause matching movie playback rows.
 * Matches the current title and its separator variant (' - ' <-> ': ') plus optional ItemId.
 */
export function buildMovieWhereClause(safeTitle: string, safeId: string | null): string {
  const altTitle = getAltTitle(safeTitle);
  const conditions = [`ItemName = '${safeTitle}'`];
  if (altTitle !== safeTitle) conditions.push(`ItemName = '${altTitle}'`);
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
