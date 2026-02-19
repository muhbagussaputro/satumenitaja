import { ContinueReadingCard } from "@/components/continue-reading-card";
import { SurahList } from "@/components/surah-list";
import { getSurahList } from "@/lib/quran-api";

export default async function HomePage() {
  let surahs = null;

  try {
    surahs = await getSurahList();
  } catch {
    surahs = null;
  }

  return (
    <div className="home-layout">
      <ContinueReadingCard />

      <section className="card">
        <h2>Daftar Surah</h2>
        {surahs ? (
          <SurahList surahs={surahs} />
        ) : (
          <div className="error-box">
            <p>Gagal memuat daftar surah. Coba refresh halaman.</p>
          </div>
        )}
      </section>
    </div>
  );
}
