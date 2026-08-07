import { Alert } from 'react-native'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useImportSignerFlow } from '../useImportSignerFlow'
import { ConnectError } from '../useConnect'
import Logger from '@/src/utils/logger'
import type { ConnectResult } from '../useConnect'
import type { Signer } from '@/src/store/signersSlice'

jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)

jest.mock('@/src/utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}))

const mockAddress = faker.finance.ethereumAddress() as `0x${string}`
const checksumAddress = getAddress(mockAddress)

const mockRouterPush = jest.fn()
const mockDisconnect = jest.fn()
const mockClose = jest.fn()
const mockValidateAddressOwnership = jest.fn()
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

jest.mock('@/src/hooks/useAddressOwnershipValidation', () => ({
  useAddressOwnershipValidation: () => ({ validateAddressOwnership: mockValidateAddressOwnership }),
}))

jest.mock('../useSwitchNetwork', () => ({
  useSwitchNetwork: () => ({ switchNetworkIfNeeded: mockSwitchNetworkIfNeeded }),
}))

jest.mock('../useConnect', () => ({
  ...jest.requireActual('../useConnect'),
  useConnect: () => mockConnect,
}))

const renderImportFlow = (initialStore?: { signers?: Record<string, Signer> }) =>
  renderHook(() => useImportSignerFlow(), initialStore)

describe('useImportSignerFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls connect when initiateConnection is called', () => {
    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    expect(mockConnect).toHaveBeenCalled()
  })

  it('navigates to name-signer when connected address is an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectResolve({ address: mockAddress, walletName: 'MetaMask', walletIcon: 'icon' })
    })

    await waitFor(() => {
      expect(mockValidateAddressOwnership).toHaveBeenCalledWith(checksumAddress)
      expect(mockSwitchNetworkIfNeeded).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/name-signer',
          params: expect.objectContaining({
            address: checksumAddress,
            walletName: 'MetaMask',
          }),
        }),
      )
    })
  })

  it('disconnects and navigates to error when connected address is not an owner', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: false })

    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectResolve({ address: mockAddress, walletName: 'MetaMask', walletIcon: 'icon' })
    })

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/import-signers/connect-signer-error',
          params: expect.objectContaining({
            address: checksumAddress,
            walletIcon: 'icon',
          }),
        }),
      )
    })
  })

  it('short-circuits silently when connect resolves null (useConnect handled the cancel/unsupported case)', async () => {
    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectResolve(null)
    })

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
    expect(mockDisconnect).not.toHaveBeenCalled()
    expect(Alert.alert).not.toHaveBeenCalled()
    // The flow's catch must not run for the null path — no fallback log either.
    expect(Logger.error).not.toHaveBeenCalled()
  })

  it('disconnects, closes the modal, then alerts when connect rejects with a catastrophic ConnectError', async () => {
    const { result } = renderImportFlow()
    const connectError = new ConnectError('Connection failed')

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectReject(connectError)
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error during signer import', expect.any(String), expect.any(Array))
    })

    expect(Logger.error).toHaveBeenCalledWith('Error during signer import:', connectError)
    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalled()
    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
    // Modal must dismiss before the alert renders so the alert isn't hosted by
    // the dismissing modal on iOS.
    const closeOrder = mockClose.mock.invocationCallOrder[0]
    const alertOrder = (Alert.alert as jest.Mock).mock.invocationCallOrder[0]
    expect(closeOrder).toBeLessThan(alertOrder)
  })

  it('captures async rejection from disconnect() during fallback cleanup without dropping close/alert', async () => {
    const { result } = renderImportFlow()
    const connectError = new ConnectError('Connection failed')
    const disconnectRejection = new Error('relay teardown failed')
    mockDisconnect.mockRejectedValueOnce(disconnectRejection)

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectReject(connectError)
    })

    await waitFor(() => {
      expect(Logger.warn).toHaveBeenCalledWith(
        'Failed to disconnect WC session after signer import error:',
        disconnectRejection,
      )
    })

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Error during signer import', expect.any(String), expect.any(Array))
  })

  it('runs the fallback alert when validation throws after a successful connect', async () => {
    const validationError = new Error('Network error')
    mockValidateAddressOwnership.mockRejectedValue(validationError)

    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectResolve({ address: mockAddress, walletName: 'MetaMask', walletIcon: 'icon' })
    })

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error during signer import', expect.any(String), expect.any(Array))
    })

    expect(Logger.error).toHaveBeenCalledWith('Error during signer import:', validationError)
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('disconnects and shows alert when a different-type signer exists for the address', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })

    const existing: Signer = {
      value: checksumAddress,
      name: 'Existing PK',
      logoUri: null,
      type: 'private-key',
    }

    const { result } = renderImportFlow({ signers: { [checksumAddress]: existing } })

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectResolve({ address: mockAddress, walletName: 'MetaMask', walletIcon: 'icon' })
    })

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
      expect(Alert.alert).toHaveBeenCalledWith('Signer already imported', expect.any(String), expect.any(Array))
    })

    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('logs error and continues when disconnect fails during collision', async () => {
    mockValidateAddressOwnership.mockResolvedValue({ isOwner: true })
    const disconnectError = new Error('teardown failed')
    mockDisconnect.mockRejectedValueOnce(disconnectError)

    const existing: Signer = {
      value: checksumAddress,
      name: 'Existing PK',
      logoUri: null,
      type: 'private-key',
    }

    const { result } = renderImportFlow({ signers: { [checksumAddress]: existing } })

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectResolve({ address: mockAddress, walletName: 'MetaMask', walletIcon: 'icon' })
    })

    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled()
      expect(Logger.error).toHaveBeenCalledWith('Failed to disconnect WC session after collision:', disconnectError)
    })

    expect(Alert.alert).toHaveBeenCalledWith('Signer already imported', expect.any(String), expect.any(Array))
    expect(mockSwitchNetworkIfNeeded).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })
})
