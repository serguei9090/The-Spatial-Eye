"use client";

import type { StoryItem } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { Image as ImageIcon, Quote } from "lucide-react";

interface CreativeBoardProps {
  readonly stream: StoryItem[];
}

export function CreativeBoard({ stream }: CreativeBoardProps) {
  // Use storyStream-like filtering for consistency
  const content = stream.filter((item) => item.type === "text" || item.type === "image");
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-white/90 font-mono">
          <span className="mr-2 text-cyan-400">❖</span>CREATIVE BOARD
        </h2>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/50">
          {content.length} Elements
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <AnimatePresence initial={false}>
          {content.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <div className="mb-4 rounded-full bg-white/5 p-4">
                <Quote className="h-8 w-8 opacity-20" />
              </div>
              <p className="max-w-[200px] text-sm opacity-50">
                Start speaking to generate stories and visuals...
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {content.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  {item.type === "text" ? (
                    <div className="flex gap-3">
                      <Quote className="mt-1 h-5 w-5 shrink-0 text-cyan-400/50" />
                      <p className="leading-relaxed text-white/80 font-serif italic text-lg">
                        &ldquo;{item.content ?? ""}&rdquo;
                      </p>
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/50">
                      {/* Placeholder for actual image component */}
                      <div className="absolute inset-0 flex items-center justify-center text-white/20">
                        <ImageIcon className="h-12 w-12" />
                      </div>
                      {item.content && (
                        <img
                          src={item.content}
                          alt="Generated"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
