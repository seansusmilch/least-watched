import { EMBY_DEVICE, EMBY_URL, urlWithParams } from './common.ts';

const resultsLimit = 100;

export async function getShowsList({ parentId = 6, offset = 0 } = {}) {
  const params = {
    IncludeItemTypes: 'Series',
    Fields: '',
    StartIndex: offset,
    SortBy: 'SortName',
    SortOrder: 'Ascending',
    ParentId: parentId,
    ImageTypeLimit: 1,
    Recursive: 'true',
    Limit: resultsLimit,
    ...EMBY_DEVICE,
  };

  const response = await fetch(urlWithParams(`${EMBY_URL}/emby/Items`, params));
  const data = await response.json();
  return data.Items;
}

if (import.meta.main) {
  console.log(await getShowsList({ offset: 200 }));
}
