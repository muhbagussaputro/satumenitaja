"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type SurahListResponse = {
  surahs: SurahMeta[];
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

export function HeaderSearch() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const response = await fetch("/api/surah-list", { cache: "force-cache" });
        if (!response.ok) {
          throw new Error("Failed to load surah list");
        }

        const payload = (await response.json()) as SurahListResponse;
        if (!mounted) {
          return;
        }

        setSurahs(payload.surahs ?? []);
        setHasError(false);
      } catch {
        if (!mounted) {
          return;
        }

        setSurahs([]);
        setHasError(true);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, []);

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
      .sort((a, b) => b.score - a.score || a.surah.number - b.surah.number)
      .slice(0, 8)
      .map((entry) => entry.surah);
  }, [indexedSurahs, safeQuery]);

  const showResults = focused && safeQuery.length > 0;

  return (
    <div ref={rootRef} className="header-search">
      <input
        type="search"
        className="text-input header-search-input"
        value={query}
        onFocus={() => setFocused(true)}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari surah: 3 / imraan / الرحمن"
        aria-label="Cari surah"
      />

      {showResults ? (
        <div
          className="header-search-results"
          role="listbox"
          aria-label="Hasil pencarian surah"
        >
          {isLoading ? (
            <p className="header-search-status muted">Memuat daftar surah...</p>
          ) : null}

          {!isLoading && hasError ? (
            <p className="header-search-status muted">
              Gagal memuat search. Coba refresh halaman.
            </p>
          ) : null}

          {!isLoading && !hasError && results.length === 0 ? (
            <p className="header-search-status muted">Surah tidak ditemukan.</p>
          ) : null}

          {results.length > 0 ? (
            <ul className="header-search-list">
              {results.map((surah) => (
                <li key={surah.number}>
                  <Link
                    href={`/surah/${surah.number}`}
                    onClick={() => {
                      setFocused(false);
                      setQuery("");
                    }}
                  >
                    <strong>
                      {surah.number}. {surah.englishName}
                    </strong>
                    <p>
                      {surah.name} · {surah.englishNameTranslation}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
