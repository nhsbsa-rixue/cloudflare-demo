import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with conflict resolution.
 * Combines clsx for conditional classes + twMerge to handle Tailwind specificity.
 * This is the standard shadcn-style utility used by all components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
