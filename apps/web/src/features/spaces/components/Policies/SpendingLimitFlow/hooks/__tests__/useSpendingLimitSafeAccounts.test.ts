import { renderHook } from '@/tests/test-utils'
import { buildSafeAccountId } from '../../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../../SafeAccountSelector/types'
import { useEligibleSafeAccounts } from '../../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { useSpendingLimitSafeAccounts } from '../useSpendingLimitSafeAccounts'

jest.mock('../../../SafeAccountSelector/hooks/useEligibleSafeAccounts', () => ({
  useEligibleSafeAccounts: jest.fn(),
}))

// Sepolia and Polygon have an AllowanceModule deployment; chain 999999 does not exist.
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      { chainId: '11155111', chainName: 'Sepolia', shortName: 'sep', features: ['SPENDING_LIMIT'] },
      { chainId: '137', chainName: 'Polygon', shortName: 'matic', features: [] },
      { chainId: '999999', chainName: 'Nowhere', shortName: 'nowhere', features: ['SPENDING_LIMIT'] },
    ],
  }),
}))

const mockUseEligibleSafeAccounts = useEligibleSafeAccounts as jest.MockedFunction<typeof useEligibleSafeAccounts>

const SAFE_A = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'

const option = (chainId: string): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, SAFE_A),
  chainId,
  address: SAFE_A,
  eligibility: 'signer',
})

describe('useSpendingLimitSafeAccounts', () => {
  beforeEach(() => {
    mockUseEligibleSafeAccounts.mockReturnValue({
      accounts: [option('11155111'), option('137'), option('999999')].map((account) => ({ ...account })),
      isLoading: false,
      isError: false,
      hasWallet: true,
      refetch: jest.fn(),
    })
  })

  it('keeps Safes on chains with the spending-limit feature and a known module deployment only', () => {
    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    expect(result.current.accounts.map((entry) => ('chainId' in entry ? entry.chainId : 'group'))).toEqual(['11155111'])
  })

  it('passes the loading, error and wallet state through', () => {
    const refetch = jest.fn()
    mockUseEligibleSafeAccounts.mockReturnValue({
      accounts: [],
      isLoading: true,
      isError: false,
      hasWallet: false,
      refetch,
    })

    const { result } = renderHook(() => useSpendingLimitSafeAccounts())

    expect(result.current).toMatchObject({ isLoading: true, isError: false, hasWallet: false, refetch })
  })
})
