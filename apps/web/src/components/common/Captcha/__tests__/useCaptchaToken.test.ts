import { act, renderHook, waitFor } from '@/tests/test-utils'
import { sharedTokenRef, resolveCaptchaReady, resetCaptchaPromise } from '@/components/common/Captcha/captchaHeadersInit'
import { useCaptchaToken } from '@/components/common/Captcha/useCaptchaToken'

// jest.mock is hoisted before imports, so the imports above receive the mocked versions
jest.mock('@/components/common/Captcha/captchaHeadersInit', () => ({
  sharedTokenRef: { current: null },
  resolveCaptchaReady: jest.fn(),
  resetCaptchaPromise: jest.fn(),
}))

jest.mock('@safe-global/utils/config/constants', () => ({
  TURNSTILE_SITE_KEY: 'test-site-key',
}))

type TurnstileOptions = Parameters<NonNullable<typeof window.turnstile>['render']>[1]

const mockTurnstile = {
  render: jest.fn(),
  reset: jest.fn(),
  remove: jest.fn(),
}

function getCallbacks(): TurnstileOptions {
  return mockTurnstile.render.mock.calls.at(-1)?.[1] ?? {}
}

function mountContainer(result: ReturnType<typeof renderHook<ReturnType<typeof useCaptchaToken>, unknown>>['result']) {
  const container = document.createElement('div')
  act(() => result.current.onWidgetContainerReady(container as unknown as HTMLDivElement))
  return container
}

describe('useCaptchaToken', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(sharedTokenRef as { current: string | null }).current = null
    Object.defineProperty(window, 'turnstile', { value: mockTurnstile, writable: true, configurable: true })
    mockTurnstile.render.mockReturnValue('widget-id-1')
  })

  afterEach(() => {
    Object.defineProperty(window, 'turnstile', { value: undefined, writable: true, configurable: true })
  })

  describe('widget rendering', () => {
    it('renders widget when script becomes ready and container is already mounted', async () => {
      // Script not loaded yet — window.turnstile is undefined
      Object.defineProperty(window, 'turnstile', { value: undefined, writable: true, configurable: true })

      const { result, rerender } = renderHook((props: { isScriptReady: boolean }) => useCaptchaToken(props), {
        initialProps: { isScriptReady: false },
      })

      mountContainer(result)
      expect(mockTurnstile.render).not.toHaveBeenCalled()

      // Script loads — window.turnstile is now available
      Object.defineProperty(window, 'turnstile', { value: mockTurnstile, writable: true, configurable: true })
      rerender({ isScriptReady: true })

      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalledTimes(1))
    })

    it('renders widget immediately when container mounts after script is ready', async () => {
      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalledTimes(1))
    })

    it('does not render widget twice', async () => {
      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalledTimes(1))
    })
  })

  describe('token callback', () => {
    it('sets token, updates shared ref, resolves captcha, and closes modal after delay', async () => {
      jest.useFakeTimers()

      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalled())

      act(() => getCallbacks()['before-interactive-callback']?.())
      expect(result.current.isModalOpen).toBe(true)

      act(() => getCallbacks().callback?.('my-token'))

      expect(result.current.token).toBe('my-token')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(resolveCaptchaReady).toHaveBeenCalled()
      expect((sharedTokenRef as { current: string | null }).current).toBe('my-token')
      expect(result.current.isModalOpen).toBe(true) // still open before delay

      act(() => jest.advanceTimersByTime(500))
      expect(result.current.isModalOpen).toBe(false)

      jest.useRealTimers()
    })
  })

  describe('error-callback', () => {
    it('sets error, clears token, and resolves captcha', async () => {
      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalled())

      act(() => getCallbacks()['error-callback']?.('300010'))

      expect(result.current.error?.message).toBe('300010')
      expect(result.current.token).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect((sharedTokenRef as { current: string | null }).current).toBeNull()
      expect(resolveCaptchaReady).toHaveBeenCalled()
    })
  })

  describe('expired-callback', () => {
    it('clears token, resets the captcha promise, and resets the widget', async () => {
      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalled())

      act(() => getCallbacks().callback?.('initial-token'))
      expect(result.current.token).toBe('initial-token')

      act(() => getCallbacks()['expired-callback']?.())

      expect(result.current.token).toBeNull()
      expect((sharedTokenRef as { current: string | null }).current).toBeNull()
      expect(resetCaptchaPromise).toHaveBeenCalled()
      expect(mockTurnstile.reset).toHaveBeenCalledWith('widget-id-1')
    })
  })

  describe('before-interactive-callback', () => {
    it('opens the modal', async () => {
      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalled())

      act(() => getCallbacks()['before-interactive-callback']?.())
      expect(result.current.isModalOpen).toBe(true)
    })
  })

  describe('refreshToken', () => {
    it('calls turnstile.reset and sets isLoading to true', async () => {
      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalled())

      act(() => result.current.refreshToken())

      expect(mockTurnstile.reset).toHaveBeenCalledWith('widget-id-1')
      expect(result.current.isLoading).toBe(true)
    })

    it('clears error so modal shows instructions instead of verification failed', async () => {
      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalled())

      act(() => getCallbacks()['error-callback']?.('300010'))
      expect(result.current.error?.message).toBe('300010')

      act(() => result.current.refreshToken())
      expect(result.current.error).toBeNull()
    })
  })

  describe('cleanup', () => {
    it('calls turnstile.remove on unmount', async () => {
      const { result, unmount } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)
      await waitFor(() => expect(mockTurnstile.render).toHaveBeenCalled())

      unmount()
      expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-id-1')
    })

    it('does not call turnstile.remove if widget was never rendered', () => {
      const { unmount } = renderHook(() => useCaptchaToken({ isScriptReady: false }))
      unmount()
      expect(mockTurnstile.remove).not.toHaveBeenCalled()
    })
  })

  describe('render error', () => {
    it('sets error state and resolves captcha when turnstile.render throws', async () => {
      mockTurnstile.render.mockImplementationOnce(() => {
        throw new Error('render failed')
      })

      const { result } = renderHook(() => useCaptchaToken({ isScriptReady: true }))
      mountContainer(result)

      await waitFor(() => {
        expect(result.current.error?.message).toBe('render failed')
        expect(result.current.isLoading).toBe(false)
      })
      expect(resolveCaptchaReady).toHaveBeenCalled()
    })
  })
})
