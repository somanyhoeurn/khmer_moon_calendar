import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      default: "bg-surface-muted text-foreground",
      primary: "bg-primary text-primary-foreground",
      sage: "bg-sage text-forest",
      gold: "border border-gold/50 bg-gold-soft text-gold-text",
      holiday: "border border-holiday/30 bg-holiday-soft text-holiday",
      outline: "border border-border text-muted",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
