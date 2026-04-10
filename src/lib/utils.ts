/**
 * Tiny className combiner — filters falsy and joins with spaces.
 * Avoids the clsx dependency for a 5-line utility we use everywhere.
 */
export function cn(
  ...args: (string | undefined | null | false | 0)[]
): string {
  return args.filter(Boolean).join(" ");
}
