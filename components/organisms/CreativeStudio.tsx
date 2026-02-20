"use client";

import type { StoryItem } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { InterleavedPost } from "@/components/molecules/InterleavedPost";
import { VideoFeed } from "@/components/molecules/VideoFeed";

interface CreativeStudioProps {
  readonly stream: StoryItem[];
  readonly videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * Groups story items so that images appear BEFORE the text that follows them.
 *
 * The Gemini model writes text first, then calls render_visual. This means
 * in raw timestamp order the sequence is: [TEXT] → [IMAGE]. But CSS float
 * only wraps content that comes AFTER the floated element in the DOM.
 *
 * Solution: pair each image with the next text block following it, so the
 * final DOM order per group is: [IMAGE (float-right)] [TEXT (wraps it)].
 * Groups are only emitted when a title (story_segment) or a text block appears.
 */
function groupItems(
  items: StoryItem[],
): Array<{ image?: StoryItem; text?: StoryItem; raw?: StoryItem }> {
  const groups: Array<{ image?: StoryItem; text?: StoryItem; raw?: StoryItem }> = [];
  let pendingImage: StoryItem | undefined;

  for (const item of items) {
    if (item.type === "image") {
      // Hold the image — it will be paired with the next text block
      pendingImage = item;
    } else if (item.type === "text" && item.isStory) {
      // Narrative text: attach any pending image so it floats right into this text block
      groups.push({ image: pendingImage, text: item });
      pendingImage = undefined;
    } else {
      // title (story_segment), rule_event, audio_event — flush pending image first if any
      if (pendingImage) {
        groups.push({ raw: pendingImage });
        pendingImage = undefined;
      }
      groups.push({ raw: item });
    }
  }

  // Flush any trailing image with no following text
  if (pendingImage) {
    groups.push({ raw: pendingImage });
  }

  return groups;
}

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

  // Include ALL content types — titles first, then story text + images + events
  const storyContent = stream
    .filter(
      (item) =>
        item.type === "story_segment" ||
        (item.type === "text" && item.isStory) ||
        item.type === "image" ||
        item.type === "audio_event" ||
        item.type === "rule_event",
    )
    .sort((a, b) => {
      // Titles always sort before other content at the same timestamp
      if (a.type === "story_segment" && b.type !== "story_segment") return -1;
      if (b.type === "story_segment" && a.type !== "story_segment") return 1;
      return a.timestamp - b.timestamp;
    });

  const hasContent = storyContent.length > 0;
  const grouped = groupItems(storyContent);

  return (
    <div className="relative h-full w-full">
      {/* FLOATING VIDEO FEED - Small PIP style - Draggable */}
      <motion.div
        drag
        dragMomentum={false}
        className="absolute top-4 right-4 z-50 w-48 rounded-xl border border-white/20 bg-black/80 shadow-2xl backdrop-blur-md overflow-hidden aspect-video cursor-move touch-none"
      >
        <VideoFeed videoRef={videoRef} className="h-full w-full object-cover pointer-events-none" />
      </motion.div>

      <div className="flex h-full w-full items-center justify-center p-4">
        <AnimatePresence>
          {!hasContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white/20 pointer-events-none z-10"
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
                Awaiting Director&apos;s Greeting...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN STORY SCROLL */}
        <div
          ref={narrativeRef}
          className="h-full w-full max-w-3xl overflow-y-auto px-6 py-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
          <div className="flex flex-col gap-2 pb-20">
            {grouped.map((group, i) => (
              <InterleavedPost key={group.raw?.id ?? group.text?.id ?? `g-${i}`} group={group} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
