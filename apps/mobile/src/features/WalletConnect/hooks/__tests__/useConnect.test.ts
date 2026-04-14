import { renderHook, act } from '@/src/tests/test-utils'
import { useConnect, ConnectError, UserRejectedError } from '../useConnect'

const mockOpen = jest.fn()

const mockWalletState = {
  address: undefined as string | undefined,
  isConnected: false,
  walletInfo: undefined as { name: string; icon: string } | undefined,
}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen }),
  useAccount: () => ({
    isConnected: mockWalletState.isConnected,
    address: mockWalletState.address,
  }),
  useWalletInfo: () => ({ walletInfo: mockWalletState.walletInfo }),
}))

const eventCallbacks: Record<string, (() => void) | undefined> = {}

jest.mock('../useStableAppKitEvent', () => ({
  useStableAppKitEvent: (event: string, callback: () => void) => {
    eventCallbacks[event] = callback
  },
}))

const setConnected = (address: string, walletName = 'MetaMask', walletIcon = 'icon-url') => {
  mockWalletState.address = address
  mockWalletState.isConnected = true
  mockWalletState.walletInfo = { name: walletName, icon: walletIcon }
}

const setDisconnected = () => {
  mockWalletState.address = undefined
  mockWalletState.isConnected = false
  mockWalletState.walletInfo = undefined
}

describe('useConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setDisconnected()

    Object.keys(eventCallbacks).forEach((key) => {
      eventCallbacks[key] = undefined
    })
  })

  it('calls open with Connect view when connect is called', () => {
    const { result } = renderHook(() => useConnect())

    act(() => {
      result.current()
    })

    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('resolves with address, walletName, and walletIcon on successful connection', async () => {
    const { result, rerender } = renderHook(() => useConnect())

    let resolved: unknown
    act(() => {
      result.current().then((r) => {
        resolved = r
      })
    })

    setConnected('0xABC', 'Rainbow', 'rainbow-icon')
    rerender({})

    await act(async () => {
      await Promise.resolve()
    })

    expect(resolved).toEqual({
      address: '0xABC',
      walletName: 'Rainbow',
      walletIcon: 'rainbow-icon',
    })
  })

  it('rejects on CONNECT_ERROR', async () => {
    const { result } = renderHook(() => useConnect())

    let rejected: Error | undefined
    act(() => {
      result.current().catch((e: Error) => {
        rejected = e
      })
    })

    act(() => {
      eventCallbacks['CONNECT_ERROR']?.()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(rejected).toBeInstanceOf(ConnectError)
  })

  it('rejects on USER_REJECTED', async () => {
    const { result } = renderHook(() => useConnect())

    let rejected: Error | undefined
    act(() => {
      result.current().catch((e: Error) => {
        rejected = e
      })
    })

    act(() => {
      eventCallbacks['USER_REJECTED']?.()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(rejected).toBeInstanceOf(UserRejectedError)
  })

  it('does not resolve when walletInfo fields are incomplete', async () => {
    const { result, rerender } = renderHook(() => useConnect())

    let resolved = false
    act(() => {
      result.current().then(() => {
        resolved = true
      })
    })

    // walletInfo present but missing icon
    mockWalletState.address = '0xABC'
    mockWalletState.isConnected = true
    mockWalletState.walletInfo = { name: 'MetaMask', icon: '' }
    rerender({})

    await act(async () => {
      await Promise.resolve()
    })

    expect(resolved).toBe(false)

    // Now provide complete walletInfo
    mockWalletState.walletInfo = { name: 'MetaMask', icon: 'icon-url' }
    rerender({})

    await act(async () => {
      await Promise.resolve()
    })

    expect(resolved).toBe(true)
  })

  it('does not resolve when no connect is pending', () => {
    const { rerender } = renderHook(() => useConnect())

    setConnected('0xABC')
    rerender({})

    // No promise was created, so nothing to assert except no crash
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('ignores error events when no connect is pending', () => {
    renderHook(() => useConnect())

    // Should not throw
    act(() => {
      eventCallbacks['CONNECT_ERROR']?.()
      eventCallbacks['USER_REJECTED']?.()
    })
  })

  it('clears pending promise on unmount', async () => {
    const { result, unmount } = renderHook(() => useConnect())

    let settled = false
    act(() => {
      result.current().then(
        () => {
          settled = true
        },
        () => {
          settled = true
        },
      )
    })

    unmount()

    await act(async () => {
      await Promise.resolve()
    })

    expect(settled).toBe(false)
  })

  it('handles sequential connect calls', async () => {
    const { result, rerender } = renderHook(() => useConnect())

    // First connect — reject it
    let firstRejected = false
    act(() => {
      result.current().catch(() => {
        firstRejected = true
      })
    })

    act(() => {
      eventCallbacks['USER_REJECTED']?.()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(firstRejected).toBe(true)

    // Second connect — resolve it
    let secondResolved: unknown
    act(() => {
      result.current().then((r) => {
        secondResolved = r
      })
    })

    setConnected('0xDEF', 'Phantom', 'phantom-icon')
    rerender({})

    await act(async () => {
      await Promise.resolve()
    })

    expect(secondResolved).toEqual({
      address: '0xDEF',
      walletName: 'Phantom',
      walletIcon: 'phantom-icon',
    })
  })
})
