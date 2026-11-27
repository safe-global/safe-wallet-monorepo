import type { SpendingLimitState } from '@/features/spending-limits'
import { tokenInfoBuilder } from '@/tests/builders/balances'
import { chainBuilder } from '@/tests/builders/chains'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole, type TestRole } from '@/tests/mocks/roles'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { SWAP_LABELS } from '@/services/analytics/events/swaps'
import { AppRoutes } from '@/config/routes'
import type { NextRouter } from 'next/router'
import userEvent from '@testing-library/user-event'
import SwapButton from '.'

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

const swappedToken = tokenInfoBuilder().build()

const LIMITED_TOKEN = {
  'no spending limit': undefined,
  'a spending limit for this token': swappedToken,
  'a spending limit for another token': tokenInfoBuilder().build(),
}

type Limit = keyof typeof LIMITED_TOKEN

const spendingLimitsOf = (beneficiary: string | undefined, limit: Limit): SpendingLimitState[] => {
  const token = LIMITED_TOKEN[limit]
  if (!beneficiary || !token) return []
  const spendingLimit = spendingLimitStateBuilder().build()
  return [{ ...spendingLimit, beneficiary, token: { ...spendingLimit.token, address: token.address } }]
}

const renderSwapButton = (spendingLimits: SpendingLimitState[], routerProps?: Partial<NextRouter>) =>
  render(<SwapButton tokenInfo={swappedToken} amount="0" trackingLabel={SWAP_LABELS.asset} />, {
    initialReduxState: { spendingLimits: { data: spendingLimits, loading: false, loaded: true } },
    routerProps,
  })

describe('SwapButton role gating', () => {
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

    renderSwapButton(spendingLimitsOf(wallet?.address, limit))

    expect(screen.getByRole('button', { name: 'Swap' })).toHaveProperty('disabled', disabled)
  })
})

describe('SwapButton navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
  })

  it('opens the swap page with the token preselected and keeps the Safe in the route', async () => {
    mockRole('owner')
    const push = jest.fn()
    const safe = `eth:${fakerChecksummedAddress()}`

    renderSwapButton([], { push, query: { safe } })
    await userEvent.click(screen.getByRole('button', { name: 'Swap' }))

    expect(push).toHaveBeenCalledWith({
      pathname: AppRoutes.swap,
      query: { safe, token: swappedToken.address, amount: '0' },
    })
  })
})
