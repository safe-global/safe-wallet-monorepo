import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { renderHook } from '@/tests/test-utils'
import { useInitSafeCoreSDK } from '@/hooks/coreSDK/useInitSafeCoreSDK'
import * as web3 from '@/hooks/wallets/web3'
import * as router from 'next/router'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as coreSDK from '@/hooks/coreSDK/safeCoreSDK'
import { ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'
import { waitFor } from '@testing-library/react'
import type Safe from '@safe-global/protocol-kit'
import { type JsonRpcProvider } from 'ethers'

describe('useInitSafeCoreSDK hook', () => {
  const mockSafeAddress = '0x0000000000000000000000000000000000005AFE'

  const mockSafeInfo = {
    safe: {
      chainId: '5',
      address: {
        value: mockSafeAddress,
      },
      version: '1.3.0',
      implementation: {
        value: '0x1',
      },
      implementationVersionState: ImplementationVersionState.UP_TO_DATE,
    } as ExtendedSafeInfo,
    safeAddress: mockSafeAddress,
    safeLoaded: true,
    safeError: undefined,
    safeLoading: true,
  }

  let mockProvider: JsonRpcProvider

  beforeEach(() => {
    jest.clearAllMocks()

    mockProvider = jest.fn() as unknown as JsonRpcProvider
    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(mockProvider)
    jest.spyOn(useSafeInfo, 'default').mockReturnValue(mockSafeInfo)
    jest
      .spyOn(router, 'useRouter')
      .mockReturnValue({ query: { safe: `gno:${mockSafeAddress}` } } as unknown as router.NextRouter)
  })

  it('initializes a Core SDK instance', async () => {
    const mockSafe = {} as Safe
    const initMock = jest.spyOn(coreSDK, 'initSafeSDK').mockReturnValue(Promise.resolve(mockSafe))
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    jest.spyOn(useSafeInfo, 'default').mockReturnValueOnce(mockSafeInfo)

    renderHook(() => useInitSafeCoreSDK())

    expect(initMock).toHaveBeenCalledWith({
      ...mockSafeInfo.safe,
      provider: mockProvider,
      address: mockSafeInfo.safe.address.value,
      implementation: mockSafeInfo.safe.implementation.value,
      undeployedSafe: undefined,
    })

    await waitFor(() => {
      expect(setSDKMock).toHaveBeenCalledWith(mockSafe)
    })
  })

  it('does not initialize a Core SDK instance if the safe info is not loaded', async () => {
    const initMock = jest.spyOn(coreSDK, 'initSafeSDK')
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    jest.spyOn(useSafeInfo, 'default').mockReturnValueOnce({
      ...mockSafeInfo,
      safeLoaded: false,
    })

    renderHook(() => useInitSafeCoreSDK())

    expect(initMock).not.toHaveBeenCalled()
    expect(setSDKMock).toHaveBeenCalledWith(undefined)
  })

  it('does not initialize a Core SDK instance if the provider is not initialized', async () => {
    const initMock = jest.spyOn(coreSDK, 'initSafeSDK')
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValueOnce(undefined)

    renderHook(() => useInitSafeCoreSDK())

    expect(initMock).not.toHaveBeenCalled()
    expect(setSDKMock).toHaveBeenCalledWith(undefined)
  })

  it('does not initialize a Core SDK instance if the loaded Safe does not match that in the URL', async () => {
    const initMock = jest.spyOn(coreSDK, 'initSafeSDK')
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    jest.spyOn(router, 'useRouter').mockReturnValueOnce({ query: {} } as unknown as router.NextRouter)

    renderHook(() => useInitSafeCoreSDK())

    expect(initMock).not.toHaveBeenCalled()
    expect(setSDKMock).toHaveBeenCalledWith(undefined)
  })
})
