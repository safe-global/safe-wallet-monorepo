import { useState, useEffect, useCallback, useRef } from 'react'
import { sharedTokenRef, resolveCaptchaReady, resetCaptchaPromise } from './captchaHeadersInit'
import { TURNSTILE_SITE_KEY } from '@safe-global/utils/config/constants'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
          appearance?: 'always' | 'execute' | 'interaction-only'
          callback?: (token: string) => void
          'error-callback'?: (error: string) => void
          'expired-callback'?: () => void
          'before-interactive-callback'?: () => void
          'after-interactive-callback'?: () => void
        },
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

/**
 * Waits for window.turnstile to be available after script load.
 * Polls every 100ms for up to 5 seconds.
 */
function waitForTurnstile(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve()
      return
    }

    let attempts = 0
    const checkInterval = setInterval(() => {
      attempts++
      if (window.turnstile) {
        clearInterval(checkInterval)
        resolve()
      } else if (attempts >= 50) {
        clearInterval(checkInterval)
        reject(new Error('Turnstile failed to initialize'))
      }
    }, 100)
  })
}

/**
 * Loads the Turnstile script if not already present.
 */
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve()
  }

  const existingScript = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')
  if (existingScript) {
    return waitForTurnstile()
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => waitForTurnstile().then(resolve).catch(reject)
    script.onerror = () => reject(new Error('Failed to load Turnstile script'))
    ;(document.head || document.body).appendChild(script)
  })
}

interface UseCaptchaTokenOptions {
  theme?: 'light' | 'dark' | 'auto'
}

interface UseCaptchaTokenReturn {
  token: string | null
  isLoading: boolean
  error: Error | null
  isModalOpen: boolean
  onWidgetContainerReady: (container: HTMLDivElement | null) => void
  refreshToken: () => void
}

export function useCaptchaToken(options: UseCaptchaTokenOptions = {}): UseCaptchaTokenReturn {
  const { theme = 'auto' } = options
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScriptReady, setIsScriptReady] = useState(false)

  const widgetContainerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const hasRenderedRef = useRef<boolean>(false)

  // Ref to access the latest theme value inside callbacks (avoids stale closures)
  const themeRef = useRef(theme)
  themeRef.current = theme

  const refreshToken = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !window.turnstile || !widgetIdRef.current) return

    try {
      window.turnstile.reset(widgetIdRef.current)
      setIsLoading(true)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset Turnstile'))
    }
  }, [])

  // Render widget when script is ready and container is available
  const renderWidget = useCallback(() => {
    const container = widgetContainerRef.current
    if (!container || !window.turnstile || hasRenderedRef.current) return

    try {
      const widgetId = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY!,
        theme: themeRef.current,
        size: 'normal',
        // Only show widget when user interaction is required
        appearance: 'interaction-only',
        callback: (token: string) => {
          sharedTokenRef.current = token
          resolveCaptchaReady()
          setToken(token)
          setIsLoading(false)
          setError(null)

          // Close modal after successful verification (if it was open)
          setTimeout(() => {
            setIsModalOpen(false)
          }, 500)
        },
        'error-callback': (error: string) => {
          sharedTokenRef.current = null
          resolveCaptchaReady()
          setError(new Error(error))
          setIsLoading(false)
          setToken(null)
        },
        'expired-callback': () => {
          sharedTokenRef.current = null
          resetCaptchaPromise()
          setToken(null)
          refreshToken()
        },
        // Show modal only when interaction is required
        'before-interactive-callback': () => {
          setIsModalOpen(true)
        },
        'after-interactive-callback': () => {
          // Modal will be closed by the success callback
        },
      })

      widgetIdRef.current = widgetId
      hasRenderedRef.current = true
    } catch (err) {
      resolveCaptchaReady()
      setError(err instanceof Error ? err : new Error('Failed to initialize Turnstile'))
      setIsLoading(false)
    }
  }, [refreshToken])

  // Callback ref - called when container is mounted
  const onWidgetContainerReady = useCallback(
    (container: HTMLDivElement | null) => {
      widgetContainerRef.current = container
      if (container && isScriptReady) {
        renderWidget()
      }
    },
    [isScriptReady, renderWidget],
  )

  // Load script
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      // Captcha disabled - resolve immediately so requests can proceed
      resolveCaptchaReady()
      setIsLoading(false)
      return
    }

    const loadScript = async () => {
      try {
        await loadTurnstileScript()
        setIsScriptReady(true)
      } catch (err) {
        resolveCaptchaReady()
        setError(err instanceof Error ? err : new Error('Failed to load Turnstile'))
        setIsLoading(false)
      }
    }

    loadScript()
  }, [])

  // Render widget when script becomes ready (if container already mounted)
  useEffect(() => {
    if (isScriptReady && widgetContainerRef.current) {
      renderWidget()
    }
  }, [isScriptReady, renderWidget])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Ignore
        }
      }
    }
  }, [])

  return {
    token,
    isLoading,
    error,
    isModalOpen,
    onWidgetContainerReady,
    refreshToken,
  }
}
