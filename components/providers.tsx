"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/auth-context";
import { useGlobalErrorHandler } from "@/lib/hooks/useGlobalErrorHandler";
import { AudioDeviceProvider } from "@/lib/store/audio-context";

interface ProvidersProps {
  readonly children: ReactNode;
}

/**
 * Mounts once inside the provider tree — no rendered output.
 * Attaches window.onerror and unhandledrejection listeners.
 */
function GlobalErrorListener() {
  useGlobalErrorHandler();
  return null;
}

import { SettingsProvider } from "@/lib/store/settings-context";

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SettingsProvider>
        <AuthProvider>
          <AudioDeviceProvider>
            <GlobalErrorListener />
            <TooltipProvider>
              {children}
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </AudioDeviceProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
