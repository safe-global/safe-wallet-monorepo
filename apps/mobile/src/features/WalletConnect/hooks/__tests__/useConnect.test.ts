import { renderHook, act } from '@/src/tests/test-utils'
import { useConnect, ConnectError, UnsupportedChainError, UserRejectedError } from '../useConnect'

const mockOpen = jest.fn()
const mockDisconnect = jest.fn().mockResolvedValue(undefined)
const mockSwitchNetwork = jest.fn().mockResolvedValue(undefined)

const mockWalletState = {
  address: undefined as string | undefined,
  isConnected: false,
  walletInfo: undefined as { name: string; icon: string } | undefined,
  chain: undefined as { caipNetworkId: string } | undefined,
}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen, disconnect: mockDisconnect, switchNetwork: mockSwitchNetwork }),
  useAccount: () => ({
    isConnected: mockWalletState.isConnected,
    address: mockWalletState.address,
    chain: mockWalletState.chain,
  }),
  useWalletInfo: () => ({ walletInfo: mockWalletState.walletInfo }),
}))

type EventCallback = (state?: { data: { address?: string; properties: { caipNetworkId?: string } } }) => void
const eventCallbacks: Record<string, EventCallback | undefined> = {}

jest.mock('../useStableAppKitEvent', () => ({
  useStableAppKitEvent: (event: string, callback: EventCallback) => {
    eventCallbacks[event] = callback
  },
}))

const setConnected = (
  address: string,
  walletName = 'MetaMask',
  walletIcon = 'icon-url',
  caipNetworkId = 'eip155:1',
) => {
  mockWalletState.address = address
  mockWalletState.isConnected = true
  mockWalletState.walletInfo = { name: walletName, icon: walletIcon }
  mockWalletState.chain = { caipNetworkId }
}

