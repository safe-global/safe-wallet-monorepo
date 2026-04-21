import { Alert } from 'react-native'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { renderHook, act, waitFor } from '@/src/tests/test-utils'
import { useImportSignerFlow } from '../useImportSignerFlow'
import { UserRejectedError } from '../useConnect'
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
const mockValidateAddressOwnership = jest.fn()
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

  it('calls connect when initiateConnection is called', async () => {
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

  it('navigates to error when validation throws', async () => {
    mockValidateAddressOwnership.mockRejectedValue(new Error('Network error'))

    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectResolve({ address: mockAddress, walletName: 'MetaMask', walletIcon: 'icon' })
    })

    await waitFor(() => {
      expect(mockRouterPush).not.toHaveBeenCalled()
    })
  })

  it('does nothing when connect is rejected (user rejected)', async () => {
    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectReject(new UserRejectedError())
    })

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
    expect(mockRouterPush).not.toHaveBeenCalled()
  })

  it('does nothing when connect fails (connection error)', async () => {
    const { result } = renderImportFlow()

    act(() => {
      result.current.initiateConnection()
    })

    await act(async () => {
      mockConnectReject(new Error('Connection failed'))
    })

    expect(mockValidateAddressOwnership).not.toHaveBeenCalled()
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
