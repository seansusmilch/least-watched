import { EMBY_DEVICE, EMBY_URL, urlWithParams } from './common.ts';

const resultLimit = 100;

export const getEpisodes = async (seriesId: number, { offset = 0 } = {}) => {
  const params: { [key: string]: string | number } = {
    Fields: 'MediaSources',
    ExcludeFields: 'VideoChapters,VideoMediaSources,MeadiaStreams',
    MediaTypes: 'Video',
    IncludeItemTypes: 'Episode',
    ParentId: seriesId,
    StartIndex: offset,
    Limit: resultLimit,
    ...EMBY_DEVICE,
  };
  console.log('params', params);

  const res = await fetch(urlWithParams(`${EMBY_URL}/emby/Items`, params));
  const data = await res.json();
  console.log(data);

  return data.Items;
};

if (import.meta.main) {
  console.log(await getEpisodes(202309));
}
