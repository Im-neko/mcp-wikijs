import { config } from '../config';

const LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type Level = typeof LEVELS[number];

const currentLevelIndex = LEVELS.indexOf(config.logging.level);

// Extracts a safe, user-facing message from an unknown thrown value.
// Never returns the raw error object: some errors here (e.g. from graphql-request)
// carry the outgoing request, which includes the WikiJS Authorization header.
export function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function log(level: Level, message: string, error?: unknown): void {
  if (LEVELS.indexOf(level) < currentLevelIndex) {
    return;
  }
  // MCP stdio reserves stdout for JSON-RPC; all logging must go to stderr.
  // console.error() always writes to stderr, regardless of level.
  if (error !== undefined) {
    console.error(`[${level}] ${message}`, toErrorMessage(error, String(error)));
  } else {
    console.error(`[${level}] ${message}`);
  }
}

export const logger = {
  debug: (message: string, error?: unknown) => log('debug', message, error),
  info: (message: string, error?: unknown) => log('info', message, error),
  warn: (message: string, error?: unknown) => log('warn', message, error),
  error: (message: string, error?: unknown) => log('error', message, error)
};

export default logger;
