import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import type { JsonRpcProvider } from 'ethers'
import { useBytecodeComparison } from '../useBytecodeComparison'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { makeStore, setStoreInstance } from '@/store'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import { isSmartContract } from '@/utils/wallets'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: jest.fn(() => undefined) }))

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock

const IMPLEMENTATION = '0x0000000000000000000000000000000000000abc'

const unknownSafe = {
  implementationVersionState: ImplementationVersionState.UNKNOWN,
  version: '1.3.0',
  chainId: '1',
  implementation: { value: IMPLEMENTATION },
  address: { value: '0x0000000000000000000000000000000000000001' },
}

describe('useBytecodeComparison', () => {
  let getCode: jest.Mock
  let store: ReturnType<typeof makeStore>
  let wrapper: ({ children }: { children: ReactNode }) => ReactElement

  beforeEach(() => {
    jest.clearAllMocks()

    store = makeStore(undefined, { skipBroadcast: true })
    setStoreInstance(store)
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>

    getCode = jest.fn().mockResolvedValue('0x1234')
    mockUseSafeInfo.mockReturnValue({ safe: unknownSafe })

    jest
      .spyOn(web3ReadOnly, 'getWeb3ReadOnly')
      .mockImplementation(
        () => ({ getCode, getNetwork: async () => ({ chainId: BigInt(1) }) }) as unknown as JsonRpcProvider,
      )
    jest
      .spyOn(web3ReadOnly, 'useWeb3ReadOnly')
      .mockImplementation(
        () => ({ getCode, getNetwork: async () => ({ chainId: BigInt(1) }) }) as unknown as JsonRpcProvider,
      )
  })

  it('fetches bytecode only once for two concurrent consumers of the same implementation', async () => {
    const { result } = renderHook(() => ({ a: useBytecodeComparison(), b: useBytecodeComparison() }), { wrapper })

    await waitFor(() => expect(result.current.a.isLoading).toBe(false))

    expect(getCode).toHaveBeenCalledTimes(1)
    expect(result.current.a.result).toEqual({ isMatch: false })
    expect(result.current.b.result).toEqual({ isMatch: false })
  })

  it('serves the cached result on remount without a second getCode', async () => {
    const first = renderHook(() => useBytecodeComparison(), { wrapper })
    await waitFor(() => expect(getCode).toHaveBeenCalledTimes(1))
    first.unmount()

    const second = renderHook(() => useBytecodeComparison(), { wrapper })
    await waitFor(() => expect(second.result.current.result).toEqual({ isMatch: false }))

    expect(second.result.current.isLoading).toBe(false)
    expect(getCode).toHaveBeenCalledTimes(1)
  })

  it('reuses bytecode already read by another consumer of the same address', async () => {
    await isSmartContract('1', IMPLEMENTATION)
    expect(getCode).toHaveBeenCalledTimes(1)

    const { result } = renderHook(() => useBytecodeComparison(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.result).toEqual({ isMatch: false })
    expect(getCode).toHaveBeenCalledTimes(1)
  })
})
