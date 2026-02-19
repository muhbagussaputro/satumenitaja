"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getLastRead, LastReadRecord } from "@/lib/storage";

export function ContinueReadingCard() {
  const [lastRead, setLastRead] = useState<LastReadRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getLastRead().then((value) => {
      setLastRead(value);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="muted">Membaca riwayat terakhir...</p>;
  }

  if (!lastRead) {
    return (
      <div className="card compact">
        <h2>Lanjutkan Bacaan</h2>
        <p className="muted">
          Belum ada posisi terakhir. Pilih surah untuk mulai membaca.
        </p>
      </div>
    );
  }

  return (
    <div className="card compact">
      <h2>Lanjutkan Bacaan</h2>
      <p>
        Surah {lastRead.surahNumber} ({lastRead.surahName}) ayat{" "}
        {lastRead.ayahNumber}
      </p>
      <Link
        className="btn btn-primary"
        href={`/surah/${lastRead.surahNumber}#ayah=${lastRead.ayahNumber}`}
      >
        Buka Posisi Terakhir
      </Link>
    </div>
  );
}
