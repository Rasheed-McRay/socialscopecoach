## Goal
Silence the 62 `console.*` calls across `src/` in production builds, while keeping them in dev for debugging.

## Approach
Instead of wrapping every call site in `if (import.meta.env.DEV)` (noisy, error-prone, 22 files), add a single logger utility and replace all `console.log/info/debug/warn` with it. Keep raw `console.error` only inside `ErrorBoundary` (so React error reporting still surfaces if the user opens devtools).

### 1. New file: `src/lib/logger.ts`
```ts
const dev = import.meta.env.DEV;
export const logger = {
  log:   (...a: unknown[]) => { if (dev) console.log(...a); },
  info:  (...a: unknown[]) => { if (dev) console.info(...a); },
  debug: (...a: unknown[]) => { if (dev) console.debug(...a); },
  warn:  (...a: unknown[]) => { if (dev) console.warn(...a); },
  error: (...a: unknown[]) => { if (dev) console.error(...a); },
};
```

### 2. Codemod across 22 files
In every file currently using `console.log|info|debug|warn|error`:
- Add `import { logger } from "@/lib/logger";`
- Replace `console.log(` → `logger.log(`, same for `info/debug/warn/error`.

Exception: `src/components/ErrorBoundary.tsx` keeps its `console.error` (real uncaught-error reporting).

### 3. Verify
- Build passes
- `rg "console\." src` returns only the ErrorBoundary line + the logger file itself.

## Out of scope
- Edge functions (server-side logs are fine, useful for debugging in the function logs panel).
- `index.html` / vendor code.
