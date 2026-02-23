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

interface GroupEntry {
  image?: StoryItem;
  text?: StoryItem;
  raw?: StoryItem;
  /** 1-based story number — set only on story_segment entries */
  storyIndex?: number;
}

function processTurn(turnItems: StoryItem[]): GroupEntry[] {
  const finalGroups: GroupEntry[] = [];

  // Within a single turn (invocationId), enforce a strict logical order
  // regardless of slight timestamp variances from the network.
  const typeRank = (t: StoryItem["type"]) => {
    switch (t) {
      case "story_segment":
        return 0;
      case "audio_event":
        return 1;
      case "rule_event":
        return 2;
      case "image":
        return 3;
      case "text":
        return 4;
      case "director_prompt":
        return 5;
      default:
        return 6;
    }
  };

  const sorted = [...turnItems].sort((a, b) => {
    const rankDiff = typeRank(a.type) - typeRank(b.type);
    if (rankDiff !== 0) return rankDiff;
    // Fallback to chronological if same type
    return a.timestamp - b.timestamp;
  });

  let pendingImage: StoryItem | undefined;

  for (const item of sorted) {
    if (item.type === "image") {
      pendingImage = item;
    } else if (item.type === "text" && item.isStory) {
      finalGroups.push({ image: pendingImage, text: item });
      pendingImage = undefined; // Consumed by text
    } else {
      if (pendingImage && typeRank(item.type) > typeRank("image")) {
        // If we hit a director prompt or non-story text, flush the pending image early
        finalGroups.push({ raw: pendingImage });
        pendingImage = undefined;
      }
      finalGroups.push({ raw: item });
    }
  }

  if (pendingImage) {
    finalGroups.push({ raw: pendingImage });
  }

  return finalGroups;
}

function groupItems(items: StoryItem[]): GroupEntry[] {
  // 1. Group items by turn (invocationId)
  const groupedByTurn: Map<string, StoryItem[]> = new Map();
  const ungrouped: StoryItem[] = [];

  for (const item of items) {
    if (item.invocationId) {
      const g = groupedByTurn.get(item.invocationId) || [];
      g.push(item);
      groupedByTurn.set(item.invocationId, g);
    } else {
      ungrouped.push(item);
    }
  }

  // 2. Sort turns chronologically based on their earliest item
  const sortedTurnIds = Array.from(groupedByTurn.entries()).sort((a, b) => {
    const minA = Math.min(...a[1].map((i) => i.timestamp));
    const minB = Math.min(...b[1].map((i) => i.timestamp));
    return minA - minB;
  });

  // 3. Process each turn in order
  const finalGroups: GroupEntry[] = [];
  for (const [_, turnItems] of sortedTurnIds) {
    finalGroups.push(...processTurn(turnItems));
  }

  // 4. Append ungrouped items at the very end (if any)
  for (const item of ungrouped) {
    finalGroups.push({ raw: item });
  }

  // 5. Assign exactly one unique storyIndex to each story_segment
  let segmentCount = 0;
  for (const group of finalGroups) {
    if (group.raw?.type === "story_segment") {
      segmentCount += 1;
      group.storyIndex = segmentCount;
    }
  }

  return finalGroups;
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

  const storyContent = stream.filter(
    (item) =>
      item.type === "story_segment" ||
      (item.type === "text" && item.isStory) ||
      item.type === "image" ||
      item.type === "audio_event" ||
      item.type === "rule_event",
  );

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
