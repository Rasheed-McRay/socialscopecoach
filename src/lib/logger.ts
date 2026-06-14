const dev = import.meta.env.DEV;

export const logger = {
  log: (...a: unknown[]) => {
    if (dev) console.log(...a);
  },
  info: (...a: unknown[]) => {
    if (dev) console.info(...a);
  },
  debug: (...a: unknown[]) => {
    if (dev) console.debug(...a);
  },
  warn: (...a: unknown[]) => {
    if (dev) console.warn(...a);
  },
  error: (...a: unknown[]) => {
    if (dev) console.error(...a);
  },
};
