"use client";

import { AudioTrigger } from "@/components/atoms/AudioTrigger";
import { NarrativeText } from "@/components/atoms/NarrativeText";
import type { StoryItem } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ImageIcon, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { useEffect, useRef } from "react";

interface CreativeStudioProps {
  readonly stream: StoryItem[];
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
}

const SPARKLE_IDS = Array.from({ length: 12 }, (_, i) => `sparkle-id-${i}`);

/**
 * Particle Effect Component for "Magic" appearance
 */
function SparkleEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {SPARKLE_IDS.map((id, i) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, scale: 0, x: "50%", y: "50%" }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0.5],
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: i % 2 === 0 ? Number.POSITIVE_INFINITY : 0,
            delay: Math.random() * 1,
            ease: "easeInOut",
          }}
          className="absolute h-1 w-1 bg-cyan-400 rounded-full blur-[1px]"
        />
      ))}
    </div>
  );
}

import { InterleavedPost } from "@/components/molecules/InterleavedPost";
import { VideoFeed } from "@/components/molecules/VideoFeed";

export function CreativeStudio({ stream, videoRef }: CreativeStudioProps) {
  const narrativeRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Trigger scroll on stream update
  useEffect(() => {
    if (narrativeRef.current) {
      narrativeRef.current.scrollTo({
        top: narrativeRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [stream.length]);

  // Filter relevant content (Narrative Text + Images)
  const storyContent = stream
    .filter(
      (item) =>
        (item.type === "text" && item.isStory) ||
        item.type === "image" ||
        item.type === "audio_event" ||
        item.type === "rule_event",
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const hasContent = storyContent.length > 0;

  return (
    <div className="relative h-full w-full">
      {/* FLOATING VIDEO FEED - Small PIP style */}
      <div className="absolute top-4 right-4 z-50 w-48 rounded-xl border border-white/20 bg-black/80 shadow-2xl backdrop-blur-md overflow-hidden aspect-video">
        <VideoFeed videoRef={videoRef} className="h-full w-full object-cover" />
      </div>

      <div className="flex h-full w-full items-center justify-center p-4">
        <AnimatePresence>
          {!hasContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-white/20"
            >
              <div className="relative">
                <Sparkles className="h-10 w-10 animate-pulse" />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute inset-0 bg-cyan-500 rounded-full blur-xl"
                />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em]">
                Awaiting Director's Greeting...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN STORY SCROLL - Centered, Readable Width */}
        <div
          ref={narrativeRef}
          className="h-full w-full max-w-3xl overflow-y-auto px-6 py-12 scrollbar-none"
        >
          <div className="flex flex-col gap-2 pb-20">
            {storyContent.map((item) => (
              <InterleavedPost key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
