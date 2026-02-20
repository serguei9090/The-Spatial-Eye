import { Badge as UIBadge, type badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: Readonly<BadgeProps>) {
  return <UIBadge className={cn(className)} variant={variant} {...props} />;
}
