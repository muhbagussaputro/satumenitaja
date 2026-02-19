"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookmarkRecord, getBookmarks, removeBookmark } from "@/lib/storage";

export function BookmarkListClient() {
  const [bookmarks, setBookmarks] = useState<BookmarkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadBookmarks = async () => {
    const results = await getBookmarks();
    setBookmarks(results);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    void getBookmarks().then((results) => {
      if (!active) {
        return;
      }
      setBookmarks(results);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const onDelete = async (surahNumber: number, ayahNumber: number) => {
    await removeBookmark(surahNumber, ayahNumber);
    await reloadBookmarks();
  };

  if (loading) {
    return <p className="muted">Memuat bookmark...</p>;
  }

  if (bookmarks.length === 0) {
    return (
      <div className="card">
        <h2>Bookmark kosong</h2>
        <p className="muted">
          Simpan ayat dari halaman Surah untuk menampilkan daftar di sini.
        </p>
      </div>
    );
  }

  return (
    <ul className="bookmark-list">
      {bookmarks.map((bookmark) => (
        <li key={bookmark.id} className="card compact">
          <div>
            <strong>
              Surah {bookmark.surahNumber} ({bookmark.surahName}) - Ayah{" "}
              {bookmark.ayahNumber}
            </strong>
            <p className="muted">{bookmark.textPreview}</p>
          </div>
          <div className="inline-actions">
            <Link
              className="btn btn-primary"
              href={`/surah/${bookmark.surahNumber}#ayah=${bookmark.ayahNumber}`}
            >
              Buka
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onDelete(bookmark.surahNumber, bookmark.ayahNumber)}
            >
              Hapus
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
