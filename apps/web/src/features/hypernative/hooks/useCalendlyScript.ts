import type { RefObject } from 'react'
import { useCallback, useEffect, useState } from 'react'

const CALENDLY_SCRIPT_URL = 'https://assets.calendly.com/assets/external/widget.js'
const POLL_INTERVAL_MS = 100
const POLL_TIMEOUT_MS = 5000

/**
 * Hook to load and initialize Calendly inline widget.
 * Handles script loading, polling for API availability, and cleanup.
 *
 * @param widgetRef - Ref to the DOM element where the widget will be rendered
 * @param calendlyUrl - The Calendly URL to display
 * @returns boolean indicating if the widget is loaded
 */
export const useCalendlyScript = (widgetRef: RefObject<HTMLDivElement | null>, calendlyUrl: string): boolean => {
  const [isLoaded, setIsLoaded] = useState(false)

  const isValidOrigin = useCallback((origin: string): boolean => {
    try {
      const url = new URL(origin)
      const allowedHosts = ['calendly.com', 'www.calendly.com']
      return url.protocol === 'https:' && allowedHosts.includes(url.hostname)
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    if (!widgetRef.current) return

    const handleMessage = (event: MessageEvent) => {
      if (!isValidOrigin(event.origin)) {
        return
      }

      // Listen for any Calendly event to confirm the widget is loaded
      if (event.data?.event && event.data.event.startsWith('calendly.')) {
        setIsLoaded(true)
      }
    }

    window.addEventListener('message', handleMessage)

    const initWidget = () => {
      const element = widgetRef.current
      if (window.Calendly && element) {
        window.Calendly.initInlineWidget({
          url: calendlyUrl,
          parentElement: element,
        })
      }
    }

    // Resources that may need cleanup
    let checkInterval: ReturnType<typeof setInterval> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let calendlyScript: HTMLScriptElement | null = null

    const existingScript = document.querySelector('script[src*="calendly"]')

    if (existingScript && window.Calendly) {
      initWidget()
      return () => {
        window.removeEventListener('message', handleMessage)
      }
    }

    if (existingScript) {
      // Script loaded but API not ready - wait:
      timeoutId = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval)
      }, POLL_TIMEOUT_MS)

      checkInterval = setInterval(() => {
        if (window.Calendly && widgetRef.current) {
          initWidget()
          if (checkInterval) clearInterval(checkInterval)
          if (timeoutId) clearTimeout(timeoutId)
        }
      }, POLL_INTERVAL_MS)
    } else {
      // Load script
      calendlyScript = document.createElement('script')
      calendlyScript.type = 'text/javascript'
      calendlyScript.src = CALENDLY_SCRIPT_URL
      calendlyScript.async = true
      calendlyScript.onload = initWidget
      document.body.appendChild(calendlyScript)
    }

    // Cleanup all resources
    return () => {
      setIsLoaded(false)
      window.removeEventListener('message', handleMessage)
      if (checkInterval) clearInterval(checkInterval)
      if (timeoutId) clearTimeout(timeoutId)
      if (calendlyScript?.parentNode) {
        calendlyScript.parentNode.removeChild(calendlyScript)
      }
    }
  }, [calendlyUrl, widgetRef, isValidOrigin])

  return isLoaded
}
