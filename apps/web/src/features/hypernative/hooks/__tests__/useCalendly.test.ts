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
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      expect(result.current).toEqual({
        isLoaded: false,
        isSecondStep: false,
        hasScheduled: false,
      })
    })

    it('should return updated state from Redux', () => {
      const initialReduxState: Partial<RootState> = {
        calendly: {
          isLoaded: true,
          isSecondStep: true,
          hasScheduled: true,
        } as CalendlyState,
      }

      const { result } = renderHook(() => useCalendly(widgetRef, calendlyUrl), {
        initialReduxState,
      })

      expect(result.current).toEqual({
        isLoaded: true,
        isSecondStep: true,
        hasScheduled: true,
      })
    })
  })
})
