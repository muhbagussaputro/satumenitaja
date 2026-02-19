"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ARABIC_FONT_OPTIONS,
  ArabicFontOption,
  getMushafBrightnessLimits,
  getFontScaleLimits,
  MUSHAF_PAPER_TEMPLATE_OPTIONS,
  MushafPaperTemplateOption,
} from "@/lib/preferences";
import { usePreferences } from "@/components/preferences-provider";

const FONT_SCALE_LIMITS = getFontScaleLimits();
const MUSHAF_BRIGHTNESS_LIMITS = getMushafBrightnessLimits();

export function AppShell({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const pathname = usePathname();
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

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      if (currentY <= 20) {
        setHeaderVisible(true);
        lastScrollYRef.current = currentY;
        return;
      }

      if (Math.abs(delta) < 8) {
        return;
      }

      const nextVisible = delta < 0;
      setHeaderVisible((current) =>
        current === nextVisible ? current : nextVisible,
      );
      lastScrollYRef.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className={`top-bar${headerVisible ? "" : " is-hidden"}`}>
        <Link className="brand" href="/">
          <span className="brand-mark">سم</span>
          <span className="brand-copy">
            <strong>SatuMenitAja</strong>
            <small>Al-Quran Reader</small>
          </span>
        </Link>

        <nav className="top-nav" aria-label="Main navigation">
          <Link
            href="/"
            className={`nav-link${pathname === "/" ? " is-active" : ""}`}
          >
            Surah
          </Link>
          <Link
            href="/bookmarks"
            className={`nav-link${pathname === "/bookmarks" ? " is-active" : ""}`}
          >
            Bookmark
          </Link>
          <button
            type="button"
            className={`nav-link nav-toggle${settingsOpen ? " is-active" : ""}`}
            onClick={() => setSettingsOpen((prev) => !prev)}
            aria-expanded={settingsOpen}
            aria-controls="reader-settings"
          >
            Settings
          </button>
        </nav>
      </header>

      {settingsOpen ? (
        <section
          id="reader-settings"
          className="settings-panel"
          aria-label="Reader settings"
        >
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
                onChange={(event) => setAudioAutoAdvance(event.target.checked)}
              />
            </label>
          </div>
        </section>
      ) : null}

      <main className="content">{children}</main>
    </div>
  );
}
