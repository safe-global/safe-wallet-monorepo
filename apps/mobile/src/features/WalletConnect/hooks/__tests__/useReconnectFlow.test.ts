import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useReconnectFlow } from '../useReconnectFlow'
import { UserRejectedError } from '../useConnect'
import type { ConnectResult } from '../useConnect'

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`
const mockOtherAddress = faker.finance.ethereumAddress() as `0x${string}`

const mockRouterPush = jest.fn()
const mockDisconnect = jest.fn()
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
  useAppKit: () => ({ disconnect: mockDisconnect }),
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

  it('does nothing when connect is rejected', async () => {
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
  })
})
