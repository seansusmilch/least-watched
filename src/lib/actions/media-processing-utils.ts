const MEDIA_ITEM_IDS_FIELD = 'mediaItemIds';

export function extractMediaItemIds(formData: FormData): string[] {
  const ids = formData
    .getAll(MEDIA_ITEM_IDS_FIELD)
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);

  return [...new Set(ids)];
}
