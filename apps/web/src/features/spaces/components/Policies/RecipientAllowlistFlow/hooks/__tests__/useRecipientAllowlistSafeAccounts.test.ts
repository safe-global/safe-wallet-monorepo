import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { buildSafeAccountId, findSafeAccount, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { useEligibleSafeAccounts } from '../../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { useSafeVersions } from '../useSafeVersions'
import { useRecipientAllowlistSafeAccounts } from '../useRecipientAllowlistSafeAccounts'

jest.mock('../../../SafeAccountSelector/hooks/useEligibleSafeAccounts', () => ({
  useEligibleSafeAccounts: jest.fn(),
}))

jest.mock('../useSafeVersions', () => ({
  useSafeVersions: jest.fn(),
}))

const mockChainsLoading = jest.fn<boolean, []>()

const SEPOLIA = '11155111'
const MAINNET = '1'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({
    configs: [
      { chainId: '11155111', features: ['POLICY_RECIPIENT_ALLOWLIST'] },
      { chainId: '1', features: [] },
    ],
    loading: mockChainsLoading(),
  }),
}))

const mockUseEligibleSafeAccounts = useEligibleSafeAccounts as jest.MockedFunction<typeof useEligibleSafeAccounts>
const mockUseSafeVersions = useSafeVersions as jest.MockedFunction<typeof useSafeVersions>

const SAFE_A = faker.finance.ethereumAddress()
const SAFE_B = faker.finance.ethereumAddress()

const option = (chainId: string, address = SAFE_A, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(chainId, address),
  chainId,
  address,
  eligibility: 'signer',
  ...extra,
})

const eligible = (accounts: SafeAccountOption[], isLoading = false) =>
  mockUseEligibleSafeAccounts.mockReturnValue({
    accounts: groupSafeAccounts(accounts),
    isLoading,
    isError: false,
    hasWallet: true,
    signersOnly: false,
    refetch: jest.fn(),
  })

describe('useRecipientAllowlistSafeAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockChainsLoading.mockReturnValue(false)
    mockUseSafeVersions.mockReturnValue({ versions: new Map(), isLoading: false })
  })

  it('reads the version only of Safes on an allowlist chain', () => {
    eligible([
      option(SEPOLIA, SAFE_A),
      option(SEPOLIA, SAFE_B, { ineligibleReason: 'not-activated' }),
      option(MAINNET, SAFE_A),
    ])

    renderHook(() => useRecipientAllowlistSafeAccounts())

    expect(mockUseSafeVersions).toHaveBeenLastCalledWith([option(SEPOLIA, SAFE_A)])
  })

  it('marks every Safe with the reason it cannot take an allowlist', () => {
    eligible([option(SEPOLIA, SAFE_A), option(SEPOLIA, SAFE_B), option(MAINNET, SAFE_B)])
    mockUseSafeVersions.mockReturnValue({
      versions: new Map([
        [buildSafeAccountId(SEPOLIA, SAFE_A), '1.5.0'],
        [buildSafeAccountId(SEPOLIA, SAFE_B), '1.4.1'],
      ]),
      isLoading: false,
    })

    const { result } = renderHook(() => useRecipientAllowlistSafeAccounts())

    const reasonOf = (chainId: string, address: string) =>
      findSafeAccount(result.current.accounts, buildSafeAccountId(chainId, address))?.ineligibleReason
    expect(reasonOf(SEPOLIA, SAFE_A)).toBeUndefined()
    expect(reasonOf(SEPOLIA, SAFE_B)).toBe('unsupported-safe-version')
    expect(reasonOf(MAINNET, SAFE_B)).toBe('no-recipient-allowlists')
    expect(result.current.hasSelectableAccount).toBe(true)
  })

  it('has no selectable Safe when none is on an allowlist chain', () => {
    eligible([option(MAINNET, SAFE_A)])

    const { result } = renderHook(() => useRecipientAllowlistSafeAccounts())

    expect(result.current.accounts).toHaveLength(1)
    expect(result.current.hasSelectableAccount).toBe(false)
  })

  it.each([
    ['the Safes', () => eligible([option(SEPOLIA)], true)],
    ['the chains', () => (eligible([option(SEPOLIA)]), mockChainsLoading.mockReturnValue(true))],
    ['the versions', () => (eligible([option(SEPOLIA)]), mockUseSafeVersions.mockReturnValue({ isLoading: true }))],
  ])('is loading, with no rows, while %s load', (_, arrange) => {
    arrange()

    const { result } = renderHook(() => useRecipientAllowlistSafeAccounts())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.accounts).toEqual([])
  })
})
