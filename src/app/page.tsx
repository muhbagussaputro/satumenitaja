import { ContinueReadingCard } from "@/components/continue-reading-card";
import { HomeSearch } from "@/components/home-search";
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
      <section className="hero card">
        <p className="eyebrow">MVP Frontend</p>
        <h1>Al-Quran Reader Mobile-First</h1>
        <p className="muted">
          Fokus baca cepat: daftar surah, jump ayah, bookmark, last read, dan
          preferensi tampilan lokal tanpa login.
        </p>
      </section>

      <ContinueReadingCard />
      <HomeSearch />

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
