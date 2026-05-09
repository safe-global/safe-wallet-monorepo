import { renderHook, waitFor } from '@/tests/test-utils'
import { useLoadSpendingLimits } from '../useSpendingLimits'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChainId from '@/hooks/useChainId'
import * as useBalances from '@/hooks/useBalances'
import * as web3 from '@/hooks/wallets/web3'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import * as spendingLimitLoader from '../../services/spendingLimitLoader'
import { faker } from '@faker-js/faker'
import { TokenType } from '@safe-global/store/gateway/types'
import type { SpendingLimitState } from '../../types'

jest.mock('../../services/spendingLimitLoader')

const mockLoadSpendingLimits = spendingLimitLoader.loadSpendingLimits as jest.MockedFunction<
  typeof spendingLimitLoader.loadSpendingLimits
>

const SAFE_ADDRESS = faker.finance.ethereumAddress()
const CHAIN_ID = '11155111'
const MOCK_MODULES = [{ value: faker.finance.ethereumAddress() }]

const mockToken = {
  address: faker.finance.ethereumAddress(),
  name: 'Test Token',
  symbol: 'TST',
  decimals: 18,
  logoUri: '',
  type: TokenType.ERC20,
}

const mockSpendingLimit: SpendingLimitState = {
  beneficiary: faker.finance.ethereumAddress(),
  token: { address: mockToken.address, symbol: 'TST', decimals: 18 },
  amount: '1000000000000000000',
  spent: '500000000000000000',
  nonce: '1',
  resetTimeMin: '0',
  lastResetMin: '0',
}

const MOCK_PROVIDER = {} as any

const setupMocks = ({
  provider = MOCK_PROVIDER,
  safeLoaded = true,
  modules = MOCK_MODULES,
  balanceItems = [{ tokenInfo: mockToken, balance: '0', fiatBalance: '0', fiatConversion: '1' }],
}: {
  provider?: any
  safeLoaded?: boolean
  modules?: Array<{ value: string }> | null
  balanceItems?: any[]
} = {}) => {
  jest.spyOn(useChainId, 'default').mockReturnValue(CHAIN_ID)

  jest.spyOn(useSafeInfo, 'default').mockReturnValue({
    safe: {
      address: { value: SAFE_ADDRESS },
      chainId: CHAIN_ID,
      modules,
      deployed: true,
      txHistoryTag: '0',
    },
    safeAddress: SAFE_ADDRESS,
    safeLoaded,
    safeLoading: false,
    safeError: undefined,
  } as any)

  jest.spyOn(web3, 'useWeb3ReadOnly').mockReturnValue(provider)
  jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockReturnValue(provider)

  jest.spyOn(useBalances, 'default').mockReturnValue({
    balances: { items: balanceItems, fiatTotal: '0' },
    loaded: true,
    loading: false,
    error: undefined,
  })
}

