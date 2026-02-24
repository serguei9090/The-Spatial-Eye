"use client";

import { type Language, translations } from "@/lib/i18n/translations";
import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type HighlightDuration = 3000 | 5000 | 10000 | "always";

interface SettingsContextType {
  // Language Settings
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)["en"];

  // Highlight Settings
  highlightDuration: HighlightDuration;
  setHighlightDuration: (duration: HighlightDuration) => void;

  // Debug Settings
  showDebugGrid: boolean;
  setShowDebugGrid: (show: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Initialize with defaults (could load from localStorage here)
  const [language, setLanguage] = useState<Language>("en");
  const [highlightDuration, setHighlightDuration] = useState<HighlightDuration>(5000);
  const [showDebugGrid, setShowDebugGrid] = useState<boolean>(false);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      highlightDuration,
      setHighlightDuration,
      showDebugGrid,
      setShowDebugGrid,
    }),
    [language, highlightDuration, showDebugGrid],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
