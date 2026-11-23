import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import useSpendingLimitTokenOptions from '../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import type { TokenOption } from '../../../SpendingLimitFlow/utils/tokenOptions'
import { useAllowlistAddressInfo } from '../useAllowlistAddressInfo'

const mockResolveName = jest.fn()

jest.mock('../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions')
jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: jest.fn(),
}))
jest.mock('@/hooks/useAllAddressBooks', () => ({
  useSafeNameResolver: () => mockResolveName,
}))

const mockOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>

const CHAIN_ID = '11155111'

const tokenOption = (overrides: Partial<TokenOption> = {}): TokenOption => ({
  address: faker.finance.ethereumAddress(),
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  logoUri: 'https://example.com/usdc.png',
  group: 'held',
  ...overrides,
})

const withOptions = (options: TokenOption[]) => {
  mockOptions.mockReturnValue({
    options,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isPopularLoading: false,
    isPopularError: false,
    refetchPopular: jest.fn(),
    identityKey: `${CHAIN_ID}:0x1`,
  })
}

describe('useAllowlistAddressInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSafeScope as jest.Mock).mockReturnValue({ chainId: CHAIN_ID })
    mockResolveName.mockReturnValue('')
    withOptions([])
  })

  it('should return the token symbol and logo, when the address is a token option in another case', () => {
    const token = tokenOption()
    withOptions([token])

    const { result } = renderHook(() => useAllowlistAddressInfo())

    expect(result.current(token.address.toLowerCase())).toEqual({ name: 'USDC', logoUri: token.logoUri })
  })

  it('should return the token name, when the token option has no symbol', () => {
    const token = tokenOption({ symbol: '' })
    withOptions([token])

    const { result } = renderHook(() => useAllowlistAddressInfo())

    expect(result.current(token.address).name).toBe('USD Coin')
  })

  it('should return the given name, when the address is named and not a token', () => {
    const address = faker.finance.ethereumAddress()
    mockResolveName.mockReturnValue('Address book name')

    const { result } = renderHook(() => useAllowlistAddressInfo([{ address, name: 'Treasury' }]))

    expect(result.current(address)).toEqual({ name: 'Treasury' })
  })

  it("should return the address book name on the Safe's chain, when the named entry has no name", () => {
    const address = faker.finance.ethereumAddress()
    mockResolveName.mockReturnValue('Address book name')

    const { result } = renderHook(() => useAllowlistAddressInfo([{ address }]))

    expect(result.current(address)).toEqual({ name: 'Address book name' })
    expect(mockResolveName).toHaveBeenCalledWith(address, CHAIN_ID)
  })

  it('should return no name, when neither the tokens nor the address book know the address', () => {
    const { result } = renderHook(() => useAllowlistAddressInfo())

    expect(result.current(faker.finance.ethereumAddress())).toEqual({ name: undefined })
  })
})
