import { StudioLayout } from "@/components/templates/StudioLayout";
import { StudioProvider } from "@/lib/store/studio-context";
import { Suspense } from "react";

export default function StudioPage() {
  return (
    <main className="relative min-h-screen w-full bg-background overflow-hidden">
      <Suspense fallback={null}>
        <StudioProvider>
          <StudioLayout />
        </StudioProvider>
      </Suspense>
    </main>
  );
}
