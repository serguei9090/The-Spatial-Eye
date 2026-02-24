"use client";

import { ParticleBackground } from "@/components/backgrounds/ParticleBackground";
import { FeatureCard } from "@/components/molecules/FeatureCard";
import { LandingHero } from "@/components/organisms/LandingHero";
import { AnimatePresence, motion } from "framer-motion";
import { Bug, ChevronDown, Cpu, Eye, Github, Share2, Terminal } from "lucide-react";
import { useRef, useState } from "react";

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
    title: "IT Architecture Studio",
    description:
      "Visual system design and documentation. The AI interprets complex technical diagrams and assists in building real-time architecture models with industry-standard patterns.",
    icon: Terminal,
    color: "#06b6d4",
    delay: 0.2,
    mode: "it-architecture",
  },
];

const ISSUES_SOLUTIONS = [
  {
    id: "ai-looping",
    title: "Action-Looping & Input Hallucination",
    issue:
      "The spatial AI would repeatedly trigger greetings or 'hallucinate' user input, causing infinite conversational loops and redundant tool invocations.",
    solution:
      "Re-architected the client-server bridge. The React frontend now acts purely as an ultra-low-latency A/V conduit, offloading all session orchestration, state management, and tool routing to a robust FastAPI Python backend.",
    icon: Bug,
    color: "#eab308",
  },
  {
    id: "tool-execution",
    title: "Ghost Highlights & Verbalized Coordinates",
    issue:
      "During spatial tracking, the agent successfully executed the `track_and_highlight` tool but would speak the raw bounding box coordinates aloud while the UI failed to render the visual.",
    solution:
      "Refined prompt engineering to enforce silent spatial tool execution. Bound backend coordinate payloads directly to Framer Motion components on the frontend canvas layer for surgical, seamless visual highlighting.",
    icon: Cpu,
    color: "#22c55e",
  },
];

interface IssueSolutionItem {
  id: string;
  title: string;
  issue: string;
  solution: string;
  icon: React.ElementType;
  color: string;
}

function AccordionItem({ item, idx }: { item: IssueSolutionItem; idx: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="border border-white/10 rounded-2xl bg-white/5 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10"
            style={{ color: item.color }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">{item.title}</h3>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 border-t border-white/5 mt-2 bg-black/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    The Issue
                  </h4>
                  <p className="text-white/80 leading-relaxed text-sm">{item.issue}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Our Solution
                  </h4>
                  <p className="text-white/80 leading-relaxed text-sm">{item.solution}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

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
              <Github className="h-5 w-5" />
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
              Explore the two core dimensions of The Spatial Eye, each leveraging Gemini&apos;s
              multimodal power in unique ways.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        {/* Issues & Solutions Section */}
        <section id="issues" className="py-24 border-t border-white/5">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Challenges & Architecture Decisions
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Building a real-time multimodal agent requires solving complex synchronization and
              state management challenges. Here's how we tackled them.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {ISSUES_SOLUTIONS.map((item, idx) => (
              <AccordionItem key={item.id} item={item} idx={idx} />
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
                  { label: "Google Cloud Run", detail: "Serverless backend orchestration" },
                  { label: "Firebase Auth", detail: "Secure Google Sign-In" },
                  { label: "Firebase Hosting", detail: "Managed CDN & Static Assets" },
                  { label: "Terraform", detail: "Automated IaC for reliability" },
                  { label: "Next.js 15", detail: "Cutting-edge frontend performance" },
                  { label: "shadcn/ui", detail: "Atomic design components" },
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
