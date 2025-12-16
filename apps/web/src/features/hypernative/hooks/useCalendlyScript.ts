import type { RefObject } from 'react'
import { useEffect } from 'react'

const CALENDLY_SCRIPT_URL = 'https://assets.calendly.com/assets/external/widget.js'
const POLL_INTERVAL_MS = 100
const POLL_TIMEOUT_MS = 5000

/**
 * Hook to load and initialize Calendly inline widget.
 * Handles script loading, polling for API availability, and cleanup.
 *
 * @param widgetRef - Ref to the DOM element where the widget will be rendered
 * @param calendlyUrl - The Calendly URL to display
 */
export const useCalendlyScript = (widgetRef: RefObject<HTMLDivElement | null>, calendlyUrl: string): void => {
  useEffect(() => {
    if (!widgetRef.current) return

    const initWidget = () => {
      const element = widgetRef.current
      if (window.Calendly && element) {
        window.Calendly.initInlineWidget({
          url: calendlyUrl,
          parentElement: element,
        })
      }
    }

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="calendly"]')

    if (existingScript) {
      if (window.Calendly) {
        initWidget()
        return
      }

      // Poll for Calendly API to be available
      let checkInterval: ReturnType<typeof setInterval> | null = null
      const timeoutId = setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval)
        }
      }, POLL_TIMEOUT_MS)

      checkInterval = setInterval(() => {
        if (window.Calendly && widgetRef.current) {
          initWidget()
          if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
          }
          clearTimeout(timeoutId)
        }
      }, POLL_INTERVAL_MS)

      return () => {
        if (checkInterval) clearInterval(checkInterval)
        clearTimeout(timeoutId)
      }
    }

    // Load script first, then initialize
    const calendlyScript = document.createElement('script')
    calendlyScript.type = 'text/javascript'
    calendlyScript.src = CALENDLY_SCRIPT_URL
    calendlyScript.async = true
    calendlyScript.onload = initWidget

    document.body.appendChild(calendlyScript)

    return () => {
      // Cleanup: remove script if component unmounts before load completes
      if (calendlyScript.parentNode) {
        calendlyScript.parentNode.removeChild(calendlyScript)
      }
    }
  }, [calendlyUrl, widgetRef])
}
