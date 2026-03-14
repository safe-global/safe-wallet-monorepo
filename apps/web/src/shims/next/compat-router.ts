/**
 * Shim for `next/compat/router` — re-exports useRouter from the main router shim.
 *
 * In Next.js the compat router returns `NextRouter | null`.
 * In our SPA the router is always available, so we return it directly.
 */
export { useRouter } from './router'
export type { NextRouter } from './router'
