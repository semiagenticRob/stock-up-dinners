export const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
] as const;

export type UtmKey = typeof UTM_KEYS[number];
export type UtmParams = Partial<Record<UtmKey, string>>;

export function extractUtmParams(urlOrSearch: string): UtmParams {
  let params: URLSearchParams;
  try {
    params = new URL(urlOrSearch).searchParams;
  } catch {
    params = new URLSearchParams(urlOrSearch.startsWith('?') ? urlOrSearch.slice(1) : urlOrSearch);
  }
  const out: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value !== null && value !== '') out[key] = value;
  }
  return out;
}
