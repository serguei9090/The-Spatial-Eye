import type { Metadata } from "next";

import { PremiumParticlesBackground } from "@/components/premium-particles-background";
import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "The Spatial Eye",
  description: "Realtime spatial visual assistant powered by Gemini Live API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <PremiumParticlesBackground />
      </body>
    </html>
  );
}
