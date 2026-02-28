import type { Highlight } from "@/lib/types";

interface CoordinateDisplayProps {
  readonly highlight?: Highlight;
}

export function CoordinateDisplay({ highlight }: CoordinateDisplayProps) {
  if (!highlight) {
    return <p className="text-sm text-muted">No active detection.</p>;
  }

  return (
    <p className="font-mono text-xs text-muted-foreground">
      [{highlight.ymin}, {highlight.xmin}, {highlight.ymax}, {highlight.xmax}]
    </p>
  );
}
