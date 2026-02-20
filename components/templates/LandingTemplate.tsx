"use client";

import { ParticleBackground } from "@/components/backgrounds/ParticleBackground";
import { FeatureCard } from "@/components/molecules/FeatureCard";
import { LandingHero } from "@/components/organisms/LandingHero";
import { motion } from "framer-motion";
import { BookOpen, Eye, GithubIcon, Share2, Terminal } from "lucide-react";

const FEATURES = [
  {
    title: "Spatial Assistant",
    description:
      "Real-time object detection and spatial awareness. The AI identifies your environment, tracks objects, and provides context-aware assistance through high-speed video processing.",
    icon: Eye,
    color: "#3b82f6",
    delay: 0.1,
    mode: "spatial",
  },
  {
    title: "Creative Storyteller",
    description:
      "Multimodal narrative generation with interleaved output. The AI weaves together live narration, generated imagery, and soundscapes based on your current physical surroundings.",
    icon: BookOpen,
    color: "#d946ef",
    delay: 0.2,
    mode: "storyteller",
  },
  {
    title: "IT Architecture Studio",
    description:
      "Visual system design and documentation. The AI interprets complex technical diagrams and assists in building real-time architecture models with industry-standard patterns.",
    icon: Terminal,
    color: "#06b6d4",
    delay: 0.3,
    mode: "it-architecture",
  },
];

export function LandingTemplate() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white">
      <ParticleBackground />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="h-6 w-6 rounded-full bg-primary" />
            THE SPATIAL EYE
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground mr-10">
            <a href="#features" className="hover:text-white transition-colors">
              Project Modules
            </a>
            <a href="#tech" className="hover:text-white transition-colors">
              Technology Stack
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About Hakentoch
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/your-repo"
              target="_blank"
              className="p-2 rounded-full hover:bg-white/5 transition-colors"
              rel="noreferrer"
            >
              <GithubIcon className="h-5 w-5" />
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6">
        <LandingHero />

        {/* Features Grid */}
        <section id="features" className="py-24">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Unified Intelligence</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore the three core dimensions of The Spatial Eye, each leveraging Gemini's
              multimodal power in unique ways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        {/* Technical Section */}
        <section id="tech" className="py-24 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 italic italic-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Powering the Future <br /> on Google Cloud
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Built for the{" "}
                <span className="text-white font-semibold">Gemini Live Agent Challenge</span>, our
                infrastructure leverages high-performance Google Cloud services to ensure sub-second
                latency and global scalability.
              </p>

              <ul className="space-y-4">
                {[
                  { label: "Gemini 2.5 Live", detail: "Low-latency WebSocket interaction" },
                  { label: "Cloud Run", detail: "Serverless containerized backend" },
                  { label: "Terraform/Pulumi", detail: "Automated IaC for reliability" },
                  { label: "Next.js 15", detail: "Cutting-edge frontend performance" },
                  { label: "React 19", detail: "Component-based UI architecture" },
                  { label: "shadcn/ui", detail: "Beautifully designed atomic components" },
                  { label: "Antigravity IDE", detail: "Advanced agentic development" },
                ].map((item, idx) => (
                  <motion.li
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                    <span className="font-bold text-white/90">{item.label}:</span>
                    <span className="text-muted-foreground">{item.detail}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              whileHover={{ rotateY: 10, rotateX: 5 }}
              className="relative aspect-square rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 to-transparent p-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://www.gstatic.com/lamda/images/gemini_wordmark_604x164.png')] bg-center bg-no-repeat bg-contain opacity-20 filter invert" />
              <div className="flex h-full w-full items-center justify-center rounded-[calc(1.5rem-2px)] bg-black/80 backdrop-blur-xl">
                <Share2 className="h-24 w-24 text-primary/30" />
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 mt-24">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-sm text-muted-foreground">
            © 2026 The Spatial Eye Team. Google Cloud Next 2026 Submission.
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="https://devpost.com"
              className="hover:text-primary transition-colors italic"
            >
              Devpost
            </Link>
            <Link
              href="https://cloud.google.com"
              className="hover:text-primary transition-colors italic"
            >
              GCP
            </Link>
            <Link href="https://ai.google" className="hover:text-primary transition-colors italic">
              Google AI
            </Link>
            <Link
              href="https://github.com/google-deepmind/antigravity"
              className="hover:text-primary transition-colors italic"
              title="Built with Antigravity AI"
            >
              Antigravity IDE
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Link({
  href,
  children,
  className,
  title,
}: { href: string; children: React.ReactNode; className?: string; title?: string }) {
  return (
    <a href={href} target="_blank" className={className} rel="noreferrer" title={title}>
      {children}
    </a>
  );
}
