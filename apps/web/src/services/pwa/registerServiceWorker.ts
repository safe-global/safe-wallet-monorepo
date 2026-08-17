import type {} from '@ducanh2912/next-pwa/workbox'
import { logger } from '@/services/observability'

/**
 * Registers the PWA service worker ourselves instead of relying on next-pwa's
 * auto-register (disabled via `register: false` in `next.config.mjs`).
 *
 * next-pwa's own register script (workbox-window's `Workbox.register()`)
 * unconditionally attaches an `updatefound` listener to the resolved
 * registration, without checking that `navigator.serviceWorker.register()`
 * actually returned one. In private-browsing modes and some in-app WebViews
 * registration can resolve without a registration object, which throws a
 * `TypeError` there. Registration can also reject with an `AbortError` when
 * `sw.js` is transiently unreachable (deploy-time cache churn, offline first
 * paint). Both surface as uncaught errors when next-pwa registers
 * automatically.
 *
 * We guard both cases explicitly: bail out if the capability or the
 * registration itself is missing, and catch (rather than surface) a failed
 * registration, logging it at `info` level since the shape of the error
 * (transient, one-off) doesn't indicate a persistent fault. See WA-2949.
 */
export const registerServiceWorker = async (): Promise<void> => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  if (typeof window === 'undefined' || !window.workbox) return

  try {
    const registration = await window.workbox.register()

    if (!registration) return
  } catch (error) {
    logger.info('Service worker registration failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
