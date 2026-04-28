/**
 * --- DEV-ONLY LOGGER ---
 * Wraps console methods so they only output in development builds.
 * In production (`npm run build`), all log/warn calls become no-ops.
 * Errors are always logged regardless of environment.
 */

const isDev = import.meta.env.DEV;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFn = (...args: any[]) => void;

const noop: LogFn = () => {};

export const logger = {
  log: isDev ? console.log.bind(console) : noop,
  warn: isDev ? console.warn.bind(console) : noop,
  error: console.error.bind(console), // Always log errors
  info: isDev ? console.info.bind(console) : noop,
};
