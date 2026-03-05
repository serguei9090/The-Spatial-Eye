import { cn } from "@/lib/utils";
import { Image as ImageIcon, Loader2 } from "lucide-react";

interface MediaPlaceholderProps {
  readonly label: string;
  readonly isLoading?: boolean;
  readonly className?: string;
}

export function MediaPlaceholder({ label, isLoading, className }: MediaPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-lg bg-black/40 border border-white/10 group",
        className,
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-3">
        {isLoading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            <span className="text-xs uppercase tracking-widest animate-pulse text-cyan-400/80">
              Generating Visual
            </span>
          </>
        ) : (
          <ImageIcon className="h-12 w-12 opacity-20 group-hover:opacity-30 transition-opacity" />
        )}
        <p className="text-xs max-w-[80%] text-center opacity-60 font-mono text-white/60">
          {label}
        </p>
      </div>

      {/* Scanline effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent bg-[length:100%_200%] animate-scan" />
      )}
    </div>
  );
}
