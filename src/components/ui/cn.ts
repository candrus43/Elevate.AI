export type ClassValue = string | false | null | undefined;

/**
 * Tiny className combiner — filters falsy values and joins with spaces.
 * Kept dependency-free (no clsx/tailwind-merge needed for primitives).
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