const setDisconnected = () => {
  mockWalletState.address = undefined
  mockWalletState.isConnected = false
  mockWalletState.walletInfo = undefined
  mockWalletState.chain = undefined
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

  describe('CONNECT_SUCCESS chain guard', () => {
    const activeSafeStore = {
      activeSafe: { address: '0x0000000000000000000000000000000000000001' as const, chainId: '1' },
    }

    beforeEach(() => {
      mockSwitchNetwork.mockResolvedValue(undefined)
    })

    it('attempts to switch network when caipNetworkId does not match the active Safe chain', async () => {
      const { result } = renderHook(() => useConnect(), activeSafeStore)

      let rejected: Error | undefined
      act(() => {
        result.current().catch((e: Error) => {
          rejected = e
        })
      })

      await act(async () => {
        eventCallbacks['CONNECT_SUCCESS']?.({
          data: { address: '0xABC', properties: { caipNetworkId: 'eip155:137' } },
        })
      })

      expect(mockSwitchNetwork).toHaveBeenCalledWith('eip155:1')
      expect(rejected).toBeUndefined()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('rejects with UnsupportedChainError when switchNetwork throws', async () => {
      mockSwitchNetwork.mockRejectedValueOnce(new Error('Chain not supported'))

      const { result } = renderHook(() => useConnect(), activeSafeStore)

      let rejected: Error | undefined
      act(() => {
        result.current().catch((e: Error) => {
          rejected = e
        })
      })

      await act(async () => {
        eventCallbacks['CONNECT_SUCCESS']?.({
          data: { address: '0xABC', properties: { caipNetworkId: 'eip155:137' } },
        })
      })

      expect(rejected).toBeInstanceOf(UnsupportedChainError)
      expect(mockDisconnect).toHaveBeenCalled()
    })

    it('rejects via timeout when switchNetwork resolves but chain never settles', async () => {
      jest.useFakeTimers()

      const { result } = renderHook(() => useConnect(), activeSafeStore)

      let rejected: Error | undefined
      act(() => {
        result.current().catch((e: Error) => {
          rejected = e
        })
      })

      await act(async () => {
        eventCallbacks['CONNECT_SUCCESS']?.({
          data: { address: '0xABC', properties: { caipNetworkId: 'eip155:137' } },
        })
      })

      expect(mockSwitchNetwork).toHaveBeenCalledWith('eip155:1')
      expect(rejected).toBeUndefined()

      await act(async () => {
        jest.advanceTimersByTime(8000)
      })

      expect(rejected).toBeInstanceOf(UnsupportedChainError)
      expect(mockDisconnect).toHaveBeenCalled()

      jest.useRealTimers()
    })

    it('resolves after switchNetwork succeeds and state settles on the correct chain', async () => {
      const { result, rerender } = renderHook(() => useConnect(), activeSafeStore)

      let resolved: unknown
      let rejected: Error | undefined
      act(() => {
        result.current().then(
          (r) => {
            resolved = r
          },
          (e: Error) => {
            rejected = e
          },
        )
      })

      await act(async () => {
        eventCallbacks['CONNECT_SUCCESS']?.({
          data: { address: '0xABC', properties: { caipNetworkId: 'eip155:137' } },
        })
      })

      expect(mockSwitchNetwork).toHaveBeenCalledWith('eip155:1')

      // Simulate post-switch state update: wallet now connected on chain 1.
      setConnected('0xABC', 'Rainbow', 'rainbow-icon', 'eip155:1')
      rerender({})

      await act(async () => {
        await Promise.resolve()
      })

      expect(resolved).toEqual({ address: '0xABC', walletName: 'Rainbow', walletIcon: 'rainbow-icon' })
      expect(rejected).toBeUndefined()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('resolver does not resolve while wallet state is on the wrong chain', async () => {
      const { result, rerender } = renderHook(() => useConnect(), activeSafeStore)

      let resolved: unknown
      let rejected: Error | undefined
      act(() => {
        result.current().then(
          (r) => {
            resolved = r
          },
          (e: Error) => {
            rejected = e
          },
        )
      })

      // State flips to connected on the wrong chain *before* any CONNECT_SUCCESS event.
      // The resolver must not fire until the chain matches the active Safe.
      setConnected('0xABC', 'Rainbow', 'rainbow-icon', 'eip155:137')
      rerender({})

      await act(async () => {
        await Promise.resolve()
      })

      expect(resolved).toBeUndefined()
      expect(rejected).toBeUndefined()
    })

    it('does not attempt to switch when caipNetworkId matches and address is present', async () => {
      const { result } = renderHook(() => useConnect(), activeSafeStore)

      let rejected: Error | undefined
      act(() => {
        result.current().catch((e: Error) => {
          rejected = e
        })
      })

      await act(async () => {
        eventCallbacks['CONNECT_SUCCESS']?.({
          data: { address: '0xABC', properties: { caipNetworkId: 'eip155:1' } },
        })
      })

      expect(mockSwitchNetwork).not.toHaveBeenCalled()
      expect(rejected).toBeUndefined()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('ignores CONNECT_SUCCESS when no active Safe is set', async () => {
      const { result } = renderHook(() => useConnect())

      let rejected: Error | undefined
      act(() => {
        result.current().catch((e: Error) => {
          rejected = e
        })
      })

      await act(async () => {
        eventCallbacks['CONNECT_SUCCESS']?.({
          data: { properties: { caipNetworkId: 'eip155:137' } },
        })
      })

      expect(mockSwitchNetwork).not.toHaveBeenCalled()
      expect(rejected).toBeUndefined()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })

    it('does not switch when address is present and caipNetworkId is missing', async () => {
      const { result } = renderHook(() => useConnect(), activeSafeStore)

      let rejected: Error | undefined
      act(() => {
        result.current().catch((e: Error) => {
          rejected = e
        })
      })

      await act(async () => {
        eventCallbacks['CONNECT_SUCCESS']?.({ data: { address: '0xABC', properties: {} } })
      })

      expect(mockSwitchNetwork).not.toHaveBeenCalled()
      expect(rejected).toBeUndefined()
      expect(mockDisconnect).not.toHaveBeenCalled()
    })
  })
})
