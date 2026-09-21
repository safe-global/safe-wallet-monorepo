import { renderHook, act } from '@testing-library/react'
import useLogout from '@/hooks/useLogout'
import { LOGGING_OUT_KEY } from '@/hooks/useLogoutCallback'
import useOnboard from '@/hooks/wallets/useOnboard'
import useWallet from '@/hooks/wallets/useWallet'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { OnboardAPI } from '@web3-onboard/core'

jest.mock('@/config/gateway', () => ({
  GATEWAY_URL: 'https://safe-client.safe.global',
}))

jest.mock('@/hooks/wallets/useOnboard')
jest.mock('@/hooks/wallets/useWallet')

const mockUseOnboard = useOnboard as jest.MockedFunction<typeof useOnboard>
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>

describe('useLogout', () => {
  const originalLocation = window.location
  let submitSpy: jest.Mock
  let appendChildSpy: jest.SpyInstance
  let removeChildSpy: jest.SpyInstance
  let capturedForm: HTMLFormElement | null = null
  let disconnectWalletSpy: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    capturedForm = null

    disconnectWalletSpy = jest.fn().mockResolvedValue(undefined)
    mockUseOnboard.mockReturnValue({ disconnectWallet: disconnectWalletSpy } as unknown as OnboardAPI)
    mockUseWallet.mockReturnValue(null)

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

  it('should disconnect the connected wallet before submitting the logout form', async () => {
    mockUseWallet.mockReturnValue({ label: 'MetaMask' } as ConnectedWallet)

    const { result } = renderHook(() => useLogout())

    await act(async () => {
      await result.current.logout()
    })

    expect(disconnectWalletSpy).toHaveBeenCalledWith({ label: 'MetaMask' })
    expect(disconnectWalletSpy.mock.invocationCallOrder[0]).toBeLessThan(submitSpy.mock.invocationCallOrder[0])
    expect(submitSpy).toHaveBeenCalled()
    expect(sessionStorage.getItem(LOGGING_OUT_KEY)).toBe('1')
  })

  it('should not attempt to disconnect when no wallet is connected', async () => {
    mockUseWallet.mockReturnValue(null)

    const { result } = renderHook(() => useLogout())

    await act(async () => {
      await result.current.logout()
    })

    expect(disconnectWalletSpy).not.toHaveBeenCalled()
    expect(submitSpy).toHaveBeenCalled()
  })
})
