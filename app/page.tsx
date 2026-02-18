"use client";

import { useState } from "react";
import { SpatialLayout } from "@/components/templates/SpatialLayout";
import { StudioLayout } from "@/components/templates/StudioLayout";
import { ModeSelector, type AppMode } from "@/components/molecules/ModeSelector";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("live");

  return (
    <main className="relative min-h-screen w-full bg-background overflow-hidden">

      {/* Mode Switcher - Floating Top Center */}
      <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2">
        <ModeSelector mode={mode} onChange={setMode} />
      </div>

      {mode === "live" ? (
        <SpatialLayout />
      ) : (
        <StudioLayout />
      )}
    </main>
  );
}
