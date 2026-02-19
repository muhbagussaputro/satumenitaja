import { BookmarkListClient } from "@/components/bookmark-list-client";

export default function BookmarksPage() {
  return (
    <div className="stack-layout">
      <section className="card">
        <p className="eyebrow">Local Persistence</p>
        <h1>Daftar Bookmark</h1>
        <p className="muted">
          Disimpan lokal dengan IndexedDB (tanpa login). Urutan terbaru di atas.
        </p>
      </section>
      <BookmarkListClient />
    </div>
  );
}
