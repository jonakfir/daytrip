"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children" | "className"> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "relative overflow-hidden bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 shadow-md",
  secondary:
    "border-2 border-terracotta-500 text-terracotta-500 hover:bg-terracotta-500/5 active:bg-terracotta-500/10",
  ghost:
    "text-charcoal-900 hover:bg-charcoal-900/5 active:bg-charcoal-900/10",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-1.5 text-body-sm rounded-lg",
  md: "px-6 py-2.5 text-body rounded-xl",
  lg: "px-8 py-3.5 text-body-lg rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className={cn(
          "inline-flex items-center justify-center font-sans font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {variant === "primary" && (
          <span className="pointer-events-none absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

Button.displayName = "Button";

export { Button };
export type { ButtonProps, Variant, Size };
