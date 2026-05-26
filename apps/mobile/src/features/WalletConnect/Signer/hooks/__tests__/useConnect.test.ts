import { Alert } from 'react-native'
import { renderHook, act } from '@/src/tests/test-utils'
import { useConnect, ConnectError, isProposalExpiredMessage } from '../useConnect'
import Logger from '@/src/utils/logger'

jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}))

const mockOpen = jest.fn()
const mockClose = jest.fn()
const mockDisconnect = jest.fn().mockResolvedValue(undefined)
const mockSwitchNetwork = jest.fn().mockResolvedValue(undefined)

const mockWalletState = {
  address: undefined as string | undefined,
  isConnected: false,
  walletInfo: undefined as { name: string; icon: string } | undefined,
  chain: undefined as { caipNetworkId: string } | undefined,
}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({
    open: mockOpen,
    close: mockClose,
    disconnect: mockDisconnect,
    switchNetwork: mockSwitchNetwork,
  }),
  useAccount: () => ({
    isConnected: mockWalletState.isConnected,
    address: mockWalletState.address,
    chain: mockWalletState.chain,
  }),
  useWalletInfo: () => ({ walletInfo: mockWalletState.walletInfo }),
}))

type EventCallback = (state?: {
  data: { address?: string; properties: { caipNetworkId?: string; message?: string } }
}) => void
const eventCallbacks: Record<string, EventCallback | undefined> = {}

jest.mock('../useStableAppKitEvent', () => ({
  useStableAppKitEvent: (event: string, callback: EventCallback) => {
    eventCallbacks[event] = callback
  },
}))

