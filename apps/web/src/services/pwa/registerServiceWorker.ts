import type {} from '@ducanh2912/next-pwa/workbox'
import { logger } from '@/services/observability'

let hasAttemptedRegistration = false

/**
 * Registers the PWA service worker ourselves; next-pwa's auto-register is off
 * (`register: false` in `next.config.mjs`) because workbox-window neither
 * validates what `register()` resolved with (in-app WebViews return a stub with
 * no `addEventListener`) nor catches a rejection (`AbortError` when `sw.js` is
 * briefly unreachable) — both surfaced as uncaught errors. See WA-2949.
 */
export const registerServiceWorker = async (): Promise<void> => {
  if (hasAttemptedRegistration) return
  hasAttemptedRegistration = true

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  if (typeof window === 'undefined') return

  if (!window.workbox) {
    // next-pwa always assigns `window.workbox` when `serviceWorker` is supported,
    // so reaching this means SW registration silently broke for every user.
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

/** Test-only: resets the idempotency guard between unit tests. */
export const __resetRegisterServiceWorkerForTests = (): void => {
  hasAttemptedRegistration = false
}
