export const ARABIC_FONT_OPTIONS = [
  { value: "noto-naskh", label: "Noto Naskh Arabic" },
  { value: "amiri", label: "Amiri" },
  { value: "scheherazade", label: "Scheherazade New" },
  { value: "markazi", label: "Markazi Text" },
  { value: "noto-kufi", label: "Noto Kufi Arabic" },
  { value: "tajawal", label: "Tajawal" },
  { value: "cairo", label: "Cairo" },
  { value: "noto-sans", label: "Noto Sans Arabic" },
] as const;

export type ArabicFontOption = (typeof ARABIC_FONT_OPTIONS)[number]["value"];

export const MUSHAF_PAPER_TEMPLATE_OPTIONS = [
  { value: "classic-cream", label: "Classic Cream" },
  { value: "soft-ivory", label: "Soft Ivory" },
  { value: "aged-parchment", label: "Aged Parchment" },
  { value: "linen-beige", label: "Linen Beige" },
  { value: "sandstone", label: "Sandstone" },
  { value: "rose-paper", label: "Rose Paper" },
  { value: "mint-paper", label: "Mint Paper" },
  { value: "gray-manuscript", label: "Gray Manuscript" },
  { value: "blue-folio", label: "Blue Folio" },
  { value: "night-folio", label: "Night Folio" },
] as const;

export type MushafPaperTemplateOption =
  (typeof MUSHAF_PAPER_TEMPLATE_OPTIONS)[number]["value"];

export type ReaderPreferences = {
  nightMode: boolean;
  fontScale: number;
  audioAutoAdvance: boolean;
  arabicFont: ArabicFontOption;
  mushafPaperTemplate: MushafPaperTemplateOption;
  mushafBrightness: number;
  mushafTextColor: string;
};

const PREFERENCE_STORAGE_KEY = "satumenitaja.preferences";
const FONT_SCALE_MIN = 0.9;
const FONT_SCALE_MAX = 1.4;
const MUSHAF_BRIGHTNESS_MIN = 0.7;
const MUSHAF_BRIGHTNESS_MAX = 1.35;
const HEX_COLOR_REGEX = /^#[\da-fA-F]{6}$/;

export const DEFAULT_PREFERENCES: ReaderPreferences = {
  nightMode: false,
  fontScale: 1,
  audioAutoAdvance: true,
  arabicFont: "noto-naskh",
  mushafPaperTemplate: "classic-cream",
  mushafBrightness: 1,
  mushafTextColor: "#2b1d0e",
};

function isValidArabicFont(value: string): value is ArabicFontOption {
  return ARABIC_FONT_OPTIONS.some((option) => option.value === value);
}

function isValidMushafPaperTemplate(
  value: string,
): value is MushafPaperTemplateOption {
  return MUSHAF_PAPER_TEMPLATE_OPTIONS.some((option) => option.value === value);
}

function clampFontScale(value: number): number {
  return Math.min(Math.max(value, FONT_SCALE_MIN), FONT_SCALE_MAX);
}

function clampMushafBrightness(value: number): number {
  return Math.min(Math.max(value, MUSHAF_BRIGHTNESS_MIN), MUSHAF_BRIGHTNESS_MAX);
}

function normalizeMushafTextColor(value: string): string {
  const normalized = value.trim();
  if (HEX_COLOR_REGEX.test(normalized)) {
    return normalized.toLowerCase();
  }
  return DEFAULT_PREFERENCES.mushafTextColor;
}

export function loadPreferences(): ReaderPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;

  try {
    const raw = window.localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_PREFERENCES,
        nightMode: prefersDarkMode,
      };
    }

    const parsed = JSON.parse(raw) as Partial<ReaderPreferences>;
    return {
      nightMode:
        typeof parsed.nightMode === "boolean"
          ? parsed.nightMode
          : prefersDarkMode,
      fontScale:
        typeof parsed.fontScale === "number"
          ? clampFontScale(parsed.fontScale)
          : DEFAULT_PREFERENCES.fontScale,
      audioAutoAdvance:
        typeof parsed.audioAutoAdvance === "boolean"
          ? parsed.audioAutoAdvance
          : DEFAULT_PREFERENCES.audioAutoAdvance,
      arabicFont:
        typeof parsed.arabicFont === "string" &&
        isValidArabicFont(parsed.arabicFont)
          ? parsed.arabicFont
          : DEFAULT_PREFERENCES.arabicFont,
      mushafPaperTemplate:
        typeof parsed.mushafPaperTemplate === "string" &&
        isValidMushafPaperTemplate(parsed.mushafPaperTemplate)
          ? parsed.mushafPaperTemplate
          : DEFAULT_PREFERENCES.mushafPaperTemplate,
      mushafBrightness:
        typeof parsed.mushafBrightness === "number"
          ? clampMushafBrightness(parsed.mushafBrightness)
          : DEFAULT_PREFERENCES.mushafBrightness,
      mushafTextColor:
        typeof parsed.mushafTextColor === "string"
          ? normalizeMushafTextColor(parsed.mushafTextColor)
          : DEFAULT_PREFERENCES.mushafTextColor,
    };
  } catch {
    return {
      ...DEFAULT_PREFERENCES,
      nightMode: prefersDarkMode,
    };
  }
}

export function savePreferences(preferences: ReaderPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  const safePreferences: ReaderPreferences = {
    ...preferences,
    fontScale: clampFontScale(preferences.fontScale),
    mushafBrightness: clampMushafBrightness(preferences.mushafBrightness),
    mushafTextColor: normalizeMushafTextColor(preferences.mushafTextColor),
  };

  try {
    window.localStorage.setItem(
      PREFERENCE_STORAGE_KEY,
      JSON.stringify(safePreferences),
    );
  } catch {
    // Ignore localStorage failures, especially in strict private browsing.
  }
}

export function getFontScaleLimits(): { min: number; max: number } {
  return { min: FONT_SCALE_MIN, max: FONT_SCALE_MAX };
}

export function getMushafBrightnessLimits(): { min: number; max: number } {
  return { min: MUSHAF_BRIGHTNESS_MIN, max: MUSHAF_BRIGHTNESS_MAX };
}
