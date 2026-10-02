import { renderHook } from '@/tests/test-utils'
import { buildSafeAccountId, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { isSafeAccountGroup, type SafeAccountOption } from '../../../SafeAccountSelector/types'
import { useEligibleSafeAccounts } from '../../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { useSpendingLimitSafeAccounts } from '../useSpendingLimitSafeAccounts'

jest.mock('../../../SafeAccountSelector/hooks/useEligibleSafeAccounts', () => ({
  useEligibleSafeAccounts: jest.fn(),
}))

const mockConfigs = jest.fn()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockConfigs() }),
}))

const mockUseEligibleSafeAccounts = useEligibleSafeAccounts as jest.MockedFunction<typeof useEligibleSafeAccounts>

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const SAFE_B = '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'

const SEPOLIA = '11155111'
const POLYGON = '137'
const NOWHERE = '999999'

// Sepolia and Polygon have an AllowanceModule deployment; chain 999999 does not exist.
const CHAINS = [
  {
    chainId: SEPOLIA,
    chainName: 'Sepolia',
    shortName: 'sep',
    features: ['SPENDING_LIMIT', 'POLICY_INDEXER_SPENDING_LIMIT'],
  },
  { chainId: POLYGON, chainName: 'Polygon', shortName: 'matic', features: ['SPENDING_LIMIT'] },
  {
    chainId: NOWHERE,
    chainName: 'Nowhere',
    shortName: 'nowhere',
    features: ['SPENDING_LIMIT', 'POLICY_INDEXER_SPENDING_LIMIT'],
  },
  { chainId: '1', chainName: 'Ethereum', shortName: 'eth', features: [] },
]

const option = (chainId: string, address = SAFE_A, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  eligibility: 'signer',
  chain: { chainId, chainName: chainId, chainLogoUri: null, shortName: chainId },
  ...extra,
})

const eligible = (accounts: SafeAccountOption[]) =>
  mockUseEligibleSafeAccounts.mockReturnValue({
    accounts: groupSafeAccounts(accounts),
    isLoading: false,
    isError: false,
    hasWallet: true,
    signersOnly: false,
    refetch: jest.fn(),
  })

const reasons = (entries: ReturnType<typeof useSpendingLimitSafeAccounts>['accounts']) =>
  entries
    .flatMap((entry) => (isSafeAccountGroup(entry) ? entry.accounts : [entry]))
    .map((account) => [account.chainId, account.ineligibleReason])

describe('useSpendingLimitSafeAccounts', () => {
  beforeEach(() => {
    mockConfigs.mockReturnValue(CHAINS)
  })

  it('disables Safes on chains without the spending-limit feature or a module deployment', () => {
    eligible([option(SEPOLIA), option('1', SAFE_B), option(NOWHERE, SAFE_B)])

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    expect(reasons(result.current.accounts)).toEqual([
      [SEPOLIA, undefined],
      ['1', 'no-spending-limits'],
      [NOWHERE, 'no-spending-limits'],
    ])
  })

  it('keeps but disables Safes on chains the Policy Indexer does not index', () => {
    eligible([option(SEPOLIA), option(POLYGON, SAFE_B)])

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    expect(reasons(result.current.accounts)).toEqual([
      [SEPOLIA, undefined],
      [POLYGON, 'unsupported-chain'],
    ])
  })

  it('keeps a multichain Safe grouped, each chain carrying its own reason', () => {
    eligible([option(SEPOLIA), option(POLYGON), option('1')])

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    const [group] = result.current.accounts
    expect(isSafeAccountGroup(group)).toBe(true)
    expect(reasons([group])).toEqual([
      ['1', 'no-spending-limits'],
      [SEPOLIA, undefined],
      [POLYGON, 'unsupported-chain'],
    ])
  })

  it('keeps a group whose every chain is unindexed, with every row disabled', () => {
    mockConfigs.mockReturnValue(CHAINS.map((chain) => ({ ...chain, features: ['SPENDING_LIMIT'] })))
    eligible([option(SEPOLIA), option(POLYGON)])

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    const [group] = result.current.accounts
    expect(isSafeAccountGroup(group)).toBe(true)
    expect(reasons([group]).every(([, reason]) => reason === 'unsupported-chain')).toBe(true)
  })

  it('lets the network reason win over not-activated', () => {
    eligible([option(POLYGON, SAFE_A, { ineligibleReason: 'not-activated' })])

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    expect(reasons(result.current.accounts)).toEqual([[POLYGON, 'unsupported-chain']])
  })

  it('returns no accounts while the chain configs are still empty', () => {
    mockConfigs.mockReturnValue([])
    eligible([option(SEPOLIA)])

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    expect(result.current.accounts).toEqual([])
  })

  it('never empties a non-empty eligible list once the chain configs are loaded', () => {
    eligible([option('1'), option(NOWHERE, SAFE_B)])

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    expect(result.current.accounts).toHaveLength(2)
  })

  it('passes the loading, error and wallet state through', () => {
    const refetch = jest.fn()
    mockUseEligibleSafeAccounts.mockReturnValue({
      accounts: [],
      isLoading: true,
      isError: false,
      hasWallet: false,
      signersOnly: false,
      refetch,
    })

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    expect(result.current).toMatchObject({ isLoading: true, isError: false, hasWallet: false, refetch })
  })
})
