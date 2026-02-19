import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface ContextCardProps {
  readonly title: string;
  readonly description: string;
  readonly className?: string;
}

export function ContextCard({ title, description, className }: ContextCardProps) {
  return (
    <div
      className={cn(
        "my-4 rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-4 backdrop-blur-sm animate-in zoom-in-95 duration-300",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-full bg-cyan-500/10 p-1">
          <Info className="h-3 w-3 text-cyan-400" />
        </div>
        <div>
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-200">
            World Update: {title}
          </h4>
          <p className="mt-1 text-sm text-cyan-100/70">{description}</p>
        </div>
      </div>
    </div>
  );
}
