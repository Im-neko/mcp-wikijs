import { config } from '../config';

const LEVELS = ['debug', 'info', 'warn', 'error'] as const;
type Level = typeof LEVELS[number];

const currentLevelIndex = LEVELS.indexOf(config.logging.level);

// Joins the messages of a GraphQL `errors` payload. Tolerates payloads that are
// not the spec'd array of {message} objects so the real cause is never masked by
// a secondary TypeError (e.g. "Cannot read properties of undefined (reading 'map')").
export function formatGraphQLErrors(errors: unknown): string {
  const items = Array.isArray(errors) ? errors : [errors];
  const messages = items
    .map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && typeof (item as { message?: unknown }).message === 'string') {
        return (item as { message: string }).message;
      }
      return '';
    })
    .filter(message => message !== '');
  return messages.length > 0 ? messages.join(', ') : 'Unknown GraphQL error';
}

// Extracts a safe, user-facing message from an unknown thrown value.
// Never returns the raw error object: some errors here (e.g. from graphql-request)
// carry the outgoing request, which includes the WikiJS Authorization header.
// For graphql-request's ClientError the GraphQL error messages are returned instead of
// its Error.message, which embeds the whole request and response as JSON.
export function toErrorMessage(error: unknown, fallback: string): string {
  const graphQLErrors = (error as { response?: { errors?: unknown } } | null)?.response?.errors;
  if (graphQLErrors !== undefined && graphQLErrors !== null) {
    return formatGraphQLErrors(graphQLErrors);
  }
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
