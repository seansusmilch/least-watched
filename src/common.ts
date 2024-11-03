export const EMBY_URL = Deno.env.get('EMBY_URL');
export const EMBY_TOKEN = Deno.env.get('EMBY_TOKEN') || '';

export const EMBY_DEVICE = {
  'X-Emby-Client': 'Least Watched',
  'X-Emby-Device-Name': 'Python',
  'X-Emby-Device-Id': 'd40b36d8-7e85-4803-9243-e37202ea1533',
  'X-Emby-Client-Version': '0.0.1',
  'X-Emby-Token': EMBY_TOKEN,
  'X-Emby-Language': 'en-us',
};

export function urlWithParams(
  url: string,
  params: { [key: string]: string | number }
) {
  const urlObj = new URL(url);
  Object.keys(params).forEach((key) =>
    urlObj.searchParams.append(key, params[key] as string)
  );
  return urlObj;
}

export function bytesToGB(bytes: number) {
  return bytes / 1024 ** 3;
}
