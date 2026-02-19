"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArabicFontOption,
  DEFAULT_PREFERENCES,
  MushafPaperTemplateOption,
  ReaderPreferences,
  savePreferences,
  loadPreferences,
} from "@/lib/preferences";

type PreferencesContextValue = {
  preferences: ReaderPreferences;
  setNightMode: (enabled: boolean) => void;
  setFontScale: (value: number) => void;
  setAudioAutoAdvance: (enabled: boolean) => void;
  setArabicFont: (font: ArabicFontOption) => void;
  setMushafPaperTemplate: (template: MushafPaperTemplateOption) => void;
  setMushafBrightness: (value: number) => void;
  setMushafTextColor: (value: string) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function applyPreferences(preferences: ReaderPreferences): void {
  const root = document.documentElement;
  root.dataset.theme = preferences.nightMode ? "night" : "day";
  root.style.setProperty("--font-scale", String(preferences.fontScale));

  if (document.body) {
    document.body.dataset.arabicFont = preferences.arabicFont;
    document.body.dataset.paperTemplate = preferences.mushafPaperTemplate;
    document.body.style.setProperty(
      "--mushaf-brightness",
      String(preferences.mushafBrightness),
    );
    document.body.style.setProperty(
      "--mushaf-text-color",
      preferences.mushafTextColor,
    );
  }
}

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [preferences, setPreferences] = useState<ReaderPreferences>(() =>
    typeof window === "undefined" ? DEFAULT_PREFERENCES : loadPreferences(),
  );

  useEffect(() => {
    applyPreferences(preferences);
    savePreferences(preferences);
  }, [preferences]);

  const setNightMode = useCallback((enabled: boolean) => {
    setPreferences((current) => ({ ...current, nightMode: enabled }));
  }, []);

  const setFontScale = useCallback((value: number) => {
    setPreferences((current) => ({ ...current, fontScale: value }));
  }, []);

  const setAudioAutoAdvance = useCallback((enabled: boolean) => {
    setPreferences((current) => ({ ...current, audioAutoAdvance: enabled }));
  }, []);

  const setArabicFont = useCallback((font: ArabicFontOption) => {
    setPreferences((current) => ({ ...current, arabicFont: font }));
  }, []);

  const setMushafPaperTemplate = useCallback(
    (template: MushafPaperTemplateOption) => {
      setPreferences((current) => ({ ...current, mushafPaperTemplate: template }));
    },
    [],
  );

  const setMushafBrightness = useCallback((value: number) => {
    setPreferences((current) => ({ ...current, mushafBrightness: value }));
  }, []);

  const setMushafTextColor = useCallback((value: string) => {
    setPreferences((current) => ({ ...current, mushafTextColor: value }));
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      setNightMode,
      setFontScale,
      setAudioAutoAdvance,
      setArabicFont,
      setMushafPaperTemplate,
      setMushafBrightness,
      setMushafTextColor,
    }),
    [
      preferences,
      setNightMode,
      setFontScale,
      setAudioAutoAdvance,
      setArabicFont,
      setMushafPaperTemplate,
      setMushafBrightness,
      setMushafTextColor,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used inside PreferencesProvider.");
  }
  return context;
}
