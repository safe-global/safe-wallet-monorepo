import { renderHook } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSpendingLimitTokenOptions from '../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import type { TokenOption } from '../../../SpendingLimitFlow/utils/tokenOptions'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import useHeldTokenAddresses from '../useHeldTokenAddresses'

jest.mock('../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions')
jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))

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
  beforeEach(() => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ chainId: '11155111' })
  })

  it('returns only the held tokens as addresses and keeps every option', () => {
    const options = [option(ZERO_ADDRESS, 'held'), option(USDC, 'held'), option(DAI, 'popular')]
    read({ options })

    const { result } = renderHook(() => useHeldTokenAddresses())

    expect(result.current.addresses).toEqual([ZERO_ADDRESS, USDC])
    expect(result.current.options).toEqual(options)
  })

  it('drops the native token on a chain without a native transfer policy', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ chainId: '1' })
    read({ options: [option(ZERO_ADDRESS, 'held'), option(USDC, 'held')] })

    const { result } = renderHook(() => useHeldTokenAddresses())

    expect(result.current.addresses).toEqual([USDC])
    expect(result.current.options.map(({ address }) => address)).toEqual([USDC])
  })

  it('keeps the native token on a chain with a native transfer policy', () => {
    ;(useSafeScope as jest.Mock).mockReturnValue({ chainId: '11155111' })
    read({ options: [option(ZERO_ADDRESS, 'held'), option(USDC, 'held')] })

    const { result } = renderHook(() => useHeldTokenAddresses())

    expect(result.current.addresses).toEqual([ZERO_ADDRESS, USDC])
    expect(result.current.options.map(({ address }) => address)).toEqual([ZERO_ADDRESS, USDC])
  })

  it('passes loading, error and retry through', () => {
    const refetch = read({ isLoading: true, isError: true })

    const { result } = renderHook(() => useHeldTokenAddresses())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isError).toBe(true)
    result.current.refetch()
    expect(refetch).toHaveBeenCalled()
  })

  it('passes the popular list state and the account identity through', () => {
    read({ isPopularLoading: true, isPopularError: true, identityKey: '1:0xabc' })

    const { result } = renderHook(() => useHeldTokenAddresses())

    expect(result.current.isPopularLoading).toBe(true)
    expect(result.current.isPopularError).toBe(true)
    expect(result.current.identityKey).toBe('1:0xabc')
  })
})
