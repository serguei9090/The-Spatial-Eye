import { InterleavedPost } from "@/components/molecules/InterleavedPost";
import type { StoryItem } from "@/lib/types";
import { Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

interface StoryOrchestratorProps {
  readonly stream: StoryItem[];
}

export function StoryOrchestrator({ stream }: StoryOrchestratorProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on stream update
  // biome-ignore lint/correctness/useExhaustiveDependencies: Scroll on new content
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [stream]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/5 bg-black/20 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <h2 className="font-mono text-sm font-bold tracking-wider text-white/80">
            STORY ORCHESTRATOR
          </h2>
        </div>
        <div className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40 font-mono">
          {stream.length} EVENTS
        </div>
      </div>

      {/* Stream */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {stream.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="rounded-full bg-white/5 p-4 mb-3">
              <Sparkles className="h-6 w-6 text-white/20" />
            </div>
            <p className="text-white/30 text-sm font-mono max-w-[200px]">
              The Director is waiting for your input...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {stream.map((item) => (
              <InterleavedPost key={item.id} group={{ raw: item }} />
            ))}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
}
