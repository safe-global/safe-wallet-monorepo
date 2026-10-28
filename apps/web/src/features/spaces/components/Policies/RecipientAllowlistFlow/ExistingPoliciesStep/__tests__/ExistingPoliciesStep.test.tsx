import { faker } from '@faker-js/faker'
import {
  NO_RESTRICTED_SPENDING_LIMITS_TITLE,
  NO_SPENDING_LIMITS_TITLE,
  RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
  SPENDING_LIMITS_LOAD_ERROR_DESCRIPTION,
  SPENDING_LIMITS_LOADING_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import type { PolicyAllowance } from '@safe-global/views/features/spaces/components/Policies/types'
import type { RecipientAllowlistFlowData } from '../../types'
import { useSpendingLimitImpacts, type SpendingLimitImpactsResult } from '../../hooks/useSpendingLimitImpacts'
import type { SpendingLimitImpact, SpendingLimitImpactKind } from '../../utils/spendingLimitImpacts'
import ExistingPoliciesStep from '..'

jest.mock('../../hooks/useSpendingLimitImpacts', () => ({ useSpendingLimitImpacts: jest.fn() }))
jest.mock('../../hooks/useRecipientAllowlistSafeAccounts', () => ({
  useRecipientAllowlistSafeAccounts: () => ({ accounts: [] }),
}))
jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
  useSafeNameResolver: () => () => '',
}))

const mockImpacts = useSpendingLimitImpacts as jest.MockedFunction<typeof useSpendingLimitImpacts>

const makeAllowance = (symbol: string): PolicyAllowance => ({
  token: { address: faker.finance.ethereumAddress(), symbol, decimals: 6, logoUri: null },
  amount: '500000000',
  spent: '0',
  remaining: '500000000',
  resetPeriodMinutes: 1_440,
  resetsAtMinute: null,
})

const makeImpact = (symbol: string, impact: SpendingLimitImpactKind): SpendingLimitImpact => ({
  spender: faker.finance.ethereumAddress(),
  allowance: makeAllowance(symbol),
  impact,
  recipients: impact === 'restricted' ? [faker.finance.ethereumAddress(), faker.finance.ethereumAddress()] : [],
})

const spendingLimits = (overrides: Partial<SpendingLimitImpactsResult> = {}) =>
  mockImpacts.mockReturnValue({ impacts: [], isLoading: false, isError: false, refetch: jest.fn(), ...overrides })

const data: RecipientAllowlistFlowData = { excludedTokens: [], addedTokens: [], recipients: [], rules: [] }

const renderStep = () => {
  const onNext = jest.fn()
  const view = renderWithUserEvent(
    <TxFlowContext.Provider value={{ ...initialContext, data, onNext }}>
      <ExistingPoliciesStep />
    </TxFlowContext.Provider>,
  )

  return { ...view, onNext }
}

describe('ExistingPoliciesStep', () => {
  beforeEach(() => {
    spendingLimits({ impacts: [makeImpact('USDC', 'restricted'), makeImpact('ETH', 'unaffected')] })
  })

  it('should say the spending limit follows the rules, when the Safe has one restricted limit', () => {
    spendingLimits({ impacts: [makeImpact('USDC', 'restricted')] })
    renderStep()

    expect(screen.getByText("Your spending limit will follow this allowlist's rules.")).toBeInTheDocument()
    expect(screen.getByText(RESTRICTED_SPENDING_LIMITS_DESCRIPTION)).toBeInTheDocument()
  })

  it('should count the restricted limits out of all of them, when only some are restricted', () => {
    renderStep()

    expect(screen.getByText("1 of your 2 spending limits will follow this allowlist's rules.")).toBeInTheDocument()
    expect(screen.getByText(RESTRICTED_SPENDING_LIMITS_DESCRIPTION)).toBeInTheDocument()
  })

  it('should say all spending limits follow the rules, when every limit is restricted', () => {
    spendingLimits({ impacts: [makeImpact('USDC', 'restricted'), makeImpact('DAI', 'restricted')] })
    renderStep()

    expect(screen.getByText("Your 2 spending limits will follow this allowlist's rules.")).toBeInTheDocument()
  })

  it('should list every limit and mark only the restricted one, when only some are restricted', () => {
    renderStep()

    expect(screen.getAllByTestId('spending-limit-impact')).toHaveLength(2)
    expect(screen.getByText('Will be restricted')).toBeInTheDocument()
    expect(screen.queryByText('Will be blocked')).not.toBeInTheDocument()
    expect(screen.getByText('500/day · USDC is in this allowlist')).toBeInTheDocument()
    expect(screen.getByText("500/day · ETH isn't in this allowlist")).toBeInTheDocument()
  })

  it('should keep Next disabled until the change is acknowledged, when the limits have loaded', async () => {
    const { user, onNext } = renderStep()
    const next = screen.getByTestId('next-btn')

    expect(screen.getByText('I understand how this allowlist changes these spending limits.')).toBeInTheDocument()
    expect(next).toBeDisabled()
    await user.click(screen.getByRole('checkbox'))
    expect(next).toBeEnabled()
    await user.click(next)

    expect(onNext).toHaveBeenCalledWith(data)
  })

  it('should show the loading banner and keep Next disabled, when the limits are still loading', async () => {
    spendingLimits({ isLoading: true })
    const { user } = renderStep()

    await user.click(screen.getByRole('checkbox'))

    expect(screen.getByText(SPENDING_LIMITS_LOADING_TITLE)).toBeInTheDocument()
    expect(screen.queryByTestId('spending-limit-impact')).not.toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('should show the error banner and keep Next disabled, when the limits failed to load', async () => {
    spendingLimits({ isError: true })
    const { user } = renderStep()

    await user.click(screen.getByRole('checkbox'))

    expect(screen.getByText(/Couldn't load the spending limits on/)).toBeInTheDocument()
    expect(screen.getByText(SPENDING_LIMITS_LOAD_ERROR_DESCRIPTION)).toBeInTheDocument()
    expect(screen.queryByTestId('spending-limit-impact')).not.toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('should reload the limits, when Retry is clicked after they failed to load', async () => {
    const refetch = jest.fn()
    spendingLimits({ isError: true, refetch })
    const { user } = renderStep()

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should say the Safe has no spending limits, when none load after a retry', () => {
    spendingLimits({ impacts: [] })
    renderStep()

    expect(screen.getByText(NO_SPENDING_LIMITS_TITLE)).toBeInTheDocument()
    expect(screen.queryByTestId('spending-limit-impact')).not.toBeInTheDocument()
  })

  it('should say none of the limits follow the rules, when only unaffected limits load after a retry', () => {
    spendingLimits({ impacts: [makeImpact('ETH', 'unaffected')] })
    renderStep()

    expect(screen.getByText(NO_RESTRICTED_SPENDING_LIMITS_TITLE)).toBeInTheDocument()
    expect(screen.queryByText(RESTRICTED_SPENDING_LIMITS_DESCRIPTION)).not.toBeInTheDocument()
    expect(screen.getAllByTestId('spending-limit-impact')).toHaveLength(1)
  })
})
