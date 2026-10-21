import { renderHook } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSpendingLimitTokenOptions from '../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import type { TokenOption } from '../../../SpendingLimitFlow/utils/tokenOptions'
import useHeldTokenAddresses from '../useHeldTokenAddresses'

jest.mock('../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions')

const mockOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>

const USDC = '0x00000000000000000000000000000000000000a1'
const DAI = '0x00000000000000000000000000000000000000b2'

const option = (address: string, group: TokenOption['group']): TokenOption => ({
  address,
  symbol: 'TKN',
  name: 'Token',
  decimals: 18,
  group,
})

const read = (overrides: Partial<ReturnType<typeof useSpendingLimitTokenOptions>>) => {
  const refetch = jest.fn()
  mockOptions.mockReturnValue({
    options: [],
    isLoading: false,
    isError: false,
    refetch,
    isPopularLoading: false,
    isPopularError: false,
    refetchPopular: jest.fn(),
    identityKey: '1:0x1',
    ...overrides,
  })
  return refetch
}

describe('useHeldTokenAddresses', () => {
  it('returns only the held tokens as addresses and keeps every option', () => {
    const options = [option(ZERO_ADDRESS, 'held'), option(USDC, 'held'), option(DAI, 'popular')]
    read({ options })

    const { result } = renderHook(() => useHeldTokenAddresses())

    expect(result.current.addresses).toEqual([ZERO_ADDRESS, USDC])
    expect(result.current.options).toEqual(options)
  })

  it('passes loading, error and retry through', () => {
    const refetch = read({ isLoading: true, isError: true })

    const { result } = renderHook(() => useHeldTokenAddresses())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(true)
    result.current.refetch()
    expect(refetch).toHaveBeenCalled()
  })
})
