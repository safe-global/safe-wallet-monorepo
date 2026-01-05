import type { RefObject } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { getStoreInstance } from '@/store'
import {
  setLoaded,
  setSecondStep,
  setHasScheduled,
  reset,
  selectCalendlyIsLoaded,
  selectCalendlyIsSecondStep,
  selectCalendlyHasScheduled,
  selectCalendlyState,
} from '../store/calendlySlice'

const CALENDLY_SCRIPT_URL = 'https://assets.calendly.com/assets/external/widget.js'
const POLL_INTERVAL_MS = 100
const POLL_TIMEOUT_MS = 5000

/**
 * Allowed Calendly origins for postMessage validation.
 * Only messages from these origins are processed for security.
 */
const ALLOWED_HOSTS = ['calendly.com', 'www.calendly.com']

/**
 * Unified hook for managing Calendly widget integration.
 * Combines script loading, widget initialization, event tracking, and state management.
 *
 * Features:
 * - Loads and initializes Calendly inline widget script
 * - Tracks widget loading status via Redux
 * - Detects when user progresses to date/time selection (2nd step)
 * - Handles booking scheduled events with optional callback
 * - Manages cleanup and resource disposal
 *
 * @param widgetRef - Ref to the DOM element where the widget will be rendered
 * @param calendlyUrl - The Calendly URL to display
 * @param onBookingScheduled - Optional callback function called when a booking is scheduled
 * @returns Object containing widget state flags
 */
export const useCalendly = (
  widgetRef: RefObject<HTMLDivElement | null>,
  calendlyUrl: string,
  onBookingScheduled?: () => void,
) => {
  const dispatch = useAppDispatch()
  const isLoaded = useAppSelector(selectCalendlyIsLoaded)
  const isSecondStep = useAppSelector(selectCalendlyIsSecondStep)
  const hasScheduled = useAppSelector(selectCalendlyHasScheduled)

  // Track if callback has been called to prevent duplicate invocations
  const callbackCalledRef = useRef(false)

  /**
   * Validates that a message origin is from an allowed Calendly domain.
   * Security check to prevent processing messages from malicious origins.
   */
  const isValidOrigin = useCallback((origin: string): boolean => {
    try {
      const url = new URL(origin)
      return url.protocol === 'https:' && ALLOWED_HOSTS.includes(url.hostname)
    } catch {
      return false
    }
  }, [])

  /**
   * Handles all postMessage events from Calendly widget.
   * Processes different event types and updates Redux state accordingly.
   */
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (!isValidOrigin(event.origin)) {
        return
      }

      const eventType = event.data?.event

      if (!eventType || !eventType.startsWith('calendly.')) {
        return
      }

      // Get current state from store to avoid dependency on isLoaded
      const store = getStoreInstance()
      const currentState = selectCalendlyState(store.getState())

      // Any Calendly event confirms the widget is loaded
      if (!currentState.isLoaded) {
        dispatch(setLoaded(true))
      }

      // Detect when user progresses to date/time selection (2nd step)
      // Only dispatch if not already true to avoid unnecessary updates
      if (eventType === 'calendly.event_type_viewed' && !currentState.isSecondStep) {
        dispatch(setSecondStep(true))
      }

      // Handle booking scheduled event
      if (eventType === 'calendly.event_scheduled') {
        dispatch(setHasScheduled(true))

        // Call callback only once per booking
        if (!callbackCalledRef.current && onBookingScheduled) {
          callbackCalledRef.current = true
          onBookingScheduled()
        }
      }
    },
    [isValidOrigin, dispatch, onBookingScheduled],
  )

  /**
   * Initializes the Calendly inline widget.
   * Called when the script is loaded and the widget container is ready.
   */
  const initWidget = useCallback(() => {
    const element = widgetRef.current
    if (window.Calendly && element) {
      window.Calendly.initInlineWidget({
        url: calendlyUrl,
        parentElement: element,
      })
    }
  }, [widgetRef, calendlyUrl])

  /**
   * Main effect: Handles script loading, widget initialization, and event listeners.
   * Manages the complete lifecycle of the Calendly widget integration.
   */
  useEffect(() => {
    if (!widgetRef.current) return

    // Set up message listener for Calendly events
    window.addEventListener('message', handleMessage)

    // Resources that may need cleanup
    let checkInterval: ReturnType<typeof setInterval> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let calendlyScript: HTMLScriptElement | null = null

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="calendly"]')

    // If script and API are both ready, initialize immediately
    if (existingScript && window.Calendly) {
      initWidget()
      return () => {
        // Only cleanup event listener, don't reset state
        window.removeEventListener('message', handleMessage)
      }
    }

    // If script exists but API not ready, poll for availability
    if (existingScript) {
      timeoutId = setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval)
          // Log timeout for debugging. The script's onload can still initialize the widget later
          console.warn('Calendly API polling timeout: widget may still initialize via script onload event')
        }
      }, POLL_TIMEOUT_MS)

      checkInterval = setInterval(() => {
        if (window.Calendly && widgetRef.current) {
          initWidget()
          if (checkInterval) clearInterval(checkInterval)
          if (timeoutId) clearTimeout(timeoutId)
        }
      }, POLL_INTERVAL_MS)
    } else {
      // Load script if it doesn't exist
      calendlyScript = document.createElement('script')
      calendlyScript.type = 'text/javascript'
      calendlyScript.src = CALENDLY_SCRIPT_URL
      calendlyScript.async = true
      calendlyScript.onload = initWidget
      document.body.appendChild(calendlyScript)
    }

    // Cleanup: Remove event listeners
    // Don't reset state here - only reset on actual component unmount
    return () => {
      callbackCalledRef.current = false
      window.removeEventListener('message', handleMessage)
      if (checkInterval) clearInterval(checkInterval)
      if (timeoutId) clearTimeout(timeoutId)
      if (calendlyScript?.parentNode) {
        calendlyScript.parentNode.removeChild(calendlyScript)
      }
      // Note: We don't reset Redux state here because the effect may re-run
      // State will persist across re-renders, which is desired for isSecondStep
    }
  }, [calendlyUrl, widgetRef, handleMessage, initWidget, dispatch])

  // Separate effect to reset state only on actual component unmount
  useEffect(() => {
    return () => {
      // Only reset when component actually unmounts
      dispatch(reset())
    }
  }, [dispatch])

  return {
    /** Whether the Calendly widget is loaded and initialized */
    isLoaded,
    /** Whether the user has progressed to the 2nd step (date/time selection) */
    isSecondStep,
    /** Whether a booking has been scheduled */
    hasScheduled,
  }
}
