import { Alert } from 'react-native'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useReconnectFlow } from '../useReconnectFlow'
import { ConnectError, ProposalExpiredError, UnsupportedChainError, UserRejectedError } from '../useConnect'
import type { ConnectResult } from '../useConnect'
import Logger from '@/src/utils/logger'

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}))

jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`
const mockOtherAddress = faker.finance.ethereumAddress() as `0x${string}`

const mockRouterPush = jest.fn()
const mockDisconnect = jest.fn()
const mockClose = jest.fn()
const mockSwitchNetworkIfNeeded = jest.fn().mockResolvedValue(undefined)

let mockConnectResolve: (result: ConnectResult) => void
let mockConnectReject: (error: Error) => void

const mockConnect = jest.fn(
  () =>
    new Promise<ConnectResult>((resolve, reject) => {
      mockConnectResolve = resolve
      mockConnectReject = reject
    }),
)

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockRouterPush(...args),
  },
}))

jest.mock('@reown/appkit-react-native', () => ({
  useAppKit: () => ({ disconnect: mockDisconnect, close: mockClose }),
}))

jest.mock('../useSwitchNetwork', () => ({
  useSwitchNetwork: () => ({ switchNetworkIfNeeded: mockSwitchNetworkIfNeeded }),
}))

jest.mock('../useConnect', () => ({
  ...jest.requireActual('../useConnect'),
  useConnect: () => mockConnect,
}))

const renderReconnectFlow = () => renderHook(() => useReconnectFlow())

describe('useReconnectFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls connect when reconnect is called', () => {
    const { result } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    expect(mockConnect).toHaveBeenCalled()
  })

  it('switches network when reconnected address matches', async () => {
    const { result } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    await act(async () => {
      mockConnectResolve({ address: mockAddress, walletName: 'MetaMask', walletIcon: 'icon' })
    })

    await waitFor(() => {
      expect(mockSwitchNetworkIfNeeded).toHaveBeenCalled()
      expect(mockDisconnect).not.toHaveBeenCalled()
      expect(mockRouterPush).not.toHaveBeenCalled()
    })
  })

  it('disconnects and navigates to error when address does not match', async () => {
    const { result } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    await act(async () => {
      mockConnectResolve({ address: mockOtherAddress, walletName: 'MetaMask', walletIcon: 'icon' })
    })

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/reconnect-error',
          params: { address: getAddress(mockAddress) },
        }),
      )
    })
  })

  it('shows an alert when wallet does not support the active Safe chain', async () => {
    const { result } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    await act(async () => {
      mockConnectReject(new UnsupportedChainError())
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Unsupported network', expect.any(String), expect.any(Array))
    })

    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
    expect(mockClose).not.toHaveBeenCalled()
  })

  it('closes the modal on UserRejectedError without alerting and emits info-level telemetry', async () => {
    const { result } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    await act(async () => {
      mockConnectReject(new UserRejectedError())
    })

    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
    expect(Alert.alert).not.toHaveBeenCalled()
    expect(Logger.error).not.toHaveBeenCalled()
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(Logger.info).toHaveBeenCalledWith('User rejected WC connect during reconnect')
    expect(mockClose).toHaveBeenCalled()
  })

  it('disconnects, closes the modal, then alerts when connect fails with a non-expiry ConnectError', async () => {
    const { result } = renderReconnectFlow()
    const connectError = new ConnectError('Connection failed')

    act(() => {
      result.current.reconnect(mockAddress)
    })

    await act(async () => {
      mockConnectReject(connectError)
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error during reconnect', expect.any(String), expect.any(Array))
    })

    expect(Logger.error).toHaveBeenCalledWith('Error during reconnect:', connectError)
    expect(Logger.warn).not.toHaveBeenCalled()
    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalled()
    // Modal must dismiss before the alert renders so the alert isn't hosted by
    // the dismissing modal on iOS.
    const closeOrder = mockClose.mock.invocationCallOrder[0]
    const alertOrder = (Alert.alert as jest.Mock).mock.invocationCallOrder[0]
    expect(closeOrder).toBeLessThan(alertOrder)
  })

  it('downgrades to Logger.warn and still cleans up when connect fails with a ProposalExpiredError', async () => {
    const { result } = renderReconnectFlow()
    const expiredError = new ProposalExpiredError('Proposal expired')

    act(() => {
      result.current.reconnect(mockAddress)
    })

    await act(async () => {
      mockConnectReject(expiredError)
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error during reconnect', expect.any(String), expect.any(Array))
    })

    expect(Logger.warn).toHaveBeenCalledWith('WalletConnect proposal expired during reconnect:', expiredError)
    expect(Logger.error).not.toHaveBeenCalled()
    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalled()
  })

  it('captures async rejection from disconnect() during error cleanup without dropping close/alert', async () => {
    const { result } = renderReconnectFlow()
    const connectError = new ConnectError('Connection failed')
    const disconnectRejection = new Error('relay teardown failed')
    mockDisconnect.mockRejectedValueOnce(disconnectRejection)

    act(() => {
      result.current.reconnect(mockAddress)
    })

    await act(async () => {
      mockConnectReject(connectError)
    })

    await waitFor(() => {
      expect(Logger.warn).toHaveBeenCalledWith(
        'Failed to disconnect WC session after reconnect error:',
        disconnectRejection,
      )
    })

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Error during reconnect', expect.any(String), expect.any(Array))
  })
})
