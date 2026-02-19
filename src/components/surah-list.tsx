import Link from "next/link";
import { SurahMeta } from "@/lib/quran-types";

export function SurahList({ surahs }: { surahs: SurahMeta[] }) {
  return (
    <ul className="surah-grid">
      {surahs.map((surah) => (
        <li key={surah.number}>
          <Link className="surah-item" href={`/surah/${surah.number}`}>
            <span className="surah-number">{surah.number}</span>
            <span className="surah-meta">
              <strong>{surah.englishName}</strong>
              <small>
                {surah.name} · {surah.numberOfAyahs} ayat
              </small>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
