import pino from 'pino';

export type { Logger } from 'pino';

/**
 * Returns a named child logger scoped to the calling module.
 * The `browser` option makes pino use console.* so it works in CF Workers and Pages.
 */
export function createLogger(name: string, level = 'info') {
  return pino({ name, level, browser: { asObject: false } });
}

export const logger = createLogger('app');
