import { faker } from '@faker-js/faker'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { renderHook } from '@/src/tests/test-utils'
import { useBalance, useTokenBalances } from './useBalance'

const mockUseBalances = jest.fn()
jest.mock('@/src/hooks/useBalances', () => ({
  useBalances: (...args: unknown[]) => mockUseBalances(...args),
}))

const tokenAddress = faker.finance.ethereumAddress()

const balancesWith = (address: string): { balances: Balances } => ({
  balances: {
    fiatTotal: '0',
    items: [
      {
        tokenInfo: { type: 'ERC20', address, decimals: 6, symbol: 'USDC', name: 'USD Coin', logoUri: '' },
        balance: '100000000',
        fiatBalance: '100',
        fiatConversion: '1',
      },
    ],
  } as unknown as Balances,
})

describe('useTokenBalances', () => {
  beforeEach(() => jest.clearAllMocks())

  it('serves tokens from the trusted set and keeps the untrusted query skipped', () => {
    mockUseBalances.mockReturnValue(balancesWith(tokenAddress))

    const { result } = renderHook(() => useTokenBalances([tokenAddress]))

    expect(result.current?.items).toHaveLength(1)
    expect(mockUseBalances).toHaveBeenCalledWith(false, undefined, false, true)
  })

  it('widens to untrusted balances when a token is missing from the trusted set', () => {
    const emptyTrusted = { balances: { fiatTotal: '0', items: [] } as unknown as Balances }
    mockUseBalances.mockImplementation((...args: unknown[]) =>
      args[2] === false ? balancesWith(tokenAddress) : emptyTrusted,
    )

    const { result } = renderHook(() => useTokenBalances([tokenAddress]))

    expect(mockUseBalances).toHaveBeenCalledWith(false, undefined, false, false)
    expect(result.current?.items?.[0]?.balance).toEqual('100000000')
  })

  it('keeps the untrusted query skipped without token addresses or while trusted balances load', () => {
    mockUseBalances.mockReturnValue({ balances: undefined })
    renderHook(() => useTokenBalances(undefined))
    expect(mockUseBalances).toHaveBeenCalledWith(false, undefined, false, true)

    renderHook(() => useTokenBalances([tokenAddress]))
    expect(mockUseBalances).toHaveBeenLastCalledWith(false, undefined, false, true)
  })
})

describe('useBalance', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the balance entry for the token', () => {
    mockUseBalances.mockReturnValue(balancesWith(tokenAddress))

    const { result } = renderHook(() => useBalance(tokenAddress.toUpperCase().replace('0X', '0x')))

    expect(result.current?.balance).toEqual('100000000')
    expect(result.current?.tokenInfo.symbol).toEqual('USDC')
  })

  it('returns undefined without an address or when the Safe does not hold the token', () => {
    mockUseBalances.mockReturnValue(balancesWith(tokenAddress))

    const { result: noAddress } = renderHook(() => useBalance(undefined))
    expect(noAddress.current).toBeUndefined()

    const { result: notHeld } = renderHook(() => useBalance(faker.finance.ethereumAddress()))
    expect(notHeld.current).toBeUndefined()
  })
})
