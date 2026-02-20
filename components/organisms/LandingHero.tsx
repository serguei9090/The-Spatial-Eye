"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Eye, Layout, Sparkles, Video } from "lucide-react";
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative flex flex-col items-center justify-center pt-32 pb-20 px-4 text-center">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md"
      >
        <Sparkles className="h-4 w-4" />
        <span>Gemini Live Agent Challenge 2026</span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6"
      >
        Your Digital World, <br />
        <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Through a New Lens
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10"
      >
        The Spatial Eye is a multimodal AI companion that sees what you see, hears what you hear,
        and acts on your digital intent in real-time using Gemini 2.5 Live.
      </motion.p>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link href="/studio">
          <Button
            size="lg"
            className="h-14 px-8 text-lg font-bold shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-primary/50 transition-all"
          >
            Enter the Studio
          </Button>
        </Link>
        <Link href="https://devpost.com/software/the-spatial-eye" target="_blank">
          <Button
            size="lg"
            variant="outline"
            className="h-14 px-8 text-lg font-semibold border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10"
          >
            View on Devpost
          </Button>
        </Link>
      </motion.div>

      {/* Stats/Badge area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-50"
      >
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          <span className="text-sm font-medium">Real-time Vision</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <span className="text-sm font-medium">Multimodal AI</span>
        </div>
        <div className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          <span className="text-sm font-medium">Atomic Design</span>
        </div>
      </motion.div>
    </section>
  );
}
