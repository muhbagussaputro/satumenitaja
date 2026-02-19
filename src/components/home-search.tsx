"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SearchMatch } from "@/lib/quran-types";

type SearchState =
  | { status: "idle"; results: SearchMatch[]; error: string | null }
  | { status: "loading"; results: SearchMatch[]; error: string | null }
  | { status: "success"; results: SearchMatch[]; error: string | null }
  | { status: "error"; results: SearchMatch[]; error: string | null };

function sanitizeInput(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function truncate(text: string, maxLength = 120): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

export function HomeSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({
    status: "idle",
    results: [],
    error: null,
  });

  const safeQuery = useMemo(() => sanitizeInput(query), [query]);

  useEffect(() => {
    if (safeQuery.length < 2) {
      setState({ status: "idle", results: [], error: null });
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setState((current) => ({
          status: "loading",
          results: current.results,
          error: null,
        }));
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(safeQuery)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const payload = (await response.json()) as { matches: SearchMatch[] };
        setState({
          status: "success",
          results: payload.matches,
          error: null,
        });
      } catch {
        setState({
          status: "error",
          results: [],
          error: "Search belum tersedia. Coba lagi.",
        });
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [safeQuery]);

  return (
    <section className="card">
      <h2>Search Ayat</h2>
      <p className="muted">Minimal 2 karakter. Debounce 300ms.</p>
      <input
        className="text-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Contoh: rahmat"
      />

      {state.status === "loading" ? <p className="muted">Mencari...</p> : null}
      {state.status === "error" ? <p className="error">{state.error}</p> : null}
      {state.status === "success" && state.results.length === 0 ? (
        <p className="muted">Tidak ditemukan. Ubah keyword.</p>
      ) : null}

      {state.results.length > 0 ? (
        <ul className="search-results">
          {state.results.slice(0, 8).map((match) => (
            <li key={`${match.number}`}>
              <Link
                href={`/surah/${match.surah.number}#ayah=${match.numberInSurah}`}
              >
                <strong>
                  {match.surah.englishName}:{match.numberInSurah}
                </strong>
                <p>{truncate(match.text)}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
