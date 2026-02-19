import { notFound } from "next/navigation";
import { ReaderClient } from "@/components/reader-client";
import { getSurahDetail } from "@/lib/quran-api";

type SurahPageProps = {
  params: Promise<{ surahNumber: string }>;
};

export default async function SurahPage({ params }: SurahPageProps) {
  const { surahNumber } = await params;
  const parsedSurahNumber = Number(surahNumber);

  if (
    !Number.isInteger(parsedSurahNumber) ||
    parsedSurahNumber < 1 ||
    parsedSurahNumber > 114
  ) {
    notFound();
  }

  let surah = null;
  try {
    surah = await getSurahDetail(parsedSurahNumber);
  } catch {
    surah = null;
  }

  if (!surah) {
    return (
      <div className="error-box">
        <h1>Gagal memuat Surah {parsedSurahNumber}</h1>
        <p>Cek koneksi lalu coba buka ulang.</p>
      </div>
    );
  }

  return (
    <div className="stack-layout">
      <section className="card surah-overview">
        <p className="surah-overview-meta">
          <span className="eyebrow">Surah {surah.number}</span>
          <span className="surah-pill">{surah.numberOfAyahs} ayat</span>
        </p>
        <h1>{surah.englishName}</h1>
        <p className="surah-arabic-name">{surah.name}</p>
        <p className="muted surah-translation">{surah.englishNameTranslation}</p>
      </section>

      <ReaderClient surah={surah} />
    </div>
  );
}
