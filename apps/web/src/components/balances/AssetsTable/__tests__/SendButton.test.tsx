import type { SpendingLimitState } from '@/features/spending-limits'
import { tokenInfoBuilder } from '@/tests/builders/balances'
import { chainBuilder } from '@/tests/builders/chains'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import { render, screen } from '@/tests/test-utils'
import SendButton from '../SendButton'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(() => chainBuilder().build()),
}))

const sentToken = tokenInfoBuilder().build()

const LIMITED_TOKEN = {
  'no spending limit': undefined,
  'a spending limit for this token': sentToken,
  'a spending limit for another token': tokenInfoBuilder().build(),
}

type Limit = keyof typeof LIMITED_TOKEN

const spendingLimitsOf = (beneficiary: string | undefined, limit: Limit): SpendingLimitState[] => {
  const token = LIMITED_TOKEN[limit]
  if (!beneficiary || !token) return []
  const spendingLimit = spendingLimitStateBuilder().build()
  return [{ ...spendingLimit, beneficiary, token: { ...spendingLimit.token, address: token.address } }]
}

const renderSendButton = (spendingLimits: SpendingLimitState[]) =>
  render(<SendButton tokenInfo={sentToken} />, {
    initialReduxState: { spendingLimits: { data: spendingLimits, loading: false, loaded: true } },
  })

describe('SendButton role gating', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
  })

  it.each<{ role: TestRole; limit: Limit; disabled: boolean }>([
    { role: 'owner', limit: 'no spending limit', disabled: false },
    { role: 'proposer', limit: 'no spending limit', disabled: false },
    { role: 'spendingLimitBeneficiary', limit: 'a spending limit for this token', disabled: false },
    { role: 'spendingLimitBeneficiary', limit: 'a spending limit for another token', disabled: true },
    { role: 'nonOwner', limit: 'no spending limit', disabled: true },
    { role: 'disconnected', limit: 'no spending limit', disabled: true },
  ])('sets disabled=$disabled for a $role with $limit', ({ role, limit, disabled }) => {
    const wallet = mockRole(role)

    renderSendButton(spendingLimitsOf(wallet?.address, limit))

    expect(screen.getByRole('button', { name: 'Send' })).toHaveProperty('disabled', disabled)
  })
})
