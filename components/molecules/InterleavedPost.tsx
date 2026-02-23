import { AudioTrigger } from "@/components/atoms/AudioTrigger";
import { MediaPlaceholder } from "@/components/atoms/MediaPlaceholder";
import { NarrativeText } from "@/components/atoms/NarrativeText";
import type { StoryItem } from "@/lib/types";
import { motion } from "framer-motion";

interface GroupProps {
  /** A pending image to float inside this text block */
  image?: StoryItem;
  /** The narrative text block. Image (if any) will float right of this. */
  text?: StoryItem;
  /** Non-text, non-image standalone items (titles, rules, audio) */
  raw?: StoryItem;
  /** Sequential story number (1-based), derived from how many segment_story calls precede this */
  storyIndex?: number;
}

interface InterleavedPostProps {
  readonly group: GroupProps;
}

function ImageCard({ item }: { readonly item: StoryItem }) {
  return (
    <div className="float-right ml-6 mb-4 w-[40%] min-w-[200px] max-w-[360px]">
      <div className="relative w-full overflow-hidden rounded-md border border-white/10 bg-black/50 shadow-2xl">
        {item.isGenerating ? (
          <div className="aspect-[4/3] w-full">
            <MediaPlaceholder label={item.content} isLoading={true} />
          </div>
        ) : (
          <img
            src={item.content}
            alt={String(item.metadata?.subject || "Story Visual")}
            className="w-full object-cover aspect-[4/3] animate-in fade-in duration-1000"
          />
        )}
      </div>
      {!item.isGenerating && item.metadata?.subject && (
        <p className="mt-2 text-center font-serif text-xs italic text-white/40">
          {String(item.metadata.subject)}
        </p>
      )}
    </div>
  );
}

export function InterleavedPost({ group }: InterleavedPostProps) {
  const { image, text, raw, storyIndex } = group;

  // ── Paired text + image (Wikipedia-style float) ──────────────────────────
  if (text) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 block overflow-hidden"
      >
        {/* Image renders first in DOM so float-right wraps the following text */}
        {image && <ImageCard item={image} />}
        <NarrativeText text={text.content} />
        {/* clearfix so next element isn't affected by the float */}
        <div className="clear-both" />
      </motion.div>
    );
  }

  // ── Standalone items (titles, rules, audio, orphaned images) ─────────────
  const item = raw;
  if (!item) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 block"
    >
      {item.type === "story_segment" && (
        <div className="my-14 flex flex-col items-center gap-4">
          {/* Top ornament */}
          <div className="flex w-full items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-cyan-500/60" />
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rotate-45 bg-cyan-400/60" />
              <div className="h-1.5 w-1.5 rotate-45 bg-cyan-400/80" />
              <div className="h-1 w-1 rotate-45 bg-cyan-400/60" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-cyan-500/30 to-cyan-500/60" />
          </div>

          {/* Story number badge + title */}
          <div className="flex flex-col items-center gap-2">
            {storyIndex !== undefined && (
              <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-cyan-500/50">
                Story {storyIndex}
              </span>
            )}
            {item.isPlaceholder ? (
              // Shimmer state while the real title is in transit
              <motion.span
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="font-mono text-sm tracking-[0.4em] text-cyan-400/50"
              >
                ···
              </motion.span>
            ) : (
              <span className="font-serif text-xl tracking-[0.18em] uppercase text-cyan-100/90 text-center px-4">
                {item.content}
              </span>
            )}
          </div>

          {/* Bottom ornament (mirrored) */}
          <div className="flex w-full items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-cyan-500/60" />
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rotate-45 bg-cyan-400/60" />
              <div className="h-1.5 w-1.5 rotate-45 bg-cyan-400/80" />
              <div className="h-1 w-1 rotate-45 bg-cyan-400/60" />
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-cyan-500/30 to-cyan-500/60" />
          </div>
        </div>
      )}

      {item.type === "image" && (
        // Orphaned image (no following text) — display centered
        <div className="my-6 flex justify-center">
          <div className="w-1/2 min-w-[240px] max-w-[400px]">
            <ImageCard item={item} />
            <div className="clear-both" />
          </div>
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
            &ldquo;{String(item.metadata?.description || "")}&rdquo;
          </p>
          {item.metadata?.consequence && (
            <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-cyan-500/40 font-mono">
              The Law: {String(item.metadata.consequence)}
            </p>
          )}
        </div>
      )}

      {item.type === "director_prompt" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="my-14 mx-auto max-w-sm text-center"
        >
          {/* Closing flourish line */}
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/40" />
            <span className="font-mono text-[10px] tracking-[0.5em] text-amber-400/70 uppercase">
              ✦ The End ✦
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/40" />
          </div>

          {/* Director's invitation */}
          <div className="rounded-xl border border-white/8 bg-white/3 px-6 py-5 backdrop-blur-sm">
            <p className="font-serif italic text-white/60 text-sm leading-relaxed">
              {item.content}
            </p>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/40">
              — The Director
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
