"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ARABIC_FONT_OPTIONS,
  ArabicFontOption,
  getMushafBrightnessLimits,
  getFontScaleLimits,
  MUSHAF_PAPER_TEMPLATE_OPTIONS,
  MushafPaperTemplateOption,
} from "@/lib/preferences";
import { SurahDetail } from "@/lib/quran-types";
import { usePreferences } from "@/components/preferences-provider";
import {
  getBookmarksForSurah,
  setLastRead,
  toggleBookmark,
} from "@/lib/storage";

const FONT_SCALE_LIMITS = getFontScaleLimits();
const MUSHAF_BRIGHTNESS_LIMITS = getMushafBrightnessLimits();

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
  const {
    preferences,
    setNightMode,
    setFontScale,
    setAudioAutoAdvance,
    setArabicFont,
    setMushafPaperTemplate,
    setMushafBrightness,
    setMushafTextColor,
  } = usePreferences();
  const [activeAyah, setActiveAyah] = useState(1);
  const [jumpValue, setJumpValue] = useState("1");
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<number>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
  const [bookmarkPromptAyah, setBookmarkPromptAyah] = useState<number | null>(
    null,
  );

  const ayahLimit = surah.numberOfAyahs;
  const bookmarkPromptAyahData =
    bookmarkPromptAyah === null
      ? null
      : surah.ayahs.find((ayah) => ayah.numberInSurah === bookmarkPromptAyah) ??
        null;

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

  useEffect(() => {
    const onToggleReaderSettings = () => {
      setReaderSettingsOpen((prev) => !prev);
    };

    window.addEventListener(
      "reader-settings:toggle",
      onToggleReaderSettings as EventListener,
    );

    return () => {
      window.removeEventListener(
        "reader-settings:toggle",
        onToggleReaderSettings as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (!readerSettingsOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReaderSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [readerSettingsOpen]);

  useEffect(() => {
    if (bookmarkPromptAyah === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setBookmarkPromptAyah(null);
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bookmarkPromptAyah]);

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
    setReaderSettingsOpen(false);
    router.push(`/surah/${surah.number + 1}`);
  };

  const goPrevSurah = () => {
    if (surah.number <= 1) {
      setNotice("Sudah surah pertama.");
      return;
    }
    setNotice(null);
    setReaderSettingsOpen(false);
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
    setBookmarkPromptAyah(null);
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
                onClick={() => {
                  focusAyah(ayah.numberInSurah, false);
                  setBookmarkPromptAyah(ayah.numberInSurah);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    focusAyah(ayah.numberInSurah, false);
                    setBookmarkPromptAyah(ayah.numberInSurah);
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

      {bookmarkPromptAyahData && !readerSettingsOpen ? (
        <div className="ayah-bookmark-popover" role="status" aria-live="polite">
          <p className="muted">Ayat {bookmarkPromptAyahData.numberInSurah}</p>
          <div className="ayah-bookmark-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setBookmarkPromptAyah(null)}
            >
              Tutup
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                void onToggleBookmark(
                  bookmarkPromptAyahData.numberInSurah,
                  bookmarkPromptAyahData.text,
                )
              }
            >
              {bookmarkedAyahs.has(bookmarkPromptAyahData.numberInSurah)
                ? "Hapus Bookmark"
                : "Tambah Bookmark"}
            </button>
          </div>
        </div>
      ) : null}

      {readerSettingsOpen ? (
        <div
          className="reader-modal-backdrop"
          onClick={() => setReaderSettingsOpen(false)}
          role="presentation"
        >
          <section
            className="reader-modal card compact"
            role="dialog"
            aria-modal="true"
            aria-label="Reader settings"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="reader-modal-head">
              <div className="reader-modal-copy">
                <p className="eyebrow">Surah {surah.number}</p>
                <h2>{surah.englishName}</h2>
                <p className="muted">
                  {surah.name} · {surah.englishNameTranslation} · {ayahLimit} ayat
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setReaderSettingsOpen(false)}
              >
                Tutup
              </button>
            </div>

            <p className="muted controls-active">
              Ayat aktif: {activeAyah} / {ayahLimit}
            </p>

            <div className="inline-actions reader-modal-actions">
              <button type="button" className="btn btn-secondary" onClick={goPrev}>
                Prev
              </button>
              <button type="button" className="btn btn-secondary" onClick={goNext}>
                Next
              </button>
              <button type="button" className="btn btn-primary" onClick={goPrevSurah}>
                Prev Surah
              </button>
              <button type="button" className="btn btn-primary" onClick={goNextSurah}>
                Next Surah
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

            <div className="inline-actions reader-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onToggleFullscreen}
              >
                {isFullscreen ? "Tutup Fullscreen" : "Fullscreen"}
              </button>
            </div>

            <div className="reader-modal-settings">
              <h3>Tampilan</h3>
              <div className="settings-grid">
                <label className="setting-item setting-item-inline">
                  <span className="setting-label">Night mode</span>
                  <input
                    type="checkbox"
                    checked={preferences.nightMode}
                    onChange={(event) => setNightMode(event.target.checked)}
                  />
                </label>

                <label className="setting-item">
                  <span className="setting-label">Font scale</span>
                  <input
                    type="range"
                    min={FONT_SCALE_LIMITS.min}
                    max={FONT_SCALE_LIMITS.max}
                    step={0.05}
                    value={preferences.fontScale}
                    onChange={(event) => setFontScale(Number(event.target.value))}
                  />
                </label>

                <label className="setting-item">
                  <span className="setting-label">Font Arab</span>
                  <select
                    className="select-input"
                    value={preferences.arabicFont}
                    onChange={(event) =>
                      setArabicFont(event.target.value as ArabicFontOption)
                    }
                  >
                    {ARABIC_FONT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="setting-item">
                  <span className="setting-label">Template kertas ayat</span>
                  <select
                    className="select-input"
                    value={preferences.mushafPaperTemplate}
                    onChange={(event) =>
                      setMushafPaperTemplate(
                        event.target.value as MushafPaperTemplateOption,
                      )
                    }
                  >
                    {MUSHAF_PAPER_TEMPLATE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="setting-item">
                  <span className="setting-label">
                    Brightness kertas {Math.round(preferences.mushafBrightness * 100)}
                    %
                  </span>
                  <input
                    type="range"
                    min={MUSHAF_BRIGHTNESS_LIMITS.min}
                    max={MUSHAF_BRIGHTNESS_LIMITS.max}
                    step={0.05}
                    value={preferences.mushafBrightness}
                    onChange={(event) =>
                      setMushafBrightness(Number(event.target.value))
                    }
                  />
                </label>

                <label className="setting-item">
                  <span className="setting-label">Warna font ayat</span>
                  <div className="color-field">
                    <input
                      className="color-input"
                      type="color"
                      value={preferences.mushafTextColor}
                      onChange={(event) => setMushafTextColor(event.target.value)}
                    />
                    <span className="color-code">
                      {preferences.mushafTextColor.toUpperCase()}
                    </span>
                  </div>
                </label>

                <label className="setting-item setting-item-inline">
                  <span className="setting-label">Auto next audio</span>
                  <input
                    type="checkbox"
                    checked={preferences.audioAutoAdvance}
                    onChange={(event) =>
                      setAudioAutoAdvance(event.target.checked)
                    }
                  />
                </label>
              </div>
            </div>

            {notice ? <p className="notice">{notice}</p> : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
