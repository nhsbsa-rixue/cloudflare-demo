import { cubicOut } from 'svelte/easing';

/**
 * Standard "rise" entrance transition params shared across pages.
 * Use with `in:fly={rise(delay)}`.
 */
export const rise = (delay: number) => ({ y: 16, duration: 600, delay, easing: cubicOut });
