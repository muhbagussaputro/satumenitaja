"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SurahDetail } from "@/lib/quran-types";
import {
  getBookmarksForSurah,
  setLastRead,
  toggleBookmark,
} from "@/lib/storage";

function parseAyahFromHash(maxAyah: number): number {
  if (typeof window === "undefined") {
    return 1;
  }

  const match = window.location.hash.match(/ayah=(\d+)/i);
  if (!match) {
    return 1;
  }

  const ayah = Number(match[1]);
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > maxAyah) {
    return 1;
  }

  return ayah;
}

function makePreview(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= 140) {
    return normalized;
  }
  return `${normalized.slice(0, 140)}...`;
}

function toArabicIndicNumber(value: number): string {
  return String(value)
    .split("")
    .map((digit) => String.fromCharCode(0x0660 + Number(digit)))
    .join("");
}

export function ReaderClient({ surah }: { surah: SurahDetail }) {
  const router = useRouter();
  const [activeAyah, setActiveAyah] = useState(1);
  const [jumpValue, setJumpValue] = useState("1");
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const ayahLimit = surah.numberOfAyahs;
  const activeAyahData = surah.ayahs.find(
    (ayah) => ayah.numberInSurah === activeAyah,
  );

  const focusAyah = useCallback(
    (ayahNumber: number, smooth = true) => {
      const target = document.getElementById(`ayah-${ayahNumber}`);
      if (!target) {
        setNotice("Ayat target belum tersedia.");
        return;
      }

      target.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "center",
      });
      setActiveAyah(ayahNumber);
      setJumpValue(String(ayahNumber));
      window.history.replaceState(null, "", `#ayah=${ayahNumber}`);
    },
    [setActiveAyah, setJumpValue],
  );

  useEffect(() => {
    const ayahFromHash = parseAyahFromHash(ayahLimit);
    const frame = window.requestAnimationFrame(() => {
      setActiveAyah(ayahFromHash);
      setJumpValue(String(ayahFromHash));
      const target = document.getElementById(`ayah-${ayahFromHash}`);
      if (target) {
        target.scrollIntoView({ behavior: "auto", block: "center" });
      }
      window.history.replaceState(null, "", `#ayah=${ayahFromHash}`);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [ayahLimit]);

  useEffect(() => {
    void getBookmarksForSurah(surah.number).then((values) =>
      setBookmarkedAyahs(values),
    );
  }, [surah.number]);

  useEffect(() => {
    void setLastRead({
      surahNumber: surah.number,
      surahName: surah.englishName,
      ayahNumber: activeAyah,
    });
  }, [surah.number, surah.englishName, activeAyah]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  const submitJump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetAyah = Number(jumpValue);

    if (
      !Number.isInteger(targetAyah) ||
      targetAyah < 1 ||
      targetAyah > ayahLimit
    ) {
      setNotice(`Ayat harus di antara 1 - ${ayahLimit}.`);
      return;
    }

    setNotice(null);
    focusAyah(targetAyah);
  };

  const goPrev = () => {
    if (activeAyah <= 1) {
      setNotice("Sudah ayat pertama.");
      return;
    }
    setNotice(null);
    focusAyah(activeAyah - 1);
  };

  const goNext = () => {
    if (activeAyah >= ayahLimit) {
      setNotice("Sudah ayat terakhir.");
      return;
    }
    setNotice(null);
    focusAyah(activeAyah + 1);
  };

  const goNextSurah = () => {
    if (surah.number >= 114) {
      setNotice("Sudah surah terakhir.");
      return;
    }
    setNotice(null);
    router.push(`/surah/${surah.number + 1}`);
  };

  const goPrevSurah = () => {
    if (surah.number <= 1) {
      setNotice("Sudah surah pertama.");
      return;
    }
    setNotice(null);
    router.push(`/surah/${surah.number - 1}`);
  };

  const onToggleBookmark = async (ayahNumber: number, text: string) => {
    const isBookmarked = await toggleBookmark({
      surahNumber: surah.number,
      surahName: surah.englishName,
      ayahNumber,
      textPreview: makePreview(text),
    });

    setBookmarkedAyahs((current) => {
      const next = new Set(current);
      if (isBookmarked) {
        next.add(ayahNumber);
      } else {
        next.delete(ayahNumber);
      }
      return next;
    });
  };

  const onToggleActiveBookmark = async () => {
    if (!activeAyahData) {
      return;
    }

    await onToggleBookmark(activeAyahData.numberInSurah, activeAyahData.text);
  };

  const onToggleFullscreen = async () => {
    const root = document.getElementById("reader-root");
    if (!root) {
      setNotice("Reader tidak ditemukan untuk fullscreen.");
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        if (!document.fullscreenEnabled) {
          setNotice("Fullscreen belum didukung browser ini.");
          return;
        }
        await root.requestFullscreen();
      }
      setNotice(null);
    } catch {
      setNotice("Gagal mengubah mode fullscreen.");
    }
  };

  return (
    <section id="reader-root" className="reader-layout">
      <div className="sticky-controls card compact">
        <div className="controls-head">
          <p className="muted controls-active">
            Ayat aktif: {activeAyah} / {ayahLimit}
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onToggleFullscreen}
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>

        <div className="row-gap">
          <div className="inline-actions nav-actions">
            <button type="button" className="btn btn-secondary" onClick={goPrev}>
              Prev
            </button>
            <button type="button" className="btn btn-secondary" onClick={goNext}>
              Next
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={goPrevSurah}
            >
              Prev Surah
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={goNextSurah}
            >
              Next Surah
            </button>
          </div>

          <div className="inline-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onToggleActiveBookmark}
            >
              {bookmarkedAyahs.has(activeAyah)
                ? "Hapus Bookmark Aktif"
                : "Bookmark Ayat Aktif"}
            </button>
          </div>

          <form className="inline-form jump-form" onSubmit={submitJump}>
            <label htmlFor="jump-ayah">Jump ayah</label>
            <input
              id="jump-ayah"
              className="text-input"
              type="number"
              min={1}
              max={ayahLimit}
              value={jumpValue}
              onChange={(event) => setJumpValue(event.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Go
            </button>
          </form>
        </div>

        {notice ? <p className="notice">{notice}</p> : null}
      </div>

      <article className="mushaf-sheet">
        <p className="mushaf-text">
          {surah.ayahs.map((ayah) => {
            const isActive = ayah.numberInSurah === activeAyah;
            const isBookmarked = bookmarkedAyahs.has(ayah.numberInSurah);

            return (
              <span
                key={ayah.number}
                id={`ayah-${ayah.numberInSurah}`}
                className={`ayah-inline${isActive ? " active" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => focusAyah(ayah.numberInSurah, false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    focusAyah(ayah.numberInSurah, false);
                  }
                }}
              >
                {ayah.text}
                <span
                  className={`ayah-marker${isBookmarked ? " bookmarked" : ""}`}
                  aria-label={`Ayat ${ayah.numberInSurah}`}
                >
                  {toArabicIndicNumber(ayah.numberInSurah)}
                </span>{" "}
              </span>
            );
          })}
        </p>
      </article>
    </section>
  );
}
