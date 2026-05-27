import { setPrepareHeadersHook, setHandleResponseHook } from '@safe-global/store/gateway/cgwClient'
import { TURNSTILE_SITE_KEY } from '@safe-global/utils/config/constants'

export const sharedTokenRef: { current: string | null } = { current: null }

const widgetRefreshCallbackRef: { current: (() => void) | null } = { current: null }

export function registerWidgetRefreshCallback(callback: () => void) {
  widgetRefreshCallbackRef.current = callback
}

// Activation callback — registered by CaptchaProvider; called on the first protected request
const activateCaptchaRef: { current: (() => void) | null } = { current: null }
let captchaActivated = false

export function registerActivateCaptcha(callback: () => void) {
  activateCaptchaRef.current = callback
}

export function isCaptchaActivated(): boolean {
  return captchaActivated
}

// Only these endpoint patterns require a captcha token
const CAPTCHA_PROTECTED_ROUTES = [
  /\/v2\/owners\/[^/]+\/safes/,
  /\/v3\/owners\/[^/]+\/safes/,
  /\/v1\/chains\/[^/]+\/safes\/[^/]+\/positions\/[^/]+/,
  /\/v1\/portfolio\/[^/]+/,
]

export function isProtectedEndpoint(url: string): boolean {
  return CAPTCHA_PROTECTED_ROUTES.some((pattern) => pattern.test(url))
}

// Promise-based waiting for captcha readiness
// This allows HTTP requests to wait indefinitely until captcha is ready
let captchaReadyResolve: (() => void) | null = null
let captchaReadyPromise: Promise<void> | null = null

// Initialize the promise
function createCaptchaReadyPromise() {
  captchaReadyPromise = new Promise<void>((resolve) => {
    captchaReadyResolve = resolve
  })
}

// Call this when captcha is ready (token obtained or captcha disabled)
export function resolveCaptchaReady() {
  if (captchaReadyResolve) {
    captchaReadyResolve()
    captchaReadyResolve = null
  }
}

// Reset the promise (e.g., when token expires)
export function resetCaptchaPromise() {
  createCaptchaReadyPromise()
}

let initialized = false

// Serializes token consumption so concurrent protected requests each get a
// unique, fresh Turnstile token (tokens are single-use; reuse yields 401).
let consumeQueue: Promise<void> = Promise.resolve()

// Must be called once at app startup, before any CGW requests are made.
export function initializeCaptchaHeaders() {
  if (initialized) return
  initialized = true

  // Create initial promise
  createCaptchaReadyPromise()

  setPrepareHeadersHook(async (headers: Headers, url: string) => {
    // Non-owners URLs pass through immediately — no captcha needed
    if (!isProtectedEndpoint(url)) return headers

    // Captcha disabled (no site key) — pass through
    if (!TURNSTILE_SITE_KEY) return headers

    // First protected request: signal CaptchaProvider to load the Turnstile script + widget
    if (!captchaActivated) {
      captchaActivated = true
      activateCaptchaRef.current?.()
    }

    const prev = consumeQueue
    let release!: () => void
    consumeQueue = new Promise<void>((r) => {
      release = r
    })

    try {
      await prev

      // Lazy refresh: the previous request consumed the token and no new
      // challenge is currently in flight (captchaReadyResolve === null means
      // the ready promise has already resolved). Kick off a fresh challenge
      // now — but only if a widget is actually registered, otherwise we'd
      // arm a promise nothing can resolve.
      if (!sharedTokenRef.current && captchaReadyResolve === null && widgetRefreshCallbackRef.current) {
        resetCaptchaPromise()
        widgetRefreshCallbackRef.current()
      }

      // Block until the widget is initialized and a token is obtained
      if (captchaReadyPromise) {
        await captchaReadyPromise
      }

      const token = sharedTokenRef.current
      if (token) {
        headers.set('X-Captcha-Token', token)
        // Single-use: consume locally. The next hook invocation will lazily
        // trigger a fresh challenge if another protected request shows up.
        sharedTokenRef.current = null
      }

      return headers
    } finally {
      release()
    }
  })

  setHandleResponseHook(async (response: Response, url: string) => {
    // Only handle 401 responses
    if (response.status !== 401) return
    // Only captcha-protected endpoints can return captcha 401s
    if (!isProtectedEndpoint(url)) return
    // No widget registered means captcha is disabled — don't reset the promise or we'll deadlock
    if (!widgetRefreshCallbackRef.current) return

    try {
      const data = await response.clone().json()
      if (data?.message === 'Invalid CAPTCHA token') {
        // Clear the stale token only. The next protected request will lazily
        // trigger a fresh challenge via the rotation logic above — avoids
        // popping a modal when no retry is in flight.
        sharedTokenRef.current = null
      }
    } catch {
      // Ignore non-JSON or unreadable responses
    }
  })
}
