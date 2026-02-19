import { AudioTrigger } from "@/components/atoms/AudioTrigger";
import { MediaPlaceholder } from "@/components/atoms/MediaPlaceholder";
import { NarrativeText } from "@/components/atoms/NarrativeText";
import { ContextCard } from "@/components/molecules/ContextCard";
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
      className="mb-6 block"
    >
      {item.type === "text" && <NarrativeText text={item.content} />}

      {item.type === "image" && (
        <div className="my-4">
          {item.isGenerating ? (
            <MediaPlaceholder label={item.content} isLoading={true} />
          ) : (
            // Use a real image tag when generated
            <div className="overflow-hidden rounded-lg border border-white/10">
              <img
                src={item.content}
                alt="Story Visual"
                className="w-full object-cover aspect-video animate-in fade-in duration-700"
              />
            </div>
          )}
        </div>
      )}

      {item.type === "audio_event" && <AudioTrigger description={item.content} />}

      {item.type === "rule_event" && (
        <ContextCard title={item.content} description={String(item.metadata?.description || "")} />
      )}
    </motion.div>
  );
}
