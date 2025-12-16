import { renderHook, act } from '@/tests/test-utils'
import { useCalendlyEventScheduled } from '../useCalendlyEventScheduled'

describe('useCalendlyEventScheduled', () => {
  let mockCallback: jest.Mock
  let messageHandler: ((event: MessageEvent) => void) | null = null

  beforeEach(() => {
    mockCallback = jest.fn()
    jest.clearAllMocks()
    messageHandler = null

    // Spy on addEventListener to capture the handler
    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((type: string, handler: (event: MessageEvent) => void) => {
        if (type === 'message') {
          messageHandler = handler as (event: MessageEvent) => void
        }
      })
  })

  afterEach(() => {
    jest.restoreAllMocks()
    messageHandler = null
  })

  it('should call callback when valid Calendly event_scheduled message is received', async () => {
    renderHook(() => useCalendlyEventScheduled(mockCallback))

    // Wait for useEffect to set up the listener
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })

    expect(messageHandler).not.toBeNull()

    // Create a proper MessageEvent-like object
    const mockEvent = {
      origin: 'https://calendly.com',
      data: {
        event: 'calendly.event_scheduled',
      },
      type: 'message',
      bubbles: false,
      cancelable: false,
    } as MessageEvent

    // Call the handler directly - it should invoke the callback
    if (messageHandler) {
      messageHandler(mockEvent)
    }

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should call callback when message comes from www.calendly.com', async () => {
    renderHook(() => useCalendlyEventScheduled(mockCallback))

    // Wait for useEffect to set up the listener
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

    // Call the handler directly
    if (messageHandler) {
      messageHandler(mockEvent)
    }

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback for invalid origin', async () => {
    renderHook(() => useCalendlyEventScheduled(mockCallback))

    // Wait for useEffect to set up the listener
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
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
    renderHook(() => useCalendlyEventScheduled(mockCallback))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(messageHandler).not.toBeNull()

    // These would have passed with startsWith() but should be rejected with proper URL parsing
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
    renderHook(() => useCalendlyEventScheduled(mockCallback))

    // Wait for useEffect to set up the listener
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
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
    renderHook(() => useCalendlyEventScheduled(mockCallback))

    // Wait for useEffect to set up the listener
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

    // Call the handler directly
    if (messageHandler) {
      messageHandler(mockEvent1)
      messageHandler(mockEvent2)
    }

    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it('should not call callback if callback is not provided', async () => {
    renderHook(() => useCalendlyEventScheduled(undefined))

    // Wait for useEffect to set up the listener
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(messageHandler).not.toBeNull()

    const mockEvent = {
      origin: 'https://calendly.com',
      data: {
        event: 'calendly.event_scheduled',
      },
    } as MessageEvent

    // Should not throw or cause errors
    act(() => {
      messageHandler!(mockEvent)
    })

    expect(mockCallback).not.toHaveBeenCalled()
  })

  it('should handle messages without data property', async () => {
    renderHook(() => useCalendlyEventScheduled(mockCallback))

    // Wait for useEffect to set up the listener
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
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

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
    const { unmount } = renderHook(() => useCalendlyEventScheduled(mockCallback))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })
})
