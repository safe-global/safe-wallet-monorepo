import { act } from 'react'
import { renderHook } from '@testing-library/react'
import useOnceVisible from '../useOnceVisible'

describe('useOnceVisible hook', () => {
  let observeMock: jest.Mock
  let unobserveMock: jest.Mock
  let disconnectMock: jest.Mock
  let intersectionObserverMock: jest.Mock
  let intersectionCallback: IntersectionObserverCallback
  let mockObserverInstance: IntersectionObserver

  beforeEach(() => {
    observeMock = jest.fn()
    unobserveMock = jest.fn()
    disconnectMock = jest.fn()

    // Mock factory for IntersectionObserver:
    intersectionObserverMock = jest.fn((callback: IntersectionObserverCallback) => {
      // Save the callback so we can trigger it later
      intersectionCallback = callback

      mockObserverInstance = {
        observe: observeMock,
        unobserve: unobserveMock,
        disconnect: disconnectMock,
        takeRecords: jest.fn(),
        root: null,
        rootMargin: '',
        thresholds: [],
      }

      return mockObserverInstance
    })

    // Override the global IntersectionObserver
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: intersectionObserverMock,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns false initially', () => {
    const ref = { current: document.createElement('div') }

    const { result } = renderHook(() => useOnceVisible(ref))
    expect(result.current).toBe(false)
  })

  it('calls observe on mount', () => {
    const ref = { current: document.createElement('div') }
    renderHook(() => useOnceVisible(ref))

    expect(observeMock).toHaveBeenCalledTimes(1)
    expect(observeMock).toHaveBeenCalledWith(ref.current)
  })

  it('updates to true when the element becomes visible', async () => {
    const ref = { current: document.createElement('div') }
    const { result } = renderHook(() => useOnceVisible(ref))

    expect(result.current).toBe(false)

    act(() => {
      intersectionCallback(
        [
          {
            isIntersecting: true,
            target: ref.current!,
            intersectionRatio: 1,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0,
          },
        ],
        mockObserverInstance,
      )
    })

    expect(result.current).toBe(true)
  })

  it('disconnects observer on unmount', () => {
    const ref = { current: document.createElement('div') }
    const { unmount } = renderHook(() => useOnceVisible(ref))

    unmount()
    expect(disconnectMock).toHaveBeenCalledTimes(1)
  })

  it('does nothing if ref.current is null', () => {
    const ref = { current: null }

    const { unmount } = renderHook(() => useOnceVisible(ref))
    expect(intersectionObserverMock).not.toHaveBeenCalled()

    unmount()
  })
})
