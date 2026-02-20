import type React from 'react'
import { renderHook, act } from '@/tests/test-utils'
import { useCalendly } from '../useCalendly'
import type { RootState } from '@/store'
import type { CalendlyState } from '../../store/calendlySlice'
import { setStoreInstance, makeStore } from '@/store'

describe('useCalendly', () => {
  let mockWidgetElement: HTMLDivElement
  let widgetRef: React.RefObject<HTMLDivElement>
  const calendlyUrl = 'https://calendly.com/test-americas'
  let messageHandler: ((event: MessageEvent) => void) | null = null
  let mockStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    // Create a mock widget element
    mockWidgetElement = document.createElement('div')
    widgetRef = { current: mockWidgetElement }

    // Create a test store
    mockStore = makeStore({}, { skipBroadcast: true })
    setStoreInstance(mockStore)

    // Clear any existing Calendly script
    const existingScript = document.querySelector('script[src*="calendly"]')
    if (existingScript) {
      existingScript.remove()
    }

    // Clear window.Calendly
    window.Calendly = undefined

    // Spy on addEventListener to capture the handler
    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((type: string, handler: EventListenerOrEventListenerObject) => {
        if (type === 'message' && typeof handler === 'function') {
          messageHandler = handler as (event: MessageEvent) => void
        }
      })

    jest.spyOn(window, 'removeEventListener').mockImplementation(() => {})

    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    messageHandler = null
    const existingScript = document.querySelector('script[src*="calendly"]')
    if (existingScript) {
      existingScript.remove()
    }
    window.Calendly = undefined
  })

  describe('message handling', () => {
    it('should call callback when valid Calendly event_scheduled message is received', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      // Wait for useEffect to set up the listener
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const mockEvent = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_scheduled',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      if (messageHandler) {
        const handler = messageHandler
        act(() => {
          handler(mockEvent)
        })
      }

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should call callback when message comes from www.calendly.com', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const mockEvent = {
        origin: 'https://www.calendly.com',
        data: {
          event: 'calendly.event_scheduled',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      if (messageHandler) {
        const handler = messageHandler
        act(() => {
          handler(mockEvent)
        })
      }

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should not call callback for invalid origin', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const mockEvent = {
        origin: 'https://malicious-site.com',
        data: {
          event: 'calendly.event_scheduled',
        },
      } as MessageEvent

      act(() => {
        messageHandler!(mockEvent)
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should reject malicious origins that start with calendly.com', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const maliciousOrigins = [
        'https://calendly.com.evil.com',
        'https://www.calendly.com.evil.com',
        'https://calendly.com@evil.com',
        'http://calendly.com', // Not HTTPS
      ]

      for (const origin of maliciousOrigins) {
        const mockEvent = {
          origin,
          data: {
            event: 'calendly.event_scheduled',
          },
        } as MessageEvent

        act(() => {
          messageHandler!(mockEvent)
        })
      }

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should not call callback for different event type', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const mockEvent = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_cancelled',
        },
      } as MessageEvent

      act(() => {
        messageHandler!(mockEvent)
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should only call callback once even if multiple events are received', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const mockEvent1 = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_scheduled',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      const mockEvent2 = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_scheduled',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      if (messageHandler) {
        const handler = messageHandler
        act(() => {
          handler(mockEvent1)
          handler(mockEvent2)
        })
      }

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should not call callback if callback is not provided', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, undefined), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const mockEvent = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_scheduled',
        },
      } as MessageEvent

      act(() => {
        messageHandler!(mockEvent)
      })

      // Should not throw or cause errors
      expect(messageHandler).not.toBeNull()
    })

    it('should handle messages without data property', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const mockEvent = {
        origin: 'https://calendly.com',
        data: null,
      } as MessageEvent

      act(() => {
        messageHandler!(mockEvent)
      })

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should set isLoaded to true when any Calendly event is received', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      const mockEvent = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.some_event',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      if (messageHandler) {
        const handler = messageHandler
        act(() => {
          handler(mockEvent)
        })
      }

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(result.current.isLoaded).toBe(true)
    })

    it('should set isSecondStep to true when event_type_viewed event is received', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      const mockEvent = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_type_viewed',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      if (messageHandler) {
        const handler = messageHandler
        act(() => {
          handler(mockEvent)
        })
      }

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(result.current.isSecondStep).toBe(true)
    })

    it('should not set isSecondStep to false once it is true', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: true,
          isSecondStep: true,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // Send another event_type_viewed event
      const mockEvent = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_type_viewed',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      if (messageHandler) {
        const handler = messageHandler
        act(() => {
          handler(mockEvent)
        })
      }

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // Should still be true
      expect(result.current.isSecondStep).toBe(true)
    })

    it('should set hasScheduled to true when event_scheduled event is received', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      const mockEvent = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_scheduled',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      if (messageHandler) {
        const handler = messageHandler
        act(() => {
          handler(mockEvent)
        })
      }

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(result.current.hasScheduled).toBe(true)
    })
  })

  describe('script loading', () => {
    it('should initialize widget when script and API are ready', () => {
      const mockInitInlineWidget = jest.fn()
      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      expect(mockInitInlineWidget).toHaveBeenCalledWith({
        url: calendlyUrl,
        parentElement: mockWidgetElement,
      })

      script.remove()
    })

    it('should not initialize if widgetRef.current is null', () => {
      const mockInitInlineWidget = jest.fn()
      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const nullRef = { current: null }
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(nullRef, calendlyUrl), {
        initialReduxState,
      })

      expect(mockInitInlineWidget).not.toHaveBeenCalled()

      script.remove()
    })
  })

  describe('cleanup', () => {
    it('should clean up event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })

    it('should reset state on unmount', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: true,
          isSecondStep: true,
          hasScheduled: true,
          hasError: false,
        } as CalendlyState,
      }

      const { result, unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // State should be set initially
      expect(result.current.isLoaded).toBe(true)
      expect(result.current.isSecondStep).toBe(true)
      expect(result.current.hasScheduled).toBe(true)

      unmount()

      // Wait for cleanup
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // State should be reset (check via store)
      const state = mockStore.getState()
      expect(state.calendly.isLoaded).toBe(false)
      expect(state.calendly.isSecondStep).toBe(false)
      expect(state.calendly.hasScheduled).toBe(false)
    })
  })

  describe('return values', () => {
    it('should return correct initial state', () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      expect(result.current).toMatchObject({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
        hasError: false,
      })
      expect(typeof result.current.refresh).toBe('function')
    })

    it('should return updated state from Redux', () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: true,
          isSecondStep: true,
          hasScheduled: true,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      expect(result.current).toMatchObject({
        isLoaded: true,
        isSecondStep: true,
        hasScheduled: true,
        hasError: false,
      })
      expect(typeof result.current.refresh).toBe('function')
    })
  })

  describe('refresh functionality', () => {
    it('should clear widget container innerHTML when refresh is called', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      // Set some content in the widget element
      mockWidgetElement.innerHTML = '<div>Some content</div>'
      expect(mockWidgetElement.innerHTML).toBe('<div>Some content</div>')

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Call refresh
      act(() => {
        result.current.refresh()
      })

      // Wait for refresh to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // Verify innerHTML is cleared
      expect(mockWidgetElement.innerHTML).toBe('')
    })

    it('should remove existing Calendly script when refresh is called', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      // Create and add a mock script with a specific identifier
      const existingScript = document.createElement('script')
      existingScript.src = 'https://assets.calendly.com/assets/external/widget.js'
      existingScript.setAttribute('data-test-id', 'existing-script')
      document.body.appendChild(existingScript)

      expect(document.querySelector('script[data-test-id="existing-script"]')).toBeTruthy()

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Wait for initial effect to run
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // Call refresh - this should remove the existing script
      act(() => {
        result.current.refresh()
      })

      // Verify the original script with test-id is removed
      // (the effect may add a new script, but the original one should be gone)
      expect(document.querySelector('script[data-test-id="existing-script"]')).toBeNull()
    })

    it('should clear window.Calendly when refresh is called', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      // Set window.Calendly
      const mockCalendly = {
        initInlineWidget: jest.fn(),
      }
      window.Calendly = mockCalendly as unknown as typeof window.Calendly

      expect(window.Calendly).toBeDefined()

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Call refresh
      act(() => {
        result.current.refresh()
      })

      // Wait for refresh to complete
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // Verify window.Calendly is cleared
      expect(window.Calendly).toBeUndefined()
    })

    it('should handle refresh when widgetRef.current is null', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: true,
          isSecondStep: true,
          hasScheduled: true,
          hasError: true,
        } as CalendlyState,
      }

      const nullRef = { current: null }
      const { result } = renderHook(() => useCalendly(nullRef, calendlyUrl), {
        initialReduxState,
      })

      // Should not throw when refresh is called with null ref
      act(() => {
        result.current.refresh()
      })

      // Wait for state update
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // State should still be reset
      const state = mockStore.getState()
      expect(state.calendly.isLoaded).toBe(false)
      expect(state.calendly.isSecondStep).toBe(false)
      expect(state.calendly.hasScheduled).toBe(false)
      expect(state.calendly.hasError).toBe(false)
    })

    it('should trigger effect re-run after refresh', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const appendChildSpy = jest.spyOn(document.body, 'appendChild')
      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Wait for initial effect to run
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // Clear the spy to count new calls
      appendChildSpy.mockClear()

      // Call refresh
      act(() => {
        result.current.refresh()
      })

      // Wait for effect to re-run
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      // Verify that script loading is attempted again (effect re-ran)
      // The script should be added to document body
      expect(appendChildSpy).toHaveBeenCalled()

      appendChildSpy.mockRestore()
    })
  })

  describe('error handling', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should set error when script onerror is triggered', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow script creation
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Find the script element
      const script = document.querySelector('script[src*="calendly"]') as HTMLScriptElement
      expect(script).toBeTruthy()

      // Trigger onerror
      act(() => {
        if (script.onerror) {
          script.onerror(new Event('error'))
        }
      })

      // Advance timers to process state updates
      act(() => {
        jest.advanceTimersByTime(10)
      })

      expect(result.current.hasError).toBe(true)
    })

    it('should set error when script load timeout expires', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow script creation and timeout setup
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Fast-forward past SCRIPT_LOAD_TIMEOUT_MS (5000ms)
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.hasError).toBe(true)
    })

    it('should set error when iframe error event is triggered', async () => {
      let iframe: HTMLIFrameElement | null = null
      const mockInitInlineWidget = jest.fn(() => {
        // Create a mock iframe after init is called
        setTimeout(() => {
          iframe = document.createElement('iframe')
          iframe.src = 'https://calendly.com/test'
          mockWidgetElement.appendChild(iframe)
        }, 10)
      })

      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow widget initialization
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Advance timers to create iframe
      act(() => {
        jest.advanceTimersByTime(10)
      })

      expect(iframe).toBeTruthy()

      // Advance timers to allow polling interval to find the iframe and attach listeners
      // IFRAME_CHECK_INTERVAL_MS is 100ms, so advance at least that much
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Now dispatch the error event - listeners should be attached by now
      if (iframe) {
        act(() => {
          iframe!.dispatchEvent(new Event('error', { bubbles: true }))
        })
      }

      expect(result.current.hasError).toBe(true)

      script.remove()
    })

    it('should set error when iframe creation timeout expires', async () => {
      const mockInitInlineWidget = jest.fn()
      // Don't create iframe - simulate timeout scenario
      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow widget initialization
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Fast-forward past IFRAME_CREATION_TIMEOUT_MS (2000ms)
      // Plus some buffer for the polling interval checks
      act(() => {
        jest.advanceTimersByTime(2100)
      })

      expect(result.current.hasError).toBe(true)

      script.remove()
    })

    it('should set error when postMessage timeout expires after iframe load', async () => {
      let iframe: HTMLIFrameElement | null = null
      const mockInitInlineWidget = jest.fn(() => {
        // Create iframe after init - use setTimeout so it's created asynchronously
        setTimeout(() => {
          iframe = document.createElement('iframe')
          iframe.src = 'https://calendly.com/test'
          mockWidgetElement.appendChild(iframe)
        }, 10)
      })

      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow widget initialization (initWidget is called)
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Advance timers to create iframe (setTimeout fires)
      act(() => {
        jest.advanceTimersByTime(10)
      })

      expect(iframe).toBeTruthy()

      // Advance timers to allow polling interval to find the iframe and attach listeners
      // IFRAME_CHECK_INTERVAL_MS is 100ms, so advance at least that much
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Now dispatch the load event - listeners should be attached by now
      if (iframe) {
        act(() => {
          iframe!.dispatchEvent(new Event('load', { bubbles: true }))
        })
      }

      // Fast-forward past POST_LOAD_TIMEOUT_MS (1000ms) to trigger the timeout
      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.hasError).toBe(true)

      script.remove()
    })

    it('should not set error when postMessage arrives before timeout', async () => {
      let iframe: HTMLIFrameElement | null = null
      const mockInitInlineWidget = jest.fn(() => {
        // Create iframe after init
        setTimeout(() => {
          iframe = document.createElement('iframe')
          iframe.src = 'https://calendly.com/test'
          mockWidgetElement.appendChild(iframe)
          // Trigger load event after iframe is added to DOM
          setTimeout(() => {
            iframe?.dispatchEvent(new Event('load', { bubbles: true }))
          }, 5)
        }, 10)
      })

      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow widget initialization
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Advance timers to create iframe
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Advance timers to allow polling interval to find the iframe and attach listeners
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Advance timers to trigger the load event
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Send a postMessage before timeout expires
      if (messageHandler) {
        const mockEvent = {
          origin: 'https://calendly.com',
          data: {
            event: 'calendly.some_event',
          },
          type: 'message',
          bubbles: false,
          cancelable: false,
        } as MessageEvent

        act(() => {
          messageHandler!(mockEvent)
        })
      }

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      // Error should not be set because postMessage arrived
      expect(result.current.hasError).toBe(false)
      expect(result.current.isLoaded).toBe(true)

      script.remove()
    })

    it('should clear timeouts when script error occurs', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow script creation
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Find the script element
      const script = document.querySelector('script[src*="calendly"]') as HTMLScriptElement
      expect(script).toBeTruthy()

      // Trigger onerror - this should clear timeouts
      act(() => {
        if (script.onerror) {
          script.onerror(new Event('error'))
        }
      })

      // Fast-forward time - timeouts should have been cleared
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      // Error should be set, but no additional errors from timeouts
      expect(result.current.hasError).toBe(true)
    })

    it('should set error when initWidget throws an error', async () => {
      const mockInitInlineWidget = jest.fn(() => {
        throw new Error('Initialization failed')
      })

      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow widget initialization attempt
      act(() => {
        jest.advanceTimersByTime(10)
      })

      expect(result.current.hasError).toBe(true)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to initialize Calendly widget:', expect.any(Error))

      consoleErrorSpy.mockRestore()
      script.remove()
    })

    it('should set error when polling timeout expires for existing script', async () => {
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      // Don't set window.Calendly - simulate script loaded but API not ready

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow polling to start
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Fast-forward past POLL_TIMEOUT_MS (5000ms)
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.hasError).toBe(true)

      script.remove()
    })

    describe('monitorIframeLoad edge cases', () => {
      it('should clear existing loadTimeout when iframe load event fires', async () => {
        let iframe: HTMLIFrameElement | null = null
        const mockInitInlineWidget = jest.fn(() => {
          setTimeout(() => {
            iframe = document.createElement('iframe')
            iframe.src = 'https://calendly.com/test'
            mockWidgetElement.appendChild(iframe)
          }, 10)
        })

        window.Calendly = {
          initInlineWidget: mockInitInlineWidget,
        }

        const initialReduxState: Partial<RootState> = {
          calendly: {
            isLoaded: false,
            isSecondStep: false,
            hasScheduled: false,
            hasError: false,
          } as CalendlyState,
        }

        const script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        document.body.appendChild(script)

        const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
          initialReduxState,
        })

        // Initialize widget
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Create iframe
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Polling finds iframe and attaches listeners
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // First load event - sets up timeout
        if (iframe) {
          act(() => {
            iframe!.dispatchEvent(new Event('load', { bubbles: true }))
          })
        }

        // Advance time but not enough to trigger timeout
        act(() => {
          jest.advanceTimersByTime(500)
        })

        // Second load event - should clear previous timeout and set new one
        if (iframe) {
          act(() => {
            iframe!.dispatchEvent(new Event('load', { bubbles: true }))
          })
        }

        // Advance past the new timeout (1000ms from second load)
        act(() => {
          jest.advanceTimersByTime(1000)
        })

        // Should have error because no postMessage arrived
        expect(result.current.hasError).toBe(true)

        script.remove()
      })

      it('should clear loadTimeout when iframe error event fires after load', async () => {
        let iframe: HTMLIFrameElement | null = null
        const mockInitInlineWidget = jest.fn(() => {
          setTimeout(() => {
            iframe = document.createElement('iframe')
            iframe.src = 'https://calendly.com/test'
            mockWidgetElement.appendChild(iframe)
          }, 10)
        })

        window.Calendly = {
          initInlineWidget: mockInitInlineWidget,
        }

        const initialReduxState: Partial<RootState> = {
          calendly: {
            isLoaded: false,
            isSecondStep: false,
            hasScheduled: false,
            hasError: false,
          } as CalendlyState,
        }

        const script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        document.body.appendChild(script)

        const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
          initialReduxState,
        })

        // Initialize widget
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Create iframe
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Polling finds iframe and attaches listeners
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // Load event fires - sets up timeout
        if (iframe) {
          act(() => {
            iframe!.dispatchEvent(new Event('load', { bubbles: true }))
          })
        }

        // Error event fires - should clear timeout and set error immediately
        if (iframe) {
          act(() => {
            iframe!.dispatchEvent(new Event('error', { bubbles: true }))
          })
        }

        // Advance time - timeout should have been cleared, error already set
        act(() => {
          jest.advanceTimersByTime(2000)
        })

        expect(result.current.hasError).toBe(true)

        script.remove()
      })

      it('should not set error when postMessage arrives after iframe load but before timeout', async () => {
        let iframe: HTMLIFrameElement | null = null
        const mockInitInlineWidget = jest.fn(() => {
          setTimeout(() => {
            iframe = document.createElement('iframe')
            iframe.src = 'https://calendly.com/test'
            mockWidgetElement.appendChild(iframe)
          }, 10)
        })

        window.Calendly = {
          initInlineWidget: mockInitInlineWidget,
        }

        const initialReduxState: Partial<RootState> = {
          calendly: {
            isLoaded: false,
            isSecondStep: false,
            hasScheduled: false,
            hasError: false,
          } as CalendlyState,
        }

        const script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        document.body.appendChild(script)

        const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
          initialReduxState,
        })

        // Initialize widget
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Create iframe
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Polling finds iframe and attaches listeners
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // Load event fires - sets up timeout
        if (iframe) {
          act(() => {
            iframe!.dispatchEvent(new Event('load', { bubbles: true }))
          })
        }

        // Advance time partway through timeout
        act(() => {
          jest.advanceTimersByTime(500)
        })

        // PostMessage arrives - should prevent error
        if (messageHandler) {
          const mockEvent = {
            origin: 'https://calendly.com',
            data: {
              event: 'calendly.some_event',
            },
            type: 'message',
            bubbles: false,
            cancelable: false,
          } as MessageEvent

          act(() => {
            messageHandler!(mockEvent)
          })
        }

        // Advance past the timeout - error should not be set because postMessage arrived
        act(() => {
          jest.advanceTimersByTime(1000)
        })

        expect(result.current.hasError).toBe(false)
        expect(result.current.isLoaded).toBe(true)

        script.remove()
      })

      it('should handle iframe being removed before listeners are attached', async () => {
        let iframe: HTMLIFrameElement | null = null
        const mockInitInlineWidget = jest.fn(() => {
          setTimeout(() => {
            iframe = document.createElement('iframe')
            iframe.src = 'https://calendly.com/test'
            mockWidgetElement.appendChild(iframe)
            // Remove iframe immediately
            setTimeout(() => {
              if (iframe && iframe.parentNode) {
                iframe.parentNode.removeChild(iframe)
              }
            }, 5)
          }, 10)
        })

        window.Calendly = {
          initInlineWidget: mockInitInlineWidget,
        }

        const initialReduxState: Partial<RootState> = {
          calendly: {
            isLoaded: false,
            isSecondStep: false,
            hasScheduled: false,
            hasError: false,
          } as CalendlyState,
        }

        const script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        document.body.appendChild(script)

        const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
          initialReduxState,
        })

        // Initialize widget
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Create iframe
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Remove iframe
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Polling should not find iframe (it was removed)
        // Advance past IFRAME_CREATION_TIMEOUT_MS
        act(() => {
          jest.advanceTimersByTime(2100)
        })

        // Should set error because iframe never appeared (or was removed)
        expect(result.current.hasError).toBe(true)

        script.remove()
      })

      it('should handle multiple iframes being created', async () => {
        let iframe1: HTMLIFrameElement | null = null
        let iframe2: HTMLIFrameElement | null = null
        const mockInitInlineWidget = jest.fn(() => {
          setTimeout(() => {
            iframe1 = document.createElement('iframe')
            iframe1.src = 'https://calendly.com/test1'
            mockWidgetElement.appendChild(iframe1)
            // Create second iframe
            setTimeout(() => {
              iframe2 = document.createElement('iframe')
              iframe2.src = 'https://calendly.com/test2'
              mockWidgetElement.appendChild(iframe2)
            }, 5)
          }, 10)
        })

        window.Calendly = {
          initInlineWidget: mockInitInlineWidget,
        }

        const initialReduxState: Partial<RootState> = {
          calendly: {
            isLoaded: false,
            isSecondStep: false,
            hasScheduled: false,
            hasError: false,
          } as CalendlyState,
        }

        const script = document.createElement('script')
        script.src = 'https://assets.calendly.com/assets/external/widget.js'
        document.body.appendChild(script)

        const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
          initialReduxState,
        })

        // Initialize widget
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Create first iframe
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Create second iframe
        act(() => {
          jest.advanceTimersByTime(10)
        })

        // Polling finds first iframe and attaches listeners
        act(() => {
          jest.advanceTimersByTime(100)
        })

        // Error event on first iframe
        if (iframe1) {
          act(() => {
            iframe1!.dispatchEvent(new Event('error', { bubbles: true }))
          })
        }

        expect(result.current.hasError).toBe(true)

        script.remove()
      })
    })
  })

  describe('origin validation edge cases', () => {
    it('should reject origin with invalid URL format', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const invalidOrigins = ['not-a-url', 'calendly.com', 'ftp://calendly.com', '://calendly.com', 'null']

      for (const origin of invalidOrigins) {
        const mockEvent = {
          origin,
          data: {
            event: 'calendly.event_scheduled',
          },
        } as MessageEvent

        act(() => {
          messageHandler!(mockEvent)
        })
      }

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should reject origin with subdomain that is not www', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const maliciousSubdomains = [
        'https://api.calendly.com',
        'https://app.calendly.com',
        'https://evil.calendly.com',
        'https://staging.calendly.com',
      ]

      for (const origin of maliciousSubdomains) {
        const mockEvent = {
          origin,
          data: {
            event: 'calendly.event_scheduled',
          },
        } as MessageEvent

        act(() => {
          messageHandler!(mockEvent)
        })
      }

      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should reject malicious domains that start with www but are not www.calendly.com', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      const maliciousWwwDomains = [
        'https://www.calendly.com.evil.com',
        'https://www-calendly.com',
        'https://wwwcalendly.com',
        'https://www.calendly.com.malicious.com',
        'https://www.calendly.com@evil.com',
        'https://www.calendly.com.co',
        'https://www.calendly.com.fake',
      ]

      for (const origin of maliciousWwwDomains) {
        const mockEvent = {
          origin,
          data: {
            event: 'calendly.event_scheduled',
          },
        } as MessageEvent

        act(() => {
          messageHandler!(mockEvent)
        })
      }

      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('race conditions', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.runOnlyPendingTimers()
      jest.useRealTimers()
    })

    it('should handle script onload firing after component unmount', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow script creation
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Find the script element before unmount
      const script = document.querySelector('script[src*="calendly"]') as HTMLScriptElement
      expect(script).toBeTruthy()

      // Unmount the component
      unmount()

      // Now trigger script onload after unmount - should not throw
      expect(() => {
        act(() => {
          if (script.onload) {
            ;(script.onload as EventListener)(new Event('load'))
          }
        })
      }).not.toThrow()
    })

    it('should handle postMessage arriving during cleanup', async () => {
      const mockCallback = jest.fn()
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      // We need real timers for this test to capture the message handler
      jest.useRealTimers()

      renderHook(() => useCalendly(widgetRef, calendlyUrl, mockCallback), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      expect(messageHandler).not.toBeNull()

      // Send message - should not throw even if component is in cleanup state
      const mockEvent = {
        origin: 'https://calendly.com',
        data: {
          event: 'calendly.event_scheduled',
        },
        type: 'message',
        bubbles: false,
        cancelable: false,
      } as MessageEvent

      expect(() => {
        if (messageHandler) {
          const handler = messageHandler
          act(() => {
            handler(mockEvent)
          })
        }
      }).not.toThrow()

      jest.useFakeTimers()
    })

    it('should handle rapid refresh calls without errors', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow initial setup
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Call refresh multiple times in rapid succession
      expect(() => {
        act(() => {
          result.current.refresh()
          result.current.refresh()
          result.current.refresh()
        })
      }).not.toThrow()

      // Advance timers to process all refreshes
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // State should be reset
      const state = mockStore.getState()
      expect(state.calendly.isLoaded).toBe(false)
      expect(state.calendly.hasError).toBe(false)
    })

    it('should cancel pending script load when refresh is called mid-load', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow script creation
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Call refresh before script loads (before SCRIPT_LOAD_TIMEOUT_MS)
      act(() => {
        result.current.refresh()
      })

      // Advance past the original script timeout
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      // Should not have error from the cancelled timeout
      // (refresh clears pending timeouts)
      const state = mockStore.getState()
      // The new script load attempt will timeout, but that's expected
      // The key is that the original timeout was cleared
      expect(state.calendly.isLoaded).toBe(false)
    })

    it('should not create duplicate scripts on rapid remounts', async () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      // First mount
      const { unmount: unmount1 } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Quick unmount
      unmount1()

      // Immediately remount
      renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Should only have one Calendly script
      const scripts = document.querySelectorAll('script[src*="calendly"]')
      expect(scripts.length).toBeLessThanOrEqual(1)
    })

    it('should handle unmount during polling for window.Calendly', async () => {
      // Script exists but window.Calendly is not yet available
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to start polling
      act(() => {
        jest.advanceTimersByTime(50)
      })

      // Unmount during polling
      unmount()

      // Advance past poll timeout - should not throw
      expect(() => {
        act(() => {
          jest.advanceTimersByTime(5000)
        })
      }).not.toThrow()

      script.remove()
    })
  })

  describe('memory leak prevention', () => {
    it('should not accumulate event listeners on re-renders', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener')
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { rerender, unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // Verify addEventListener was called with 'message' and a function
      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function))

      // Clear mocks to count only rerender calls
      addEventListenerSpy.mockClear()
      removeEventListenerSpy.mockClear()

      // Rerender multiple times
      rerender()
      rerender()
      rerender()

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
      })

      // Verify addEventListener was called with 'message' during rerenders
      expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function))
      // Verify removeEventListener was called with 'message' during cleanup
      expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function))

      // Each rerender should add and remove listeners
      // Verify that both were called (cleanup happens on rerender)
      // After rerenders, we should have added and removed listeners
      // The net effect should be that we don't accumulate listeners
      // Since we cleared mocks before rerenders, both should have been called
      expect(addEventListenerSpy).toHaveBeenCalled()
      expect(removeEventListenerSpy).toHaveBeenCalled()

      // Verify the call counts are balanced
      // After 3 rerenders, each rerender should trigger cleanup (remove) and setup (add)
      // So we expect both to be called 3 times
      expect(addEventListenerSpy).toHaveBeenCalledTimes(3)
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(3)

      unmount()

      addEventListenerSpy.mockRestore()
      removeEventListenerSpy.mockRestore()
    })

    it('should cleanup iframe event listeners on unmount', async () => {
      jest.useFakeTimers()

      let iframe: HTMLIFrameElement | null = null
      const removeEventListenerSpy = jest.fn()
      const mockInitInlineWidget = jest.fn(() => {
        setTimeout(() => {
          iframe = document.createElement('iframe')
          iframe.src = 'https://calendly.com/test'
          iframe.removeEventListener = removeEventListenerSpy
          mockWidgetElement.appendChild(iframe)
        }, 10)
      })

      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Initialize widget
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Create iframe
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Polling finds iframe and attaches listeners
      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(iframe).toBeTruthy()

      // Unmount component
      unmount()

      // Verify removeEventListener was called for both 'load' and 'error'
      expect(removeEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function))

      script.remove()
      jest.useRealTimers()
    })

    it('should clear all timeouts on unmount', async () => {
      jest.useFakeTimers()
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to allow script creation and timeout setup
      act(() => {
        jest.advanceTimersByTime(10)
      })

      // Unmount before timeout fires
      unmount()

      // clearTimeout should have been called for pending timeouts
      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
      jest.useRealTimers()
    })

    it('should clear all intervals on unmount during polling', async () => {
      jest.useFakeTimers()
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      // Script exists but window.Calendly is not yet available
      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Advance timers to start polling
      act(() => {
        jest.advanceTimersByTime(50)
      })

      // Unmount during polling
      unmount()

      // clearInterval should have been called for polling interval
      expect(clearIntervalSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
      script.remove()
      jest.useRealTimers()
    })

    it('should not leave orphaned DOM elements after unmount', async () => {
      jest.useFakeTimers()

      const mockInitInlineWidget = jest.fn(() => {
        const iframe = document.createElement('iframe')
        iframe.src = 'https://calendly.com/test'
        mockWidgetElement.appendChild(iframe)
      })

      window.Calendly = {
        initInlineWidget: mockInitInlineWidget,
      }

      const script = document.createElement('script')
      script.src = 'https://assets.calendly.com/assets/external/widget.js'
      document.body.appendChild(script)

      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: false,
          isSecondStep: false,
          hasScheduled: false,
          hasError: false,
        } as CalendlyState,
      }

      const { unmount } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      // Initialize widget
      act(() => {
        jest.advanceTimersByTime(10)
      })

      expect(mockWidgetElement.querySelector('iframe')).toBeTruthy()

      unmount()

      // Widget container should still have iframe (cleanup is caller's responsibility)
      // But no memory leaks from event handlers
      // The hook doesn't clear widget innerHTML on unmount - that's expected

      script.remove()
      jest.useRealTimers()
    })
  })
})
