import { setPrepareHeadersHook } from '@safe-global/store/gateway/cgwClient'

export const sharedTokenRef: { current: string | null } = { current: null }

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

// Must be called once at app startup, before any CGW requests are made.
export function initializeCaptchaHeaders() {
  if (initialized) return
  initialized = true

  // Create initial promise
  createCaptchaReadyPromise()

  setPrepareHeadersHook(async (headers: Headers) => {
    // Wait for captcha to be ready (no timeout - waits until resolved)
    if (captchaReadyPromise) {
      await captchaReadyPromise
    }

    const token = sharedTokenRef.current
    if (token) {
      headers.set('X-Captcha-Token', token)
    }

    return headers
  })
}
