import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { renderHook } from '@/tests/test-utils'
import { useInitSafeCoreSDK } from '@/hooks/coreSDK/useInitSafeCoreSDK'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import * as router from 'next/router'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as coreSDK from '@/hooks/coreSDK/safeCoreSDK'
import { waitFor } from '@testing-library/react'
import type Safe from '@safe-global/protocol-kit'
import { type JsonRpcProvider } from 'ethers'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'

const mockTrackError = jest.fn()
jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  trackError: (...args: unknown[]) => mockTrackError(...args),
}))

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

  const deferred = () => {
    let resolve!: (value: Safe | undefined) => void
    let reject!: (reason: Error) => void
    const promise = new Promise<Safe | undefined>((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }

  const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0))

  beforeEach(() => {
    jest.clearAllMocks()

    mockProvider = jest.fn() as unknown as JsonRpcProvider
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(mockProvider)
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
      isL2Chain: undefined,
      isZkChain: undefined,
    })

    await waitFor(() => {
      expect(setSDKMock).toHaveBeenCalledWith(mockSafe)
    })
  })

  it('does not initialize a Core SDK instance if the safe info is not loaded', async () => {
    const initMock = jest.spyOn(coreSDK, 'initSafeSDK')
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
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

    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(undefined)

    renderHook(() => useInitSafeCoreSDK())

    expect(initMock).not.toHaveBeenCalled()
    expect(setSDKMock).toHaveBeenCalledWith(undefined)
  })

  it('does not initialize a Core SDK instance if the loaded Safe does not match that in the URL', async () => {
    const initMock = jest.spyOn(coreSDK, 'initSafeSDK')
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    jest.spyOn(router, 'useRouter').mockReturnValue({ query: {} } as unknown as router.NextRouter)

    renderHook(() => useInitSafeCoreSDK())

    expect(initMock).not.toHaveBeenCalled()
    expect(setSDKMock).toHaveBeenCalledWith(undefined)
  })

  it('clears the SDK and reports an error when initialization fails', async () => {
    const error = new Error('RPC unreachable')
    jest.spyOn(coreSDK, 'initSafeSDK').mockRejectedValue(error)
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    renderHook(() => useInitSafeCoreSDK())

    await waitFor(() => {
      expect(setSDKMock).toHaveBeenCalledWith(undefined)
    })

    expect(mockTrackError).toHaveBeenCalledWith(ErrorCodes._105, error.message, expect.anything())
  })

  it('does not clear the SDK when a superseded run fails', async () => {
    const { promise, reject } = deferred()
    jest.spyOn(coreSDK, 'initSafeSDK').mockReturnValue(promise)
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    const { unmount } = renderHook(() => useInitSafeCoreSDK())
    unmount()

    reject(new Error('RPC unreachable'))
    await flushMicrotasks()

    expect(setSDKMock).not.toHaveBeenCalled()
    expect(mockTrackError).not.toHaveBeenCalled()
  })

  it('does not overwrite the SDK when a superseded run succeeds', async () => {
    const { promise, resolve } = deferred()
    jest.spyOn(coreSDK, 'initSafeSDK').mockReturnValue(promise)
    const setSDKMock = jest.spyOn(coreSDK, 'setSafeSDK')

    const { unmount } = renderHook(() => useInitSafeCoreSDK())
    unmount()

    resolve({} as Safe)
    await flushMicrotasks()

    expect(setSDKMock).not.toHaveBeenCalled()
  })
})
