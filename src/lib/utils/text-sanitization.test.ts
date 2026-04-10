import { describe, it, expect } from 'vitest';
import { sanitizeText, pickOverview } from '@/lib/utils/text-sanitization';

describe('sanitizeText', () => {
  it('returns the string when non-empty', () => {
    expect(sanitizeText('hello')).toBe('hello');
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeText('  hello world  ')).toBe('hello world');
  });

  it('returns undefined for empty string', () => {
    expect(sanitizeText('')).toBeUndefined();
  });

  it('returns undefined for whitespace-only string', () => {
    expect(sanitizeText('   ')).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(sanitizeText(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(sanitizeText(undefined)).toBeUndefined();
  });

  it('returns undefined for number', () => {
    expect(sanitizeText(42)).toBeUndefined();
  });

  it('returns undefined for object', () => {
    expect(sanitizeText({})).toBeUndefined();
  });
});

describe('pickOverview', () => {
  it('prefers arrOverview over embyOverview when both present', () => {
    expect(
      pickOverview({ arrOverview: 'Arr description', embyOverview: 'Emby description' })
    ).toBe('Arr description');
  });

  it('falls back to embyOverview when arrOverview is empty string', () => {
    expect(
      pickOverview({ arrOverview: '', embyOverview: 'Emby description' })
    ).toBe('Emby description');
  });

  it('falls back to embyOverview when arrOverview is null', () => {
    expect(
      pickOverview({ arrOverview: null, embyOverview: 'Emby description' })
    ).toBe('Emby description');
  });

  it('falls back to embyOverview when arrOverview is undefined', () => {
    expect(
      pickOverview({ arrOverview: undefined, embyOverview: 'Emby description' })
    ).toBe('Emby description');
  });

  it('returns undefined when both are empty', () => {
    expect(pickOverview({ arrOverview: '', embyOverview: '' })).toBeUndefined();
  });

  it('returns undefined when both are null', () => {
    expect(pickOverview({ arrOverview: null, embyOverview: null })).toBeUndefined();
  });

  it('trims whitespace from selected overview', () => {
    expect(
      pickOverview({ arrOverview: '  trimmed  ', embyOverview: 'Emby' })
    ).toBe('trimmed');
  });
});
