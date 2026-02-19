import { NextResponse } from "next/server";
import { getSurahList } from "@/lib/quran-api";

export async function GET() {
  try {
    const surahs = await getSurahList();

    return NextResponse.json(
      { surahs },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { message: "Gagal memuat daftar surah." },
      { status: 502 },
    );
  }
}
