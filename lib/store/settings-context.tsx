"use client";

import { AI_VISION } from "@/lib/constants";
import { type Language, translations } from "@/lib/i18n/translations";
import type React from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type HighlightDuration = 3000 | 5000 | 10000 | "always";
export type HighlightType = "circle" | "rounded-rect" | "fitted-circle";

interface SettingsContextType {
  // Language Settings
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)["en"];

  // Highlight Settings
  highlightDuration: HighlightDuration;
  setHighlightDuration: (duration: HighlightDuration) => void;
  highlightType: HighlightType;
  setHighlightType: (type: HighlightType) => void;

  // Debug Settings
  showDebugGrid: boolean;
  setShowDebugGrid: (show: boolean) => void;
  isDiagnosticsEnabled: boolean;

  // View Settings
  showTranscript: boolean;
  setShowTranscript: (show: boolean) => void;

  // Connection Settings
  byokKey: string;
  setByokKey: (key: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const IS_DIAGNOSTICS = AI_VISION.SPATIAL_DIAGNOSTICS;

export function SettingsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [language, setLanguage] = useState<Language>("en");
  const [highlightDuration, setHighlightDuration] = useState<HighlightDuration>(5000);
  // Production default: clean "circle". Debug default: "fitted-circle" (shows tight bbox).
  const [highlightType, setHighlightType] = useState<HighlightType>(
    IS_DIAGNOSTICS ? "fitted-circle" : "circle",
  );
  // Grid is only on by default when diagnostics are enabled
  const [showDebugGrid, setShowDebugGrid] = useState<boolean>(IS_DIAGNOSTICS);

  // Transcript is off by default
  const [showTranscript, setShowTranscript] = useState<boolean>(false);

  // AI Connection Settings (API Key starts empty. If empty, the backend proxy uses its private GOOGLE_API_KEY)
  const [byokKey, setByokKey] = useState<string>("");

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
      highlightDuration,
      setHighlightDuration,
      highlightType,
      setHighlightType,
      showDebugGrid,
      setShowDebugGrid,
      isDiagnosticsEnabled: IS_DIAGNOSTICS,
      showTranscript,
      setShowTranscript,
      byokKey,
      setByokKey,
    }),
    [language, highlightDuration, highlightType, showDebugGrid, showTranscript, byokKey],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
}