const renderUseConnect = (initialStore?: Record<string, unknown>) =>
  renderHook(() => useConnect({ flow: 'test' }), initialStore)

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
    const { result } = renderUseConnect()

    act(() => {
      result.current()
    })

    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('resolves with address, walletName, and walletIcon on successful connection', async () => {
    const { result, rerender } = renderUseConnect()

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

  it('rejects on CONNECT_ERROR with the AppKit message preserved (catastrophic case)', async () => {
    const { result } = renderUseConnect()

    let rejected: Error | undefined
    act(() => {
      result.current().catch((e: Error) => {
        rejected = e
      })
    })

    act(() => {
      eventCallbacks['CONNECT_ERROR']?.({
        data: { properties: { message: 'WalletConnect signing failed' } },
      })
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(rejected).toBeInstanceOf(ConnectError)
    expect(rejected?.message).toBe('WalletConnect signing failed')
  })

  it('falls back to a generic message when AppKit emits CONNECT_ERROR without one', async () => {
    const { result } = renderUseConnect()

    let rejected: Error | undefined
    act(() => {
      result.current().catch((e: Error) => {
        rejected = e
      })
    })

    act(() => {
      eventCallbacks['CONNECT_ERROR']?.({ data: { properties: {} } })
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(rejected).toBeInstanceOf(ConnectError)
    expect(rejected?.message).toBe('Connection failed')
  })

  describe('proposal expired (transparent retry)', () => {
    it('reopens the connect modal and keeps the promise pending', async () => {
      const { result } = renderUseConnect()

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

      expect(mockOpen).toHaveBeenCalledTimes(1)

      act(() => {
        eventCallbacks['CONNECT_ERROR']?.({
          data: { properties: { message: 'Proposal expired' } },
        })
      })

      // Allow the IIFE (await disconnect → re-open) to flush.
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(Logger.warn).toHaveBeenCalledWith('WalletConnect proposal expired during test, reopening connect modal')
      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockOpen).toHaveBeenCalledTimes(2)
      expect(mockOpen).toHaveBeenLastCalledWith({ view: 'Connect' })
      expect(resolved).toBeUndefined()
      expect(rejected).toBeUndefined()
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('reopens for wrapped "Proposal expired" messages too', async () => {
      const { result } = renderUseConnect()

      act(() => {
        result.current().then(
          () => undefined,
          () => undefined,
        )
      })

      act(() => {
        eventCallbacks['CONNECT_ERROR']?.({
          data: { properties: { message: 'Pairing already exists: Proposal expired' } },
        })
      })

      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(mockOpen).toHaveBeenCalledTimes(2)
      expect(Alert.alert).not.toHaveBeenCalled()
    })

    it('does not reopen if the consumer unmounted between the error and the cleanup', async () => {
      const { result, unmount } = renderUseConnect()

      act(() => {
        result.current().then(
          () => undefined,
          () => undefined,
        )
      })

      act(() => {
        eventCallbacks['CONNECT_ERROR']?.({
          data: { properties: { message: 'Proposal expired' } },
        })
      })

      // Unmount before the IIFE finishes its disconnect → reopen sequence.
      unmount()

      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(mockOpen).toHaveBeenCalledTimes(1) // initial only — no reopen
    })
  })

  it('isProposalExpiredMessage matches wrapped messages and rejects unrelated substrings', () => {
    expect(isProposalExpiredMessage('Pairing already exists: Proposal expired')).toBe(true)
    expect(isProposalExpiredMessage('Proposal  expired')).toBe(true)
    expect(isProposalExpiredMessage('subproposal expired-ish')).toBe(false)
    expect(isProposalExpiredMessage('')).toBe(false)
    expect(isProposalExpiredMessage('Connection failed')).toBe(false)
  })

  describe('USER_REJECTED', () => {
    it('resolves with null, closes the modal, logs at info level, does not alert', async () => {
      const { result } = renderUseConnect()

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

      act(() => {
        eventCallbacks['USER_REJECTED']?.()
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(resolved).toBeNull()
      expect(rejected).toBeUndefined()
      expect(mockClose).toHaveBeenCalledTimes(1)
      expect(Logger.info).toHaveBeenCalledWith('User rejected WC connect during test')
      expect(Alert.alert).not.toHaveBeenCalled()
    })
  })

  it('does not resolve when walletInfo fields are incomplete', async () => {
    const { result, rerender } = renderUseConnect()

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
    const { rerender } = renderUseConnect()

    setConnected('0xABC')
    rerender({})

    // No promise was created, so nothing to assert except no crash
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('ignores error events when no connect is pending', () => {
    renderUseConnect()

    // Should not throw
    act(() => {
      eventCallbacks['CONNECT_ERROR']?.({ data: { properties: { message: 'Proposal expired' } } })
      eventCallbacks['USER_REJECTED']?.()
    })

    expect(mockClose).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
  })

  it('clears pending promise on unmount', async () => {
    const { result, unmount } = renderUseConnect()

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
    const { result, rerender } = renderUseConnect()

    // First connect — user rejects, resolves null.
    let firstResolved: unknown = 'unset'
    act(() => {
      result.current().then((r) => {
        firstResolved = r
      })
    })

    act(() => {
      eventCallbacks['USER_REJECTED']?.()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(firstResolved).toBeNull()

    // Second connect — resolve via state update.
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
      const { result } = renderUseConnect(activeSafeStore)

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

    it('resolves null and alerts when switchNetwork throws (unsupported chain)', async () => {
      mockSwitchNetwork.mockRejectedValueOnce(new Error('Chain not supported'))

      const { result } = renderUseConnect(activeSafeStore)

      let resolved: unknown = 'unset'
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

      // Allow the IIFE disconnect to settle.
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(resolved).toBeNull()
      expect(rejected).toBeUndefined()
      expect(mockDisconnect).toHaveBeenCalled()
      expect(Alert.alert).toHaveBeenCalledWith('Unsupported network', expect.any(String), expect.any(Array))
    })

    it('resolves null and alerts via timeout when switchNetwork resolves but chain never settles', async () => {
      jest.useFakeTimers()

      const { result } = renderUseConnect(activeSafeStore)

      let resolved: unknown = 'unset'
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
      expect(resolved).toBe('unset')

      await act(async () => {
        jest.advanceTimersByTime(8000)
      })

      // Allow the IIFE disconnect to settle.
      await act(async () => {
        await Promise.resolve()
        await Promise.resolve()
      })

      expect(resolved).toBeNull()
      expect(rejected).toBeUndefined()
      expect(mockDisconnect).toHaveBeenCalled()
      expect(Alert.alert).toHaveBeenCalledWith('Unsupported network', expect.any(String), expect.any(Array))

      jest.useRealTimers()
    })

    it('resolves after switchNetwork succeeds and state settles on the correct chain', async () => {
      const { result, rerender } = renderUseConnect(activeSafeStore)

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
      const { result, rerender } = renderUseConnect(activeSafeStore)

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
      const { result } = renderUseConnect(activeSafeStore)

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
      const { result } = renderUseConnect()

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
      const { result } = renderUseConnect(activeSafeStore)

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
