import type { RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { getStoreInstance } from '@/store'
import {
  setLoaded,
  setSecondStep,
  setHasScheduled,
  setError,
  reset,
  selectCalendlyIsLoaded,
  selectCalendlyIsSecondStep,
  selectCalendlyHasScheduled,
  selectCalendlyHasError,
  selectCalendlyState,
} from '../store/calendlySlice'

const CALENDLY_SCRIPT_URL = 'https://assets.calendly.com/assets/external/widget.js'
const POLL_INTERVAL_MS = 100
const POLL_TIMEOUT_MS = 5000
const SCRIPT_LOAD_TIMEOUT_MS = 5000 // Timeout for script loading
const IFRAME_CHECK_INTERVAL_MS = 100
const IFRAME_CREATION_TIMEOUT_MS = 2000 // Timeout for iframe creation after widget init
const POST_LOAD_TIMEOUT_MS = 1000 // No Calendly postMessage events arrive within 1 second after iframe load

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
  const hasError = useAppSelector(selectCalendlyHasError)

  // Track if callback has been called to prevent duplicate invocations
  const callbackCalledRef = useRef(false)
  // Track load timeout to detect if widget fails to load
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track script load timeout
  const scriptLoadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Refresh key to force effect re-run on refresh
  const [refreshKey, setRefreshKey] = useState(0)

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
        dispatch(setError(false))
        // Clear load timeout since widget loaded successfully
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
          loadTimeoutRef.current = null
        }
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
   * Monitors iframe for load failures after initialization.
   * Strategy: Wait for iframe's `load` event, then check if Calendly postMessage arrived.
   * If no postMessage within timeout after load, it's an error (e.g., error page shown).
   */
  const monitorIframeLoad = useCallback(() => {
    const element = widgetRef.current
    if (!element) return

    // Store references to iframe and handlers for cleanup
    let iframeRef: HTMLIFrameElement | null = null
    let handleIframeLoad: (() => void) | null = null
    let handleIframeError: (() => void) | null = null

    // Poll for iframe creation (Calendly creates it async)
    let checkCount = 0
    const maxChecks = Math.ceil(IFRAME_CREATION_TIMEOUT_MS / IFRAME_CHECK_INTERVAL_MS)
    const checkForIframe = setInterval(() => {
      checkCount++
      const iframe = element.querySelector('iframe')

      if (iframe) {
        clearInterval(checkForIframe)
        iframeRef = iframe

        handleIframeLoad = () => {
          // Iframe finished loading - start short timeout for Calendly postMessage
          // If no postMessage arrives within timeout, the page likely failed
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current)
          }

          loadTimeoutRef.current = setTimeout(() => {
            const store = getStoreInstance()
            const currentState = selectCalendlyState(store.getState())
            // Only set error if widget hasn't loaded (no postMessage received)
            if (!currentState.isLoaded) {
              dispatch(setError(true))
            }
            loadTimeoutRef.current = null
          }, POST_LOAD_TIMEOUT_MS)
        }

        handleIframeError = () => {
          dispatch(setError(true))
          if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current)
            loadTimeoutRef.current = null
          }
        }

        iframe.addEventListener('load', handleIframeLoad)
        iframe.addEventListener('error', handleIframeError)
      } else if (checkCount >= maxChecks) {
        // Iframe never appeared within timeout - something went wrong
        clearInterval(checkForIframe)
        dispatch(setError(true))
      }
    }, IFRAME_CHECK_INTERVAL_MS)

    // Store cleanup function
    return () => {
      clearInterval(checkForIframe)
      // Remove event listeners if they were attached
      if (iframeRef && handleIframeLoad && handleIframeError) {
        iframeRef.removeEventListener('load', handleIframeLoad)
        iframeRef.removeEventListener('error', handleIframeError)
      }
    }
  }, [dispatch, widgetRef])

  /**
   * Initializes the Calendly inline widget.
   * Called when the script is loaded and the widget container is ready.
   * @returns Cleanup function for iframe monitoring, or undefined if initialization failed
   */
  const initWidget = useCallback(() => {
    const element = widgetRef.current
    if (window.Calendly && element) {
      try {
        window.Calendly.initInlineWidget({
          url: calendlyUrl,
          parentElement: element,
        })
        // Monitor iframe after initialization and return cleanup function
        return monitorIframeLoad()
      } catch (error) {
        console.error('Failed to initialize Calendly widget:', error)
        dispatch(setError(true))
        return undefined
      }
    }
    return undefined
  }, [widgetRef, calendlyUrl, monitorIframeLoad, dispatch])

  /**
   * Handles script load errors.
   */
  const handleScriptError = useCallback(() => {
    dispatch(setError(true))
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
      loadTimeoutRef.current = null
    }
    if (scriptLoadTimeoutRef.current) {
      clearTimeout(scriptLoadTimeoutRef.current)
      scriptLoadTimeoutRef.current = null
    }
  }, [dispatch])

  /**
   * Main effect: Handles script loading, widget initialization, and event listeners.
   * Manages the complete lifecycle of the Calendly widget integration.
   */
  useEffect(() => {
    if (!widgetRef.current) return

    // Reset error state when attempting to load
    dispatch(setError(false))

    // Set up message listener for Calendly events
    window.addEventListener('message', handleMessage)

    // Resources that may need cleanup
    let checkInterval: ReturnType<typeof setInterval> | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let calendlyScript: HTMLScriptElement | null = null
    let iframeMonitorCleanup: (() => void) | undefined = undefined

    // Helper to clean up previous iframe monitoring and set new one
    const setIframeMonitorCleanup = (newCleanup: (() => void) | undefined) => {
      // Clean up previous cleanup if it exists
      if (iframeMonitorCleanup) {
        iframeMonitorCleanup()
      }
      iframeMonitorCleanup = newCleanup
    }

    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="calendly"]')

    // If script and API are both ready, initialize immediately
    if (existingScript && window.Calendly) {
      setIframeMonitorCleanup(initWidget())
      return () => {
        // Only cleanup event listener, don't reset state
        window.removeEventListener('message', handleMessage)
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current)
          loadTimeoutRef.current = null
        }
        // Cleanup iframe monitoring
        if (iframeMonitorCleanup) {
          iframeMonitorCleanup()
        }
      }
    }

    // If script exists but API not ready, poll for availability
    if (existingScript) {
      timeoutId = setTimeout(() => {
        if (checkInterval) {
          clearInterval(checkInterval)
          const store = getStoreInstance()
          const currentState = selectCalendlyState(store.getState())
          if (!currentState.isLoaded) {
            dispatch(setError(true))
          }
        }
      }, POLL_TIMEOUT_MS)

      checkInterval = setInterval(() => {
        if (window.Calendly && widgetRef.current) {
          setIframeMonitorCleanup(initWidget())
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

      // Set up script load timeout for faster error detection
      scriptLoadTimeoutRef.current = setTimeout(() => {
        // Script didn't load within timeout - likely network/CORS error
        dispatch(setError(true))
        scriptLoadTimeoutRef.current = null
        // Remove script if it's still loading
        if (calendlyScript?.parentNode) {
          calendlyScript.parentNode.removeChild(calendlyScript)
        }
      }, SCRIPT_LOAD_TIMEOUT_MS)

      calendlyScript.onload = () => {
        // Clear timeout on successful load
        if (scriptLoadTimeoutRef.current) {
          clearTimeout(scriptLoadTimeoutRef.current)
          scriptLoadTimeoutRef.current = null
        }
        setIframeMonitorCleanup(initWidget())
      }
      calendlyScript.onerror = handleScriptError
      document.body.appendChild(calendlyScript)
    }

    // Cleanup: Remove event listeners
    // Don't reset state here - only reset on actual component unmount
    return () => {
      callbackCalledRef.current = false
      window.removeEventListener('message', handleMessage)
      if (checkInterval) clearInterval(checkInterval)
      if (timeoutId) clearTimeout(timeoutId)
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
      if (scriptLoadTimeoutRef.current) {
        clearTimeout(scriptLoadTimeoutRef.current)
        scriptLoadTimeoutRef.current = null
      }
      if (calendlyScript?.parentNode) {
        calendlyScript.parentNode.removeChild(calendlyScript)
      }
      // Cleanup iframe monitoring (removes event listeners)
      if (iframeMonitorCleanup) {
        iframeMonitorCleanup()
      }
      // Note: We don't reset Redux state here because the effect may re-run
      // State will persist across re-renders, which is desired for isSecondStep
    }
  }, [calendlyUrl, widgetRef, handleMessage, initWidget, dispatch, handleScriptError, refreshKey])

  // Separate effect to reset state only on actual component unmount
  useEffect(() => {
    return () => {
      // Only reset when component actually unmounts
      dispatch(reset())
    }
  }, [dispatch])

  /**
   * Refreshes the widget by resetting state and triggering reload.
   */
  const refresh = useCallback(() => {
    // Clear pending timeouts to prevent race conditions
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
      loadTimeoutRef.current = null
    }
    if (scriptLoadTimeoutRef.current) {
      clearTimeout(scriptLoadTimeoutRef.current)
      scriptLoadTimeoutRef.current = null
    }
    dispatch(reset())
    callbackCalledRef.current = false
    // Increment refresh key to force effect re-run
    setRefreshKey((prev) => prev + 1)
    // Clear widget container
    const widgetElement = widgetRef.current
    if (widgetElement) {
      widgetElement.innerHTML = ''
    }
    // Force re-initialization by removing existing script
    const existingScript = document.querySelector('script[src*="calendly"]')
    if (existingScript?.parentNode) {
      existingScript.parentNode.removeChild(existingScript)
    }
    // Clear window.Calendly to force reload
    if (window.Calendly) {
      delete (window as { Calendly?: unknown }).Calendly
    }
  }, [dispatch, widgetRef])

  return {
    /** Whether the Calendly widget is loaded and initialized */
    isLoaded,
    /** Whether the user has progressed to the 2nd step (date/time selection) */
    isSecondStep,
    /** Whether a booking has been scheduled */
    hasScheduled,
    /** Whether there was an error loading the widget */
    hasError,
    /** Function to refresh/retry loading the widget */
    refresh,
  }
}
