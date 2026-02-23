import { renderHook, act } from '@testing-library/react'
import useThirdPartyCookies from './useThirdPartyCookies'

const COOKIE_CHECK_URL = 'https://third-party-cookies-check.gnosis-safe.com'
const COOKIE_CHECK_ORIGIN = new URL(COOKIE_CHECK_URL).origin

jest.mock('@/config/constants', () => ({
  SAFE_APPS_THIRD_PARTY_COOKIES_CHECK_URL: 'https://third-party-cookies-check.gnosis-safe.com',
}))

describe('useThirdPartyCookies', () => {
  let appendChildSpy: jest.SpyInstance
  let removeChildSpy: jest.SpyInstance

  beforeEach(() => {
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node)
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
  })

  afterEach(() => {
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('should accept cookie check messages from the expected origin', () => {
    const { result } = renderHook(() => useThirdPartyCookies())

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: COOKIE_CHECK_ORIGIN,
          data: { isCookieEnabled: false },
        }),
      )
    })

    expect(result.current.thirdPartyCookiesDisabled).toBe(true)
  })

  it('should ignore cookie check messages from unexpected origins', () => {
    const { result } = renderHook(() => useThirdPartyCookies())

    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://evil.com',
          data: { isCookieEnabled: false },
        }),
      )
    })

    expect(result.current.thirdPartyCookiesDisabled).toBe(false)
  })

  it('should use the cookie check origin instead of wildcard when posting to iframe', () => {
    const mockPostMessage = jest.fn()
    let capturedOnload: (() => void) | null = null

    const origCreateElement = document.createElement.bind(document)
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string, options?: any) => {
      if (tag === 'iframe') {
        const fakeIframe = {
          src: '',
          setAttribute: jest.fn(),
          set onload(fn: () => void) {
            capturedOnload = fn
          },
          contentWindow: { postMessage: mockPostMessage },
        }
        return fakeIframe as unknown as HTMLIFrameElement
      }
      return origCreateElement(tag, options)
    })

    renderHook(() => useThirdPartyCookies())

    // Trigger the onload callback that was set by createIframe
    act(() => {
      capturedOnload?.()
    })

    expect(mockPostMessage).toHaveBeenCalledWith({ test: 'cookie' }, COOKIE_CHECK_ORIGIN)
    expect(mockPostMessage).not.toHaveBeenCalledWith(expect.anything(), '*')

    createElementSpy.mockRestore()
  })
})