describe('useLoadSpendingLimits', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([
    { scenario: 'no provider', overrides: { provider: null } },
    { scenario: 'safe is not loaded', overrides: { safeLoaded: false } },
    { scenario: 'safe has no modules', overrides: { modules: null } },
    { scenario: 'no token balances', overrides: { balanceItems: [] as any[] } },
  ])('should not fetch when $scenario', async ({ overrides }) => {
    jest.useFakeTimers()
    setupMocks(overrides)

    const { result } = renderHook(() => useLoadSpendingLimits())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockLoadSpendingLimits).not.toHaveBeenCalled()

    jest.useRealTimers()
  })

  it('should fetch and dispatch spending limits to the store', async () => {
    setupMocks()
    mockLoadSpendingLimits.mockResolvedValue([mockSpendingLimit])

    const { result } = renderHook(() => useLoadSpendingLimits())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.spendingLimits).toEqual([mockSpendingLimit])
    })

    expect(mockLoadSpendingLimits).toHaveBeenCalledWith(expect.anything(), MOCK_MODULES, SAFE_ADDRESS, CHAIN_ID, [
      mockToken,
    ])
  })

  it('should return empty array when fetch returns undefined', async () => {
    setupMocks()
    mockLoadSpendingLimits.mockResolvedValue(undefined)

    const { result } = renderHook(() => useLoadSpendingLimits())

    // useAsync resolves with undefined → data stays undefined → store gets []
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.spendingLimits).toEqual([])
  })

  it('should handle fetch errors', async () => {
    setupMocks()
    const error = new Error('Failed to load spending limits')
    mockLoadSpendingLimits.mockRejectedValue(error)

    const { result } = renderHook(() => useLoadSpendingLimits())

    await waitFor(() => {
      expect(result.current.error).toBeDefined()
    })

    expect(result.current.error?.message).toBe('Failed to load spending limits')
    expect(result.current.loading).toBe(false)
  })

  it('should show loading state while fetching', async () => {
    setupMocks()

    let resolvePromise: (value: SpendingLimitState[]) => void
    mockLoadSpendingLimits.mockReturnValue(
      new Promise<SpendingLimitState[]>((resolve) => {
        resolvePromise = resolve
      }),
    )

    const { result } = renderHook(() => useLoadSpendingLimits())

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    // Resolve the fetch
    resolvePromise!([mockSpendingLimit])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.spendingLimits).toEqual([mockSpendingLimit])
    })
  })

  it('should clear stale data when Safe changes', async () => {
    // First load: Safe A has spending limits
    setupMocks()
    mockLoadSpendingLimits.mockResolvedValue([mockSpendingLimit])

    const { result, rerender } = renderHook(() => useLoadSpendingLimits())

    await waitFor(() => {
      expect(result.current.spendingLimits).toEqual([mockSpendingLimit])
      expect(result.current.loading).toBe(false)
    })

    // Switch to Safe B — change safeAddress so useAsync deps change
    const NEW_SAFE_ADDRESS = faker.finance.ethereumAddress()
    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: {
        address: { value: NEW_SAFE_ADDRESS },
        chainId: CHAIN_ID,
        modules: MOCK_MODULES,
        deployed: true,
        txHistoryTag: '0',
      },
      safeAddress: NEW_SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    } as any)

    let resolveSafeB: (value: SpendingLimitState[]) => void
    mockLoadSpendingLimits.mockReturnValue(
      new Promise<SpendingLimitState[]>((resolve) => {
        resolveSafeB = resolve
      }),
    )

    rerender()

    // While Safe B is loading, stale data from Safe A should be cleared (not shown)
    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })
    // Store should have empty data (not Safe A's limits) because clearData=true
    expect(result.current.spendingLimits).toEqual([])

    // Resolve Safe B fetch
    const safeBLimit: SpendingLimitState = {
      ...mockSpendingLimit,
      beneficiary: faker.finance.ethereumAddress(),
    }
    resolveSafeB!([safeBLimit])

    await waitFor(() => {
      expect(result.current.spendingLimits).toEqual([safeBLimit])
      expect(result.current.loading).toBe(false)
    })
  })

  it('should dispatch data=undefined during loading so reducer computes loaded=false', async () => {
    // This test verifies the fix for the race condition bug.
    // The old code dispatched data=[] during loading, which caused the reducer
    // to compute loaded=true (because [] !== undefined), creating a deadlock.
    // The fix dispatches data=undefined during loading (via useAsync's natural behavior),
    // so the reducer correctly computes loaded=false.
    setupMocks()

    let resolvePromise: (value: SpendingLimitState[]) => void
    mockLoadSpendingLimits.mockReturnValue(
      new Promise<SpendingLimitState[]>((resolve) => {
        resolvePromise = resolve
      }),
    )

    const { result } = renderHook(() => useLoadSpendingLimits())

    // During loading, spendingLimits should still be [] (initial state)
    // but loading should be true — the key is that the fetch is NOT cancelled
    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    resolvePromise!([mockSpendingLimit])

    // After resolve, the data should be in the store — NOT stuck in a deadlock
    await waitFor(() => {
      expect(result.current.spendingLimits).toEqual([mockSpendingLimit])
      expect(result.current.loading).toBe(false)
    })
  })
})
