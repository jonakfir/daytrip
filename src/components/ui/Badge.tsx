import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "terracotta" | "sage" | "neutral";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  terracotta: "bg-terracotta-500/10 text-terracotta-600",
  sage: "bg-sage-500/10 text-sage-700",
  neutral: "bg-charcoal-900/5 text-charcoal-800",
};

export function Badge({ variant = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-caption font-sans font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
