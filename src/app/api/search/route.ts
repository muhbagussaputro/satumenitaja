import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_SEARCH_EDITION, searchQuran } from "@/lib/quran-api";

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

    const data = await searchQuran(keyword, normalizedScope, edition);
    return NextResponse.json(data, {
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
