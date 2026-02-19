import {
  QuranApiEnvelope,
  SearchPayload,
  SurahDetail,
  SurahMeta,
} from "@/lib/quran-types";

export const QURAN_API_BASE_URL = "https://api.alquran.cloud/v1";
export const DEFAULT_TEXT_EDITION = "quran-uthmani";
export const DEFAULT_SEARCH_EDITION = "id.indonesian";

async function fetchQuranApi<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> {
  const response = await fetch(`${QURAN_API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw new Error(`Quran API request failed (${response.status}) for ${path}`);
  }

  const json = (await response.json()) as QuranApiEnvelope<T>;
  if (json.status.toLowerCase() !== "ok") {
    throw new Error(`Quran API returned non-OK status for ${path}`);
  }

  return json.data;
}

export async function getSurahList(): Promise<SurahMeta[]> {
  return fetchQuranApi<SurahMeta[]>("/surah", {
    next: { revalidate: 60 * 60 * 24 },
  });
}

export async function getSurahDetail(
  surahNumber: number,
  edition = DEFAULT_TEXT_EDITION,
): Promise<SurahDetail> {
  return fetchQuranApi<SurahDetail>(`/surah/${surahNumber}/${edition}`, {
    next: { revalidate: 60 * 10 },
  });
}

export async function searchQuran(
  keyword: string,
  scope: "all" | `${number}` = "all",
  editionOrLanguage = DEFAULT_SEARCH_EDITION,
): Promise<SearchPayload> {
  const encodedKeyword = encodeURIComponent(keyword);
  const path = `/search/${encodedKeyword}/${scope}/${editionOrLanguage}`;
  const response = await fetch(`${QURAN_API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  // Quran API returns 404 for "no matches"; treat it as empty result.
  if (response.status === 404) {
    return { count: 0, matches: [] };
  }

  if (!response.ok) {
    throw new Error(`Quran API request failed (${response.status}) for ${path}`);
  }

  const json = (await response.json()) as QuranApiEnvelope<SearchPayload>;
  if (json.status.toLowerCase() !== "ok") {
    throw new Error(`Quran API returned non-OK status for ${path}`);
  }

  return json.data;
}
