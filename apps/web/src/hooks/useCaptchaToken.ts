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

interface UseCaptchaTokenOptions {
  theme?: 'light' | 'dark' | 'auto'
  isScriptReady: boolean
}

interface UseCaptchaTokenReturn {
  token: string | null
  isLoading: boolean
  error: Error | null
  isModalOpen: boolean
  onWidgetContainerReady: (container: HTMLDivElement | null) => void
  refreshToken: () => void
}

export function useCaptchaToken({ theme = 'auto', isScriptReady }: UseCaptchaTokenOptions): UseCaptchaTokenReturn {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const widgetContainerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const hasRenderedRef = useRef<boolean>(false)
  const isMountedRef = useRef<boolean>(true)

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
            if (isMountedRef.current) setIsModalOpen(false)
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

  // Handle captcha disabled (no site key) - resolve immediately so requests can proceed
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      resolveCaptchaReady()
      setIsLoading(false)
    }
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
      isMountedRef.current = false
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // Ignore
        }
      }
      widgetIdRef.current = null
      widgetContainerRef.current = null
      hasRenderedRef.current = false
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
