import { StudioLayout } from "@/components/templates/StudioLayout";
import { SettingsProvider } from "@/lib/store/settings-context";

export default function Home() {
  return (
    <SettingsProvider>
      <main className="relative min-h-screen w-full bg-background overflow-hidden">
        <StudioLayout />
      </main>
    </SettingsProvider>
  );
}
