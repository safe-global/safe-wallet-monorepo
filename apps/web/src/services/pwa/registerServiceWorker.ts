import type {} from '@ducanh2912/next-pwa/workbox'
import { logger } from '@/services/observability'

let hasAttemptedRegistration = false

/**
 * Registers the PWA service worker ourselves instead of relying on next-pwa's
 * auto-register (disabled via `register: false` in `next.config.mjs`).
 *
 * next-pwa's own register script (workbox-window's `Workbox.register()`) reads
 * `.waiting` off, and later attaches an `updatefound` listener to, whatever
 * `navigator.serviceWorker.register()` resolved with — without checking it's
 * actually a usable `ServiceWorkerRegistration`. The production
 * `TypeError: l.fn.addEventListener is not a function` tells us that value was
 * *truthy* (an actually-`undefined` registration would throw ~70 lines
 * earlier, at the `.waiting` read, with "Cannot read properties of undefined
 * (reading 'waiting')" — a different error, never reaching the
 * `updatefound` line at all) but not a real registration — e.g. a stub some
 * in-app WebView's `register()` polyfill returns. Because `register()` is
 * `async`, that throw rejects the promise it returns; nothing catches it, so
 * it surfaces as an uncaught error. Registration can also reject outright
 * with an `AbortError` when `sw.js` is transiently unreachable (deploy-time
 * cache churn, offline first paint) — the same "uncaught rejection" shape.
 *
 * We call `window.workbox.register()` ourselves and catch any rejection —
 * covering both the WebView-stub `TypeError` and the `AbortError` — logging
 * it at `info` level since the failure is transient/one-off, not a
 * persistent fault. See WA-2949.
 */
export const registerServiceWorker = async (): Promise<void> => {
  if (hasAttemptedRegistration) return
  hasAttemptedRegistration = true

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  if (typeof window === 'undefined') return

  if (!window.workbox) {
    // Should be impossible whenever `serviceWorker` is supported: next-pwa's
    // injected script unconditionally assigns `window.workbox` in that case.
    // If this ever fires, something upstream (a next-pwa bump, a build
    // config change) silently stopped wiring it up — worth a real signal,
    // since the fallout is total (no SW registration for anyone), not the
    // narrow private-browsing/WebView case this module otherwise guards.
    logger.warn('Service worker registration skipped: window.workbox is unavailable')
    return
  }

  try {
    await window.workbox.register()
  } catch (error) {
    logger.info('Service worker registration failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Test-only: resets the idempotency guard between unit tests. Not part of
 * the module's runtime contract.
 */
export const __resetRegisterServiceWorkerForTests = (): void => {
  hasAttemptedRegistration = false
}
