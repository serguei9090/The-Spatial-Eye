import { cn } from "@/lib/utils";

interface NarrativeTextProps {
  readonly text: string;
  readonly className?: string;
  readonly isStreaming?: boolean;
}

export function NarrativeText({ text, className, isStreaming }: NarrativeTextProps) {
  return (
    <p className={cn("leading-relaxed text-white/90 font-serif italic text-lg", className)}>
      &ldquo;{text}&rdquo;
      {isStreaming && <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-cyan-400/50" />}
    </p>
  );
}
