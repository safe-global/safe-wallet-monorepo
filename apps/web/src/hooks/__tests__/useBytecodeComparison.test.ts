import { renderHook, waitFor } from '@/tests/test-utils'
import { useBytecodeComparison, _resetBytecodeComparisonCache } from '../useBytecodeComparison'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/wallets/web3', () => ({ useWeb3ReadOnly: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ useCurrentChain: jest.fn(() => undefined) }))

const mockUseSafeInfo = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
const mockUseWeb3ReadOnly = jest.requireMock('@/hooks/wallets/web3').useWeb3ReadOnly as jest.Mock

const IMPLEMENTATION = '0x0000000000000000000000000000000000000abc'

const unknownSafe = {
  implementationVersionState: ImplementationVersionState.UNKNOWN,
  version: '1.3.0',
  chainId: '1',
  implementation: { value: IMPLEMENTATION },
  address: { value: '0x0000000000000000000000000000000000000001' },
}

describe('useBytecodeComparison caching', () => {
  let getCode: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    _resetBytecodeComparisonCache()
    getCode = jest.fn().mockResolvedValue('0x1234')
    mockUseSafeInfo.mockReturnValue({ safe: unknownSafe })
    mockUseWeb3ReadOnly.mockReturnValue({ getCode })
  })

  it('fetches bytecode only once for two concurrent consumers of the same implementation', async () => {
    const { result } = renderHook(() => ({ a: useBytecodeComparison(), b: useBytecodeComparison() }))

    await waitFor(() => expect(result.current.a.isLoading).toBe(false))

    expect(getCode).toHaveBeenCalledTimes(1)
    expect(result.current.a.result).toEqual({ isMatch: false })
    expect(result.current.b.result).toEqual({ isMatch: false })
  })

  it('serves the cached result on remount without a second getCode', async () => {
    const first = renderHook(() => useBytecodeComparison())
    await waitFor(() => expect(getCode).toHaveBeenCalledTimes(1))
    first.unmount()

    const second = renderHook(() => useBytecodeComparison())
    await waitFor(() => expect(second.result.current.result).toEqual({ isMatch: false }))

    expect(second.result.current.isLoading).toBe(false)
    expect(getCode).toHaveBeenCalledTimes(1)
  })
})
