import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SEARCH_EDITION, searchQuran } from "@/lib/quran-api";
import { SearchMatch, SearchPayload } from "@/lib/quran-types";

const ARABIC_SEARCH_EDITION = "ar.jalalayn";
const ARABIC_CHAR_REGEX = /[\u0600-\u06FF]/u;
const ARABIC_MARKS_REGEX = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;

function containsArabicScript(keyword: string): boolean {
  return ARABIC_CHAR_REGEX.test(keyword);
}

function normalizeArabicKeyword(keyword: string): string {
  return keyword
    .replace(ARABIC_MARKS_REGEX, "")
    .replace(/\u0640/gu, "")
    .replace(/[أإآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ؤ/gu, "و")
    .replace(/ئ/gu, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

function buildKeywordVariants(keyword: string, isArabic: boolean): string[] {
  if (!isArabic) {
    return [keyword];
  }

  const variants = [keyword];
  const normalized = normalizeArabicKeyword(keyword);

  if (normalized.length > 0 && normalized !== keyword) {
    variants.push(normalized);
  }

  return variants;
}

function mergePayloads(payloads: SearchPayload[], maxMatches = 200): SearchPayload {
  const matches: SearchMatch[] = [];
  const seen = new Set<number>();

  for (const payload of payloads) {
    for (const match of payload.matches) {
      if (seen.has(match.number)) {
        continue;
      }

      seen.add(match.number);
      matches.push(match);

      if (matches.length >= maxMatches) {
        return { count: matches.length, matches };
      }
    }
  }

  return { count: matches.length, matches };
}

function sanitizeKeyword(keyword: string): string {
  return keyword
    .trim()
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .replace(/\s+/g, " ");
}

function isValidScope(scope: string): boolean {
  if (scope === "all") {
    return true;
  }

  const number = Number(scope);
  return Number.isInteger(number) && number >= 1 && number <= 114;
}

export async function GET(request: NextRequest) {
  const keyword = sanitizeKeyword(request.nextUrl.searchParams.get("q") ?? "");
  const scope = request.nextUrl.searchParams.get("scope") ?? "all";
  const edition =
    request.nextUrl.searchParams.get("edition") ?? DEFAULT_SEARCH_EDITION;
  const isArabic = containsArabicScript(keyword);

  if (keyword.length < 2) {
    return NextResponse.json(
      { message: "Keyword minimal 2 karakter." },
      { status: 400 },
    );
  }

  if (!isValidScope(scope)) {
    return NextResponse.json(
      { message: "Scope harus all atau nomor surah (1-114)." },
      { status: 400 },
    );
  }

  try {
    const normalizedScope =
      scope === "all" ? "all" : (`${Number(scope)}` as `${number}`);
    const keywordVariants = buildKeywordVariants(keyword, isArabic);
    const editionCandidates = [...new Set(
      isArabic
        ? [edition, ARABIC_SEARCH_EDITION, DEFAULT_SEARCH_EDITION]
        : [edition, DEFAULT_SEARCH_EDITION],
    )];
    const payloads: SearchPayload[] = [];
    let hasSuccessfulRequest = false;

    for (const keywordVariant of keywordVariants) {
      for (const editionCandidate of editionCandidates) {
        try {
          const payload = await searchQuran(
            keywordVariant,
            normalizedScope,
            editionCandidate,
          );

          hasSuccessfulRequest = true;

          if (payload.matches.length > 0) {
            payloads.push(payload);
          }
        } catch {
          // Try next edition/variant and only fail if all requests fail.
        }
      }
    }

    if (!hasSuccessfulRequest) {
      throw new Error("Search API unavailable");
    }

    return NextResponse.json(mergePayloads(payloads), {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Gagal mengambil data search dari Quran API." },
      { status: 502 },
    );
  }
}
