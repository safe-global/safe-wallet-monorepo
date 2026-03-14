/**
 * Shim for @next/third-parties/google.
 * Injects the Google Analytics gtag.js script and provides sendGAEvent.
 *
 * Window.dataLayer and Window.gtag are already declared in src/definitions.d.ts.
 */
import { useEffect, type FC } from 'react'

interface GoogleAnalyticsProps {
  gaId: string
  debugMode?: boolean
}

export const GoogleAnalytics: FC<GoogleAnalyticsProps> = ({ gaId, debugMode = false }) => {
  useEffect(() => {
    if (!gaId || document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
      return
    }

    window.dataLayer = window.dataLayer || []
    window.gtag =
      window.gtag ||
      function gtag(...args: Parameters<NonNullable<Window['gtag']>>) {
        ;(window.dataLayer ?? (window.dataLayer = [])).push(args)
      }
    window.gtag('js', new Date())
    window.gtag('config', gaId, { debug_mode: debugMode })

    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    script.async = true
    document.head.appendChild(script)
  }, [gaId, debugMode])

  return null
}

export const sendGAEvent = (command: string, eventName: string, eventParams?: Record<string, unknown>): void => {
  window.gtag?.(command, eventName, eventParams)
}

export default { GoogleAnalytics, sendGAEvent }
