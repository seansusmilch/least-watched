import { describe, it, expect } from 'vitest';
import {
  sanitizeSqlParam,
  titleToLikePattern,
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

  it('handles multiple single quotes', () => {
    expect(sanitizeSqlParam("it's a boy's life")).toBe("it''s a boy''s life");
  });

  it('handles empty string', () => {
    expect(sanitizeSqlParam('')).toBe('');
  });
});

describe('titleToLikePattern', () => {
  it('replaces colons with %', () => {
    expect(titleToLikePattern('Title: Subtitle')).toBe('Title% Subtitle');
  });

  it('replaces semicolons with %', () => {
    expect(titleToLikePattern('Steins;Gate 0')).toBe('Steins%Gate 0');
  });

  it('replaces hyphens with %', () => {
    expect(titleToLikePattern('Spider-Man')).toBe('Spider%Man');
  });

  it('replaces em-dashes with %', () => {
    expect(titleToLikePattern('Title\u2014Subtitle')).toBe('Title%Subtitle');
  });

  it('replaces en-dashes with %', () => {
    expect(titleToLikePattern('Title\u2013Subtitle')).toBe('Title%Subtitle');
  });

  it('collapses consecutive symbols into one %', () => {
    expect(titleToLikePattern('A:-B')).toBe('A%B');
  });

  it('collapses whitespace', () => {
    expect(titleToLikePattern('Title  -  Subtitle')).toBe('Title % Subtitle');
  });

  it('trims leading and trailing whitespace', () => {
    expect(titleToLikePattern(' Hello ')).toBe('Hello');
  });

  it('leaves plain alphanumeric titles unchanged', () => {
    expect(titleToLikePattern('Breaking Bad')).toBe('Breaking Bad');
  });

  it('replaces exclamation marks with %', () => {
    expect(titleToLikePattern('World!')).toBe('World%');
  });

  it('normalizes various dash variants to the same pattern', () => {
    const colon = titleToLikePattern('Show: Part');
    const dash = titleToLikePattern('Show - Part');
    const emDash = titleToLikePattern('Show\u2014 Part');
    const enDash = titleToLikePattern('Show\u2013 Part');
    expect(colon).toBe('Show% Part');
    expect(dash).toBe('Show % Part');
    expect(emDash).toBe('Show% Part');
    expect(enDash).toBe('Show% Part');
  });

  it('handles the KonoSuba title', () => {
    const result = titleToLikePattern('KonoSuba \u2013 An Explosion on This Wonderful World!');
    expect(result).toBe('KonoSuba % An Explosion on This Wonderful World%');
  });
});

describe('buildSeriesWhereClause', () => {
  it('builds a LIKE pattern for series title', () => {
    const result = buildSeriesWhereClause('Breaking Bad');
    expect(result).toBe("(lower(ItemName) LIKE lower('Breaking Bad%s%'))");
  });

  it('handles titles with symbols via wildcards', () => {
    const result = buildSeriesWhereClause('Steins;Gate 0');
    expect(result).toContain("'Steins%Gate 0%s%'");
  });

  it('handles titles with colons', () => {
    const result = buildSeriesWhereClause('Title: Subtitle');
    expect(result).toContain("'Title% Subtitle%s%'");
  });

  it('converts apostrophes to wildcards in title', () => {
    const result = buildSeriesWhereClause("Grey's Anatomy");
    expect(result).toContain("Grey%s Anatomy");
  });

  it('handles the KonoSuba title', () => {
    const result = buildSeriesWhereClause('KonoSuba \u2013 An Explosion on This Wonderful World!');
    expect(result).toContain("'KonoSuba % An Explosion on This Wonderful World%%s%'");
  });
});

describe('buildMovieWhereClause', () => {
  it('builds LIKE condition for movie title', () => {
    const result = buildMovieWhereClause('Inception', null);
    expect(result).toContain("lower(ItemName) LIKE lower('Inception')");
    expect(result).toContain("ItemType = 'Movie'");
  });

  it('includes ItemId when provided', () => {
    const result = buildMovieWhereClause('Inception', '12345');
    expect(result).toContain("ItemId = '12345'");
  });

  it('normalizes symbols in title for matching', () => {
    const result = buildMovieWhereClause('Movie: Part Two', null);
    expect(result).toContain("'Movie% Part Two'");
  });

  it('normalizes semicolons in title', () => {
    const result = buildMovieWhereClause('Steins;Gate', null);
    expect(result).toContain("'Steins%Gate'");
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
