import { faker } from '@faker-js/faker'
import { renderHook, act } from '@/src/tests/test-utils'
import { useReconnectFlow } from '../useReconnectFlow'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`
const mockOtherAddress = faker.finance.ethereumAddress() as `0x${string}`

const mockRouterPush = jest.fn()
const mockOpen = jest.fn()
const mockDisconnect = jest.fn()
const mockSwitchNetworkIfNeeded = jest.fn().mockResolvedValue(undefined)

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}))

// Mutable state object the mock reads on each render
const mockWalletState = {
  address: undefined as string | undefined,
  isConnected: false,
  walletInfo: undefined as { name: string } | undefined,
}

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ open: mockOpen, disconnect: mockDisconnect, switchNetwork: jest.fn() }),
  useAccount: () => ({ address: mockWalletState.address, isConnected: mockWalletState.isConnected }),
  useWalletInfo: () => ({ walletInfo: mockWalletState.walletInfo }),
}))

jest.mock('../useSwitchNetwork', () => ({
  useSwitchNetwork: () => ({
    switchNetworkIfNeeded: mockSwitchNetworkIfNeeded,
    switchNetwork: jest.fn(),
  }),
}))

const setConnected = (address: string, walletName = 'MetaMask') => {
  mockWalletState.address = address
  mockWalletState.isConnected = true
  mockWalletState.walletInfo = { name: walletName }
}

const setDisconnected = () => {
  mockWalletState.address = undefined
  mockWalletState.isConnected = false
  mockWalletState.walletInfo = undefined
}

const renderReconnectFlow = () => renderHook(() => useReconnectFlow())

describe('useReconnectFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setDisconnected()
  })

  it('opens the wallet modal when reconnect is called', () => {
    const { result } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    expect(mockOpen).toHaveBeenCalledWith({ view: 'Connect' })
  })

  it('switches network when reconnected address matches', () => {
    const { result, rerender } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    setConnected(mockAddress)
    rerender({})

    expect(mockSwitchNetworkIfNeeded).toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('disconnects and navigates to error when address does not match', () => {
    const { result, rerender } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    setConnected(mockOtherAddress)
    rerender({})

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/import-signers/reconnect-error',
      }),
    )
  })

  it('disconnects and navigates to error on address mismatch (idempotent)', () => {
    const { result, rerender } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    setConnected(mockOtherAddress)
    rerender({})

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockRouterPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/import-signers/reconnect-error',
      }),
    )
  })

  it('does not act when wallet connects without reconnect initiation', () => {
    setConnected(mockAddress)

    renderReconnectFlow()

    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
