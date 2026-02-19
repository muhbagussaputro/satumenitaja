"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SurahMeta } from "@/lib/quran-types";

const ARABIC_MARKS_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;
const NON_ALNUM_SPACE_REGEX = /[^\p{L}\p{N}\s]/gu;

type IndexedSurah = {
  surah: SurahMeta;
  numberKey: string;
  englishKey: string;
  arabicKey: string;
  translationKey: string;
  searchableKey: string;
};

function sanitizeInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(ARABIC_MARKS_REGEX, "")
    .replace(/\u0640/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ؤ/gu, "و")
    .replace(/ئ/gu, "ي")
    .replace(NON_ALNUM_SPACE_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(
  source: string,
  query: string,
  exactScore: number,
  startsWithScore: number,
  includesScore: number,
): number {
  if (!source || !query) {
    return 0;
  }

  if (source === query) {
    return exactScore;
  }

  if (source.startsWith(query)) {
    return startsWithScore;
  }

  if (source.includes(query)) {
    return includesScore;
  }

  return 0;
}

function scoreIndexedSurah(indexed: IndexedSurah, query: string): number {
  const tokens = query.split(" ").filter(Boolean);
  let score = 0;

  score += scoreMatch(indexed.numberKey, query, 240, 180, 140);
  score += scoreMatch(indexed.englishKey, query, 220, 190, 140);
  score += scoreMatch(indexed.arabicKey, query, 220, 185, 135);
  score += scoreMatch(indexed.translationKey, query, 180, 150, 110);

  if (
    tokens.length > 1 &&
    tokens.every((token) => indexed.searchableKey.includes(token))
  ) {
    score += 70;
  }

  return score;
}

export function HomeSearch({ surahs }: { surahs: SurahMeta[] }) {
  const [query, setQuery] = useState("");
  const safeQuery = useMemo(() => sanitizeInput(query), [query]);

  const indexedSurahs = useMemo<IndexedSurah[]>(
    () =>
      surahs.map((surah) => {
        const numberKey = `${surah.number}`;
        const englishKey = normalizeSearchText(surah.englishName);
        const arabicKey = normalizeSearchText(surah.name);
        const translationKey = normalizeSearchText(surah.englishNameTranslation);
        const searchableKey = `${numberKey} ${englishKey} ${arabicKey} ${translationKey} ${surah.revelationType.toLowerCase()}`;

        return {
          surah,
          numberKey,
          englishKey,
          arabicKey,
          translationKey,
          searchableKey,
        };
      }),
    [surahs],
  );

  const results = useMemo(() => {
    const queryKey = normalizeSearchText(safeQuery);
    if (!queryKey) {
      return [];
    }

    return indexedSurahs
      .map((indexed) => ({
        surah: indexed.surah,
        score: scoreIndexedSurah(indexed, queryKey),
      }))
      .filter((entry) => entry.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score || a.surah.number - b.surah.number,
      )
      .slice(0, 12)
      .map((entry) => entry.surah);
  }, [indexedSurahs, safeQuery]);

  return (
    <section className="card">
      <h2>Pencarian Global</h2>
      <p className="muted">
        Prioritas Surah. Cari nomor surah, nama latin, nama Arab, atau arti
        surah.
      </p>
      <input
        className="text-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Contoh: 3 / imraan / الرحمن / keluarga"
      />

      {safeQuery.length === 0 ? (
        <p className="muted">Ketik kata kunci untuk mencari surah.</p>
      ) : null}

      {safeQuery.length > 0 && results.length === 0 ? (
        <p className="muted">Surah tidak ditemukan. Coba kata lain.</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="search-results">
          {results.map((surah) => (
            <li key={surah.number}>
              <Link href={`/surah/${surah.number}`}>
                <strong>
                  {surah.number}. {surah.englishName}
                </strong>
                <p>
                  {surah.name} · {surah.englishNameTranslation} ·{" "}
                  {surah.numberOfAyahs} ayat
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
