import { EMBY_URL, EMBY_DEVICE, urlWithParams } from './common.ts';

export async function queryPlaybacks(query: string) {
  const params = {
    aggregate_data: 'true',
    days: 365,
    end_date: '2024-10-30',
    filter_name: `${query}*`,
    ...EMBY_DEVICE,
  };

  const res = await fetch(
    urlWithParams(`${EMBY_URL}/emby/user_usage_stats/UserPlaylist`, params)
  );

  const data = await res.json();
  return data;
}

if (import.meta.main) {
  console.log(await queryPlaybacks('The Office (US)'));
}
