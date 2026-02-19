export type BookmarkRecord = {
  id: string;
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  textPreview: string;
  createdAt: number;
};

export type LastReadRecord = {
  id: "lastRead";
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  updatedAt: number;
};

const DATABASE_NAME = "satumenitaja-reader";
const DATABASE_VERSION = 1;
const BOOKMARK_STORE = "bookmarks";
const META_STORE = "meta";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BOOKMARK_STORE)) {
        const bookmarks = db.createObjectStore(BOOKMARK_STORE, {
          keyPath: "id",
        });
        bookmarks.createIndex("createdAt", "createdAt");
      }

      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to open IndexedDB."));
  });
}

function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDatabase();
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = action(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB request failed."));
      transaction.oncomplete = () => db.close();
      transaction.onerror = () =>
        reject(
          transaction.error ?? new Error("IndexedDB transaction failed."),
        );
    } catch (error) {
      reject(error);
    }
  });
}

export function makeBookmarkId(surahNumber: number, ayahNumber: number): string {
  return `${surahNumber}:${ayahNumber}`;
}

export async function getBookmarks(): Promise<BookmarkRecord[]> {
  if (!isBrowser()) {
    return [];
  }

  try {
    const results = await runTransaction<BookmarkRecord[]>(
      BOOKMARK_STORE,
      "readonly",
      (store) => store.getAll(),
    );
    return [...results].sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function getBookmarksForSurah(
  surahNumber: number,
): Promise<Set<number>> {
  const bookmarks = await getBookmarks();
  return new Set(
    bookmarks
      .filter((bookmark) => bookmark.surahNumber === surahNumber)
      .map((bookmark) => bookmark.ayahNumber),
  );
}

export async function upsertBookmark(
  bookmark: Omit<BookmarkRecord, "id" | "createdAt">,
): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  const record: BookmarkRecord = {
    ...bookmark,
    id: makeBookmarkId(bookmark.surahNumber, bookmark.ayahNumber),
    createdAt: Date.now(),
  };

  try {
    await runTransaction(BOOKMARK_STORE, "readwrite", (store) =>
      store.put(record),
    );
  } catch {
    // Fail silently for private mode or quota issues to keep reader usable.
  }
}

export async function removeBookmark(
  surahNumber: number,
  ayahNumber: number,
): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  try {
    await runTransaction(BOOKMARK_STORE, "readwrite", (store) =>
      store.delete(makeBookmarkId(surahNumber, ayahNumber)),
    );
  } catch {
    // Ignore deletion errors because persistence is best-effort in MVP.
  }
}

export async function toggleBookmark(
  bookmark: Omit<BookmarkRecord, "id" | "createdAt">,
): Promise<boolean> {
  if (!isBrowser()) {
    return false;
  }

  const id = makeBookmarkId(bookmark.surahNumber, bookmark.ayahNumber);

  try {
    const existing = await runTransaction<BookmarkRecord | undefined>(
      BOOKMARK_STORE,
      "readonly",
      (store) => store.get(id),
    );

    if (existing) {
      await removeBookmark(bookmark.surahNumber, bookmark.ayahNumber);
      return false;
    }

    await upsertBookmark(bookmark);
    return true;
  } catch {
    return false;
  }
}

export async function setLastRead(
  lastRead: Omit<LastReadRecord, "id" | "updatedAt">,
): Promise<void> {
  if (!isBrowser()) {
    return;
  }

  const payload: LastReadRecord = {
    ...lastRead,
    id: "lastRead",
    updatedAt: Date.now(),
  };

  try {
    await runTransaction(META_STORE, "readwrite", (store) => store.put(payload));
  } catch {
    // Ignore storage failures; reader still works without persistence.
  }
}

export async function getLastRead(): Promise<LastReadRecord | null> {
  if (!isBrowser()) {
    return null;
  }

  try {
    const record = await runTransaction<LastReadRecord | undefined>(
      META_STORE,
      "readonly",
      (store) => store.get("lastRead"),
    );
    return record ?? null;
  } catch {
    return null;
  }
}
