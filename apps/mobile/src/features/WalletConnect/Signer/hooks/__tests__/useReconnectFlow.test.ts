import { Alert } from 'react-native'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useReconnectFlow } from '../useReconnectFlow'
import { ConnectError } from '../useConnect'
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

let mockConnectResolve: (result: ConnectResult | null) => void
let mockConnectReject: (error: Error) => void

const mockConnect = jest.fn(
  () =>
    new Promise<ConnectResult | null>((resolve, reject) => {
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

  it('short-circuits silently when connect resolves null (useConnect handled the cancel/unsupported case)', async () => {
    const { result } = renderReconnectFlow()

    act(() => {
      result.current.reconnect(mockAddress)
    })

    await act(async () => {
      mockConnectResolve(null)
    })

    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
    expect(Alert.alert).not.toHaveBeenCalled()
    expect(Logger.error).not.toHaveBeenCalled()
  })

  it('disconnects, closes the modal, then alerts when connect rejects with a catastrophic ConnectError', async () => {
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
    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalled()
    // Modal must dismiss before the alert renders so the alert isn't hosted by
    // the dismissing modal on iOS.
    const closeOrder = mockClose.mock.invocationCallOrder[0]
    const alertOrder = (Alert.alert as jest.Mock).mock.invocationCallOrder[0]
    expect(closeOrder).toBeLessThan(alertOrder)
  })

  it('captures async rejection from disconnect() during fallback cleanup without dropping close/alert', async () => {
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
