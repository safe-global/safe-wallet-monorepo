import { renderHook } from '@/tests/test-utils'
import { useFeesPreview } from '../useFeesPreview'
import * as useGasLimitModule from '@/hooks/useGasLimit'
import * as useGasPriceModule from '@/hooks/useGasPrice'
import * as useChainsModule from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { toBeHex } from 'ethers'

describe('useFeesPreview', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns loading state when safeTx is null', () => {
    jest.spyOn(useGasLimitModule, 'default').mockReturnValue({ gasLimit: undefined, gasLimitLoading: false })
    jest.spyOn(useGasPriceModule, 'default').mockReturnValue([undefined, undefined, false] as never)
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(undefined)

    const { result } = renderHook(() => useFeesPreview())

    expect(result.current.loading).toBe(true)
  })

  it('returns loading state when gas limit is loading', () => {
    jest.spyOn(useGasLimitModule, 'default').mockReturnValue({ gasLimit: undefined, gasLimitLoading: true })
    jest.spyOn(useGasPriceModule, 'default').mockReturnValue([undefined, undefined, false] as never)
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(chainBuilder().build())

    const { result } = renderHook(() => useFeesPreview())

    expect(result.current.loading).toBe(true)
  })

  it('returns loading state when gas price is loading', () => {
    jest.spyOn(useGasLimitModule, 'default').mockReturnValue({ gasLimit: BigInt(21000), gasLimitLoading: false })
    jest.spyOn(useGasPriceModule, 'default').mockReturnValue([undefined, undefined, true] as never)
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(chainBuilder().build())

    const { result } = renderHook(() => useFeesPreview())

    expect(result.current.loading).toBe(true)
  })

  it('returns formatted gas fee when all data is available', () => {
    const chain = chainBuilder()
      .with({ nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' } })
      .build()

    jest.spyOn(useGasLimitModule, 'default').mockReturnValue({ gasLimit: BigInt(21000), gasLimitLoading: false })
    jest
      .spyOn(useGasPriceModule, 'default')
      .mockReturnValue([
        { maxFeePerGas: BigInt(toBeHex(20000000000)), maxPriorityFeePerGas: undefined },
        undefined,
        false,
      ] as never)
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(chain)

    const { result } = renderHook(() => useFeesPreview())

    expect(result.current.loading).toBe(true) // safeTx is still null from context
    expect(result.current.gasFee.currency).toBe('ETH')
    expect(result.current.gasFee.label).toBe('Gas fee')
  })

  it('falls back to ETH when chain symbol is unavailable', () => {
    jest.spyOn(useGasLimitModule, 'default').mockReturnValue({ gasLimit: undefined, gasLimitLoading: false })
    jest.spyOn(useGasPriceModule, 'default').mockReturnValue([undefined, undefined, false] as never)
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(undefined)

    const { result } = renderHook(() => useFeesPreview())

    expect(result.current.gasFee.currency).toBe('ETH')
  })
})
