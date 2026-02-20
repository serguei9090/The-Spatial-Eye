import { AudioTrigger } from "@/components/atoms/AudioTrigger";
import { MediaPlaceholder } from "@/components/atoms/MediaPlaceholder";
import { NarrativeText } from "@/components/atoms/NarrativeText";
import type { StoryItem } from "@/lib/types";
import { motion } from "framer-motion";

interface InterleavedPostProps {
  readonly item: StoryItem;
}

export function InterleavedPost({ item }: InterleavedPostProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 block"
    >
      {item.type === "text" && <NarrativeText text={item.content} />}

      {item.type === "story_segment" && (
        <div className="my-12 flex flex-col items-center">
          <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
          <span className="mt-4 font-serif text-lg tracking-[0.2em] uppercase text-cyan-200">
            {item.content}
          </span>
          <div className="mt-4 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </div>
      )}

      {item.type === "image" && (
        <div className="my-8 flex flex-col items-center">
          <div className="relative w-full max-w-md overflow-hidden rounded-sm border-4 border-white/5 bg-black Shadow-2xl">
            {item.isGenerating ? (
              <MediaPlaceholder label={item.content} isLoading={true} />
            ) : (
              <img
                src={item.content}
                alt={String(item.metadata?.subject || "Story Visual")}
                className="w-full object-cover aspect-[4/5] animate-in fade-in duration-1000"
              />
            )}
          </div>
          {/* Caption */}
          {!item.isGenerating && item.metadata?.subject && (
            <p className="mt-3 font-serif italic text-white/50 text-sm text-center max-w-md">
              {String(item.metadata.subject)}
            </p>
          )}
        </div>
      )}

      {item.type === "audio_event" && <AudioTrigger description={item.content} />}

      {item.type === "rule_event" && (
        <div className="my-10 mx-auto max-w-md text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px w-8 bg-cyan-500/30" />
            <h4 className="font-serif font-bold text-cyan-400 uppercase tracking-widest text-[10px]">
              {item.content}
            </h4>
            <div className="h-px w-8 bg-cyan-500/30" />
          </div>
          <p className="font-serif italic text-cyan-100/70 text-base leading-relaxed">
            "{String(item.metadata?.description || "")}"
          </p>
          {item.metadata?.consequence && (
            <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-cyan-500/40 font-mono">
              The Law: {String(item.metadata.consequence)}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
