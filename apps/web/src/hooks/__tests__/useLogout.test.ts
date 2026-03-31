import { renderHook, act } from '@testing-library/react'
import useLogout from '@/hooks/useLogout'
import { LOGGING_OUT_KEY } from '@/hooks/useLogoutCallback'

jest.mock('@/config/gateway', () => ({
  GATEWAY_URL: 'https://safe-client.safe.global',
}))

describe('useLogout', () => {
  const originalLocation = window.location
  let submitSpy: jest.Mock
  let appendChildSpy: jest.SpyInstance
  let removeChildSpy: jest.SpyInstance
  let capturedForm: HTMLFormElement | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    capturedForm = null

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, origin: 'http://localhost:3000' },
    })

    submitSpy = jest.fn()
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLFormElement) {
        capturedForm = node
        node.submit = submitSpy
      }
      return node
    })
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
  })

  afterEach(() => {
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should write logging_out flag to sessionStorage before submitting', () => {
    const { result } = renderHook(() => useLogout())

    act(() => {
      result.current.logout()
    })

    expect(sessionStorage.getItem(LOGGING_OUT_KEY)).toBe('1')
    expect(submitSpy).toHaveBeenCalled()
  })

  it('should submit a form POST to the logout redirect endpoint', () => {
    const { result } = renderHook(() => useLogout())

    act(() => {
      result.current.logout()
    })

    expect(capturedForm).not.toBeNull()
    expect(capturedForm!.method).toBe('post')
    expect(capturedForm!.action).toBe('https://safe-client.safe.global/v1/auth/logout/redirect')

    const input = capturedForm!.querySelector('input[name="redirect_url"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.value).toBe('http://localhost:3000/welcome/spaces')

    expect(submitSpy).toHaveBeenCalled()
  })

  it('should remove the form from the DOM after submitting', () => {
    const { result } = renderHook(() => useLogout())

    act(() => {
      result.current.logout()
    })

    expect(removeChildSpy).toHaveBeenCalledWith(capturedForm)
  })
})
