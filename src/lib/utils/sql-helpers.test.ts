import { describe, it, expect } from 'vitest';
import {
  sanitizeSqlParam,
  buildSeriesWhereClause,
  buildMovieWhereClause,
  buildPlaybackSql,
} from '@/lib/utils/sql-helpers';

describe('sanitizeSqlParam', () => {
  it('returns the string unchanged when no special characters', () => {
    expect(sanitizeSqlParam('Hello World')).toBe('Hello World');
  });

  it('escapes single quotes by doubling them', () => {
    expect(sanitizeSqlParam("Grey's Anatomy")).toBe("Grey''s Anatomy");
  });

  it('preserves semicolons in titles', () => {
    expect(sanitizeSqlParam('Steins;Gate 0')).toBe('Steins;Gate 0');
  });

  it('handles multiple single quotes', () => {
    expect(sanitizeSqlParam("it's a boy's life")).toBe("it''s a boy''s life");
  });

  it('handles empty string', () => {
    expect(sanitizeSqlParam('')).toBe('');
  });

  it('preserves other special characters', () => {
    expect(sanitizeSqlParam('Title: Part (2) & More!')).toBe('Title: Part (2) & More!');
  });
});

describe('buildSeriesWhereClause', () => {
  it('builds a LIKE pattern for series title', () => {
    const result = buildSeriesWhereClause('Breaking Bad');
    expect(result).toBe("(lower(ItemName) LIKE lower('Breaking Bad - s%'))");
  });

  it('generates alternate pattern for colon separator', () => {
    const result = buildSeriesWhereClause('Title: Subtitle');
    expect(result).toContain("lower('Title: Subtitle - s%')");
    expect(result).toContain("lower('Title - Subtitle - s%')");
  });

  it('generates alternate pattern for dash separator', () => {
    const result = buildSeriesWhereClause('Title - Subtitle');
    expect(result).toContain("lower('Title - Subtitle - s%')");
    expect(result).toContain("lower('Title: Subtitle - s%')");
  });

  it('preserves semicolons in title', () => {
    const result = buildSeriesWhereClause('Steins;Gate 0');
    expect(result).toContain('Steins;Gate 0');
  });
});

describe('buildMovieWhereClause', () => {
  it('builds exact match condition for movie title', () => {
    const result = buildMovieWhereClause('Inception', null);
    expect(result).toBe("(ItemName = 'Inception') AND ItemType = 'Movie'");
  });

  it('includes ItemId when provided', () => {
    const result = buildMovieWhereClause('Inception', '12345');
    expect(result).toContain("ItemId = '12345'");
  });

  it('generates alternate pattern for colon separator', () => {
    const result = buildMovieWhereClause('Movie: Part Two', null);
    expect(result).toContain("ItemName = 'Movie: Part Two'");
    expect(result).toContain("ItemName = 'Movie - Part Two'");
  });

  it('preserves semicolons in title', () => {
    const result = buildMovieWhereClause('Steins;Gate', null);
    expect(result).toContain("ItemName = 'Steins;Gate'");
  });
});

describe('buildPlaybackSql', () => {
  it('wraps where clause in the playback aggregation query', () => {
    const sql = buildPlaybackSql("ItemName = 'Test'");
    expect(sql).toContain('MAX(DateCreated) AS LastWatched');
    expect(sql).toContain('PlaybackActivity');
    expect(sql).toContain("WHERE ItemName = 'Test'");
  });
});
