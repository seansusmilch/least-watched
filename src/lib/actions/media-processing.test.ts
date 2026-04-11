import { describe, expect, it } from 'vitest';
import { extractMediaItemIds } from '@/lib/actions/media-processing-utils';

describe('extractMediaItemIds', () => {
  it('returns unique valid numeric ids from form data', () => {
    const formData = new FormData();
    formData.append('mediaItemIds', 'abc-12');
    formData.append('mediaItemIds', 'xyz-34');
    formData.append('mediaItemIds', 'abc-12');
    formData.append('mediaItemIds', '   ');
    formData.append('otherField', '99');

    expect(extractMediaItemIds(formData)).toEqual(['abc-12', 'xyz-34']);
  });

  it('returns an empty array when no valid ids are present', () => {
    const formData = new FormData();
    formData.append('mediaItemIds', '');
    formData.append('mediaItemIds', '   ');

    expect(extractMediaItemIds(formData)).toEqual([]);
  });
});
